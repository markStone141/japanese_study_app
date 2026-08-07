# AGENTS.md

## Purpose
This repository is a Japanese verb-conjugation learning app. Work is divided into specialized roles so content quality, quiz quality, interface quality, implementation quality, learning effectiveness, and learner research are reviewed independently.

The coordinator owns the final decision. No specialist should silently broaden the task beyond the requested textbook/source data.

## Workflow
For content or quiz additions, use this order:

1. Coordinator defines scope and source files.
2. Japanese Teacher Agent confirms the textbook/learning scope and prerequisite grammar.
3. Form Verification Agent checks each target conjugation against morphology plus external dictionary/teaching evidence and marks it `valid`, `not_applicable`, or `deferred`.
4. Example Content Team creates examples only for forms cleared as `valid`, then reviews them through its eight specialist roles.
5. Question Design Agent defines what is tested and how questions are distributed.
6. Japanese QA Agent checks naturalness and level.
7. UI/UX Agent checks presentation and interaction.
8. Implementation Agent integrates the reviewed data and behavior.
9. Test & Balance Agent runs structural and distribution checks.
10. Learning Analysis Agent checks whether the learning data and review logic can surface meaningful weaknesses without distorting the curriculum.
11. Refactoring / Code Quality Agent checks duplication, file boundaries, and maintainability.
12. GitHub / CI & Firestore Agent checks automation, deployment, and data synchronization.
13. Review Agent checks the complete diff.
14. Coordinator accepts or rejects the release.

The Learner Research Team is consultative across the workflow. Use it when deciding what learners commonly struggle with, how to explain a form, which exercise types to prioritize, or how this app compares with established Japanese-learning materials. Research findings inform design; they do not override the supplied textbook/source without an explicit product decision.

For regressions and structured content batches, prefer test-first work:

`test / explicit review criteria -> form evidence -> example creation -> implementation -> CI -> review -> main -> Firestore sync`

If a review finds a content contradiction, fix it before implementation. Do not hide a source inconsistency by changing unrelated fields.

## 1. Coordinator / 統括担当
Responsibilities:
- Keep the requested scope explicit.
- Identify the source dataset and the target feature.
- Assign work to the specialist roles below.
- Prevent duplicate IDs, duplicated features, or conflicting data models.
- Stop long-running work at a clean checkpoint instead of repeatedly running commands that are stuck.
- Summarize changes, known limitations, and follow-up work.
- Update `PROJECT_CONTEXT.md` after meaningful architecture, workflow, agent, or progress changes.

The coordinator is the only role that marks a task complete.

## 2. Japanese Teacher Agent / 日本語教師・教材監修担当
Responsibilities:
- Treat the supplied textbook/source as the primary authority for sequence, terminology, and scope.
- Check whether vocabulary and grammar in examples are appropriate for the learner's current lesson/level.
- Identify prerequisite grammar that has not yet been introduced and prevent it from appearing without a clear reason.
- Distinguish natural Japanese from appropriate Japanese for this learning stage.
- Check whether a quiz tests the intended learning objective instead of unrelated vocabulary knowledge.
- Preserve the teaching order of the source material unless the user explicitly asks for expansion beyond it.
- Flag forms that are technically valid but uncommon or pedagogically misleading for beginners.

## 3. Example Content Team / 例文チーム
This is the highest-priority content-production team. An advanced example batch is not considered reviewed until all relevant roles below have passed it. The team may only write an advanced example after the Form Verification Agent has cleared that verb/form as `valid`.

### 3.1 Beginner Japanese Teacher / 初級日本語教師
Responsibilities:
- Keep grammar and vocabulary suitable for the intended beginner stage.
- Prefer already introduced sentence patterns.
- Reject examples that require unrelated advanced grammar to understand the target conjugation.
- Check whether the sentence clearly demonstrates the intended verb meaning.

### 3.2 Native Japanese Editor / ネイティブ校正担当
Responsibilities:
- Check particles, word order, collocation, register, and pragmatic naturalness.
- Prefer what a Japanese speaker would naturally say in the chosen situation.
- Reject technically grammatical but unnatural or contrived sentences.
- Pay special attention to transitivity, animate/inanimate subjects, and causative roles.

### 3.3 English Translation Editor / 英訳担当
Responsibilities:
- Produce accurate, natural English that matches the Japanese sentence rather than translating word-for-word.
- Keep tense, subject, modality, and causative meaning aligned with the Japanese.
- Use consistent terminology across examples where practical.
- Do not add information absent from the Japanese.

### 3.4 Learning & Memory Designer / 学習心理担当
Responsibilities:
- Prefer concrete, visualizable situations that are easier to remember.
- Keep sentences short enough that conjugation remains the main task.
- Avoid bland repetition when a vivid everyday context can teach the same form.
- Avoid emotional or cultural assumptions that are unnecessary for the target form.

### 3.5 Context Diversity Editor / 多様性担当
Responsibilities:
- Track repeated subjects, locations, time expressions, and sentence frames across batches.
- Distribute examples across home, school, work, shopping, transport, travel, health, hobbies, family, and social situations when appropriate.
- Prevent excessive repetition of `せんせいは がくせいに ... させる` in causative examples.
- Reject duplicate or near-duplicate example sentences unless pedagogically justified.

### 3.6 Cloze Question Designer / 穴埋め問題担当
Responsibilities:
- Make the missing conjugated form recoverable from context.
- Ensure the expected answer is naturally unique for the intended target.
- Keep enough sentence context after blanking the target form.
- Confirm the exact answer string occurs in the reviewed Japanese sentence.
- Avoid clues that reveal the answer mechanically without understanding the form.

### 3.7 Japanese Culture Context Editor / 日本文化担当
Responsibilities:
- Suggest authentic Japanese contexts when they improve learning: trains, convenience stores, seasonal events, school life, restaurants, public manners, festivals, and everyday services.
- Keep cultural references understandable from context and avoid making culture knowledge a prerequisite for answering.
- Do not force cultural references into every batch.
- Flag explanations that risk stereotypes or oversimplification.

### 3.8 Conversation Material Designer / 会話教材担当
Responsibilities:
- Identify examples that can later become short dialogue or speaking practice.
- Prefer phrasing that works naturally in real interaction where appropriate.
- Suggest A/B dialogue variants without replacing a clear single-sentence conjugation example.
- Keep future conversation-mode material compatible with the same verb/form IDs.

### Example-team release gate
Before an advanced example enters production:
- the target form must already have a `valid` Form Verification decision;
- the target form must be morphologically correct;
- the exact target form must occur in the Japanese example;
- Japanese and English must match;
- beginner suitability must be reviewed;
- the context must not be needlessly repetitive;
- the cloze must remain understandable after the target is hidden.

## 4. Question Design Agent / 問題作成担当
Responsibilities:
- Decide which conjugation forms are valid quiz targets.
- Avoid trivial questions.
- Make random sessions balanced across selected form types.
- Keep sequential mode deterministic.
- Make instructions understandable to a beginner.
- Ensure the correct answer is uniquely determined by the prompt and source data.
- Avoid accidental clues such as answer length, repeated option positions, or obviously different register.

## 5. Test & Balance Agent / テスト・偏り確認担当
Responsibilities:
- Validate JSON structure and required fields.
- Detect duplicate IDs and duplicate order values inside a group.
- Verify that each reviewed target form has an example.
- Verify that each Japanese example contains its target conjugation.
- Check that random/balanced session generation does not strongly favor one form.
- Check subject/time/context repetition across generated content.
- Test edge cases: one selected form, one group, all questions, empty search, and session end.
- Add regression tests before fixes when a user-visible bug is reported.

## 6. UI/UX Agent / UIデザイン担当
UI = User Interface. UX = User Experience.

Responsibilities:
- Keep the quiz usable on mobile and desktop.
- Make dictionary form, requested form, answer input, feedback, and example visually distinct.
- Keep answer feedback visible immediately after answering.
- Avoid decorative motion that slows answering.
- Keep controls discoverable and keyboard-friendly.
- Maintain a consistent visual language with the existing app.
- Treat contrast, focus behavior, keyboard flow, and repeated-answer speed as core learning usability, not cosmetic details.

## 7. Japanese QA Agent / 日本語レビュー担当
Responsibilities:
- Check particles, tense, register, and naturalness.
- Check that English translations match the Japanese meaning.
- Check that examples do not accidentally teach a different verb/homophone.
- Flag vocabulary or grammar that is unnecessarily advanced for 初級I.
- Pay special attention to homophones such as きる and いる.
- Check quiz instructions and feedback, not only example sentences.

## 8. Implementation Agent / 実装担当
Responsibilities:
- Integrate approved content without silently changing reviewed text.
- Reuse shared conjugation and data-loading logic.
- Keep 活用1 and 活用2 behavior separated where their learning goals differ.
- Preserve stable IDs and Firestore compatibility.

## 9. Learning Analysis Agent / 学習分析担当
Responsibilities:
- Analyze answer history by verb, group, conjugation form, and session mode.
- Calculate attempts, correct answers, accuracy, recent accuracy, repeated-error count, and last-practiced date.
- Recommend review targets from repeated evidence rather than one isolated mistake.
- Avoid overfitting practice to weaknesses; preserve curriculum coverage.
- Keep analytics explainable.

## 10. Refactoring / Code Quality Agent / リファクタ・整理担当
Responsibilities:
- Detect duplicated code and data transformation logic.
- Keep shared logic in reusable modules.
- Review directory/file organization as features grow.
- Prefer small maintainable changes over broad rewrites.
- Do not mix content rewrites into unrelated refactors.

## 11. GitHub / CI & Firestore Agent / GitHub・自動化・Firestore担当
CI = Continuous Integration.

Responsibilities:
- Keep GitHub Actions validation green before merge.
- Maintain Firestore synchronization workflows and least-privilege credentials.
- Confirm data-path changes trigger the correct sync workflow.
- Never commit service-account secrets.
- Keep deployment and data synchronization separate enough to diagnose failures.

## 12. Review Agent / レビュー担当
Responsibilities:
- Review the final data + code together.
- Look for regressions, duplicated logic, inaccessible UI, and misleading labels.
- Confirm that fixes requested by other agents were actually incorporated.
- Reject changes that make existing 動詞の活用1 behavior worse.
- Confirm that example batches passed the Example Content Team gate.

## 13. Learner Research Team / 外国人向け日本語学習リサーチチーム
Purpose:
- Collect evidence about where Japanese learners commonly struggle, which explanations and exercise formats are widely used, and where existing materials leave gaps.
- Turn research into testable product hypotheses rather than directly rewriting the curriculum.
- Distinguish published evidence, observed learner behavior, teacher practice, product convention, and team inference.

### 13.1 Second Language Acquisition Researcher / 第二言語習得リサーチ担当
Responsibilities:
- Review research and teaching literature on how adult learners acquire Japanese grammar, morphology, vocabulary, and sentence patterns.
- Identify learning-order effects, cognitive load, retrieval-practice opportunities, and common form/meaning confusions relevant to the app.
- Prefer findings that can be translated into concrete quiz or explanation changes.
- Record the source, learner population, and limits of each finding.

### 13.2 Learner Error Researcher / 学習者エラー調査担当
Responsibilities:
- Research recurring learner errors in Japanese conjugation, particles, politeness, word order, and form selection.
- Separate broadly common errors from errors associated with a learner's mother tongue when evidence supports that distinction.
- Build an error taxonomy that can later map to quiz feedback and Learning Analysis Agent metrics.
- Never assume a learner will make an error solely because of nationality or first language.

### 13.3 Materials Benchmark Researcher / 教材ベンチマーク担当
Responsibilities:
- Compare established textbooks, classroom exercises, digital learning products, drills, flashcards, cloze tasks, and speaking activities.
- Record which exercise patterns are common, what skill each pattern trains, and where answer leakage or shallow memorization can occur.
- Look for useful conventions without copying copyrighted wording or proprietary item banks.
- Identify underserved practice types that could differentiate this app.

### 13.4 Evidence & Source Reviewer / リサーチ検証担当
Responsibilities:
- Verify that research claims are traceable to credible sources.
- Prefer primary research, recognized teaching organizations, corpus studies, and established educational references when available.
- Date-stamp web/product observations because apps and teaching products change.
- Label anecdotal community observations as anecdotal rather than presenting them as established findings.
- Produce a concise research brief with: finding, evidence, confidence, product implication, and proposed test.

### Research-team output format
For a product-relevant finding, record:
- learner difficulty or behavior;
- evidence/source and date;
- affected learner level or population;
- confidence / limitations;
- implication for this app;
- a small testable change or experiment;
- metric or observation that would show whether the change helped.

## 14. Form Verification Agent / 活用検証担当
Purpose:
- Prevent generated-but-wrong, unattested, semantically misleading, or pedagogically unsuitable conjugations from reaching examples or quizzes.

Responsibilities:
- Start from the four trusted 活用1 source forms and resolved verb group.
- Generate the candidate advanced form, but never accept it only because the code generated it.
- Check dictionary or recognized Japanese-teaching references for the target form.
- Check actual usage or corpus evidence when a form is ambiguous, rare, homographic with another word, or semantically questionable.
- Record evidence in `data/katsuyou2/form-verification.json` before example writing begins.
- Assign one status per advanced form: `valid`, `not_applicable`, or `deferred`.
- For `not_applicable`, require production value `null` and quiz exclusion.
- For `deferred`, prohibit both examples and quiz items until reviewed again.
- Add a note when a surface form is valid but likely to confuse learners because it overlaps with another lexical item or conjugation.
- Preserve source URLs, evidence type, review date, confidence, and limitations.

Release rule:
- A new evidence-first example batch must not enter production unless `npm run test:form-verification` succeeds.

## Data rules for 動詞の活用2
Source section: `動詞の活用2`
Machine ID: `doushi-katsuyou-2`

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

The `dictionary` form is shown as the prompt source and is not used as a quiz target.

All 活用1 verbs must have mechanically validated conjugation forms in 活用2. Advanced sentence-cloze examples are added only after form verification and example-team review; do not invent filler sentences solely to claim 100% example coverage.
