import fs from "node:fs";
import assert from "node:assert/strict";

const html = fs.readFileSync("katsuyou2.html", "utf8");
const resultIndex = html.indexOf('id="result"');
const buttonsIndex = html.indexOf('class="button-row"');
assert.ok(resultIndex !== -1, "katsuyou2.html must contain #result");
assert.ok(buttonsIndex !== -1, "katsuyou2.html must contain .button-row");
assert.ok(resultIndex < buttonsIndex, "The answer/result panel must appear before the navigation buttons so the learner sees feedback immediately.");

const advanced = JSON.parse(fs.readFileSync("data/katsuyou2/advanced-examples.json", "utf8"));
assert.ok(Array.isArray(advanced) && advanced.length > 0, "advanced-examples.json must contain at least one reviewed batch");
const forms = ["pastNegative", "potential", "ba", "volitional", "causative"];
for (const item of advanced) {
  assert.ok(item.sourceVerbId, "advanced example item must have sourceVerbId");
  for (const form of forms) {
    const example = item.examples?.[form];
    assert.ok(example?.ja && example?.en, `${item.sourceVerbId}: missing ${form} bilingual example`);
    assert.ok(example.answer, `${item.sourceVerbId}: ${form} must declare the exact answer used in the Japanese example`);
    assert.ok(example.ja.replace(/\s+/g, "").includes(example.answer.replace(/\s+/g, "")), `${item.sourceVerbId}: ${form} Japanese example must contain ${example.answer}`);
  }
}

console.log(`OK: result placement and ${advanced.length} reviewed advanced-example entries passed.`);
