import fs from "node:fs";
import { resolveGroupFromBase } from "../conjugation-core.js";

const GROUP_FILES = [1, 2, 3].map((group) => ({
  group,
  file: `data/verbs-minna-no-nihongo-shokyu-1-group-${group}.json`
}));
const baseByGroup = new Map(GROUP_FILES.map(({ group, file }) => [group, JSON.parse(fs.readFileSync(file, "utf8"))]));
const curatedFiles = fs.readdirSync("data/katsuyou2")
  .filter((name) => /^part-\d+\.json$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const curated = curatedFiles.flatMap((name) => JSON.parse(fs.readFileSync(`data/katsuyou2/${name}`, "utf8")));
const reviewedIds = new Set(curated.map((item) => item.sourceVerbId).filter(Boolean));
const reviewedKeys = new Set(curated.map((item) => `${item.verb?.group}|${item.dictionary}|${item.meaning}`));
const isReviewed = (item) => reviewedIds.has(item.id)
  || reviewedKeys.has(`${resolveGroupFromBase(item)}|${item.dictionary}|${item.meaning}`);

const total = [...baseByGroup.values()].reduce((sum, items) => sum + items.length, 0);
const completed = [...baseByGroup.values()].flat().filter(isReviewed).length;
const remaining = total - completed;
const percent = ((completed / total) * 100).toFixed(1);
const rows = [...baseByGroup].map(([group, items]) => {
  const done = items.filter(isReviewed).length;
  return `| グループ${group} | ${done} / ${items.length} | ${((done / items.length) * 100).toFixed(1)}% |`;
});
const orderedBase = [...baseByGroup.values()].flat();
const latestBatch = JSON.parse(fs.readFileSync(`data/katsuyou2/${curatedFiles.at(-1)}`, "utf8"));
const latestSourceId = latestBatch.at(-1)?.sourceVerbId;
const latestIndex = orderedBase.findIndex((item) => item.id === latestSourceId);
const next = orderedBase.slice(latestIndex + 1).find((item) => !isReviewed(item))
  || orderedBase.find((item) => !isReviewed(item));
const content = `# 活用2 例文整備工程表

この工程表は \`npm run progress:update\` で、教材データと \`data/katsuyou2/part-*.json\` から再集計します。

| 工程 | 完了数 | 進捗率 |
|---|---:|---:|
| 全152動詞の基本活用生成 | ${total} / ${total} | 100.0% |
| レビュー済み例文 | ${completed} / ${total} | ${percent}% |
${rows.join("\n")}

- 残り：${remaining}動詞
- 4語ずつ進める場合：あと約${Math.ceil(remaining / 4)}回
- 次の対象：${next ? `${next.dictionary}（${next.id}）` : "全動詞完了"}
- 収録済み例文バッチ：${curatedFiles.length}ファイル
`;

const output = "docs/KATSUYOU2_PROGRESS.md";
if (process.argv.includes("--check")) {
  const current = fs.existsSync(output) ? fs.readFileSync(output, "utf8") : "";
  if (current !== content) {
    console.error(`${output} is out of date. Run npm run progress:update.`);
    process.exit(1);
  }
  console.log(`Progress is current: ${completed}/${total} (${percent}%).`);
} else {
  fs.writeFileSync(output, content);
  console.log(`Updated ${output}: ${completed}/${total} (${percent}%).`);
}
