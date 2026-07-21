import { readFile } from "node:fs/promises";
import process from "node:process";
import admin from "firebase-admin";

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: node scripts/import-verbs.mjs <verbs.json>");
  process.exit(1);
}

async function getDefaultProjectId() {
  if (process.env.GOOGLE_CLOUD_PROJECT) return process.env.GOOGLE_CLOUD_PROJECT;
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;

  try {
    const firebaseRc = JSON.parse(await readFile(".firebaserc", "utf8"));
    return firebaseRc.projects && firebaseRc.projects.default;
  } catch (error) {
    return null;
  }
}

const projectId = await getDefaultProjectId();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId
});

const db = admin.firestore();
const raw = await readFile(inputPath, "utf8");
const verbs = JSON.parse(raw);

if (!Array.isArray(verbs)) {
  throw new Error("The import file must be a JSON array.");
}

let batch = db.batch();
let batchCount = 0;
let total = 0;

async function commitBatch() {
  if (batchCount === 0) return;
  await batch.commit();
  batch = db.batch();
  batchCount = 0;
}

for (const [index, verb] of verbs.entries()) {
  if (!verb.id) {
    throw new Error(`Verb at index ${index} is missing id.`);
  }

  const ref = db.collection("verbs").doc(verb.id);
  const payload = {
    ...verb,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (!Object.hasOwn(verb, "kanji")) {
    payload.kanji = admin.firestore.FieldValue.delete();
  }

  batch.set(ref, payload, { merge: true });

  batchCount += 1;
  total += 1;

  if (batchCount >= 400) {
    await commitBatch();
  }
}

await commitBatch();
console.log(`Imported ${total} verbs into Firestore collection "verbs".`);
