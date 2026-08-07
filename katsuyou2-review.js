const DATA_URLS = [
  "./data/katsuyou2/part-1.json",
  "./data/katsuyou2/part-2.json",
  "./data/katsuyou2/part-3.json",
  "./data/katsuyou2/part-4.json",
  "./data/katsuyou2/part-5.json"
];

const FORM_CONFIG = [
  ["masu", "ます形", "〜ます"],
  ["te", "て形", "〜て"],
  ["ta", "た形", "〜た"],
  ["nai", "ない形", "〜ない"],
  ["pastNegative", "なかった形", "〜なかった"],
  ["potential", "可能形", "〜できる"],
  ["ba", "ば形", "〜すれば"],
  ["volitional", "意向形", "〜しよう"],
  ["causative", "使役形", "〜させる"]
];

const els = {
  reviewGroup: document.getElementById("reviewGroup"),
  searchInput: document.getElementById("searchInput"),
  reviewCount: document.getElementById("reviewCount"),
  verbList: document.getElementById("verbList")
};

let verbs = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, "").normalize("NFKC").toLowerCase();
}

function render() {
  const term = normalize(els.searchInput.value);
  const group = els.reviewGroup.value;
  const list = verbs.filter((verb) => {
    const groupOk = group === "all" || String(verb.verb.group) === group;
    const haystack = normalize(`${verb.dictionary}${verb.reading}${verb.kanji}${verb.meaning}`);
    return groupOk && (!term || haystack.includes(term));
  });

  els.reviewCount.textContent = `${list.length} verbs`;
  els.verbList.innerHTML = list.map((verb) => `
    <article class="verb-item">
      <div class="verb-title">
        <strong>${escapeHtml(verb.reading || verb.dictionary)}</strong>
        ${verb.kanji && verb.kanji !== verb.reading ? `<span>${escapeHtml(verb.kanji)}</span>` : ""}
        <span>${escapeHtml(verb.meaning)}</span>
      </div>
      <div class="forms-mini">
        ${FORM_CONFIG.map(([id, ja, hint]) => `
          <div class="mini"><b>${ja} <span>${hint}</span></b>${escapeHtml(verb.forms[id])}</div>
        `).join("")}
      </div>
      <details class="review-examples">
        <summary>れいぶんを みる</summary>
        <div class="examples-list">
          ${FORM_CONFIG.map(([id, ja]) => {
            const example = verb.examples?.[id];
            if (!example) return "";
            return `<div class="review-example"><b>${ja}</b><div>${escapeHtml(example.ja)}</div><small lang="en">${escapeHtml(example.en)}</small></div>`;
          }).join("")}
        </div>
      </details>
    </article>
  `).join("");
}

async function init() {
  const responses = await Promise.all(DATA_URLS.map((url) => fetch(url)));
  const failed = responses.findIndex((response) => !response.ok);
  if (failed !== -1) throw new Error(`Could not load ${DATA_URLS[failed]}`);
  const parts = await Promise.all(responses.map((response) => response.json()));
  verbs = parts.flat().filter((verb) => verb.enabled !== false);
  render();
  els.reviewGroup.addEventListener("change", render);
  els.searchInput.addEventListener("input", render);
}

init().catch((error) => {
  console.error(error);
  els.verbList.innerHTML = `<div class="result-card wrong">データを よみこめませんでした。 ${escapeHtml(error.message)}</div>`;
});
