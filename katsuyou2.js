import { TARGET_FORMS, buildKatsuyou2FromBase, resolveGroupFromBase } from "./conjugation-core.js";

const BASE_DATA_URLS = [
  "./data/verbs-minna-no-nihongo-shokyu-1-group-1.json",
  "./data/verbs-minna-no-nihongo-shokyu-1-group-2.json",
  "./data/verbs-minna-no-nihongo-shokyu-1-group-3.json"
];
const CURATED_DATA_URLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28].map((part) => `./data/katsuyou2/part-${part}.json`);
const OVERRIDES_URL = "./data/content-review-overrides.json";

const FORM_CONFIG = [
  ["masu", "ます形", "〜ます", "polite / masu-form"],
  ["te", "て形", "〜て", "te-form"],
  ["ta", "た形", "〜た", "past / ta-form"],
  ["nai", "ない形", "〜ない", "negative / nai-form"],
  ["pastNegative", "なかった形", "〜なかった", "did not ..."],
  ["potential", "可能形", "〜できる", "can / be able to"],
  ["ba", "ば形", "〜すれば", "if ..."],
  ["volitional", "意向形", "〜しよう", "let's / I will"],
  ["causative", "使役形", "〜させる", "make / let someone ..."]
];
const BASIC_FORMS = ["masu", "te", "ta", "nai"];
const MASTER_FORMS = ["pastNegative", "potential", "ba", "volitional", "causative"];

const els = {
  learningMode: [...document.querySelectorAll('input[name="learningMode"]')], modeDescription: document.getElementById("modeDescription"),
  groupFilter: document.getElementById("groupFilter"), questionCount: document.getElementById("questionCount"), questionOrder: document.getElementById("questionOrder"),
  formChoices: document.getElementById("formChoices"), coverageNote: document.getElementById("coverageNote"), startButton: document.getElementById("startButton"),
  correctCount: document.getElementById("correctCount"), progressCount: document.getElementById("progressCount"), accuracy: document.getElementById("accuracy"),
  groupBadge: document.getElementById("groupBadge"), formBadge: document.getElementById("formBadge"), dictionaryKana: document.getElementById("dictionaryKana"),
  dictionaryKanji: document.getElementById("dictionaryKanji"), meaning: document.getElementById("meaning"), promptBox: document.getElementById("promptBox"),
  targetFormName: document.getElementById("targetFormName"), targetFormEnglish: document.getElementById("targetFormEnglish"), usageHint: document.getElementById("usageHint"),
  clozeCard: document.getElementById("clozeCard"), clozeJa: document.getElementById("clozeJa"), clozeEn: document.getElementById("clozeEn"), clozeHint: document.getElementById("clozeHint"),
  answerInput: document.getElementById("answerInput"), checkButton: document.getElementById("checkButton"), showButton: document.getElementById("showButton"),
  nextButton: document.getElementById("nextButton"), result: document.getElementById("result")
};
const state = { verbs: [], questions: [], index: 0, correct: 0, answered: false };

function escapeHtml(value) { return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;"); }
function normalize(value) { return String(value || "").trim().replace(/\s+/g, "").normalize("NFKC"); }
function shuffle(items) { const copy=[...items]; for(let i=copy.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];} return copy; }
function currentMode(){ return els.learningMode.find((input)=>input.checked)?.value || "basic"; }
function formConfig(id){ return FORM_CONFIG.find(([key])=>key===id) || [id,id,id,id]; }
function selectedForms(){ return [...els.formChoices.querySelectorAll("input:checked")].map((input)=>input.value); }
function deepMerge(base,patch){ if(!patch||typeof patch!=="object"||Array.isArray(patch)) return patch; const out=base&&typeof base==="object"&&!Array.isArray(base)?{...base}:{}; for(const [key,value] of Object.entries(patch)) out[key]=value&&typeof value==="object"&&!Array.isArray(value)?deepMerge(out[key],value):value; return out; }
function reviewBase(base,overrides){const patch=overrides?.verbs?.[base.id]; return patch?deepMerge(base,patch):base;}
function curatedKey(item){return item.sourceVerbId?`source:${item.sourceVerbId}`:`${item.verb?.group}|${item.dictionary}|${item.meaning}`;}

function renderFormChoices(){
  const mode=currentMode(); const defaults=mode==="basic"?BASIC_FORMS:mode==="master"?MASTER_FORMS:TARGET_FORMS;
  els.formChoices.innerHTML=FORM_CONFIG.map(([id,ja,hint,en])=>`<label class="form-choice"><input type="checkbox" value="${id}" ${defaults.includes(id)?"checked":""}><span><strong>${ja}</strong><small>${hint} / ${en}</small></span></label>`).join("");
  els.modeDescription.textContent=mode==="basic"?"まずは ます・て・た・ない の4つを、辞書形から作る練習です。":mode==="master"?"文法名だけでなく『〜できる』『〜しよう』『〜させる』の意味ヒントも見ながら練習します。":"例文の動詞だけを隠します。文の意味から、どの形が自然か考えて答えます。";
  if(els.coverageNote) els.coverageNote.textContent=mode==="sentence"?"穴埋めは、基本4形なら全動詞、発展形は例文を確認済みで、その活用が実際に使える動詞から出題します。":`活用1にある全 ${state.verbs.length||152} 動詞を対象に、該当しない活用は自動で問題から外します。`;
}
function filteredVerbs(){const group=els.groupFilter.value; return state.verbs.filter((verb)=>group==="all"||String(verb.verb.group)===group);}
function eligibleForForm(verb,form,sentenceMode){return Boolean(verb.forms?.[form]) && (!sentenceMode || Boolean(verb.examples?.[form]));}
function makeBalancedQuestions(verbs,forms,sentenceMode){const buckets=forms.map((form)=>({form,items:shuffle(verbs.filter((verb)=>eligibleForForm(verb,form,sentenceMode))).map((verb)=>({verb,form}))})); const questions=[]; let cursor=0; while(buckets.some((bucket)=>bucket.items.length)){const bucket=buckets[cursor%buckets.length];if(bucket.items.length)questions.push(bucket.items.shift());cursor+=1;}return questions;}
function makeQuestions(){const verbs=filteredVerbs();const forms=selectedForms();const sentenceMode=currentMode()==="sentence";if(!verbs.length||!forms.length)return[];let questions=[];if(els.questionOrder.value==="sequence"){for(const verb of verbs)for(const form of forms)if(eligibleForForm(verb,form,sentenceMode))questions.push({verb,form});}else questions=makeBalancedQuestions(verbs,shuffle(forms),sentenceMode);if(els.questionCount.value!=="all")questions=questions.slice(0,Number(els.questionCount.value));return questions;}
function updateScore(){const attempted=Math.min(state.index+(state.answered?1:0),state.questions.length);els.correctCount.textContent=String(state.correct);els.progressCount.textContent=`${attempted} / ${state.questions.length}`;els.accuracy.textContent=attempted?`${Math.round(state.correct/attempted*100)}%`:"0%";}
function currentQuestion(){return state.questions[state.index]||null;}
function blankExample(example,answer){if(!example)return"";const i=example.indexOf(answer);return i===-1?example:`${example.slice(0,i)}＿＿＿＿${example.slice(i+answer.length)}`;}

function renderQuestion(){const q=currentQuestion();els.result.innerHTML="";els.answerInput.value="";els.answerInput.disabled=false;els.checkButton.classList.remove("hidden");els.showButton.classList.remove("hidden");els.nextButton.classList.add("hidden");state.answered=false;if(!q){els.dictionaryKana.textContent="おわり";els.dictionaryKanji.textContent="";els.meaning.textContent="";els.targetFormName.textContent="ぜんぶ おわりました";els.targetFormEnglish.textContent="Session complete";els.usageHint.textContent="";els.clozeCard.classList.add("hidden");els.answerInput.disabled=true;els.checkButton.classList.add("hidden");els.showButton.classList.add("hidden");updateScore();return;}const[,ja,hint,en]=formConfig(q.form);const sentenceMode=currentMode()==="sentence";els.groupBadge.textContent=q.verb.verb.groupName;els.formBadge.textContent=ja;els.dictionaryKana.textContent=q.verb.reading||q.verb.dictionary;els.dictionaryKanji.textContent=q.verb.kanji&&q.verb.kanji!==q.verb.reading?q.verb.kanji:"";els.meaning.textContent=q.verb.meaning;els.targetFormName.textContent=ja;els.targetFormEnglish.textContent=en;els.usageHint.textContent=hint;els.promptBox.classList.toggle("hidden",sentenceMode);els.clozeCard.classList.toggle("hidden",!sentenceMode);if(sentenceMode){const example=q.verb.examples[q.form];const answer=q.verb.forms[q.form];els.clozeJa.textContent=blankExample(example.ja,answer);els.clozeEn.textContent=example.en;els.clozeHint.textContent=`${ja}：${hint}`;}updateScore();els.answerInput.focus();}
function resultHtml(q,correct,revealed=false){const answer=q.verb.forms[q.form];const example=q.verb.examples?.[q.form];const[,ja,hint]=formConfig(q.form);const title=revealed?"こたえ":correct?"せいかい！":"もういちど かくにん";return `<div class="result-card ${correct?"correct":"wrong"}"><div class="result-title">${title}</div><div class="correct-answer">${escapeHtml(answer)}</div><div class="answer-meaning">${escapeHtml(ja)}：${escapeHtml(hint)}</div>${example?`<div class="example"><div>${escapeHtml(example.ja)}</div><div class="example-en" lang="en">${escapeHtml(example.en)}</div></div>`:""}</div>`;}
function finishAnswer(correct,revealed=false){const q=currentQuestion();if(!q||state.answered)return;state.answered=true;if(correct&&!revealed)state.correct+=1;els.answerInput.disabled=true;els.checkButton.classList.add("hidden");els.showButton.classList.add("hidden");els.nextButton.classList.remove("hidden");els.result.innerHTML=resultHtml(q,correct,revealed);updateScore();els.nextButton.focus();}
function checkAnswer(){const q=currentQuestion();if(!q||state.answered)return;const input=normalize(els.answerInput.value);if(!input)return els.answerInput.focus();finishAnswer(input===normalize(q.verb.forms[q.form]));}
function nextQuestion(){if(state.answered){state.index+=1;renderQuestion();}}
function startSession(){const questions=makeQuestions();if(!questions.length){els.result.innerHTML='<div class="result-card wrong"><div class="result-title">この条件では問題を作れません。活用形を選び直してください。</div></div>';return;}state.questions=questions;state.index=0;state.correct=0;state.answered=false;renderQuestion();}
function handlePageEnter(event){if(event.key!=="Enter"||event.isComposing)return;if(!currentQuestion())return;const target=event.target;if(target instanceof HTMLElement&&(target.matches("button, select, input[type=checkbox], input[type=radio]")||target.isContentEditable))return;event.preventDefault();state.answered?nextQuestion():checkAnswer();}

async function init(){const[baseResponses,curatedResponses,overridesResponse]=await Promise.all([Promise.all(BASE_DATA_URLS.map((url)=>fetch(url))),Promise.all(CURATED_DATA_URLS.map((url)=>fetch(url))),fetch(OVERRIDES_URL)]);if([...baseResponses,...curatedResponses,overridesResponse].some((response)=>!response.ok))throw new Error("Could not load conjugation data");const[baseParts,curatedParts,overrides]=await Promise.all([Promise.all(baseResponses.map((response)=>response.json())),Promise.all(curatedResponses.map((response)=>response.json())),overridesResponse.json()]);const curated=curatedParts.flat();const curatedMap=new Map(curated.map((item)=>[curatedKey(item),item]));state.verbs=baseParts.flat().map((raw)=>{const base=reviewBase(raw,overrides);const group=resolveGroupFromBase(base);const match=curatedMap.get(`source:${base.id}`)||curatedMap.get(`${group}|${base.dictionary}|${base.meaning}`)||null;return buildKatsuyou2FromBase(base,match);}).filter((verb)=>verb.enabled!==false);renderFormChoices();startSession();els.startButton.addEventListener("click",startSession);els.checkButton.addEventListener("click",checkAnswer);els.showButton.addEventListener("click",()=>finishAnswer(false,true));els.nextButton.addEventListener("click",nextQuestion);els.groupFilter.addEventListener("change",startSession);els.learningMode.forEach((input)=>input.addEventListener("change",()=>{renderFormChoices();startSession();}));document.addEventListener("keydown",handlePageEnter);}
init().catch((error)=>{console.error(error);els.result.innerHTML=`<div class="result-card wrong"><div class="result-title">データを よみこめませんでした。</div><div>${escapeHtml(error.message)}</div></div>`;});
