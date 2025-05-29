// scripts/push-rigs-to-firestore.ts
// Node.js script to push sample rig data to Firestore for a user

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(), // or use cert({ projectId, clientEmail, privateKey })
});

const db = getFirestore();

// Example: Replace with your actual user ID and rig data
const uid = 'YOUR_USER_ID';
const rigs = [
  {
    id: 'rig1',
    name: 'My Rig 1',
    status: 'online',
    hashrate: 500,
    hashrateUnit: 'MH/s',
    powerConsumption: 1200,
    temperature: 65,
    fanSpeed: 70,
    algorithm: 'Ethash',
    lastSeen: Date.now(),
  },
  {
    id: 'rig2',
    name: 'My Rig 2',
    status: 'offline',
    hashrate: 0,
    hashrateUnit: 'MH/s',
    powerConsumption: 0,
    temperature: null,
    fanSpeed: null,
    algorithm: 'Ethash',
    lastSeen: Date.now(),
  },
];

async function pushRigs() {
  for (const rig of rigs) {
    await db.collection('users').doc(uid).collection('rigs').doc(rig.id).set(rig, { merge: true });
    console.log(`Pushed rig ${rig.id} to Firestore for user ${uid}`);
  }
  console.log('Done!');
}

pushRigs().catch(console.error);
