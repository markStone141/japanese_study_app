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
### 動詞の活用1
- Existing full verb dataset split into Groups 1, 2, and 3.
- Core forms: ます・て・た・ない.

### 動詞の活用2
All verbs from 活用1 are made available through the shared conjugation engine.

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
- 6 source records whose declared group did not match their own four core forms:
  - たべる: declared Group 1 -> resolved Group 2
  - みる: Group 1 -> Group 2
  - おきる: Group 1 -> Group 2
  - ねる: Group 1 -> Group 2
  - する: Group 1 -> Group 3
  - くる: Group 1 -> Group 3
- 2 compound verbs ending in 行く had incorrect て / た generation because the 行く exception was only applied to the standalone word:
  - つれていく -> つれていって / つれていった
  - もっていく -> もっていって / もっていった

Explicit regression rules include:
- 寝る past negative = `ねなかった`.
- The grammatical Group 2 causative of 寝る = `ねさせる`. `寝かせる` is treated as a separate lexical transitive verb, though it can be more natural in many real situations and should eventually be explained to learners.
- Compound verbs ending in `いく` receive the 行く て / た exception.

### Applicable vs unavailable forms
A mechanically producible string is not automatically a quiz answer. Forms confirmed by reference review as unavailable or unsuitable as that verb's ordinary conjugation are stored as `null`, shown as `該当なし`, and excluded from quiz generation.

Currently reviewed as unavailable:
- `ある` potential
- `わかる` potential
- `くれる` potential
- `できる` potential

This list must expand only with evidence. Do not infer that all stative or intransitive verbs lack a potential form.

Detailed audit ledger: `docs/KATSUYOU2_AUDIT_2026-08-07.md`.

## Content policy
Example-sentence quality is a top priority. Do not mass-generate unreviewed advanced examples merely to increase coverage.

For advanced sentence-cloze coverage, work in reviewed batches. Each batch must pass:
1. target-form correctness
2. Japanese naturalness review
3. beginner-level appropriateness review
4. English translation review
5. context/repetition review
6. cloze-answer uniqueness review
7. automated tests
8. Firestore sync after merge

Technically generatable forms may be skipped for sentence examples when they are pragmatically odd or misleading for beginners. Example: a verb such as `うまれる` can be mechanically conjugated, but its potential/causative forms are poor candidates for ordinary beginner cloze examples.

## Development workflow
Use test-first development for regressions and structured content batches:

`test / review criteria -> implementation -> CI -> review -> main -> Firestore sync`

Do not merge known failing validation.

For conjugation review, use:

`活用1 source comparison -> morphology check -> dictionary / teaching-reference check -> applicable / 該当なし decision -> example review -> automated regression test`

## Agent organization
The detailed source of truth is `AGENTS.md`.

The Example Content Team consists of:
1. Beginner Japanese Teacher / 初級日本語教師
2. Native Japanese Editor / ネイティブ校正担当
3. English Translation Editor / 英訳担当
4. Learning & Memory Designer / 学習心理担当
5. Context Diversity Editor / 多様性担当
6. Cloze Question Designer / 穴埋め問題担当
7. Japanese Culture Context Editor / 日本文化担当
8. Conversation Material Designer / 会話教材担当

The Learner Research Team consists of:
1. Second Language Acquisition Researcher / 第二言語習得リサーチ担当
2. Learner Error Researcher / 学習者エラー調査担当
3. Materials Benchmark Researcher / 教材ベンチマーク担当
4. Evidence & Source Reviewer / リサーチ検証担当

Research-team purpose:
- identify common learner stumbling points;
- distinguish general errors from mother-tongue-specific patterns when supported by evidence;
- benchmark common textbook/app exercise types and their tradeoffs;
- turn findings into small product hypotheses and tests;
- preserve source citations, dates, confidence, and limitations rather than treating intuition as research.

Research informs product design but does not silently override the supplied textbook sequence or reviewed content.

The overall team also includes Coordinator, Question Design, Japanese QA, UI/UX, Implementation, Test & Balance, Learning Analysis, Refactoring/Code Quality, GitHub/CI & Firestore operations, and Final Review.

## Current progress
### Completed
- 活用1 implementation
- 活用2 page and shared conjugation generation for all 活用1 verbs
- separate 活用2 review page
- three learning modes
- GitHub Actions validation
- automated Firestore sync
- result/answer feedback regression test
- Enter-key answer / next flow
- primary button English contrast regression fix
- Example Content Team formally expanded to eight roles
- Learner Research Team formally added
- reviewed advanced example Batch 1
- reviewed advanced example Batch 2
- full 152-entry 活用1 core-form vs 活用2 generation audit
- automatic group resolution from the four known source forms
- reviewed `該当なし` mechanism and quiz exclusion
- audited correction example batch for the 8 detected conversion defects

### Advanced example coverage
Batch 1 completed:
- あける
- あげる
- あつめる
- あびる

Batch 1: 20 reviewed advanced bilingual examples.

Batch 2 completed:
- いれる
- おきる
- おしえる (teach)
- おしえる (tell an address / information)
- おぼえる
- おりる

Batch 2: 30 reviewed advanced bilingual examples.

Audit correction batch (`data/katsuyou2/part-6.json`):
- たべる
- みる
- おきる
- ねる
- する
- つれていく
- もっていく
- くる

Audit correction batch: 40 reviewed advanced bilingual examples (5 advanced forms × 8 entries).

Total newly reviewed advanced examples represented by Batch 1 + Batch 2 + audit correction batch: 90 examples. Some older curated 活用2 examples also exist independently in `part-1` through `part-5`.

Batch 2 deliberately skips `いる` variants and `うまれる` for now because some advanced forms need separate pedagogical treatment rather than forced everyday examples.

### Current work
- Continue the dictionary / actual-usage audit of advanced forms beyond the first reviewed `該当なし` set. The 152-entry structural/core-form audit is complete, but do not claim every advanced form has been individually dictionary-verified yet.
- Continue Group 2 in small reviewed advanced-example batches.
- Use the Learner Research Team when deciding which trouble spots, explanations, and exercise formats deserve priority.
- Before adding a verb to advanced sentence-cloze coverage, decide whether each selected advanced form is both grammatically valid and pedagogically suitable. Document unavailable forms instead of forcing an unnatural sentence.

## Maintenance rule
Update this file whenever any of the following changes:
- architecture or hosting
- Firestore collections / import flow
- agent roles or workflow
- learning modes
- keyboard / interaction policy
- conjugation evidence / unavailable-form policy
- data schema
- major test policy
- completed example batches / current work
- known limitations or migration plans

This file is intended to be sufficient context for a future ChatGPT Work handoff together with `AGENTS.md`, the audit ledger, and the repository itself.
