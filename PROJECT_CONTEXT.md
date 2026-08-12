# Japanese Study App — Project Context

## Purpose
A Japanese-learning web app based on the supplied みんなの日本語 初級I verb data. The current focus is verb conjugation practice with natural bilingual examples, reliable testing, incremental content review, and evidence-informed learning design.

## Public app
- GitHub Pages: `https://markstone141.github.io/japanese_study_app/`

## Repository / deployment
- Repository: `markStone141/japanese_study_app`
- Frontend hosting: GitHub Pages
- Database: Cloud Firestore
- Firebase project: `japanese-study-app-61e23`
- GitHub Actions validates changes and synchronizes reviewed learning data to Firestore.
- GitHub Secret used for Firestore sync: `FIREBASE_SERVICE_ACCOUNT`

## Current product structure
### 統合された動詞の活用ページ
- 旧「動詞の活用1」と「動詞の活用2」は、活用2のUIを使う1つの学習ページへ統合。
- トップページから統合ページへ自動的に移動する。
- 既存の全動詞を共有活用エンジンで読み込み、基本形と発展形をチェックボックスで限定できる。
- 一覧ページは、問題中に答えが見えないよう別ページのまま維持する。

Quiz target forms:
- `masu`
- `te`
- `ta`
- `nai`
- `pastNegative`
- `potential`
- `ba`
- `volitional`
- `causative`

Learning modes:
1. 基本 — ます・て・た・ない
2. 活用マスター — なかった・可能・ば・意向・使役
3. 文の穴埋め — sentence-context practice

The review list is intentionally on a separate page so answers are not visible during the quiz.

Keyboard / quiz usability policy:
- Enter checks the current answer during a question.
- After feedback is shown, Enter moves to the next question.
- Japanese Input Method Editor (IME) composition must finish before Enter is treated as submission.
- Primary-action helper text must keep sufficient contrast; global muted English styles must not turn button labels gray.

## Conjugation correctness policy
Do not trust only the file name or declared `verbGroupId` when generating 活用2.

For every 活用1 entry, compare the existing ます・て・た・ない forms against the candidate Group 1 / 2 / 3 conjugations. If exactly one candidate matches all four source forms, that candidate is the resolved group for 活用2.

The 2026-08-07 full 152-entry source-vs-generated audit found:
- 6 source records whose declared group did not match their own four core forms: たべる・みる・おきる・ねる were resolved as Group 2; する・くる were resolved as Group 3.
- 2 compound verbs ending in 行く had incorrect て / た generation: つれていく and もっていく now use `〜いって / 〜いった`.

Explicit regression rules include:
- 寝る past negative = `ねなかった`.
- The grammatical Group 2 causative of 寝る = `ねさせる`. `寝かせる` is treated as a separate lexical transitive verb, although it is more natural in many everyday situations.
- Compound verbs ending in `いく` receive the 行く て / た exception.

### Applicable vs unavailable forms
A mechanically producible string is not automatically a quiz answer. Forms confirmed by reference review as unavailable or unsuitable as that verb's ordinary conjugation are stored as `null`, shown as `該当なし`, and excluded from quiz generation.

Currently reviewed as unavailable:
- `ある` potential
- `わかる` potential
- `くれる` potential
- `できる` potential

Detailed audit ledger: `docs/KATSUYOU2_AUDIT_2026-08-07.md`.

## Evidence-first form verification policy
Starting with the next content batch after the structural audit, **form verification happens before example writing**.

The fixed sequence is:

`活用1 core check -> morphology -> dictionary/teaching reference -> actual-use check when needed -> valid/not_applicable/deferred decision -> example writing -> language review -> automated tests -> merge -> Firestore`

Decision statuses:
- `valid`: example and quiz item may be created after pedagogical review.
- `not_applicable`: production value must be `null`; show `該当なし`; exclude from quiz.
- `deferred`: do not create an example or quiz item until the evidence/pedagogical question is resolved.

Evidence ledger: `data/katsuyou2/form-verification.json`.
Full policy: `docs/KATSUYOU2_FORM_VERIFICATION_POLICY.md`.
CI gate: `npm run test:form-verification`.

New evidence-first production entries carry `verificationRequired: true`. CI rejects them if the external verification record is absent, the verified value differs from production, a non-valid form has an example, or the example does not contain the verified answer.

## Content policy
Example-sentence quality is a top priority. Do not mass-generate unreviewed advanced examples merely to increase coverage.

For advanced sentence-cloze coverage, work in reviewed batches. Each batch must pass:
1. target-form correctness and evidence decision
2. Japanese naturalness review
3. beginner-level appropriateness review
4. English translation review
5. context/repetition review
6. cloze-answer uniqueness review
7. automated tests
8. Firestore sync after merge

Technically generatable forms may be skipped for sentence examples when they are pragmatically odd or misleading for beginners.

## Development workflow
Use test-first development for regressions and structured content batches:

`test / review criteria -> form evidence -> implementation -> CI -> review -> main -> Firestore sync`

Do not merge known failing validation.

## Agent organization
The detailed source of truth remains `AGENTS.md`.

The Example Content Team consists of:
1. Beginner Japanese Teacher / 初級日本語教師
2. Native Japanese Editor / ネイティブ校正担当
3. English Translation Editor / 英訳担当
4. Learning & Memory Designer / 学習心理担当
5. Context Diversity Editor / 多様性担当
6. Cloze Question Designer / 穴埋め問題担当
7. Japanese Culture Context Editor / 日本文化担当
8. Conversation Material Designer / 会話教材担当

A dedicated Form Verification Agent / 活用検証担当 now sits immediately before the Example Content Team. It owns the external evidence decision for each advanced form and may stop example production with `not_applicable` or `deferred`.

The Learner Research Team consists of:
1. Second Language Acquisition Researcher / 第二言語習得リサーチ担当
2. Learner Error Researcher / 学習者エラー調査担当
3. Materials Benchmark Researcher / 教材ベンチマーク担当
4. Evidence & Source Reviewer / リサーチ検証担当

Research informs product design but does not silently override the supplied textbook sequence or reviewed content.

## Current progress
### Completed
- 活用1・活用2の学習画面を、活用2 UIの単一ページへ統合
- 活用1 implementation
- 活用2 page and shared conjugation generation for all 活用1 verbs
- separate 活用2 review page
- three learning modes
- GitHub Actions validation
- automated Firestore sync
- answer feedback and Enter-key flow regression tests
- Example Content Team expanded to eight roles
- Learner Research Team added
- reviewed advanced example Batch 1 and Batch 2
- full 152-entry core-form vs generated-form audit
- automatic group resolution from four known source forms
- `該当なし` mechanism and quiz exclusion
- audit correction examples for 8 detected conversion defects
- evidence-first verification ledger and CI release gate
- enlarged, high-contrast target-form instruction card in the 活用2 quiz

### Advanced example coverage
Batch 1: 20 reviewed advanced bilingual examples across あける・あげる・あつめる・あびる.

Batch 2: 30 reviewed advanced bilingual examples across いれる・おきる・おしえる (teach)・おしえる (tell)・おぼえる・おりる.

Audit correction batch: 40 reviewed advanced bilingual examples across たべる・みる・おきる・ねる・する・つれていく・もっていく・くる.

### Evidence-first Batch 3
The first batch produced under the new verification-before-writing policy:
- あう / 会う
- あるく / 歩く
- いう / 言う
- うごく / 動く
- かう / 買う

For each entry, なかった・可能・ば・意向・使役 were externally checked and recorded before examples were added. Batch 3 adds 25 reviewed advanced examples.

### Evidence-first Batch 4
- かえす / 返す
- かえる / 帰る
- かく / 書く
- かす / 貸す
- かつ / 勝つ

All five advanced forms were verified before example writing for each verb. Batch 4 adds 25 reviewed advanced examples. Full ledger: `docs/KATSUYOU2_BATCH4_2026-08-07.md`.

### Evidence-first Batch 5
- かぶる / 被る
- がんばる / 頑張る
- きく / 聞く
- けす / 消す
- さがす / 探す

Batch 5 adds 25 reviewed advanced bilingual examples after external form verification. Special notes are recorded for `かぶれる` (surface-form ambiguity with the separate verb かぶれる), `きける` versus `きこえる`, and the pragmatic force of `がんばらせる`. Full ledger: `docs/KATSUYOU2_BATCH5_2026-08-07.md`.

The frontend curated-data loader now includes `part-8.json` for both quiz and review pages.

### Evidence-first Batch 6
- しぬ / 死ぬ
- すわる / 座る
- たつ / 立つ
- つかう / 使う

Batch 6 adds 18 reviewed advanced bilingual examples. For `しぬ`, potential `しねる` and volitional `しのう` are marked `deferred`, stored as `null`, and excluded from quizzes; all released `しぬ` examples are limited to fish or plant contexts. Full ledger: `docs/KATSUYOU2_BATCH6_2026-08-10.md`.

The frontend curated-data loader now includes `part-9.json` for both quiz and review pages.

### Evidence-first Batch 7
- とる / 取る
- のむ / 飲む
- はなす / 話す
- まつ / 待つ

Batch 7 adds 20 reviewed advanced bilingual examples. All five advanced forms for each verb are marked `valid`. Full ledger: `docs/KATSUYOU2_BATCH7_2026-08-10.md`.

The frontend curated-data loader now includes `part-10.json` for both quiz and review pages.

### Evidence-first Batch 8
- よぶ / 呼ぶ
- よむ / 読む
- わかる / 分かる
- きく（せんせいに） / 聞く（先生に）

Batch 8 adds 18 reviewed advanced bilingual examples. For `わかる`, potential is `not_applicable`; volitional `わかろう` is `deferred` by the user's pedagogical decision. Both are stored as `null` and excluded from quizzes. The separate `きく（せんせいに）` source entry uses asking contexts to distinguish it from the earlier listening-centered `きく` entry. Full ledger: `docs/KATSUYOU2_BATCH8_2026-08-10.md`.

The frontend curated-data loader now includes `part-11.json` for both quiz and review pages.

### Evidence-first Batch 9
- きる / 切る
- さわる（どあに） / 触る（ドアに）
- しる / 知る
- すう（たばこを） / 吸う（たばこを）

Batch 9 adds 19 reviewed advanced bilingual examples. For `しる`, potential `しれる` is `not_applicable` by the user's pedagogical decision, stored as `null`, and excluded from quizzes. `きる` is kept explicitly distinct from the Group 2 homophone `着る`, and smoking examples avoid encouragement. Full ledger: `docs/KATSUYOU2_BATCH9_2026-08-10.md`.

The frontend curated-data loader now includes `part-12.json` for both quiz and review pages.

### Evidence-first Batch 10
- すむ / 住む
- だす / 出す
- つく / 着く
- つくる / 作る

Batch 10 adds 20 reviewed advanced bilingual examples. All five advanced forms for each verb are marked `valid`. For `つく`, the potential `つける` is taught with an explicit destination and arrival-time context so it is not confused with `付ける`. Full ledger: `docs/KATSUYOU2_BATCH10_2026-08-10.md`.

The frontend curated-data loader now includes `part-13.json` for both quiz and review pages.

### Evidence-first Batch 11
- てつだう / 手伝う
- とまる（ほてるに） / 泊まる（ホテルに）
- とる（しゃしんを） / 撮る（写真を）
- なおる / 治る

Batch 11 adds 17 reviewed advanced bilingual examples. For `なおる`, past negative `なおらなかった` and conditional `なおれば` are released. Potential `なおれる` and volitional `なおろう` are `not_applicable`, while causative `なおらせる` is `deferred`; all three are stored as `null` and excluded from quizzes. Natural intentional contexts are reserved for the transitive `なおす`, such as `なおそう` and `なおさせる`. Full ledger: `docs/KATSUYOU2_BATCH11_2026-08-10.md`.

The frontend curated-data loader now includes `part-14.json` for both quiz and review pages.

### Evidence-first Batch 12
- なくす / 失くす（物を紛失する）
- ならう / 習う
- なる
- ぬぐ / 脱ぐ

Batch 12 adds 17 reviewed advanced bilingual examples. The textbook sense of `なくす` is fixed as `失くす` (misplace), separate from `無くす` (eliminate). For `失くす`, potential `なくせる`, volitional `なくそう`, and causative `なくさせる` are `deferred`, stored as `null`, and excluded from quizzes. Full ledger: `docs/KATSUYOU2_BATCH12_2026-08-10.md`.

The frontend curated-data loader now includes `part-15.json` for both quiz and review pages.

### 2026-08-10: 活用2 evidence-first Batch 13

Added reviewed full example coverage for source IDs 064-067: `のぼる`, `のむ（くすりを）`, `のる`, and `はいる（だいがくに）`. All five advanced forms for each verb were verified as valid, producing 20 advanced bilingual examples in `data/katsuyou2/part-16.json`.

The examples preserve each textbook sense and explicitly disambiguate medicine-taking, transport, and university enrollment. The frontend curated-data loader now includes `part-16.json` for both quiz and review pages.

### 活用2 evidence-first batch 14 (2026-08-10)

Added reviewed full example coverage for source IDs 068-071: `はいる（きっさてんに）`, `はく`, `はたらく`, and `ひく`. All five advanced forms for each verb were verified as valid, producing 20 advanced bilingual examples in `data/katsuyou2/part-17.json`.

Examples keep cafe entry, clothing, work, and musical performance distinct. In particular, `はける` and `ひける` include explicit objects to prevent homophone confusion. The frontend curated-data loader now includes `part-17.json` for both quiz and review pages. Full ledger: `docs/KATSUYOU2_BATCH14_2026-08-10.md`.

### 活用2 evidence-first batch 15 (2026-08-10)

Added reviewed example coverage for source IDs 072-075: `ふる（あめが）`, `まがる`, `まわす`, and `もつ`. Batch 15 adds 18 advanced bilingual examples in `data/katsuyou2/part-18.json`.

For `ふる`, potential `ふれる` and volitional `ふろう` are `not_applicable`, stored as `null`, and excluded from quizzes. The other three verbs release all five advanced forms, with explicit road, rotating-object, and carried-object contexts. The frontend curated-data loader now includes `part-18.json` for both quiz and review pages. Full ledger: `docs/KATSUYOU2_BATCH15_2026-08-10.md`.

### 活用2 evidence-first batch 16 (2026-08-10)

Added reviewed example coverage for source IDs 077-080: `もらう`, `やくにたつ`, `やすむ` (physical rest), and `やすむ（しごとを）` (taking leave from work). Batch 16 adds 19 advanced bilingual examples in `data/katsuyou2/part-19.json`.

For `やくにたつ`, causative `やくにたたせる` is `deferred`, stored as `null`, and excluded from quizzes; ordinary beginner contexts are reserved for the separate transitive verb `やくだてる` / 役立てる. The two `やすむ` entries keep rest and work-leave contexts distinct. The frontend curated-data loader now includes `part-19.json` for both quiz and review pages. Full ledger: `docs/KATSUYOU2_BATCH16_2026-08-10.md`.

### Current work
- Evidence-first batch 17 completed source ID 081, `わたる（はしを）`, with all five advanced forms and 5 advanced bilingual examples in `data/katsuyou2/part-20.json`. This completes the remaining reviewed-example gap in the Group 1 source list. Both quiz and review loaders include `part-20.json`. Full ledger: `docs/KATSUYOU2_BATCH17_2026-08-10.md`.
- Evidence-first batch 18 starts Group 2 with source IDs 001-004: `あける`, `あげる`, `あつめる`, and `あびる（シャワーを）`. All five advanced forms are valid, adding 20 advanced bilingual examples in `data/katsuyou2/part-21.json`. Both quiz and review loaders include `part-21.json`. Full ledger: `docs/KATSUYOU2_BATCH18_2026-08-10.md`.
- Evidence-first batch 19 covers Group 2 source IDs 005-008: three senses of `いる` and `いれる`. The existence and child-possession senses release only `いなかった` and `いれば`; their potential, volitional, and causative forms are deferred and stored as `null`. The stay sense and `いれる` release all five advanced forms, for 14 advanced bilingual examples in `data/katsuyou2/part-22.json`. Both loaders include the batch. Full ledger: `docs/KATSUYOU2_BATCH19_2026-08-10.md`.
- Evidence-first batch 20 covers Group 2 source IDs 009-012: `うまれる`, `おきる`, and two source senses of `おしえる`. For `うまれる`, only `うまれなかった` and `うまれれば` are released; potential, volitional, and causative are deferred and stored as `null`. The other three entries release all five advanced forms, adding 17 advanced bilingual examples in `data/katsuyou2/part-23.json`. Full ledger: `docs/KATSUYOU2_BATCH20_2026-08-10.md`.
- Evidence-first batch 21 covers Group 2 source IDs 013-016: `おぼえる`, `おりる`, `かえる` (currency exchange), and `かえる` (change a plan). All five advanced forms are released for every entry, adding 20 advanced bilingual examples in `data/katsuyou2/part-24.json`. The two `かえる` entries are kept distinct through currency-only versus plan/schedule contexts. Full ledger: `docs/KATSUYOU2_BATCH21_2026-08-10.md`.
- Evidence-first batch 22 covers Group 2 source IDs 017-020: two senses of `かける` (telephone and eyewear), `かりる`, and `かんがえる`. All five advanced forms are released for every entry, adding 20 advanced bilingual examples in `data/katsuyou2/part-25.json`. The two `かける` entries are separated through telephone-only versus eyewear-only contexts. Full ledger: `docs/KATSUYOU2_BATCH22_2026-08-10.md`.
- Evidence-first batch 23 covers Group 2 source IDs 021-024: `きる（服を）`, `きをつける`, `くれる`, and `しめる`. All five advanced forms are released for the first, second, and fourth entries. For `くれる`, only past negative and conditional are released; potential is not applicable, while volitional and causative are deferred. This adds 17 advanced bilingual examples in `data/katsuyou2/part-26.json`. Full ledger: `docs/KATSUYOU2_BATCH23_2026-08-10.md`.
- Evidence-first batch 24 covers Group 2 source IDs 025-028: `しらべる`, `すてる`, `たべる`, and `たりる`. All five advanced forms are released for the first three entries. For `たりる`, only past negative and conditional are released; potential, volitional, and causative are deferred. This adds 17 advanced bilingual examples in `data/katsuyou2/part-27.json`. Full ledger: `docs/KATSUYOU2_BATCH24_2026-08-10.md`.
- Evidence-first batch 25 covers Group 2 source IDs 029-032: `つかれる`, `つける（電気などを）`, `でかける`, and `できる`. All five advanced forms are released for `つける` and `でかける`. For `つかれる`, past negative, conditional, and causative are released while potential and volitional are deferred. For `できる`, only past negative and conditional are released; potential is not applicable, while volitional and causative are deferred. This adds 15 advanced bilingual examples in `data/katsuyou2/part-28.json`. Full ledger: `docs/KATSUYOU2_BATCH25_2026-08-10.md`.
- Evidence-first batch 26 covers Group 2 source IDs 033-036: three senses of `でる` (change comes out, graduate from university, and get out of a bus) plus `とめる`. The university, bus, and vehicle-stopping senses release all five advanced forms. The change sense releases only past negative and conditional; potential, volitional, and causative are deferred. This adds 17 advanced bilingual examples in `data/katsuyou2/part-29.json`. Full ledger: `docs/KATSUYOU2_BATCH26_2026-08-10.md`.
- Evidence-first batch 27 covers Group 2 source IDs 037-040: `ねる`, `のりかえる`, `はじめる`, and `まける`. All five advanced forms are released for the first three entries. For `まける`, past negative, conditional, and volitional are released; the volitional uses an explicit intentional-loss context, while potential and causative are deferred. This adds 18 advanced bilingual examples in `data/katsuyou2/part-30.json`. Full ledger: `docs/KATSUYOU2_BATCH27_2026-08-10.md`.
- Evidence-first batch 28 covers Group 2 source IDs 041-044: `みせる`, `みる`, `むかえる`, and `やめる`. All five advanced forms are released for every entry, adding 20 advanced bilingual examples in `data/katsuyou2/part-31.json`. Full ledger: `docs/KATSUYOU2_BATCH28_2026-08-12.md`.
- Progress is generated from the same source-ID and legacy composite-key matching used by the app. Run `npm run progress:update` to refresh `docs/KATSUYOU2_PROGRESS.md`, or `npm run progress:check` in validation. Current full reviewed-example coverage is 117/152 verbs (77.0%); this replaces the earlier manual estimate of 126/152, which counted recorded work rather than production-linked full coverage.
- Continue the dictionary / actual-usage audit together with example creation rather than as a separate later pass.
- Every new batch must create/update `form-verification.json` before example data is accepted.
- Existing pre-policy curated entries will be migrated through the same evidence ledger incrementally; do not claim all legacy advanced forms are externally verified yet.
- Use the Learner Research Team when deciding whether a formally valid but rare form is useful for beginner practice.
- Treat `しぬ` and other semantically sensitive or pedagogically awkward verbs as separate review cases rather than automatically filling every advanced form.

## Maintenance rule
Update this file whenever architecture, Firestore flow, agent roles, learning modes, interaction policy, form-evidence policy, data schema, tests, completed example batches, or known limitations change.

This file is intended to be sufficient context for a future ChatGPT Work handoff together with `AGENTS.md`, the audit ledger, the form-verification policy, and the repository itself.
