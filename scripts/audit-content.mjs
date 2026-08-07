import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const VERB_FILES = [
  "data/verbs-minna-no-nihongo-shokyu-1-group-1.json",
  "data/verbs-minna-no-nihongo-shokyu-1-group-2.json",
  "data/verbs-minna-no-nihongo-shokyu-1-group-3.json"
];

const BASE_FORMS = ["masu", "te", "ta", "nai"];
const KATSUYOU2_FORMS = [
  "masu", "te", "ta", "nai", "pastNegative", "potential", "ba", "volitional", "causative"
];

const RISK_PATTERNS = [
  ["ので", "理由の『〜ので』は初級Iの範囲を越える可能性があるため要確認"],
  ["ように", "『〜ように』は初級II相当の可能性があるため要確認"],
  ["ながら", "『〜ながら』は初級II相当の可能性があるため要確認"],
  ["てしま", "『〜てしまう』は初級II相当の可能性があるため要確認"],
  ["んです", "『〜んです』は初級II相当の可能性があるため要確認"],
  ["ていただ", "授受・依頼表現が学習段階より高度な可能性があるため要確認"],
  ["なければ", "条件表現が学習段階より高度な可能性があるため要確認"],
  ["らしい", "推量表現が学習段階より高度な可能性があるため要確認"]
];

function containsTarget(example, value) {
  if (!example || !value) return false;
  return String(example).replace(/\s+/g, "").includes(String(value).replace(/\s+/g, ""));
}

function addIssue(issues, issue) {
  issues.push(issue);
}

async function loadJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

const issues = [];
const exactJapanese = new Map();
const contextCounts = new Map();
let baseVerbCount = 0;
let katsuyou2VerbCount = 0;
let exampleCount = 0;

for (const file of VERB_FILES) {
  const verbs = await loadJson(file);
  if (!Array.isArray(verbs)) {
    addIssue(issues, { severity: "error", file, message: "JSON root is not an array" });
    continue;
  }

  const ids = new Set();
  const orders = new Set();
  for (const verb of verbs) {
    baseVerbCount += 1;
    if (!verb.id) addIssue(issues, { severity: "error", file, message: "Missing id" });
    if (ids.has(verb.id)) addIssue(issues, { severity: "error", file, id: verb.id, message: "Duplicate id" });
    ids.add(verb.id);

    const orderKey = `${verb.verbGroupId}:${verb.order}`;
    if (orders.has(orderKey)) addIssue(issues, { severity: "error", file, id: verb.id, message: `Duplicate order ${verb.order}` });
    orders.add(orderKey);

    for (const form of BASE_FORMS) {
      const target = verb[form] || verb.forms?.[form];
      const pair = verb.examples?.[form];
      if (!target) addIssue(issues, { severity: "error", file, id: verb.id, form, message: "Missing target form" });
      if (!pair?.ja || !pair?.en) {
        addIssue(issues, { severity: "error", file, id: verb.id, form, message: "Missing bilingual example" });
        continue;
      }
      exampleCount += 1;
      if (!containsTarget(pair.ja, target)) {
        addIssue(issues, { severity: "warning", file, id: verb.id, form, message: `Japanese example does not visibly contain target: ${target}`, ja: pair.ja });
      }
      const key = pair.ja.replace(/\s+/g, "");
      if (exactJapanese.has(key)) {
        const previous = exactJapanese.get(key);
        addIssue(issues, { severity: "warning", file, id: verb.id, form, message: `Exact Japanese example duplicated from ${previous.id}/${previous.form}`, ja: pair.ja });
      } else {
        exactJapanese.set(key, { id: verb.id, form });
      }
      for (const [pattern, note] of RISK_PATTERNS) {
        if (pair.ja.includes(pattern)) {
          addIssue(issues, { severity: "review", file, id: verb.id, form, message: note, ja: pair.ja });
        }
      }
      for (const token of ["きのう", "あした", "ともだち", "まいにち", "かいしゃ", "がっこう", "えき", "うち"] ) {
        if (pair.ja.includes(token)) contextCounts.set(token, (contextCounts.get(token) || 0) + 1);
      }
    }

    if (verb.dictionary === "きる" && /put on|wear/i.test(verb.meaning || "")) {
      const allJa = JSON.stringify(verb.examples || {});
      if (allJa.includes("ナイフ") || allJa.includes("きって")) {
        addIssue(issues, { severity: "error", file, id: verb.id, message: "Wear-verb きる appears to contain cut-verb context" });
      }
    }
    if (verb.dictionary === "いる" && /exist|stay|child|animate|have/i.test(verb.meaning || "")) {
      const allJa = JSON.stringify(verb.examples || {});
      if (allJa.includes("パスポートが い") || allJa.includes("おかねが い")) {
        addIssue(issues, { severity: "error", file, id: verb.id, message: "Animate いる appears to contain 要る context" });
      }
    }
  }
}

const katsuyou2Dir = "data/katsuyou2";
const katsuyou2Files = (await readdir(katsuyou2Dir))
  .filter((name) => /^part-\d+\.json$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const katsuyou2Ids = new Set();
for (const name of katsuyou2Files) {
  const file = path.join(katsuyou2Dir, name);
  const verbs = await loadJson(file);
  if (!Array.isArray(verbs)) {
    addIssue(issues, { severity: "error", file, message: "JSON root is not an array" });
    continue;
  }
  for (const verb of verbs) {
    katsuyou2VerbCount += 1;
    if (!verb.id) addIssue(issues, { severity: "error", file, message: "Missing id" });
    if (katsuyou2Ids.has(verb.id)) addIssue(issues, { severity: "error", file, id: verb.id, message: "Duplicate katsuyou2 id" });
    katsuyou2Ids.add(verb.id);

    for (const form of KATSUYOU2_FORMS) {
      const target = verb.forms?.[form];
      const pair = verb.examples?.[form];
      if (!target) addIssue(issues, { severity: "error", file, id: verb.id, form, message: "Missing katsuyou2 target form" });
      if (!pair?.ja || !pair?.en) {
        addIssue(issues, { severity: "error", file, id: verb.id, form, message: "Missing katsuyou2 bilingual example" });
        continue;
      }
      exampleCount += 1;
      if (!containsTarget(pair.ja, target)) {
        addIssue(issues, { severity: "warning", file, id: verb.id, form, message: `Katsuyou2 example does not visibly contain target: ${target}`, ja: pair.ja });
      }
      for (const [pattern, note] of RISK_PATTERNS) {
        if (pair.ja.includes(pattern)) addIssue(issues, { severity: "review", file, id: verb.id, form, message: note, ja: pair.ja });
      }
    }
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
if (errors.length) process.exitCode = 1;
