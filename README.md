# Japanese Verb Quiz

Firebase Hosting と Cloud Firestore に対応した日本語動詞活用クイズです。

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

別のくくりを追加する場合は、`levelId` や `verbGroupId` を変えます。例: `verbGroupId: "group-2"`、`verbGroupName: "グループ2"`。アプリの分類セレクトは Firestore のデータから自動生成されます。

## デプロイ

```bash
firebase login
firebase deploy
```
