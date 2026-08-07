import fs from "node:fs";

const defaultPaths = [1, 2, 3, 4, 5].map((part) => `data/katsuyou2/part-${part}.json`);
const paths = process.argv.length > 2 ? process.argv.slice(2) : defaultPaths;
const verbs = paths.flatMap((path) => JSON.parse(fs.readFileSync(path, "utf8")));

const targetForms = [
  "masu", "te", "ta", "nai",
  "pastNegative", "potential", "ba", "volitional", "causative"
];

const rows = {
  "う": { i: "い", a: "わ", e: "え", o: "お" },
  "く": { i: "き", a: "か", e: "け", o: "こ" },
  "ぐ": { i: "ぎ", a: "が", e: "げ", o: "ご" },
  "す": { i: "し", a: "さ", e: "せ", o: "そ" },
  "つ": { i: "ち", a: "た", e: "て", o: "と" },
  "ぬ": { i: "に", a: "な", e: "ね", o: "の" },
  "ぶ": { i: "び", a: "ば", e: "べ", o: "ぼ" },
  "む": { i: "み", a: "ま", e: "め", o: "も" },
  "る": { i: "り", a: "ら", e: "れ", o: "ろ" }
};

function group1Expected(dictionary) {
  const last = dictionary.at(-1);
  const stem = dictionary.slice(0, -1);
  const row = rows[last];
  if (!row) throw new Error(`Unsupported group-1 ending: ${dictionary}`);

  let te;
  let ta;
  if (dictionary === "いく") {
    te = "いって";
    ta = "いった";
  } else if (["う", "つ", "る"].includes(last)) {
    te = `${stem}って`;
    ta = `${stem}った`;
  } else if (["む", "ぶ", "ぬ"].includes(last)) {
    te = `${stem}んで`;
    ta = `${stem}んだ`;
  } else if (last === "く") {
    te = `${stem}いて`;
    ta = `${stem}いた`;
  } else if (last === "ぐ") {
    te = `${stem}いで`;
    ta = `${stem}いだ`;
  } else {
    te = `${stem}して`;
    ta = `${stem}した`;
  }

  const nai = dictionary === "ある" ? "ない" : `${stem}${row.a}ない`;
  return {
    dictionary,
    masu: `${stem}${row.i}ます`,
    te,
    ta,
    nai,
    pastNegative: nai === "ない" ? "なかった" : nai.replace(/ない$/, "なかった"),
    potential: `${stem}${row.e}る`,
    ba: `${stem}${row.e}ば`,
    volitional: `${stem}${row.o}う`,
    causative: `${stem}${row.a}せる`
  };
}

function group2Expected(dictionary) {
  const stem = dictionary.slice(0, -1);
  return {
    dictionary,
    masu: `${stem}ます`,
    te: `${stem}て`,
    ta: `${stem}た`,
    nai: `${stem}ない`,
    pastNegative: `${stem}なかった`,
    potential: `${stem}られる`,
    ba: `${stem}れば`,
    volitional: `${stem}よう`,
    causative: `${stem}させる`
  };
}

function irregularExpected(dictionary) {
  if (dictionary.endsWith("する")) {
    const prefix = dictionary.slice(0, -2);
    return {
      dictionary,
      masu: `${prefix}します`,
      te: `${prefix}して`,
      ta: `${prefix}した`,
      nai: `${prefix}しない`,
      pastNegative: `${prefix}しなかった`,
      potential: `${prefix}できる`,
      ba: `${prefix}すれば`,
      volitional: `${prefix}しよう`,
      causative: `${prefix}させる`
    };
  }
  if (dictionary.endsWith("くる")) {
    const prefix = dictionary.slice(0, -2);
    return {
      dictionary,
      masu: `${prefix}きます`,
      te: `${prefix}きて`,
      ta: `${prefix}きた`,
      nai: `${prefix}こない`,
      pastNegative: `${prefix}こなかった`,
      potential: `${prefix}こられる`,
      ba: `${prefix}くれば`,
      volitional: `${prefix}こよう`,
      causative: `${prefix}こさせる`
    };
  }
  throw new Error(`Unsupported group-3 verb: ${dictionary}`);
}

function expectedForms(verb) {
  const group = Number(verb.verb?.group);
  if (group === 1) return group1Expected(verb.dictionary);
  if (group === 2) return group2Expected(verb.dictionary);
  if (group === 3) return irregularExpected(verb.dictionary);
  throw new Error(`${verb.id}: unknown verb group ${verb.verb?.group}`);
}

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

  let expected;
  try {
    expected = expectedForms(verb);
  } catch (error) {
    errors.push(error.message);
    expected = null;
  }

  if (expected && verb.forms?.dictionary !== expected.dictionary) {
    errors.push(`${verb.id}: dictionary form expected "${expected.dictionary}" but got "${verb.forms?.dictionary}"`);
  }

  for (const form of targetForms) {
    const value = verb.forms?.[form];
    if (!value) {
      errors.push(`${verb.id}: missing forms.${form}`);
      continue;
    }

    if (expected && value !== expected[form]) {
      errors.push(`${verb.id}: forms.${form} expected "${expected[form]}" but got "${value}"`);
    }

    const example = verb.examples?.[form];
    if (!example?.ja || !example?.en) {
      errors.push(`${verb.id}: missing bilingual example for ${form}`);
      continue;
    }

    const normalizedJa = example.ja.replace(/\s+/g, "");
    const normalizedValue = value.replace(/\s+/g, "");
    if (!normalizedJa.includes(normalizedValue)) {
      errors.push(`${verb.id}: ${form} example does not contain target form "${value}"`);
    }
  }
}

const wear = verbs.find((verb) => verb.kanji === "着る");
if (wear && /ないふ|ナイフ|はさみ|やさい|かみを き/.test(JSON.stringify(wear.examples))) {
  errors.push(`${wear.id}: 着る examples appear to describe 切る`);
}

const exist = verbs.find((verb) => verb.kanji === "居る");
if (exist && /ぱすぽーとが い|パスポートが い|しょるいが いった|くつは いらない/.test(JSON.stringify(exist.examples))) {
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

console.log("OK: schema, IDs, conjugation correctness, form coverage, examples, and known homophones passed.");
