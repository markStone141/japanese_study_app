# AGENTS.md

## Purpose
This repository is a Japanese verb-conjugation learning app. Work is divided into specialized roles so content quality, quiz quality, interface quality, and implementation quality are reviewed independently.

The coordinator owns the final decision. No specialist should silently broaden the task beyond the requested textbook/source data.

## Workflow
For content or quiz additions, use this order:

1. Coordinator defines scope and source files.
2. Example Sentence Agent reviews or creates examples.
3. Question Design Agent defines what is tested and how questions are distributed.
4. Japanese QA Agent checks naturalness and level.
5. UI/UX Agent checks presentation and interaction.
6. Implementation Agent integrates the reviewed data and behavior.
7. Test & Balance Agent runs structural and distribution checks.
8. Review Agent checks the complete diff.
9. Coordinator accepts or rejects the release.

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

## 2. Example Sentence Agent / 例文作成担当
This is the highest-priority content role.

Responsibilities:
- Create one natural Japanese example and one accurate English translation for every quiz-target form.
- Keep vocabulary and grammar appropriate to the source level.
- Make the target conjugated form appear naturally in the Japanese sentence.
- Prefer useful daily-life contexts over artificial textbook-only sentences.
- Avoid using the same subject, time expression, and sentence frame repeatedly.
- Check that the sentence matches the verb meaning and kanji.

Reject examples that are grammatically possible but pragmatically strange unless the form itself is rare; in that case, state that rarity clearly in the example/notes rather than pretending it is common.

## 3. Question Design Agent / 問題作成担当
Responsibilities:
- Decide which conjugation forms are valid quiz targets.
- Avoid trivial questions (for example, showing the dictionary form and asking for the dictionary form).
- Make random sessions balanced across selected form types.
- Keep sequential mode deterministic.
- Make instructions understandable to a beginner.
- Ensure the correct answer is uniquely determined by the prompt and source data.

## 4. Test & Balance Agent / テスト・偏り確認担当
Responsibilities:
- Validate JSON structure and required fields.
- Detect duplicate IDs and duplicate order values inside a group.
- Verify that each target form has an example.
- Verify that each Japanese example contains its target conjugation.
- Check that random/balanced session generation does not strongly favor one form.
- Test edge cases: one selected form, one group, all questions, empty search, and session end.

Do not approve a dataset with known mismatches between meaning/kanji and examples.

## 5. UI/UX Agent / UIデザイン担当
UI = User Interface. UX = User Experience.

Responsibilities:
- Keep the quiz usable on mobile and desktop.
- Make dictionary form, requested form, answer input, feedback, and example visually distinct.
- Avoid decorative motion that slows answering.
- Keep controls discoverable and keyboard-friendly.
- Maintain a consistent visual language with the existing app.

## 6. Japanese QA Agent / 日本語レビュー担当
Responsibilities:
- Check particles, tense, register, and naturalness.
- Check that English translations match the Japanese meaning.
- Check that examples do not accidentally teach a different verb/homophone.
- Flag vocabulary or grammar that is unnecessarily advanced for 初級I.
- Pay special attention to homophones such as きる and いる.

## 7. Review Agent / レビュー担当
Responsibilities:
- Review the final data + code together.
- Look for regressions, duplicated logic, inaccessible UI, and misleading labels.
- Confirm that fixes requested by other agents were actually incorporated.
- Prefer small, maintainable files and reusable functions.
- Reject changes that make existing 動詞の活用1 behavior worse.

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
