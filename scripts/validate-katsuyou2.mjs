import fs from "node:fs";
import { buildKatsuyou2FromBase, conjugate, resolveGroupFromBase, TARGET_FORMS } from "../conjugation-core.js";

const BASE_FILES = [
  "data/verbs-minna-no-nihongo-shokyu-1-group-1.json",
  "data/verbs-minna-no-nihongo-shokyu-1-group-2.json",
  "data/verbs-minna-no-nihongo-shokyu-1-group-3.json"
];
const CURATED_FILES = fs.readdirSync("data/katsuyou2")
  .filter((name) => /^part-\d+\.json$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map((name) => `data/katsuyou2/${name}`);
const base = BASE_FILES.flatMap((file) => JSON.parse(fs.readFileSync(file, "utf8")));
const curated = CURATED_FILES.flatMap((file) => JSON.parse(fs.readFileSync(file, "utf8")));
const curatedKey = (item) => `${item.verb?.group}|${item.dictionary}|${item.meaning}`;
const curatedMap = new Map(curated.filter((item) => !item.sourceVerbId).map((item) => [curatedKey(item), item]));
const curatedBySourceId = new Map(curated.filter((item) => item.sourceVerbId).map((item) => [item.sourceVerbId, item]));
const declaredGroupOf = (item) => Number(String(item.verbGroupId || "").replace("group-", ""));
const verbs = base.map((item) => {
  const group = resolveGroupFromBase(item);
  const reviewed = curatedBySourceId.get(item.id) || curatedMap.get(`${group}|${item.dictionary}|${item.meaning}`) || null;
  return buildKatsuyou2FromBase(item, reviewed);
});
const baseById = new Map(base.map((item) => [item.id, item]));
const verbBySourceId = new Map(verbs.map((item) => [item.sourceVerbId, item]));
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
    if (verb.forms?.[form] === null) continue;
    if (verb.forms?.[form] !== expected[form]) errors.push(`${verb.id}: ${form} expected "${expected[form]}" but got "${verb.forms?.[form]}"`);
  }
  const source = baseById.get(verb.sourceVerbId);
  for (const form of ["masu", "te", "ta", "nai"]) {
    const sourceValue = source?.forms?.[form] ?? source?.[form];
    if (sourceValue && verb.forms?.[form] !== sourceValue) errors.push(`${verb.id}: generated ${form} "${verb.forms?.[form]}" disagrees with 活用1 source "${sourceValue}"`);
    const example = verb.examples?.[form];
    if (!example?.ja || !example?.en) errors.push(`${verb.id}: missing bilingual basic example for ${form}`);
  }
  if (verb.exampleCoverage === "full") {
    for (const form of TARGET_FORMS) {
      if (verb.forms?.[form] === null) continue;
      const example = verb.examples?.[form];
      if (!example?.ja || !example?.en) { errors.push(`${verb.id}: full coverage but missing ${form} example`); continue; }
      const normalizedJa = example.ja.replace(/\s+/g, "");
      const normalizedValue = verb.forms[form].replace(/\s+/g, "");
      if (!normalizedJa.includes(normalizedValue)) errors.push(`${verb.id}: ${form} example does not contain target form "${verb.forms[form]}"`);
    }
  }
}

const expectedCorrections = {
  "minna-shokyu-1-group-1-041": { group: 2, dictionary: "たべる", pastNegative: "たべなかった", causative: "たべさせる" },
  "minna-shokyu-1-group-1-042": { group: 2, dictionary: "みる", pastNegative: "みなかった", causative: "みさせる" },
  "minna-shokyu-1-group-1-043": { group: 2, dictionary: "おきる", pastNegative: "おきなかった", causative: "おきさせる" },
  "minna-shokyu-1-group-1-044": { group: 2, dictionary: "ねる", pastNegative: "ねなかった", causative: "ねさせる" },
  "minna-shokyu-1-group-1-045": { group: 3, dictionary: "する", pastNegative: "しなかった", causative: "させる" },
  "minna-shokyu-1-group-1-055": { group: 1, dictionary: "つれていく", te: "つれていって", ta: "つれていった" },
  "minna-shokyu-1-group-1-076": { group: 1, dictionary: "もっていく", te: "もっていって", ta: "もっていった" },
  "minna-shokyu-1-group-1-082": { group: 3, dictionary: "くる", pastNegative: "こなかった", causative: "こさせる" }
};
for (const [id, expected] of Object.entries(expectedCorrections)) {
  const verb = verbBySourceId.get(id);
  if (!verb) { errors.push(`Regression verb missing: ${id}`); continue; }
  if (verb.dictionary !== expected.dictionary) errors.push(`${id}: expected dictionary ${expected.dictionary}, got ${verb.dictionary}`);
  if (verb.verb.group !== expected.group) errors.push(`${id}: expected resolved group ${expected.group}, got ${verb.verb.group}`);
  for (const [form, value] of Object.entries(expected)) {
    if (["group", "dictionary"].includes(form)) continue;
    if (verb.forms?.[form] !== value) errors.push(`${id}: expected ${form} ${value}, got ${verb.forms?.[form]}`);
  }
}
const neru = verbBySourceId.get("minna-shokyu-1-group-1-044");
if (neru?.forms?.pastNegative !== "ねなかった") errors.push("寝る: なかった形 must be ねなかった");
if (neru?.forms?.causative !== "ねさせる") errors.push("寝る: grammatical causative form must be ねさせる (寝かせる is a separate lexical transitive verb)");
for (const [dictionary, form] of [["わかる", "potential"], ["ある", "potential"], ["くれる", "potential"], ["できる", "potential"]]) {
  for (const verb of verbs.filter((item) => item.dictionary === dictionary)) if (verb.forms?.[form] !== null) errors.push(`${verb.sourceVerbId}: ${dictionary} ${form} must be null/該当なし after review`);
}
const correctedDeclaredGroups = base.filter((item) => resolveGroupFromBase(item) !== declaredGroupOf(item));
const curatedFull = verbs.filter((verb) => verb.exampleCoverage === "full").length;
const advancedReady = Object.fromEntries(TARGET_FORMS.slice(4).map((form) => [form, verbs.filter((verb) => verb.forms?.[form] && verb.examples?.[form]).length]));
console.log(`Validated full 活用2 coverage: ${verbs.length}/${base.length} verbs.`);
console.log(`Source records with corrected group inference: ${correctedDeclaredGroups.length}`);
for (const item of correctedDeclaredGroups) console.log(`- ${item.id}: declared group ${declaredGroupOf(item)} -> resolved group ${resolveGroupFromBase(item)} (${item.dictionary})`);
console.log(`Curated full-example verbs: ${curatedFull}/${verbs.length}`);
console.log("Advanced cloze example coverage:", advancedReady);
if (errors.length) { console.error("\nErrors:"); for (const error of errors) console.error(`- ${error}`); process.exit(1); }
console.log("OK: every 活用1 verb can be used in 活用2; generated core forms agree with 活用1, known unavailable forms are excluded, and audited regressions are covered.");
