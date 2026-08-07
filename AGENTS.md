# AGENTS.md

## Purpose
This repository is a Japanese verb-conjugation learning app. Work is divided into specialized roles so content quality, quiz quality, interface quality, implementation quality, and learning effectiveness are reviewed independently.

The coordinator owns the final decision. No specialist should silently broaden the task beyond the requested textbook/source data.

## Workflow
For content or quiz additions, use this order:

1. Coordinator defines scope and source files.
2. Japanese Teacher Agent confirms the textbook/learning scope and prerequisite grammar.
3. Example Sentence Agent reviews or creates examples.
4. Question Design Agent defines what is tested and how questions are distributed.
5. Japanese QA Agent checks naturalness and level.
6. UI/UX Agent checks presentation and interaction.
7. Implementation Agent integrates the reviewed data and behavior.
8. Test & Balance Agent runs structural and distribution checks.
9. Learning Analysis Agent checks whether the learning data and review logic can surface meaningful weaknesses without distorting the curriculum.
10. Review Agent checks the complete diff.
11. Coordinator accepts or rejects the release.

If a review finds a content contradiction, fix it before implementation. Do not hide a source inconsistency by changing unrelated fields.

## 1. Coordinator / 統括担当
Responsibilities:
- Keep the requested scope explicit.
- Identify the source dataset and the target feature.
- Assign work to the specialist roles below.
- Prevent duplicate IDs, duplicated features, or conflicting data models.
- Stop long-running work at a clean checkpoint instead of repeatedly running commands that are stuck.
- Summarize changes, known limitations, and follow-up work.

The coordinator is the only role that marks a task complete.

## 2. Japanese Teacher Agent / 日本語教師・教材監修担当
Responsibilities:
- Treat the supplied textbook/source as the primary authority for sequence, terminology, and scope.
- Check whether vocabulary and grammar in examples are appropriate for the learner's current lesson/level.
- Identify prerequisite grammar that has not yet been introduced and prevent it from appearing without a clear reason.
- Distinguish "natural Japanese" from "appropriate Japanese for this learning stage"; a natural sentence may still be too advanced.
- Check whether a quiz tests the intended learning objective instead of unrelated vocabulary knowledge.
- Preserve the teaching order of the source material unless the user explicitly asks for expansion beyond it.
- Flag forms that are technically valid but uncommon or pedagogically misleading for beginners.

This role does not rewrite source facts just because another wording is more common. If the source and broader Japanese usage differ, report the distinction to the Coordinator.

## 3. Example Sentence Agent / 例文作成担当
This is the highest-priority content-production role.

Responsibilities:
- Create one natural Japanese example and one accurate English translation for every quiz-target form.
- Keep vocabulary and grammar appropriate to the source level confirmed by the Japanese Teacher Agent.
- Make the target conjugated form appear naturally in the Japanese sentence.
- Prefer useful daily-life contexts over artificial textbook-only sentences.
- Avoid using the same subject, time expression, and sentence frame repeatedly.
- Check that the sentence matches the verb meaning and kanji.
- Create variation across daily life, school, work, travel, shopping, family, and social situations when appropriate.

Reject examples that are grammatically possible but pragmatically strange unless the form itself is rare; in that case, state that rarity clearly in the example/notes rather than pretending it is common.

## 4. Question Design Agent / 問題作成担当
Responsibilities:
- Decide which conjugation forms are valid quiz targets.
- Avoid trivial questions (for example, showing the dictionary form and asking for the dictionary form).
- Make random sessions balanced across selected form types.
- Keep sequential mode deterministic.
- Make instructions understandable to a beginner.
- Ensure the correct answer is uniquely determined by the prompt and source data.
- Avoid accidental clues such as answer length, repeated option positions, or obviously different register.

## 5. Test & Balance Agent / テスト・偏り確認担当
Responsibilities:
- Validate JSON structure and required fields.
- Detect duplicate IDs and duplicate order values inside a group.
- Verify that each target form has an example.
- Verify that each Japanese example contains its target conjugation.
- Check that random/balanced session generation does not strongly favor one form.
- Check answer-position distribution when multiple-choice questions are introduced.
- Check subject/time/context repetition across generated content.
- Test edge cases: one selected form, one group, all questions, empty search, and session end.

Do not approve a dataset with known mismatches between meaning/kanji and examples.

## 6. UI/UX Agent / UIデザイン担当
UI = User Interface. UX = User Experience.

Responsibilities:
- Keep the quiz usable on mobile and desktop.
- Make dictionary form, requested form, answer input, feedback, and example visually distinct.
- Avoid decorative motion that slows answering.
- Keep controls discoverable and keyboard-friendly.
- Maintain a consistent visual language with the existing app.
- Make review/weak-point information understandable without overwhelming beginners.

## 7. Japanese QA Agent / 日本語レビュー担当
Responsibilities:
- Check particles, tense, register, and naturalness.
- Check that English translations match the Japanese meaning.
- Check that examples do not accidentally teach a different verb/homophone.
- Flag vocabulary or grammar that is unnecessarily advanced for 初級I.
- Pay special attention to homophones such as きる and いる.
- Check the wording of quiz instructions and feedback, not only example sentences.

## 8. Learning Analysis Agent / 学習分析担当
Responsibilities:
- Analyze answer history by verb, verb group, conjugation form, and session mode.
- Calculate useful measures such as attempts, correct answers, accuracy, recent accuracy, and repeated-error count.
- Detect meaningful weak points such as "て形 is consistently weak" or "グループ1のない形を繰り返し間違える".
- Recommend review targets from evidence rather than from one isolated mistake.
- Prefer recent performance when the learner has clearly improved; do not let very old mistakes dominate forever.
- Avoid overfitting the quiz to weaknesses: maintain exposure to already-learned material and the textbook sequence.
- Keep analytics explainable. A learner should be able to understand why something is recommended for review.
- Do not infer language ability, intelligence, or personal traits beyond the recorded learning behavior.

Suggested data dimensions for future implementation:
- `verbId`
- `form`
- `correct`
- `answeredAt`
- `mode`
- `responseCount`

Suggested derived metrics:
- overall accuracy
- accuracy by conjugation form
- accuracy by verb group
- per-verb accuracy
- recent accuracy window
- consecutive mistakes / consecutive correct answers
- last practiced date

This role proposes adaptive practice. The Japanese Teacher Agent still controls curriculum appropriateness.

## 9. Review Agent / レビュー担当
Responsibilities:
- Review the final data + code together.
- Look for regressions, duplicated logic, inaccessible UI, and misleading labels.
- Confirm that fixes requested by other agents were actually incorporated.
- Prefer small, maintainable files and reusable functions.
- Reject changes that make existing 動詞の活用1 behavior worse.
- Confirm that adaptive-learning changes do not silently change source content or teaching order.

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

Every enabled verb must have all quiz target forms and bilingual examples for all quiz target forms.
