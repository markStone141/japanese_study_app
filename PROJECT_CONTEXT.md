# Japanese Study App — Project Context

## Purpose
A Japanese-learning web app based on the supplied みんなの日本語 初級I verb data. The current focus is verb conjugation practice with natural bilingual examples, reliable testing, and incremental content review.

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
- Example Content Team formally expanded to eight roles
- reviewed advanced example Batch 1
- reviewed advanced example Batch 2

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

Total reviewed advanced examples after Batch 2: 50 examples across 10 verb entries.

Batch 2 deliberately skips `いる` variants and `うまれる` for now because some advanced forms need separate pedagogical treatment rather than forced everyday examples.

### Current work
Continue Group 2 in small reviewed batches. Before adding a verb to advanced sentence-cloze coverage, decide whether all five advanced forms are pedagogically suitable. If not, document the exception instead of forcing an unnatural sentence.

## Maintenance rule
Update this file whenever any of the following changes:
- architecture or hosting
- Firestore collections / import flow
- agent roles or workflow
- learning modes
- data schema
- major test policy
- completed example batches / current work
- known limitations or migration plans

This file is intended to be sufficient context for a future ChatGPT Work handoff together with `AGENTS.md` and the repository itself.
