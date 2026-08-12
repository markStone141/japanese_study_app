import { buildKatsuyou2FromBase, resolveGroupFromBase } from "./conjugation-core.js";

const BASE_DATA_URLS = [
  "./data/verbs-minna-no-nihongo-shokyu-1-group-1.json",
  "./data/verbs-minna-no-nihongo-shokyu-1-group-2.json",
  "./data/verbs-minna-no-nihongo-shokyu-1-group-3.json"
];
const CURATED_DATA_URLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37].map((part) => `./data/katsuyou2/part-${part}.json`);
const OVERRIDES_URL = "./data/content-review-overrides.json";

const FORM_CONFIG = [
  ["masu", "ます形", "〜ます"], ["te", "て形", "〜て"], ["ta", "た形", "〜た"], ["nai", "ない形", "〜ない"],
  ["pastNegative", "なかった形", "〜なかった"], ["potential", "可能形", "〜できる"], ["ba", "ば形", "〜すれば"],
  ["volitional", "意向形", "〜しよう"], ["causative", "使役形", "〜させる"]
];
const els={reviewGroup:document.getElementById("reviewGroup"),searchInput:document.getElementById("searchInput"),reviewCount:document.getElementById("reviewCount"),verbList:document.getElementById("verbList")};
let verbs=[];
function escapeHtml(value){return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");}
function normalize(value){return String(value||"").trim().replace(/\s+/g,"").normalize("NFKC").toLowerCase();}
function deepMerge(base,patch){if(!patch||typeof patch!=="object"||Array.isArray(patch))return patch;const out=base&&typeof base==="object"&&!Array.isArray(base)?{...base}:{};for(const[key,value]of Object.entries(patch))out[key]=value&&typeof value==="object"&&!Array.isArray(value)?deepMerge(out[key],value):value;return out;}
function curatedKey(item){return item.sourceVerbId?`source:${item.sourceVerbId}`:`${item.verb?.group}|${item.dictionary}|${item.meaning}`;}
function render(){const term=normalize(els.searchInput.value);const group=els.reviewGroup.value;const list=verbs.filter((verb)=>{const groupOk=group==="all"||String(verb.verb.group)===group;const haystack=normalize(`${verb.dictionary}${verb.reading}${verb.kanji}${verb.meaning}`);return groupOk&&(!term||haystack.includes(term));});els.reviewCount.textContent=`${list.length} / ${verbs.length} verbs`;els.verbList.innerHTML=list.map((verb)=>`<article class="verb-item"><div class="verb-title"><strong>${escapeHtml(verb.reading||verb.dictionary)}</strong>${verb.kanji&&verb.kanji!==verb.reading?`<span>${escapeHtml(verb.kanji)}</span>`:""}<span>${escapeHtml(verb.meaning)}</span></div><div class="forms-mini">${FORM_CONFIG.map(([id,ja,hint])=>{const value=verb.forms[id];return `<div class="mini"><b>${ja} <span>${hint}</span></b>${value===null?'<span class="not-applicable">該当なし</span>':escapeHtml(value)}</div>`;}).join("")}</div><details class="review-examples"><summary>れいぶんを みる ${verb.exampleCoverage==="full"?"（レビュー済み）":""}</summary><div class="examples-list">${FORM_CONFIG.map(([id,ja])=>{const example=verb.examples?.[id];if(!example||verb.forms?.[id]===null)return"";return `<div class="review-example"><b>${ja}</b><div>${escapeHtml(example.ja)}</div><small lang="en">${escapeHtml(example.en)}</small></div>`;}).join("")}</div></details></article>`).join("");}
async function init(){const[baseResponses,curatedResponses,overridesResponse]=await Promise.all([Promise.all(BASE_DATA_URLS.map((url)=>fetch(url))),Promise.all(CURATED_DATA_URLS.map((url)=>fetch(url))),fetch(OVERRIDES_URL)]);if([...baseResponses,...curatedResponses,overridesResponse].some((r)=>!r.ok))throw new Error("Could not load review data");const[baseParts,curatedParts,overrides]=await Promise.all([Promise.all(baseResponses.map((r)=>r.json())),Promise.all(curatedResponses.map((r)=>r.json())),overridesResponse.json()]);const curatedMap=new Map(curatedParts.flat().map((item)=>[curatedKey(item),item]));verbs=baseParts.flat().map((raw)=>{const patch=overrides?.verbs?.[raw.id];const base=patch?deepMerge(raw,patch):raw;const group=resolveGroupFromBase(base);const reviewed=curatedMap.get(`source:${base.id}`)||curatedMap.get(`${group}|${base.dictionary}|${base.meaning}`)||null;return buildKatsuyou2FromBase(base,reviewed);}).filter((verb)=>verb.enabled!==false);render();els.reviewGroup.addEventListener("change",render);els.searchInput.addEventListener("input",render);}
init().catch((error)=>{console.error(error);els.verbList.innerHTML=`<div class="result-card wrong">データを よみこめませんでした。 ${escapeHtml(error.message)}</div>`;});
