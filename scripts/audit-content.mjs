import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { loadContentReviewOverrides, reviewItem } from "./content-review.mjs";

const VERB_FILES = [
  "data/verbs-minna-no-nihongo-shokyu-1-group-1.json",
  "data/verbs-minna-no-nihongo-shokyu-1-group-2.json",
  "data/verbs-minna-no-nihongo-shokyu-1-group-3.json"
];
const BASE_FORMS = ["masu", "te", "ta", "nai"];
const KATSUYOU2_FORMS = ["masu", "te", "ta", "nai", "pastNegative", "potential", "ba", "volitional", "causative"];
const RISK_PATTERNS = [
  [(s) => s.includes("ので、"), "理由の『〜ので』は学習順を要確認"],
  [(s) => s.includes("ように"), "『〜ように』は学習順を要確認"],
  [(s) => s.includes("ながら"), "『〜ながら』は学習順を要確認"],
  [(s) => s.includes("てしま"), "『〜てしまう』は学習順を要確認"],
  [(s) => s.includes("ていただ"), "授受・依頼表現の学習順を要確認"],
  [(s) => s.includes("なければ"), "条件表現の学習順を要確認"]
];

const overrides = await loadContentReviewOverrides();
const issues = [];
const exactJapanese = new Map();
const contextCounts = new Map();
let baseVerbCount = 0;
let katsuyou2VerbCount = 0;
let exampleCount = 0;

const loadJson = async (file) => JSON.parse(await readFile(file, "utf8"));
const containsTarget = (example, value) => String(example || "").replace(/\s+/g, "").includes(String(value || "").replace(/\s+/g, ""));
const addIssue = (issue) => issues.push(issue);

function auditExamples(verb, file, forms) {
  for (const form of forms) {
    const target = verb[form] || verb.forms?.[form];
    const pair = verb.examples?.[form];
    if (!target) addIssue({ severity: "error", file, id: verb.id, form, message: "Missing target form" });
    if (!pair?.ja || !pair?.en) {
      addIssue({ severity: "error", file, id: verb.id, form, message: "Missing bilingual example" });
      continue;
    }
    exampleCount += 1;
    if (!containsTarget(pair.ja, target)) addIssue({ severity: "warning", file, id: verb.id, form, message: `Example does not visibly contain target: ${target}`, ja: pair.ja });

    const key = pair.ja.replace(/\s+/g, "");
    if (exactJapanese.has(key)) {
      const previous = exactJapanese.get(key);
      addIssue({ severity: "warning", file, id: verb.id, form, message: `Exact Japanese example duplicated from ${previous.id}/${previous.form}`, ja: pair.ja });
    } else exactJapanese.set(key, { id: verb.id, form });

    for (const [test, note] of RISK_PATTERNS) if (test(pair.ja)) addIssue({ severity: "review", file, id: verb.id, form, message: note, ja: pair.ja });
    for (const token of ["きのう", "あした", "ともだち", "まいにち", "かいしゃ", "がっこう", "えき", "うち"]) {
      if (pair.ja.includes(token)) contextCounts.set(token, (contextCounts.get(token) || 0) + 1);
    }
  }
}

for (const file of VERB_FILES) {
  const source = await loadJson(file);
  if (!Array.isArray(source)) { addIssue({ severity: "error", file, message: "JSON root is not an array" }); continue; }
  const ids = new Set();
  const orders = new Set();
  for (const sourceVerb of source) {
    const verb = reviewItem(sourceVerb, overrides, "verbs");
    baseVerbCount += 1;
    if (!verb.id) addIssue({ severity: "error", file, message: "Missing id" });
    if (ids.has(verb.id)) addIssue({ severity: "error", file, id: verb.id, message: "Duplicate id" });
    ids.add(verb.id);
    const orderKey = `${verb.verbGroupId}:${verb.order}`;
    if (orders.has(orderKey)) addIssue({ severity: "error", file, id: verb.id, message: `Duplicate order ${verb.order}` });
    orders.add(orderKey);
    auditExamples(verb, file, BASE_FORMS);
    const allJa = JSON.stringify(verb.examples || {});
    if (verb.dictionary === "きる" && /put on|wear/i.test(verb.meaning || "") && /ナイフ|きって/.test(allJa)) addIssue({ severity: "error", file, id: verb.id, message: "着る appears to contain 切る context" });
    if (verb.dictionary === "いる" && /exist|stay|child|animate|have/i.test(verb.meaning || "") && /パスポートが い|おかねが い/.test(allJa)) addIssue({ severity: "error", file, id: verb.id, message: "居る appears to contain 要る context" });
  }
}

const katsuyou2Files = (await readdir("data/katsuyou2")).filter((name) => /^part-\d+\.json$/.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const katsuyou2Ids = new Set();
for (const name of katsuyou2Files) {
  const file = path.join("data/katsuyou2", name);
  const source = await loadJson(file);
  if (!Array.isArray(source)) { addIssue({ severity: "error", file, message: "JSON root is not an array" }); continue; }
  for (const sourceVerb of source) {
    const verb = reviewItem(sourceVerb, overrides, "katsuyou2");
    katsuyou2VerbCount += 1;
    if (!verb.id) addIssue({ severity: "error", file, message: "Missing id" });
    if (katsuyou2Ids.has(verb.id)) addIssue({ severity: "error", file, id: verb.id, message: "Duplicate katsuyou2 id" });
    katsuyou2Ids.add(verb.id);
    auditExamples(verb, file, KATSUYOU2_FORMS);
  }
}

const severityRank = { error: 0, warning: 1, review: 2 };
issues.sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9) || String(a.id || "").localeCompare(String(b.id || ""), "ja"));
console.log(`AUDIT SUMMARY baseVerbs=${baseVerbCount} katsuyou2Verbs=${katsuyou2VerbCount} examples=${exampleCount}`);
console.log(`CONTEXT COUNTS ${[...contextCounts.entries()].map(([k, v]) => `${k}=${v}`).join(" ")}`);
for (const issue of issues) console.log(`AUDIT ${JSON.stringify(issue)}`);
const errors = issues.filter((item) => item.severity === "error");
const warnings = issues.filter((item) => item.severity === "warning");
const reviews = issues.filter((item) => item.severity === "review");
console.log(`AUDIT TOTAL errors=${errors.length} warnings=${warnings.length} review=${reviews.length}`);
if (errors.length || warnings.length) process.exitCode = 1;
