# 活用2 Evidence-first Batch 4

レビュー日: 2026-08-07

## 対象

今回は次の5動詞を、例文を書く前に活用検証してから実装した。

- かえす / 返す
- かえる / 帰る
- かく / 書く
- かす / 貸す
- かつ / 勝つ

## 検証ルール

各動詞について `なかった・可能・ば・意向・使役` の5形を先に辞書の活用表で確認し、`valid` と判定されたものだけ例文を作成した。

主な確認先:
- JapanDict 返す: https://www.japandict.com/%E8%BF%94%E3%81%99
- JapanDict 帰る: https://www.japandict.com/%E5%B8%B0%E3%82%8B
- JapanDict 書く: https://www.japandict.com/%E6%9B%B8%E3%81%8F
- JapanDict 貸す: https://www.japandict.com/%E8%B2%B8%E3%81%99
- JapanDict 勝つ: https://www.japandict.com/%E5%8B%9D%E3%81%A4

このBatchでは5動詞すべてについて5つの発展形を `valid` とした。

## 検証済み活用

| 動詞 | なかった | 可能 | ば | 意向 | 使役 |
|---|---|---|---|---|---|
| 返す | かえさなかった | かえせる | かえせば | かえそう | かえさせる |
| 帰る | かえらなかった | かえれる | かえれば | かえろう | かえらせる |
| 書く | かかなかった | かける | かけば | かこう | かかせる |
| 貸す | かさなかった | かせる | かせば | かそう | かさせる |
| 勝つ | かたなかった | かてる | かてば | かとう | かたせる |

### 勝たせるについて

`勝たせる` は形として有効。初心者向け例文では「相手にわざと勝たせる / let someone win」のように、誰が誰を勝たせるのかが分かる文脈を使う。

## 今回追加した発展例文 25件

### 返す
- なかった: きのうは としょかんの ほんを かえさなかった。 / I did not return the library book yesterday.
- 可能: きょうなら、としょかんの ほんを かえせる。 / I can return the library book today.
- ば: この ほんを かえせば、つぎの ほんを かりられます。 / If I return this book, I can borrow the next one.
- 意向: しごとの あとで、この ほんを かえそう。 / Let's return this book after work.
- 使役: せんせいは がくせいに かりた ほんを かえさせる。 / The teacher has the student return the borrowed book.

### 帰る
- なかった: きのうは 9じまで うちへ かえらなかった。 / Yesterday, I did not go home until nine.
- 可能: きょうは 6じに かえれる。 / I can go home at six today.
- ば: 6じに かえれば、いっしょに ばんごはんを たべられます。 / If I go home at six, we can eat dinner together.
- 意向: きょうは はやく うちへ かえろう。 / Let's go home early today.
- 使役: せんせいは ぐあいの わるい がくせいを うちへ かえらせる。 / The teacher lets the sick student go home.

### 書く
- なかった: きのうは にっきを かかなかった。 / I did not write in my diary yesterday.
- 可能: この かんじなら、もう かける。 / I can write this kanji now.
- ば: メモを かけば、あとで わすれません。 / If you write a note, you will not forget later.
- 意向: りょこうの あとで、にっきを かこう。 / Let's write in our diary after the trip.
- 使役: せんせいは がくせいに なまえを かかせる。 / The teacher has the student write their name.

### 貸す
- なかった: きのうは じてんしゃを だれにも かさなかった。 / I did not lend my bicycle to anyone yesterday.
- 可能: この ほんなら、あしたまで かせる。 / I can lend you this book until tomorrow.
- ば: かさを かせば、ともだちは ぬれません。 / If I lend my friend an umbrella, they will not get wet.
- 意向: この ほんを ともだちに かそう。 / Let's lend this book to our friend.
- 使役: せんせいは がくせいに じしょを かさせる。 / The teacher has the student lend a dictionary.

### 勝つ
- なかった: きのうの しあいでは かたなかった。 / I did not win yesterday's match.
- 可能: つぎの しあいなら、かてる。 / I can win the next match.
- ば: この しあいに かてば、つぎへ すすめます。 / If we win this match, we can move on to the next round.
- 意向: つぎの しあいは ぜったいに かとう。 / Let's definitely win the next match.
- 使役: ちちは ゲームで こどもを いちど かたせる。 / The father lets the child win once in the game.

## 実装場所

- 検証記録: `data/katsuyou2/form-verification.json`
- 本番データ: `data/katsuyou2/part-7.json`
- クイズ / REVIEW読み込み: `katsuyou2.js`, `katsuyou2-review.js`

新規データは `verificationRequired: true` とし、CIの `test:form-verification` を通らない限りリリースしない。
