import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const ORG_ID = process.env.ORG_ID;
const APPLY = process.argv.includes('--apply');

if (!ORG_ID) {
  throw new Error('Set ORG_ID to the organization containing the legacy fixture records.');
}

if (process.argv.includes('--emulator')) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
}

if (process.env.FIRESTORE_EMULATOR_HOST) {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'forge-rules-test' });
} else {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ?? resolve(process.cwd(), 'serviceAccountKey.json');
  if (!existsSync(keyPath)) {
    throw new Error('A service-account key is required for production cleanup.');
  }
  initializeApp({ credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
}

const db: Firestore = getFirestore();
const challengeIds = ['ch_monsoon', 'ch_hack', 'ch_steps', 'ch_meme', 'ch_design', 'ch_pitch'];
const challengeChildren = ['registrations', 'submissions', 'reviews', 'rubric', 'scores', 'leaderboard', 'votes', 'announcements'];
const fixedDocs = {
  formSchemas: ['fs_photo', 'fs_hack', 'fs_steps', 'fs_meme', 'fs_design'],
  badges: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9'],
  auditLogs: ['a1', 'a2', 'a3', 'a4', 'a5'],
} as const;
const certificates = ['cert_a1b2c3', 'cert_d4e5f6', 'cert_g7h8i9', 'cert_j1k2l3'];

async function deleteCollection(path: string) {
  const snap = await db.collection(path).get();
  if (!APPLY) return snap.size;
  for (let offset = 0; offset < snap.docs.length; offset += 400) {
    const batch = db.batch();
    snap.docs.slice(offset, offset + 400).forEach((item) => batch.delete(item.ref));
    await batch.commit();
  }
  return snap.size;
}

async function removeDoc(path: string) {
  const ref = db.doc(path);
  const snap = await ref.get();
  if (snap.exists && APPLY) await ref.delete();
  return snap.exists;
}

async function main() {
  let found = 0;
  for (const challengeId of challengeIds) {
    const base = `organizations/${ORG_ID}/challenges/${challengeId}`;
    for (const child of challengeChildren) found += await deleteCollection(`${base}/${child}`);
    if (await removeDoc(base)) found += 1;
  }
  found += await deleteCollection(`organizations/${ORG_ID}/snapshots`);
  for (const [collection, ids] of Object.entries(fixedDocs)) {
    for (const id of ids) if (await removeDoc(`organizations/${ORG_ID}/${collection}/${id}`)) found += 1;
  }
  for (const id of certificates) if (await removeDoc(`certificates/${id}`)) found += 1;
  if (await removeDoc('users/u_self')) found += 1;

  console.log(`${APPLY ? 'Removed' : 'Found'} ${found} legacy fixture document(s).`);
  if (!APPLY) console.log('Dry run only. Re-run with --apply after reviewing the target organization.');
}

void main();
