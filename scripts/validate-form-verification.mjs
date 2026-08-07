import fs from "node:fs";
import path from "node:path";

const ADVANCED_FORMS = ["pastNegative", "potential", "ba", "volitional", "causative"];
const verification = JSON.parse(fs.readFileSync("data/katsuyou2/form-verification.json", "utf8"));
const records = verification.records || {};
const errors = [];
let checkedEntries = 0;
let checkedForms = 0;

const partFiles = fs.readdirSync("data/katsuyou2")
  .filter((name) => /^part-\d+\.json$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

for (const name of partFiles) {
  const rows = JSON.parse(fs.readFileSync(path.join("data/katsuyou2", name), "utf8"));
  for (const item of rows) {
    if (!item.verificationRequired) continue;
    checkedEntries += 1;
    const record = records[item.sourceVerbId];
    if (!record) {
      errors.push(`${name}/${item.id}: missing verification record for ${item.sourceVerbId}`);
      continue;
    }
    if (record.dictionary !== item.dictionary) errors.push(`${name}/${item.id}: verification dictionary mismatch (${record.dictionary} vs ${item.dictionary})`);
    if (!record.confidence) errors.push(`${name}/${item.id}: verification confidence is missing`);
    if (!Array.isArray(record.sources) || record.sources.length === 0) errors.push(`${name}/${item.id}: at least one evidence source is required`);
    for (const source of record.sources || []) {
      if (!source.name || !source.type || !/^https:\/\//.test(source.url || "")) errors.push(`${name}/${item.id}: invalid evidence source entry`);
    }

    for (const form of ADVANCED_FORMS) {
      checkedForms += 1;
      const decision = record.forms?.[form];
      if (!decision || !["valid", "not_applicable", "deferred"].includes(decision.status)) {
        errors.push(`${name}/${item.id}: ${form} has no valid verification decision`);
        continue;
      }
      const example = item.examples?.[form];
      const value = item.forms?.[form];
      if (decision.status === "valid") {
        if (!decision.value) errors.push(`${name}/${item.id}: ${form} is valid but verification value is missing`);
        if (value !== decision.value) errors.push(`${name}/${item.id}: ${form} production value ${value} differs from verified value ${decision.value}`);
        if (!example?.ja || !example?.en) errors.push(`${name}/${item.id}: ${form} valid form is missing bilingual example`);
        if (example?.ja && value && !example.ja.replace(/\s+/g, "").includes(value.replace(/\s+/g, ""))) errors.push(`${name}/${item.id}: ${form} example does not contain verified answer ${value}`);
      } else {
        if (example) errors.push(`${name}/${item.id}: ${form} is ${decision.status} but still has an example`);
        if (decision.status === "not_applicable" && value !== null) errors.push(`${name}/${item.id}: ${form} is not_applicable but production value is not null`);
      }
    }
  }
}

if (checkedEntries === 0) errors.push("No verificationRequired production entries were found; the gate is not protecting any evidence-first batch.");

console.log(`FORM VERIFICATION checkedEntries=${checkedEntries} checkedAdvancedForms=${checkedForms}`);
if (errors.length) {
  console.error("FORM VERIFICATION ERRORS:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log("OK: evidence-first entries were verified before example release.");
