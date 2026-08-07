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
  // 行く is exceptional even inside compounds such as つれていく / もっていく.
  if (word.endsWith("いく")) {
    const beforeIku = word.slice(0, -2);
    te = `${beforeIku}いって`;
    ta = `${beforeIku}いった`;
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
    potential: `${stem}${row.e}る`,
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

function readDeclaredGroup(base) {
  if (base.verb?.group) return Number(base.verb.group);
  const match = String(base.verbGroupId || "").match(/group-(\d+)/);
  return match ? Number(match[1]) : null;
}

function sourceCoreForms(base) {
  return Object.fromEntries(["masu", "te", "ta", "nai"].map((form) => [form, base.forms?.[form] ?? base[form]]));
}

function coreMatches(candidate, source) {
  return ["masu", "te", "ta", "nai"].every((form) => !source[form] || candidate?.[form] === source[form]);
}

export function resolveGroupFromBase(base) {
  const declared = readDeclaredGroup(base);
  const source = sourceCoreForms(base);
  const candidates = [];
  for (const group of [1, 2, 3]) {
    try {
      const forms = conjugate(base.dictionary, group);
      if (coreMatches(forms, source)) candidates.push(group);
    } catch { /* not a candidate */ }
  }
  if (candidates.length === 1) return candidates[0];
  if (candidates.includes(declared)) return declared;
  return declared;
}

// Forms explicitly marked unavailable only when a reviewed reference treats that
// form as absent for this lexical verb. `null` means “該当なし” and is excluded
// from quiz generation; it is not an empty answer.
const UNAVAILABLE_FORMS = {
  "ある": new Set(["potential"]),
  "わかる": new Set(["potential"]),
  "くれる": new Set(["potential"]),
  "できる": new Set(["potential"])
};

function applyAvailability(forms, base) {
  const word = lexicalDictionary(base.dictionary);
  const unavailable = UNAVAILABLE_FORMS[word];
  if (!unavailable) return forms;
  const out = { ...forms };
  for (const form of unavailable) out[form] = null;
  return out;
}

function baseKanji(base) {
  if (typeof base.kanji === "string") return base.kanji;
  return base.kanji?.dictionary || base.dictionary;
}

export function buildKatsuyou2FromBase(base, curated = null) {
  const group = resolveGroupFromBase(base);
  const generatedForms = applyAvailability(conjugate(base.dictionary, group), base);
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
    verb: { group, groupName: `グループ${group}` },
    forms: generatedForms,
    examples: { ...(base.examples || {}) },
    order: base.order,
    enabled: base.enabled !== false,
    exampleCoverage: "basic"
  };

  if (!curated) return generated;
  const mergedForms = { ...generated.forms, ...(curated.forms || {}) };
  // Never allow curated data to silently re-enable a reviewed-unavailable form.
  for (const form of TARGET_FORMS) if (generated.forms[form] === null) mergedForms[form] = null;
  return {
    ...generated,
    ...curated,
    sourceVerbId: base.id,
    verb: { ...generated.verb, ...(curated.verb || {}) },
    forms: mergedForms,
    examples: { ...generated.examples, ...(curated.examples || {}) },
    exampleCoverage: TARGET_FORMS.filter((form) => mergedForms[form] !== null).every((form) => curated.examples?.[form] || generated.examples?.[form]) ? "full" : "partial"
  };
}
