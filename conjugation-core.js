export const TARGET_FORMS = ["masu", "te", "ta", "nai", "pastNegative", "potential", "ba", "volitional", "causative"];

const ROWS = {
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

export function lexicalDictionary(dictionary) {
  return String(dictionary || "").replace(/（.*$/, "").replace(/\s*\[.*$/, "").trim();
}

export function group1Forms(dictionary) {
  const word = lexicalDictionary(dictionary);
  const last = word.at(-1);
  const stem = word.slice(0, -1);
  const row = ROWS[last];
  if (!row) throw new Error(`Unsupported group-1 ending: ${dictionary}`);

  let te;
  let ta;
  if (word === "いく") {
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

  const nai = word === "ある" ? "ない" : `${stem}${row.a}ない`;
  return {
    dictionary: word,
    masu: `${stem}${row.i}ます`,
    te,
    ta,
    nai,
    pastNegative: nai === "ない" ? "なかった" : nai.replace(/ない$/, "なかった"),
    potential: word === "ある" ? "ありえる" : `${stem}${row.e}る`,
    ba: `${stem}${row.e}ば`,
    volitional: `${stem}${row.o}う`,
    causative: `${stem}${row.a}せる`
  };
}

export function group2Forms(dictionary) {
  const word = lexicalDictionary(dictionary);
  const stem = word.slice(0, -1);
  return {
    dictionary: word,
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

export function group3Forms(dictionary) {
  const word = lexicalDictionary(dictionary);
  if (word.endsWith("する")) {
    const prefix = word.slice(0, -2);
    return {
      dictionary: word,
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
  if (word.endsWith("くる")) {
    const prefix = word.slice(0, -2);
    return {
      dictionary: word,
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

export function conjugate(dictionary, group) {
  const number = Number(group);
  if (number === 1) return group1Forms(dictionary);
  if (number === 2) return group2Forms(dictionary);
  if (number === 3) return group3Forms(dictionary);
  throw new Error(`Unknown verb group: ${group}`);
}

function readBaseGroup(base) {
  if (base.verb?.group) return Number(base.verb.group);
  const match = String(base.verbGroupId || "").match(/group-(\d+)/);
  return match ? Number(match[1]) : null;
}

function baseKanji(base) {
  if (typeof base.kanji === "string") return base.kanji;
  return base.kanji?.dictionary || base.dictionary;
}

export function buildKatsuyou2FromBase(base, curated = null) {
  const group = readBaseGroup(base);
  const generated = {
    id: `katsuyou2-${base.id}`,
    sourceVerbId: base.id,
    dictionary: base.dictionary,
    reading: base.dictionary,
    kanji: baseKanji(base),
    meaning: base.meaning,
    textbook: {
      id: base.textbookId || base.textbook?.id || "minna-no-nihongo",
      name: base.textbookName || base.textbook?.name || "みんなの日本語",
      levelId: base.levelId || base.textbook?.levelId || "shokyu-1",
      levelName: base.levelName || base.textbook?.levelName || "初級I",
      lesson: base.lesson ?? base.textbook?.lesson ?? null,
      sourceSection: "動詞の活用2",
      sourceSectionId: "doushi-katsuyou-2"
    },
    verb: { group, groupName: base.verbGroupName || base.verb?.groupName || `グループ${group}` },
    forms: conjugate(base.dictionary, group),
    examples: { ...(base.examples || {}) },
    order: base.order,
    enabled: base.enabled !== false,
    exampleCoverage: "basic"
  };

  if (!curated) return generated;
  return {
    ...generated,
    ...curated,
    sourceVerbId: base.id,
    forms: { ...generated.forms, ...(curated.forms || {}) },
    examples: { ...generated.examples, ...(curated.examples || {}) },
    exampleCoverage: TARGET_FORMS.every((form) => curated.examples?.[form]) ? "full" : "partial"
  };
}
