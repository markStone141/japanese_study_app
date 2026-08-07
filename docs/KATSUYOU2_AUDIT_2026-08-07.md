# 動詞の活用1 → 活用2 全件レビュー記録

レビュー日: 2026-08-07

## 目的

活用1の全152動詞を活用2へ展開する処理について、単に「コード上の規則に合うか」だけではなく、次の順番で再点検した。

1. 活用1にすでに登録されている `ます・て・た・ない` と、活用2生成結果を全152件で照合する。
2. 一致しない動詞は、動詞グループの誤認・不規則活用・複合動詞の処理を確認する。
3. 発展形（なかった・可能・ば・意向・使役）は、機械的に生成できても、実際の日本語でその形を独立した活用として扱うかを辞書・日本語教育資料で確認する。
4. 参考資料で「―」「該当なし」とされる形、または別語を誤って活用形として扱う危険が高い形は `null`（該当なし）とし、問題から除外する。
5. 修正対象には、発展5形のレビュー済み例文を追加する。

## 主な確認資料

- 国際交流基金「みんなの教材サイト」使役形: https://www.kyozai.jpf.go.jp/kyozai/material/BMA00075/ja/render.do
- 国際交流基金「みんなの教材サイト」V辞書形: https://www.kyozai.jpf.go.jp/kyozai/material/BTS00066/ja/render.do
- 国際交流基金「みんなの教材サイト」V（さ）せます: https://www.kyozai.jpf.go.jp/kyozai/material/BMA00031/ja/render.do
- 国立国語研究所 基本動詞ハンドブック「分かる」: https://www2.ninjal.ac.jp/verbhandbook/headwords/%E5%88%86%E3%81%8B%E3%82%8B.html
- 国立国語研究所 基本動詞ハンドブック「来る」: https://www2.ninjal.ac.jp/verbhandbook/headwords/%E6%9D%A5%E3%82%8B.html
- 国立国語研究所 基本動詞ハンドブック「くれる」: https://www2.ninjal.ac.jp/verbhandbook/headwords/%E3%81%8F%E3%82%8C%E3%82%8B.html
- 国立国語研究所 基本動詞ハンドブック「行く」: https://www2.ninjal.ac.jp/verbhandbook/headwords/%E8%A1%8C%E3%81%8F.html
- コトバンク「寝かせる」: https://kotobank.jp/word/%E5%AF%9D%E3%81%8B%E3%81%9B%E3%82%8B-594674
- goo国語辞書「有り得る」: https://dictionary.goo.ne.jp/word/%E6%9C%89%E3%82%8A%E5%BE%97%E3%82%8B/

## 全件照合で見つかった実装上の誤り

活用1の基本4形を独立した正解データとして活用2生成結果と照合したところ、次の8エントリで問題を検出した。

| sourceVerbId | 動詞 | 原因 | 修正内容 |
|---|---|---|---|
| `minna-shokyu-1-group-1-041` | たべる | データ上Group 1として扱われ、五段活用を適用 | Group 2として自動判定。`たべなかった / たべられる / たべれば / たべよう / たべさせる` |
| `minna-shokyu-1-group-1-042` | みる | 同上 | Group 2として自動判定。`みなかった / みられる / みれば / みよう / みさせる` |
| `minna-shokyu-1-group-1-043` | おきる | 同上 | Group 2として自動判定。`おきなかった / おきられる / おきれば / おきよう / おきさせる` |
| `minna-shokyu-1-group-1-044` | ねる | 同上 | Group 2として自動判定。`ねなかった / ねられる / ねれば / ねよう / ねさせる` |
| `minna-shokyu-1-group-1-045` | する | Group 1として扱われていた | Group 3として自動判定。`しなかった / できる / すれば / しよう / させる` |
| `minna-shokyu-1-group-1-055` | つれていく | `いく` の不規則なて形・た形を「単独のいく」にしか適用していなかった | 複合動詞末尾の `いく` にも適用。`つれていって / つれていった` |
| `minna-shokyu-1-group-1-076` | もっていく | 同上 | `もっていって / もっていった` |
| `minna-shokyu-1-group-1-082` | くる | Group 1として扱われていた | Group 3として自動判定。`こなかった / こられる / くれば / こよう / こさせる` |

### 今後同じ誤りを防ぐ仕組み

活用2では、ファイル名や `verbGroupId` をそのまま信用しない。活用1に登録済みの `ます・て・た・ない` とGroup 1 / 2 / 3それぞれの候補を照合し、4形が一意に一致するグループを採用する。

これにより、たとえば `ねる` が誤ってGroup 1ファイルに入っていても、

- Group 1候補: `ねります / ねって / ねった / ねらない` → 活用1と不一致
- Group 2候補: `ねます / ねて / ねた / ねない` → 活用1と一致

となるため、Group 2として処理される。

## 「寝る」について

今回の指摘どおり、以前表示されていた `ねらなかった` は誤り。正しくは **`ねなかった`**。

使役については注意が必要。

- 文法上、Group 2の使役形の規則から作る「寝る」の使役形は **`ねさせる（寝させる）`**。
- 一方、実際の日常語では **`ねかせる（寝かせる）`** が非常によく使われる。
- ただし辞書では `寝かせる` は独立した他動詞として立項されている。つまり「寝る→寝かせる」をそのまま文法上の使役形として教えると、活用規則と語彙的な他動詞を混同する。

そのため、このアプリの「使役形」問題では **`ねさせる`** を正解とする。ただし、将来の解説では「実際の会話では意味によって `寝かせる` が自然なことが多い」と補足する方針にする。

国際交流基金の使役形資料でもGroup 2は「るを取って `させる`」と説明されている一方、実際の用例では `寝かせておきましょう` も掲載されている。この差は「文法的使役形」と「語彙的な他動詞」の違いとして扱う。

## 「該当なし」に変更した活用

機械生成できる文字列を、そのまま問題として出さない方針に変更した。

| 動詞 | 活用 | 以前の機械生成 | 現在 | 理由 |
|---|---|---|---|---|
| わかる | 可能形 | わかれる | **該当なし** | 国立国語研究所「基本動詞ハンドブック」が可能形を `―` としている。`わかれる` は別の動詞として解釈されうる。 |
| くれる | 可能形 | くれられる | **該当なし** | 国立国語研究所「基本動詞ハンドブック」が可能形を `-----` としている。 |
| ある | 可能形 | あれる / ありえる相当を誤って扱う危険 | **該当なし** | `有り得る（ありうる／ありえる）` は辞書に独立語として掲載され、存在動詞 `ある` の通常の可能形として初心者問題に出すと意味が変わる。 |
| できる | 可能形 | できられる | **該当なし** | `できる` 自体が能力・可能を表すため、さらに機械的な可能形を作る問題は対象外とする。 |

`null` にした活用は、一覧ページでは **「該当なし」** と表示し、通常問題・ランダム問題・穴埋め問題の候補から除外する。

今後も辞書や日本語教育資料で `―` / `-----` とされる動詞を見つけた場合は、この方式で追加する。

# 今回追加したレビュー済み例文一覧

以下40例文を `data/katsuyou2/part-6.json` に追加した。すべて、今回修正した8エントリの発展5形（なかった・可能・ば・意向・使役）を対象にしている。

## たべる

- なかった形 `たべなかった`: けさは いそがしくて、あさごはんを たべなかった。 / I was busy this morning, so I did not eat breakfast.
- 可能形 `たべられる`: この りょうなら、ぜんぶ たべられる。 / I can eat all of this amount.
- ば形 `たべれば`: あさごはんを たべれば、げんきが でます。 / If you eat breakfast, you will have more energy.
- 意向形 `たべよう`: ひるは いっしょに うどんを たべよう。 / Let's eat udon together for lunch.
- 使役形 `たべさせる`: ははは こどもに やさいも たべさせる。 / The mother has her child eat vegetables too.

## みる

- なかった形 `みなかった`: きのうは テレビを みなかった。 / I did not watch TV yesterday.
- 可能形 `みられる`: この せきなら、ステージが よく みられる。 / From this seat, I can see the stage well.
- ば形 `みれば`: この ちずを みれば、みちが わかります。 / If you look at this map, you will know the way.
- 意向形 `みよう`: こんや、この えいがを みよう。 / Let's watch this movie tonight.
- 使役形 `みさせる`: せんせいは がくせいに この ビデオを みさせる。 / The teacher has the students watch this video.

## おきる

- なかった形 `おきなかった`: にちようびは 8じまで おきなかった。 / I did not get up until eight on Sunday.
- 可能形 `おきられる`: あしたは 6じに おきられる。 / I can get up at six tomorrow.
- ば形 `おきれば`: はやく おきれば、ゆっくり あさごはんを たべられます。 / If you get up early, you can eat breakfast without rushing.
- 意向形 `おきよう`: あしたは いつもより はやく おきよう。 / Let's get up earlier than usual tomorrow.
- 使役形 `おきさせる`: ちちは こどもを 7じに おきさせる。 / The father makes the child get up at seven.

## ねる

- なかった形 `ねなかった`: きのうは しんぱいで、よく ねなかった。 / I was worried yesterday, so I did not sleep well.
- 可能形 `ねられる`: この へやは しずかなので、よく ねられる。 / This room is quiet, so I can sleep well.
- ば形 `ねれば`: はやく ねれば、あした らくです。 / If you go to bed early, tomorrow will be easier.
- 意向形 `ねよう`: あしたは はやいから、もう ねよう。 / Tomorrow starts early, so let's go to bed now.
- 使役形 `ねさせる`: きょうは つかれているので、こどもを もう すこし ねさせる。 / The child is tired today, so I will let them sleep a little longer.

## する

- なかった形 `しなかった`: きのうは うんどうを しなかった。 / I did not exercise yesterday.
- 可能形 `できる`: ここなら、しずかに べんきょうできる。 / I can study quietly here.
- ば形 `すれば`: まいにち れんしゅうすれば、じょうずに なります。 / If you practice every day, you will improve.
- 意向形 `しよう`: しゅくだいが おわったら、さんぽを しよう。 / Let's take a walk after finishing the homework.
- 使役形 `させる`: せんせいは がくせいに もういちど れんしゅうさせる。 / The teacher has the students practice once more.

## つれていく

- なかった形 `つれていかなかった`: あめだったので、こどもを こうえんへ つれていかなかった。 / It was raining, so I did not take the child to the park.
- 可能形 `つれていける`: くるまなら、みんなを いっしょに つれていける。 / If we go by car, I can take everyone together.
- ば形 `つれていけば`: こどもを どうぶつえんへ つれていけば、きっと よろこびます。 / If you take the child to the zoo, they will surely be happy.
- 意向形 `つれていこう`: こんど、りょうしんを きょうとへ つれていこう。 / Next time, let's take my parents to Kyoto.
- 使役形 `つれていかせる`: せんせいは せんぱいに こうはいを きょうしつへ つれていかせる。 / The teacher has the senior student take the junior student to the classroom.

## もっていく

- なかった形 `もっていかなかった`: きのうは かさを もっていかなかった。 / I did not take an umbrella yesterday.
- 可能形 `もっていける`: この かばんには、ほんを 3さつ もっていける。 / I can carry three books in this bag.
- ば形 `もっていけば`: みずを もっていけば、あんしんです。 / If you take water with you, you will be prepared.
- 意向形 `もっていこう`: ピクニックに おべんとうを もっていこう。 / Let's take a boxed lunch to the picnic.
- 使役形 `もっていかせる`: せんせいは がくせいに しりょうを かいぎしつへ もっていかせる。 / The teacher has the student take the materials to the meeting room.

## くる

- なかった形 `こなかった`: きのうは ともだちが うちに こなかった。 / My friend did not come to my house yesterday.
- 可能形 `こられる`: らいしゅうなら、ここへ こられる。 / I can come here next week.
- ば形 `くれば`: はやく くれば、いっしょに ひるごはんを たべられます。 / If you come early, we can have lunch together.
- 意向形 `こよう`: つぎは でんしゃで ここへ こよう。 / Next time, let's come here by train.
- 使役形 `こさせる`: せんせいは がくせいを 9じに きょうしつへ こさせる。 / The teacher makes the students come to the classroom at nine.

## テスト方針の変更

今回から、活用2の検証は「生成ロジック自身が生成した値と比較する」だけでは合格にしない。

- 活用1の基本4形との独立照合
- 誤グループ回帰テスト
- `いく` を末尾に持つ複合動詞の回帰テスト
- `寝る` の `ねなかった / ねさせる` 固定回帰テスト
- `該当なし` 活用が `null` のまま維持されるテスト
- `null` 活用が問題生成から除外されるテスト
- 辞書・日本語教育資料で確認した例外ルールをコードに明示する

を行う。

## 残作業

今回の全件機械照合で「活用1と活用2の基本4形が食い違う」ケースは上記の修正対象として対応した。一方、発展形の「実際の使用可否」は動詞の意味によって差があるため、今後も国立国語研究所 基本動詞ハンドブック等で `可能形 ―` などの記載を確認し、該当なしリストを拡張する。

つまり今後は「規則上作れるから正解」ではなく、**規則・辞書・実使用・教材としての自然さの4段階で採否を決める**。
