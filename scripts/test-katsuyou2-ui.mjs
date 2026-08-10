import fs from "node:fs";
import assert from "node:assert/strict";

const html = fs.readFileSync("katsuyou2.html", "utf8");
const indexHtml = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("katsuyou2.css", "utf8");
const js = fs.readFileSync("katsuyou2.js", "utf8");
const resultIndex = html.indexOf('id="result"');
const buttonsIndex = html.indexOf('class="button-row"');
assert.ok(resultIndex !== -1, "katsuyou2.html must contain #result");
assert.ok(buttonsIndex !== -1, "katsuyou2.html must contain .button-row");
assert.ok(resultIndex < buttonsIndex, "The answer/result panel must appear before the navigation buttons so the learner sees feedback immediately.");

// The former 活用1 page now enters the single unified 活用 screen.
assert.match(indexHtml, /url=\.\/katsuyou2\.html/,
  "index.html must lead to the unified conjugation page");
assert.doesNotMatch(html, /かつよう\s*1|かつよう\s*2/,
  "The unified learning page must not present separate 活用1 / 活用2 navigation");

// Regression: the global [lang=en] muted style must not make English text on primary buttons gray.
assert.match(css, /\.primary\s+\[lang=["']en["']\][^{]*\{[^}]*color\s*:\s*(?:#fff|white)/s,
  "English helper text inside primary buttons must remain high-contrast white");

// Regression: the requested target form must be the clearest instruction inside the quiz card.
assert.match(css, /\.prompt-box\s*\{[^}]*width\s*:\s*min\(680px,\s*100%\)[^}]*border\s*:\s*3px\s+solid\s+var\(--primary\)[^}]*background\s*:\s*#eef4ff/s,
  "The target-form card must remain large and visually prominent");
assert.match(css, /\.prompt-box\s+strong\s*\{[^}]*font-size\s*:\s*clamp\(2rem,\s*7vw,\s*3rem\)/s,
  "The target conjugation name must remain easy to identify at a glance");

// Regression: Enter should act as answer-check / next even when focus is not currently in the answer input.
assert.match(js, /document\.addEventListener\(["']keydown["']/,
  "katsuyou2.js must register a page-level keyboard handler");
assert.match(js, /event\.key\s*!==\s*["']Enter["']/,
  "page-level keyboard handler must explicitly handle Enter");
assert.match(js, /event\.isComposing/,
  "Enter handling must not submit while a Japanese IME composition is still active");
assert.match(js, /state\.answered\s*\?\s*nextQuestion\(\)\s*:\s*checkAnswer\(\)/,
  "Enter must check the current answer, then advance after feedback is shown");

const advanced = JSON.parse(fs.readFileSync("data/katsuyou2/advanced-examples.json", "utf8"));
const overrides = JSON.parse(fs.readFileSync("data/content-review-overrides.json", "utf8"));
assert.ok(Array.isArray(advanced) && advanced.length > 0, "advanced-examples.json must contain at least one reviewed batch");

// Batch 2 deliberately skips verbs whose advanced forms are technically generatable
// but pedagogically awkward in ordinary beginner contexts (for example 生まれる potential/causative).
const requiredBatch2 = [
  "minna-shokyu-1-group-2-008",
  "minna-shokyu-1-group-2-010",
  "minna-shokyu-1-group-2-011",
  "minna-shokyu-1-group-2-012",
  "minna-shokyu-1-group-2-013",
  "minna-shokyu-1-group-2-014"
];
const batch2Ids = new Set(advanced.filter((item) => item.batch === 2).map((item) => item.sourceVerbId));
for (const id of requiredBatch2) assert.ok(batch2Ids.has(id), `Batch 2 must include ${id}`);

const forms = ["pastNegative", "potential", "ba", "volitional", "causative"];
const sentenceKeys = new Set();
for (const item of advanced) {
  assert.ok(item.sourceVerbId, "advanced example item must have sourceVerbId");
  const productionExamples = overrides.verbs?.[item.sourceVerbId]?.examples;
  assert.ok(productionExamples, `${item.sourceVerbId}: reviewed batch must be wired into content-review-overrides.json`);
  for (const form of forms) {
    const example = item.examples?.[form];
    assert.ok(example?.ja && example?.en, `${item.sourceVerbId}: missing ${form} bilingual example`);
    assert.ok(example.answer, `${item.sourceVerbId}: ${form} must declare the exact answer used in the Japanese example`);
    assert.ok(example.ja.replace(/\s+/g, "").includes(example.answer.replace(/\s+/g, "")), `${item.sourceVerbId}: ${form} Japanese example must contain ${example.answer}`);
    assert.deepEqual(productionExamples[form], { ja: example.ja, en: example.en }, `${item.sourceVerbId}: ${form} review ledger and production override differ`);
    const sentenceKey = example.ja.replace(/\s+/g, "");
    assert.ok(!sentenceKeys.has(sentenceKey), `${item.sourceVerbId}: duplicated advanced Japanese example: ${example.ja}`);
    sentenceKeys.add(sentenceKey);
  }
}

const agents = fs.readFileSync("AGENTS.md", "utf8");
for (const role of ["初級日本語教師", "ネイティブ校正", "英訳担当", "学習心理", "多様性", "穴埋め問題", "日本文化", "会話教材"]) {
  assert.ok(agents.includes(role), `AGENTS.md must define example-team role: ${role}`);
}
for (const role of ["第二言語習得", "学習者エラー", "教材ベンチマーク", "リサーチ検証"]) {
  assert.ok(agents.includes(role), `AGENTS.md must define learner-research role: ${role}`);
}
assert.ok(fs.existsSync("PROJECT_CONTEXT.md"), "PROJECT_CONTEXT.md must exist for project handoff");

console.log(`OK: keyboard/contrast regressions, research-team definition, and ${advanced.length} reviewed advanced-example entries passed.`);
