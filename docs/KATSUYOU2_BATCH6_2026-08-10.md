# 活用2 Evidence-first Batch 6

Reviewed on: 2026-08-10

## Scope

- しぬ / 死ぬ
- すわる / 座る
- たつ / 立つ
- つかう / 使う

## Verification decision

Every advanced form was checked before example release. The production decisions are stored in `data/katsuyou2/form-verification.json`.

For `しぬ`, the potential `しねる` and volitional `しのう` are temporarily `deferred` by product decision. Both forms can appear in films, stories, or end-of-life contexts, so the app does not treat them as nonexistent. However, asking a beginner to produce them in an ordinary standalone cloze can blur contextual recognition with a direct self-referential statement. Their production values are therefore `null`, they have no cloze examples, and they are excluded from the current quiz mode. They may later be introduced in a quoted-dialogue or usage-note format with clear fictional context.

The released examples for `しぬ` use fish or plant contexts. They avoid harm instructions, insults, threats, and direct statements about the learner or another person.

The other three verbs have all five advanced forms marked `valid`.

## Release result

- 4 reviewed verbs
- 18 released advanced bilingual examples
- 2 deferred forms
- JSON deliverable: `data/katsuyou2/part-9.json`
