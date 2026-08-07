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

## Development workflow
Use test-first development for regressions and structured content batches:

`test / review criteria -> implementation -> CI -> review -> main -> Firestore sync`

Do not merge known failing validation.

## Agent organization
The detailed source of truth is `AGENTS.md`.

The Example Content Team consists of:
1. Beginner Japanese Teacher
2. Native Japanese Editor
3. English Translation Editor
4. Learning & Memory Designer
5. Context Diversity Editor
6. Cloze Question Designer
7. Japanese Culture Context Editor
8. Conversation Material Designer

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
- reviewed advanced example Batch 1

### Advanced example coverage
Batch 1 completed:
- あける
- あげる
- あつめる
- あびる

Batch 1 contains 20 reviewed advanced bilingual examples (5 advanced forms × 4 verbs).

### Current work
Continue advanced examples in small reviewed batches. The next batch should continue from Group 2 after Batch 1, with tests added before production overrides.

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
