const DATA_URLS = [
  "./data/katsuyou2/part-1.json",
  "./data/katsuyou2/part-2.json",
  "./data/katsuyou2/part-3.json",
  "./data/katsuyou2/part-4.json",
  "./data/katsuyou2/part-5.json"
];

const FORM_CONFIG = [
  ["masu", "ます形", "masu-form", "〜ます / polite"],
  ["te", "て形", "te-form", "〜て / connect・request"],
  ["ta", "た形", "ta-form", "〜た / did"],
  ["nai", "ない形", "nai-form", "〜ない / do not"],
  ["pastNegative", "なかった形", "past negative", "〜なかった / did not"],
  ["potential", "可能形", "potential form", "〜できる / can"],
  ["ba", "ば形", "conditional ba-form", "〜すれば / if"],
  ["volitional", "意向形", "volitional form", "〜しよう / let's・I will"],
  ["causative", "使役形", "causative form", "〜させる / make・let" ]
];

const MODE_CONFIG = {
  basic: {
    forms: ["masu", "te", "ta", "nai"],
    description: "まずは よくつかう4つの形を、辞書形から作る練習です。"
  },
  master: {
    forms: ["pastNegative", "potential", "ba", "volitional", "causative"],
    description: "活用名だけでなく『〜できる』『〜しよう』の意味ヒントも見ながら練習します。"
  },
  situation: {
    forms: ["pastNegative", "potential", "ba", "volitional", "causative"],
    description: "文の中の空欄を埋めます。文法名より、文の意味から必要な形を考えるモードです。"
  }
};

const els = {
  learningModes: [...document.querySelectorAll('input[name="learningMode"]')],
  modeDescription: document.getElementById("modeDescription"),
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
  dictionaryBlock: document.getElementById("dictionaryBlock"),
  dictionaryKana: document.getElementById("dictionaryKana"),
  dictionaryKanji: document.getElementById("dictionaryKanji"),
  meaning: document.getElementById("meaning"),
  standardPrompt: document.getElementById("standardPrompt"),
  targetFormName: document.getElementById("targetFormName"),
  targetFormEnglish: document.getElementById("targetFormEnglish"),
  usageHint: document.getElementById("usageHint"),
  clozePrompt: document.getElementById("clozePrompt"),
  clozeJapanese: document.getElementById("clozeJapanese"),
  clozeEnglish: document.getElementById("clozeEnglish"),
  clozeHint: document.getElementById("clozeHint"),
  answerInput: document.getElementById("answerInput"),
  checkButton: document.getElementById("checkButton"),
  showButton: document.getElementById("showButton"),
  nextButton: document.getElementById("nextButton"),
  result: document.getElementById("result")
};

const state = { verbs: [], questions: [], index: 0, correct: 0, answered: false, mode: "basic" };

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

function formConfig(id) {
  return FORM_CONFIG.find(([key]) => key === id) || [id, id, id, id];
}

function selectedForms() {
  return [...els.formChoices.querySelectorAll("input:checked")].map((input) => input.value);
}

function renderFormChoices() {
  const allowed = new Set(MODE_CONFIG[state.mode].forms);
  els.formChoices.innerHTML = FORM_CONFIG
    .filter(([id]) => allowed.has(id))
    .map(([id, ja, en, hint]) => `
      <label class="form-choice">
        <input type="checkbox" value="${id}" checked>
        <span><strong>${ja}</strong><small lang="en">${en}</small><small>${hint}</small></span>
      </label>
    `).join("");
}

function setMode(mode) {
  state.mode = mode;
  els.modeDescription.textContent = MODE_CONFIG[mode].description;
  renderFormChoices();
  startSession();
}

function filteredVerbs() {
  const group = els.groupFilter.value;
  return state.verbs.filter((verb) => group === "all" || String(verb.verb.group) === group);
}

function makeBalancedQuestions(verbs, forms) {
  const buckets = forms.map((form) => ({ form, items: shuffle(verbs).map((verb) => ({ verb, form })) }));
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
  let questions = [];
  if (els.questionOrder.value === "sequence") {
    for (const verb of verbs) for (const form of forms) questions.push({ verb, form });
  } else {
    questions = makeBalancedQuestions(verbs, shuffle(forms));
  }
  if (els.questionCount.value !== "all") questions = questions.slice(0, Number(els.questionCount.value));
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

function clozeSentence(example, answer) {
  if (!example) return "";
  const index = example.indexOf(answer);
  if (index === -1) return example;
  return `${example.slice(0, index)}＿＿＿＿${example.slice(index + answer.length)}`;
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
    els.dictionaryBlock.classList.remove("hidden");
    els.standardPrompt.classList.remove("hidden");
    els.clozePrompt.classList.add("hidden");
    els.dictionaryKana.textContent = "おわり";
    els.dictionaryKanji.textContent = "";
    els.meaning.textContent = "";
    els.targetFormName.textContent = "ぜんぶ おわりました";
    els.targetFormEnglish.textContent = "Session complete";
    els.usageHint.textContent = "";
    els.answerInput.disabled = true;
    els.checkButton.classList.add("hidden");
    els.showButton.classList.add("hidden");
    updateScore();
    return;
  }

  const [, ja, en, hint] = formConfig(q.form);
  const answer = q.verb.forms[q.form];
  const example = q.verb.examples?.[q.form];
  els.groupBadge.textContent = q.verb.verb.groupName;
  els.formBadge.textContent = state.mode === "situation" ? "あなうめ" : ja;
  els.dictionaryKana.textContent = q.verb.reading || q.verb.dictionary;
  els.dictionaryKanji.textContent = q.verb.kanji && q.verb.kanji !== q.verb.reading ? q.verb.kanji : "";
  els.meaning.textContent = q.verb.meaning;

  if (state.mode === "situation") {
    els.dictionaryBlock.classList.add("hidden");
    els.standardPrompt.classList.add("hidden");
    els.clozePrompt.classList.remove("hidden");
    els.clozeJapanese.textContent = clozeSentence(example?.ja || "", answer);
    els.clozeEnglish.textContent = example?.en || "";
    els.clozeHint.textContent = hint;
  } else {
    els.dictionaryBlock.classList.remove("hidden");
    els.standardPrompt.classList.remove("hidden");
    els.clozePrompt.classList.add("hidden");
    els.targetFormName.textContent = ja;
    els.targetFormEnglish.textContent = en;
    els.usageHint.textContent = state.mode === "master" ? hint : "";
  }

  updateScore();
  els.answerInput.focus();
}

function resultHtml(q, correct, revealed = false) {
  const answer = q.verb.forms[q.form];
  const example = q.verb.examples?.[q.form];
  const [, ja, , hint] = formConfig(q.form);
  const title = revealed ? "こたえ" : correct ? "せいかい！" : "もういちど かくにん";
  return `
    <div class="result-card ${correct ? "correct" : "wrong"}">
      <div class="result-title">${title}</div>
      <div class="correct-answer">${escapeHtml(answer)}</div>
      <div class="answer-meaning">${escapeHtml(ja)} ・ ${escapeHtml(hint)}</div>
      ${example ? `<div class="example"><div>${escapeHtml(example.ja)}</div><div class="example-en" lang="en">${escapeHtml(example.en)}</div></div>` : ""}
    </div>`;
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
  if (!input) return els.answerInput.focus();
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

async function init() {
  renderFormChoices();
  els.modeDescription.textContent = MODE_CONFIG[state.mode].description;
  const responses = await Promise.all(DATA_URLS.map((url) => fetch(url)));
  const failed = responses.findIndex((response) => !response.ok);
  if (failed !== -1) throw new Error(`Could not load ${DATA_URLS[failed]}`);
  const parts = await Promise.all(responses.map((response) => response.json()));
  state.verbs = parts.flat().filter((verb) => verb.enabled !== false);
  startSession();

  els.learningModes.forEach((input) => input.addEventListener("change", () => setMode(input.value)));
  els.startButton.addEventListener("click", startSession);
  els.checkButton.addEventListener("click", checkAnswer);
  els.showButton.addEventListener("click", () => finishAnswer(false, true));
  els.nextButton.addEventListener("click", nextQuestion);
  els.groupFilter.addEventListener("change", startSession);
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
