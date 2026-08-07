import fs from "node:fs";
import { buildKatsuyou2FromBase, TARGET_FORMS } from "../conjugation-core.js";

const baseFiles = [1, 2, 3].map((group) => `data/verbs-minna-no-nihongo-shokyu-1-group-${group}.json`);
const base = baseFiles.flatMap((file) => JSON.parse(fs.readFileSync(file, "utf8")));
const built = base.map((item) => buildKatsuyou2FromBase(item));
const missing = built.filter((verb) => TARGET_FORMS.some((form) => !verb.forms?.[form]));
console.log(`活用1 verbs: ${base.length}`);
console.log(`活用2 generated: ${built.length}`);
console.log(`Nine-form complete: ${built.length - missing.length}`);
if (missing.length) {
  for (const verb of missing) console.error(`Missing form: ${verb.sourceVerbId}`);
  process.exit(1);
}
