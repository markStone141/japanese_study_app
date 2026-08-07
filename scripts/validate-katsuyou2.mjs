import fs from "node:fs";
import { buildKatsuyou2FromBase, conjugate, TARGET_FORMS } from "../conjugation-core.js";

const BASE_FILES = [
  "data/verbs-minna-no-nihongo-shokyu-1-group-1.json",
  "data/verbs-minna-no-nihongo-shokyu-1-group-2.json",
  "data/verbs-minna-no-nihongo-shokyu-1-group-3.json"
];
const CURATED_FILES = [1, 2, 3, 4, 5].map((part) => `data/katsuyou2/part-${part}.json`);

const base = BASE_FILES.flatMap((file) => JSON.parse(fs.readFileSync(file, "utf8")));
const curated = CURATED_FILES.flatMap((file) => JSON.parse(fs.readFileSync(file, "utf8")));
const curatedKey = (item) => `${item.verb?.group}|${item.dictionary}|${item.meaning}`;
const curatedMap = new Map(curated.map((item) => [curatedKey(item), item]));
const groupOf = (item) => Number(String(item.verbGroupId || "").replace("group-", ""));
const verbs = base.map((item) => buildKatsuyou2FromBase(item, curatedMap.get(`${groupOf(item)}|${item.dictionary}|${item.meaning}`) || null));

const errors = [];
const ids = new Set();
const sourceIds = new Set();

if (verbs.length !== base.length) errors.push(`Expected ${base.length} 活用2 verbs but built ${verbs.length}`);

for (const verb of verbs) {
  if (!verb.id) errors.push("Missing id");
  if (ids.has(verb.id)) errors.push(`Duplicate id: ${verb.id}`);
  ids.add(verb.id);
  if (!verb.sourceVerbId) errors.push(`${verb.id}: missing sourceVerbId`);
  if (sourceIds.has(verb.sourceVerbId)) errors.push(`${verb.id}: duplicate sourceVerbId ${verb.sourceVerbId}`);
  sourceIds.add(verb.sourceVerbId);

  let expected;
  try { expected = conjugate(verb.dictionary, verb.verb?.group); }
  catch (error) { errors.push(`${verb.id}: ${error.message}`); continue; }

  for (const form of TARGET_FORMS) {
    if (verb.forms?.[form] !== expected[form]) errors.push(`${verb.id}: ${form} expected "${expected[form]}" but got "${verb.forms?.[form]}"`);
  }

  for (const form of ["masu", "te", "ta", "nai"]) {
    const example = verb.examples?.[form];
    if (!example?.ja || !example?.en) errors.push(`${verb.id}: missing bilingual basic example for ${form}`);
  }

  if (verb.exampleCoverage === "full") {
    for (const form of TARGET_FORMS) {
      const example = verb.examples?.[form];
      if (!example?.ja || !example?.en) {
        errors.push(`${verb.id}: full coverage but missing ${form} example`);
        continue;
      }
      const normalizedJa = example.ja.replace(/\s+/g, "");
      const normalizedValue = verb.forms[form].replace(/\s+/g, "");
      if (!normalizedJa.includes(normalizedValue)) errors.push(`${verb.id}: ${form} example does not contain target form "${verb.forms[form]}"`);
    }
  }
}

const curatedFull = verbs.filter((verb) => verb.exampleCoverage === "full").length;
const advancedReady = Object.fromEntries(TARGET_FORMS.slice(4).map((form) => [form, verbs.filter((verb) => verb.examples?.[form]).length]));

console.log(`Validated full 活用2 coverage: ${verbs.length}/${base.length} verbs.`);
console.log(`Curated full-example verbs: ${curatedFull}/${verbs.length}`);
console.log("Advanced cloze example coverage:", advancedReady);

if (errors.length) {
  console.error("\nErrors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("OK: every 活用1 verb can be used in 活用2; all 9 conjugations are generated and verified.");
