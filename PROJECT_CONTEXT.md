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

For each entry, なかった・可能・ば・意向・使役 were externally checked and recorded before examples were added. Batch 3 adds 25 reviewed advanced examples; the production entries also include reviewed basic examples so the existing full-content audit remains effective.

### Current work
- Continue the dictionary / actual-usage audit together with example creation rather than as a separate later pass.
- Every new batch must create/update `form-verification.json` before example data is accepted.
- Existing pre-policy curated entries will be migrated through the same evidence ledger incrementally; do not claim all legacy advanced forms are externally verified yet.
- Use the Learner Research Team when deciding whether a formally valid but rare form is useful for beginner practice.

## Maintenance rule
Update this file whenever architecture, Firestore flow, agent roles, learning modes, interaction policy, form-evidence policy, data schema, tests, completed example batches, or known limitations change.

This file is intended to be sufficient context for a future ChatGPT Work handoff together with `AGENTS.md`, the audit ledger, the form-verification policy, and the repository itself.
