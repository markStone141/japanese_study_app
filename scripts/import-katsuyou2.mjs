import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import admin from "firebase-admin";

async function getDefaultProjectId() {
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  try {
    const firebaseRc = JSON.parse(await readFile(".firebaserc", "utf8"));
    return firebaseRc.projects && firebaseRc.projects.default;
  } catch {
    return null;
  }
}

const projectId = await getDefaultProjectId();
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId
});

const db = admin.firestore();
const dataDir = "data/katsuyou2";
const files = (await readdir(dataDir))
  .filter((name) => /^part-\d+\.json$/.test(name))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

let batch = db.batch();
let batchCount = 0;
let total = 0;

async function commitBatch() {
  if (!batchCount) return;
  await batch.commit();
  batch = db.batch();
  batchCount = 0;
}

for (const name of files) {
  const file = path.join(dataDir, name);
  const verbs = JSON.parse(await readFile(file, "utf8"));
  if (!Array.isArray(verbs)) throw new Error(`${file} must contain a JSON array.`);

  for (const [index, verb] of verbs.entries()) {
    if (!verb.id) throw new Error(`${file}: item ${index} is missing id.`);
    const ref = db.collection("verbConjugation2").doc(verb.id);
    batch.set(ref, {
      ...verb,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    batchCount += 1;
    total += 1;
    if (batchCount >= 400) await commitBatch();
  }
}

await commitBatch();
console.log(`Imported ${total} documents into Firestore collection "verbConjugation2".`);
