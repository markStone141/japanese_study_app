# Japanese Verb Quiz

Firebase Hosting と Cloud Firestore に対応した日本語動詞活用クイズです。

## 画面

- `index.html`: 従来の動詞活用クイズ。選択した教材・レベル・動詞グループから出題します。
- `katsuyou2.html`: 「動詞の活用2」専用。なかった形・可能形・ば形・意向形・使役形を中心に、グループ1〜3を練習できます。
- 一覧: 動詞グループごとの活用と例文を確認できます。

`katsuyou2.html` は出題する活用形を選択でき、ランダム時は選択した活用形が偏りにくいようにバランスを取って出題します。正解表示のあとには、その活用形を使った日本語例文と英訳を表示します。

既存画面のCSSは共通の `styles.css`、PC用の `desktop.css`、モバイル用の `mobile.css` に分けています。「動詞の活用2」は `katsuyou2.css` / `katsuyou2.js` に分離しています。

## エージェント分担

コンテンツ追加と実装の役割分担は `AGENTS.md` に定義しています。統括、問題作成、例文作成、日本語レビュー、UI/UX、テスト・偏り確認、最終レビューを分離し、例文作成を最優先のコンテンツ工程として扱います。

## 動詞の活用2 データ検証

「動詞の活用2」のデータは `data/katsuyou2/part-*.json` にあります。各動詞について、ます形・て形・た形・ない形・なかった形・可能形・ば形・意向形・使役形の例文（日英）が揃っていることを検証できます。

```bash
npm run test:katsuyou2
```

この検証ではIDやorderの重複、活用形の欠落、例文の欠落、例文に対象の活用形が含まれているかに加え、「着る」と「切る」、「居る」と「要る」のような同音異義語の取り違えもチェックします。

## Firebase 設定

1. Firebase コンソールで Web アプリを作成します。
2. Firestore Database を作成します。
3. `firebase-config.js` の `YOUR_*` を Firebase コンソールの設定値に置き換えます。
4. `verbs` コレクションに動詞データを追加します。未登録の場合は内蔵データで動きます。

ログイン機能は現在使っていません。成績と間違い履歴はブラウザの `localStorage` に保存されます。

## 今入っているデータの移行

現在の動詞データは Firestore 投入用に次のJSONへ書き出しています。

```text
data/verbs-minna-no-nihongo-shokyu-1-group-1.json
```

このデータはすべて次の分類で登録されます。

```json
{
  "textbookId": "minna-no-nihongo",
  "textbookName": "みんなの日本語",
  "levelId": "shokyu-1",
  "levelName": "初級I",
  "verbGroupId": "group-1",
  "verbGroupName": "グループ1"
}
```

Firestoreへ投入する場合:

```bash
npm install
gcloud auth application-default login
npm run import:verbs
```

グループ別に投入する場合:

```bash
npm run import:verbs:group1
npm run import:verbs:group2
npm run import:verbs:group3
```

全グループをまとめて投入する場合:

```bash
npm run import:verbs:all
```

サービスアカウントを使う場合:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
npm run import:verbs
```

## データ追加

まとまった件数を追加する場合は、`data/` にJSONファイルを増やしてから次の形式で投入します。

```bash
node scripts/import-verbs.mjs data/your-verbs.json
```

1件だけ追加したい場合は Firebase Console の Firestore で `verbs` コレクションにドキュメントを追加しても構いません。ドキュメントIDは重複しない英数字にしてください。

`verbs` ドキュメントの例:

```json
{
  "id": "minna-shokyu-1-group-1-021",
  "dictionary": "かく",
  "meaning": "write, draw, paint",
  "masu": "かきます",
  "te": "かいて",
  "ta": "かいた",
  "nai": "かかない",
  "forms": {
    "masu": "かきます",
    "te": "かいて",
    "ta": "かいた",
    "nai": "かかない"
  },
  "kanji": {
    "dictionary": "書く",
    "masu": "書きます",
    "te": "書いて",
    "ta": "書いた",
    "nai": "書かない"
  },
  "examples": {
    "masu": {
      "ja": "のーとに じぶんの なまえを かきます。",
      "en": "I write my name in the notebook."
    }
  },
  "textbookId": "minna-no-nihongo",
  "textbookName": "みんなの日本語",
  "levelId": "shokyu-1",
  "levelName": "初級I",
  "verbGroupId": "group-1",
  "verbGroupName": "グループ1",
  "order": 21
}
```

`kanji` は任意です。入っている場合は、画面では `かく（書く）` のように表示されます。クイズの入力判定は今まで通りひらがなのみです。

別のくくりを追加する場合は、`levelId` や `verbGroupId` を変えます。例: `verbGroupId: "group-2"`、`verbGroupName: "グループ2"`。アプリの分類セレクトは Firestore のデータから自動生成されます。

## デプロイ

```bash
firebase login
firebase deploy
```
