import fs from "node:fs";

const defaultPaths = [1, 2, 3, 4, 5].map((part) => `data/katsuyou2/part-${part}.json`);
const paths = process.argv.length > 2 ? process.argv.slice(2) : defaultPaths;
const verbs = paths.flatMap((path) => JSON.parse(fs.readFileSync(path, "utf8")));

const targetForms = [
  "masu", "te", "ta", "nai",
  "pastNegative", "potential", "ba", "volitional", "causative"
];

const errors = [];
const ids = new Set();
const groupOrders = new Set();

for (const verb of verbs) {
  if (!verb.id) errors.push("Missing id");
  if (ids.has(verb.id)) errors.push(`Duplicate id: ${verb.id}`);
  ids.add(verb.id);

  const group = verb.verb?.group;
  const orderKey = `${group}:${verb.order}`;
  if (groupOrders.has(orderKey)) errors.push(`Duplicate order in group: ${orderKey}`);
  groupOrders.add(orderKey);

  if (verb.textbook?.sourceSection !== "動詞の活用2") {
    errors.push(`${verb.id}: sourceSection must be 動詞の活用2`);
  }

  for (const form of targetForms) {
    const value = verb.forms?.[form];
    if (!value) {
      errors.push(`${verb.id}: missing forms.${form}`);
      continue;
    }

    const example = verb.examples?.[form];
    if (!example?.ja || !example?.en) {
      errors.push(`${verb.id}: missing bilingual example for ${form}`);
      continue;
    }

    if (!example.ja.includes(value)) {
      errors.push(`${verb.id}: ${form} example does not contain target form "${value}"`);
    }
  }
}

const wear = verbs.find((verb) => verb.kanji === "着る");
if (wear && /ないふ|はさみ|やさい|かみを/.test(JSON.stringify(wear.examples))) {
  errors.push(`${wear.id}: 着る examples appear to describe 切る`);
}

const exist = verbs.find((verb) => verb.kanji === "居る");
if (exist && /ぱすぽーとが いります|しょるいが いった|くつは いらない/.test(JSON.stringify(exist.examples))) {
  errors.push(`${exist.id}: 居る examples appear to describe 要る`);
}

const coverage = Object.fromEntries(targetForms.map((form) => [
  form,
  verbs.filter((verb) => Boolean(verb.examples?.[form])).length
]));

console.log(`Validated ${verbs.length} verbs from ${paths.length} data files.`);
console.log("Example coverage:", coverage);

if (errors.length) {
  console.error("\nErrors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("OK: schema, IDs, form coverage, examples, and known homophones passed.");
