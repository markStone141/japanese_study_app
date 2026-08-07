import { readFile } from "node:fs/promises";

const DEFAULT_OVERRIDES_PATH = "data/content-review-overrides.json";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function deepMerge(base, patch) {
  if (!isPlainObject(patch)) return patch;
  const output = isPlainObject(base) ? { ...base } : {};
  for (const [key, value] of Object.entries(patch)) {
    output[key] = isPlainObject(value) ? deepMerge(output[key], value) : value;
  }
  return output;
}

export async function loadContentReviewOverrides(file = DEFAULT_OVERRIDES_PATH) {
  return JSON.parse(await readFile(file, "utf8"));
}

export function applyContentReview(item, overrides, namespace = "verbs") {
  const patch = overrides?.[namespace]?.[item.id];
  return patch ? deepMerge(item, patch) : item;
}

const KATAKANA_REPLACEMENTS = [
  ["ぱそこん", "パソコン"], ["すまーとふぉん", "スマートフォン"], ["あぷり", "アプリ"],
  ["かーど", "カード"], ["ぺん", "ペン"], ["からおけ", "カラオケ"], ["ぱーてぃー", "パーティー"],
  ["ばす", "バス"], ["たくしー", "タクシー"], ["すてーじ", "ステージ"], ["かれー", "カレー"],
  ["こーと", "コート"], ["しゃつ", "シャツ"], ["すーつ", "スーツ"], ["ぴあの", "ピアノ"],
  ["ぎたー", "ギター"], ["ぷれぜんと", "プレゼント"], ["ぱすぽーと", "パスポート"],
  ["れしーと", "レシート"], ["ぴくにっく", "ピクニック"], ["ほてる", "ホテル"]
];

export function normalizeExampleTypography(pair) {
  if (!pair?.ja) return pair;
  let ja = pair.ja;
  for (const [from, to] of KATAKANA_REPLACEMENTS) ja = ja.replaceAll(from, to);
  return { ...pair, ja };
}

export function normalizeReviewedItem(item) {
  if (!item?.examples) return item;
  return {
    ...item,
    examples: Object.fromEntries(
      Object.entries(item.examples).map(([form, pair]) => [form, normalizeExampleTypography(pair)])
    )
  };
}

export function reviewItem(item, overrides, namespace = "verbs") {
  return normalizeReviewedItem(applyContentReview(item, overrides, namespace));
}
