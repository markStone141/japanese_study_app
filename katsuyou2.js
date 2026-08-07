const DATA_URLS = [
  "./data/katsuyou2/part-1.json",
  "./data/katsuyou2/part-2.json",
  "./data/katsuyou2/part-3.json",
  "./data/katsuyou2/part-4.json",
  "./data/katsuyou2/part-5.json"
];

const FORM_CONFIG = [
  ["masu", "ます形", "masu-form"],
  ["te", "て形", "te-form"],
  ["ta", "た形", "ta-form"],
  ["nai", "ない形", "nai-form"],
  ["pastNegative", "なかった形", "past negative"],
  ["potential", "可能形", "potential form"],
  ["ba", "ば形", "conditional ba-form"],
  ["volitional", "意向形", "volitional form"],
  ["causative", "使役形", "causative form"]
];

const els = {
  groupFilter: document.getElementById("groupFilter"),
  questionCount: document.getElementById("questionCount"),
  questionOrder: document.getElementById("questionOrder"),
  formChoices: document.getElementById("formChoices"),
  startButton: document.getElementById("startButton"),
  correctCount: document.getElementById("correctCount"),
  progressCount: document.getElementById("progressCount"),
  accuracy: document.getElementById("accuracy"),
  groupBadge: document.getElementById("groupBadge"),
  formBadge: document.getElementById("formBadge"),
  dictionaryKana: document.getElementById("dictionaryKana"),
  dictionaryKanji: document.getElementById("dictionaryKanji"),
  meaning: document.getElementById("meaning"),
  targetFormName: document.getElementById("targetFormName"),
  targetFormEnglish: document.getElementById("targetFormEnglish"),
  answerInput: document.getElementById("answerInput"),
  checkButton: document.getElementById("checkButton"),
  showButton: document.getElementById("showButton"),
  nextButton: document.getElementById("nextButton"),
  result: document.getElementById("result"),
  searchInput: document.getElementById("searchInput"),
  verbList: document.getElementById("verbList")
};

const state = {
  verbs: [],
  questions: [],
  index: 0,
  correct: 0,
  answered: false
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, "").normalize("NFKC");
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function selectedForms() {
  return [...els.formChoices.querySelectorAll("input:checked")].map((input) => input.value);
}

function renderFormChoices() {
  els.formChoices.innerHTML = FORM_CONFIG.map(([id, ja, en], index) => `
    <label class="form-choice">
      <input type="checkbox" value="${id}" ${index >= 4 ? "checked" : ""}>
      <span><strong>${ja}</strong><small lang="en">${en}</small></span>
    </label>
  `).join("");
}

function formConfig(id) {
  return FORM_CONFIG.find(([key]) => key === id) || [id, id, id];
}

function filteredVerbs() {
  const group = els.groupFilter.value;
  return state.verbs.filter((verb) => group === "all" || String(verb.verb.group) === group);
}

function makeBalancedQuestions(verbs, forms) {
  const buckets = forms.map((form) => ({
    form,
    items: shuffle(verbs).map((verb) => ({ verb, form }))
  }));
  const questions = [];
  let cursor = 0;
  while (buckets.some((bucket) => bucket.items.length)) {
    const bucket = buckets[cursor % buckets.length];
    if (bucket.items.length) questions.push(bucket.items.shift());
    cursor += 1;
  }
  return questions;
}

function makeQuestions() {
  const verbs = filteredVerbs();
  const forms = selectedForms();
  if (!verbs.length || !forms.length) return [];

  let questions;
  if (els.questionOrder.value === "sequence") {
    questions = [];
    for (const verb of verbs) {
      for (const form of forms) questions.push({ verb, form });
    }
  } else {
    questions = makeBalancedQuestions(verbs, shuffle(forms));
  }

  if (els.questionCount.value !== "all") {
    questions = questions.slice(0, Number(els.questionCount.value));
  }
  return questions;
}

function updateScore() {
  const attempted = Math.min(state.index + (state.answered ? 1 : 0), state.questions.length);
  els.correctCount.textContent = String(state.correct);
  els.progressCount.textContent = `${attempted} / ${state.questions.length}`;
  els.accuracy.textContent = attempted ? `${Math.round(state.correct / attempted * 100)}%` : "0%";
}

function currentQuestion() {
  return state.questions[state.index] || null;
}

function renderQuestion() {
  const q = currentQuestion();
  els.result.innerHTML = "";
  els.answerInput.value = "";
  els.answerInput.disabled = false;
  els.checkButton.classList.remove("hidden");
  els.showButton.classList.remove("hidden");
  els.nextButton.classList.add("hidden");
  state.answered = false;

  if (!q) {
    els.dictionaryKana.textContent = "おわり";
    els.dictionaryKanji.textContent = "";
    els.meaning.textContent = "";
    els.targetFormName.textContent = "ぜんぶ おわりました";
    els.targetFormEnglish.textContent = "Session complete";
    els.answerInput.disabled = true;
    els.checkButton.classList.add("hidden");
    els.showButton.classList.add("hidden");
    updateScore();
    return;
  }

  const [, ja, en] = formConfig(q.form);
  els.groupBadge.textContent = q.verb.verb.groupName;
  els.formBadge.textContent = ja;
  els.dictionaryKana.textContent = q.verb.reading || q.verb.dictionary;
  els.dictionaryKanji.textContent = q.verb.kanji && q.verb.kanji !== q.verb.reading ? q.verb.kanji : "";
  els.meaning.textContent = q.verb.meaning;
  els.targetFormName.textContent = ja;
  els.targetFormEnglish.textContent = en;
  updateScore();
  els.answerInput.focus();
}

function resultHtml(q, correct, revealed = false) {
  const answer = q.verb.forms[q.form];
  const example = q.verb.examples?.[q.form];
  const title = revealed ? "こたえ" : correct ? "せいかい！" : "もういちど かくにん";
  return `
    <div class="result-card ${correct ? "correct" : "wrong"}">
      <div class="result-title">${title}</div>
      <div class="correct-answer">${escapeHtml(answer)}</div>
      ${example ? `
        <div class="example">
          <div>${escapeHtml(example.ja)}</div>
          <div class="example-en" lang="en">${escapeHtml(example.en)}</div>
        </div>
      ` : ""}
    </div>
  `;
}

function finishAnswer(correct, revealed = false) {
  const q = currentQuestion();
  if (!q || state.answered) return;
  state.answered = true;
  if (correct && !revealed) state.correct += 1;
  els.answerInput.disabled = true;
  els.checkButton.classList.add("hidden");
  els.showButton.classList.add("hidden");
  els.nextButton.classList.remove("hidden");
  els.result.innerHTML = resultHtml(q, correct, revealed);
  updateScore();
  els.nextButton.focus();
}

function checkAnswer() {
  const q = currentQuestion();
  if (!q || state.answered) return;
  const input = normalize(els.answerInput.value);
  if (!input) {
    els.answerInput.focus();
    return;
  }
  finishAnswer(input === normalize(q.verb.forms[q.form]));
}

function nextQuestion() {
  if (!state.answered) return;
  state.index += 1;
  renderQuestion();
}

function startSession() {
  const questions = makeQuestions();
  if (!questions.length) {
    els.result.innerHTML = '<div class="result-card wrong"><div class="result-title">かつようを ひとつ いじょう えらんでください。</div></div>';
    return;
  }
  state.questions = questions;
  state.index = 0;
  state.correct = 0;
  state.answered = false;
  renderQuestion();
}

function renderVerbList() {
  const term = normalize(els.searchInput.value);
  const group = els.groupFilter.value;
  const list = state.verbs.filter((verb) => {
    const groupOk = group === "all" || String(verb.verb.group) === group;
    const haystack = normalize(`${verb.dictionary}${verb.reading}${verb.kanji}${verb.meaning}`);
    return groupOk && (!term || haystack.includes(term));
  });

  els.verbList.innerHTML = list.map((verb) => `
    <article class="verb-item">
      <div class="verb-title">
        <strong>${escapeHtml(verb.reading || verb.dictionary)}</strong>
        ${verb.kanji && verb.kanji !== verb.reading ? `<span>${escapeHtml(verb.kanji)}</span>` : ""}
        <span>${escapeHtml(verb.meaning)}</span>
      </div>
      <div class="forms-mini">
        ${FORM_CONFIG.map(([id, ja]) => `
          <div class="mini"><b>${ja}</b>${escapeHtml(verb.forms[id])}</div>
        `).join("")}
      </div>
    </article>
  `).join("");
}

async function init() {
  renderFormChoices();
  const responses = await Promise.all(DATA_URLS.map((url) => fetch(url)));
  const failed = responses.findIndex((response) => !response.ok);
  if (failed !== -1) throw new Error(`Could not load ${DATA_URLS[failed]}`);
  const parts = await Promise.all(responses.map((response) => response.json()));
  state.verbs = parts.flat().filter((verb) => verb.enabled !== false);

  renderVerbList();
  startSession();

  els.startButton.addEventListener("click", startSession);
  els.checkButton.addEventListener("click", checkAnswer);
  els.showButton.addEventListener("click", () => finishAnswer(false, true));
  els.nextButton.addEventListener("click", nextQuestion);
  els.groupFilter.addEventListener("change", () => {
    renderVerbList();
    startSession();
  });
  els.searchInput.addEventListener("input", renderVerbList);
  els.answerInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (state.answered) nextQuestion();
    else checkAnswer();
  });
}

init().catch((error) => {
  console.error(error);
  els.result.innerHTML = `<div class="result-card wrong"><div class="result-title">データを よみこめませんでした。</div><div>${escapeHtml(error.message)}</div></div>`;
});
