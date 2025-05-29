/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your Worker in action
 * - Run `npm run deploy` to publish your Worker
 *
 * Bind resources to your Worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  RIGS_KV: KVNamespace;
  NICEHASH_KEY: string;
  NICEHASH_SECRET: string;
}

const TELEGRAM_BOT_TOKEN = "<YOUR_TELEGRAM_BOT_TOKEN>";
const TELEGRAM_CHAT_ID = "<USER_CHAT_ID>"; // Ideally, store per user in KV or user settings

async function sendTelegramAlert(message: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message })
  });
}

async function fetchNiceHashRigData(uid: string, apiKey: string, apiSecret: string) {
  // NiceHash API v2: https://docs.nicehash.com/main/#tag/Rig/operation/getMiningRigs2
  const orgId = '<YOUR_ORG_ID>'; // You may want to store this per user as well
  const url = `https://api2.nicehash.com/main/api/v2/mining/rigs2`;
  // NiceHash requires X-Time, X-Nonce, X-Organization-Id, X-Request-Id, X-Auth headers
  const time = Date.now().toString();
  const nonce = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  // For demo, skip HMAC signature (should be implemented for production)
  const headers = {
    'X-Time': time,
    'X-Nonce': nonce,
    'X-Organization-Id': orgId,
    'X-Request-Id': requestId,
    'X-Auth': `${apiKey}:${apiSecret}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error('Failed to fetch NiceHash data');
  const data = await resp.json() as any;
  // Extract rig info (status, temperature, hashrate, etc.)
  // This is a simplified example; adjust as needed for your data model
  const rigs = (data.miningRigs || []).map((rig: any) => ({
    name: rig.name,
    status: rig.status?.toLowerCase() || 'offline',
    hashrate: rig.stats?.hashrateTotal || 0,
    temperature: rig.devices?.[0]?.temperature || null,
    lastSeen: Date.now(),
  }));
  return rigs;
}

// Public NiceHash API example: get current BTC price
async function fetchNiceHashPublicData() {
  const url = 'https://api2.nicehash.com/main/api/v2/public/stats/global/current';
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Failed to fetch NiceHash public data');
  const data = await resp.json() as any;
  return {
    btcPrice: data.stats.BTC.price,
    stats: data.stats
  };
}

// Fetch rig stats from HiveOS API using a stored token
async function fetchHiveOSRigData(hiveToken: string) {
  // HiveOS API docs: https://api2.hiveos.farm/swagger/
  const url = 'https://api2.hiveos.farm/api/v2/farms';
  const resp = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${hiveToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  if (!resp.ok) throw new Error('Failed to fetch HiveOS farms');
  const farms = await resp.json() as any;
  if (!farms || !farms.data || !farms.data.length) return [];
  // For each farm, fetch rigs
  let allRigs: any[] = [];
  for (const farm of farms.data) {
    const rigsUrl = `https://api2.hiveos.farm/api/v2/farms/${farm.id}/workers`;
    const rigsResp = await fetch(rigsUrl, {
      headers: {
        'Authorization': `Bearer ${hiveToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    if (!rigsResp.ok) continue;
    const rigsData = await rigsResp.json() as any;
    if (rigsData && rigsData.data) {
      allRigs = allRigs.concat(rigsData.data.map((rig: any) => ({
        name: rig.name,
        status: rig.stats?.online ? 'online' : 'offline',
        hashrate: rig.hashrate || 0,
        temperature: rig.gpu_stats?.length ? Math.max(...rig.gpu_stats.map((g: any) => g.temp)) : null,
        lastSeen: rig.stats?.updated || Date.now(),
      })));
    }
  }
  return allRigs;
}

// Fetch rig stats from HiveOS API using a stored token and farm ID
async function fetchHiveOSRigDataWithFarmId(hiveToken: string, farmId: string) {
  const rigsUrl = `https://api2.hiveos.farm/api/v2/farms/${farmId}/workers`;
  const rigsResp = await fetch(rigsUrl, {
    headers: {
      'Authorization': `Bearer ${hiveToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });
  if (!rigsResp.ok) throw new Error('Failed to fetch HiveOS workers');
  const rigsData = await rigsResp.json() as any;
  if (!rigsData || !rigsData.data) return [];
  return rigsData.data.map((rig: any) => ({
    id: rig.id?.toString() || rig.name,
    name: rig.name,
    status: rig.stats?.online ? 'online' : 'offline',
    hashrate: rig.hashrate || 0,
    hashrateUnit: 'MH/s', // You may want to parse this from rig data
    powerConsumption: rig.power || 0,
    temperature: rig.gpu_stats?.length ? Math.max(...rig.gpu_stats.map((g: any) => g.temp)) : null,
    fanSpeed: rig.gpu_stats?.length ? Math.max(...rig.gpu_stats.map((g: any) => g.fan)) : null,
    uptime: rig.stats?.uptime || 0,
    algorithm: rig.algo || '',
    pool: rig.pool || '',
    lastSeen: rig.stats?.updated || Date.now(),
    gpuDetails: Array.isArray(rig.gpu_stats) ? rig.gpu_stats.map((g: any, idx: number) => ({
      id: `gpu${idx}`,
      name: g.name || `GPU ${idx+1}`,
      temperature: g.temp,
      fanSpeed: g.fan,
      hashrate: g.hash,
      power: g.power,
    })) : [],
  }));
}

// Helper: Fetch NiceHash earnings for a user
async function fetchNiceHashEarnings(apiKey: string, apiSecret: string, orgId: string) {
  const url = 'https://api2.nicehash.com/main/api/v2/accounting/accounts2/BTC';
  const time = Date.now().toString();
  const nonce = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  const headers = {
    'X-Time': time,
    'X-Nonce': nonce,
    'X-Organization-Id': orgId,
    'X-Request-Id': requestId,
    'X-Auth': `${apiKey}:${apiSecret}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error('Failed to fetch NiceHash earnings');
  const data = await resp.json() as any;
  return parseFloat((data && data.available) ? data.available : '0'); // BTC
}

// Helper: Trigger payout (stub, see NiceHash docs for full implementation)
async function triggerNiceHashPayout(apiKey: string, apiSecret: string, orgId: string, address: string, amount: number) {
  // See: https://docs.nicehash.com/main/#tag/Accounting/operation/withdrawalRequest
  // You must have withdrawal permissions and user's withdrawal address
  // This is a stub for demonstration
  // const url = 'https://api2.nicehash.com/main/api/v2/accounting/withdrawal';
  // ...
  // return await fetch(url, { method: 'POST', headers, body: ... });
  return true;
}

// Helper: Trigger payout via NowPayments API (real implementation)
async function triggerNowPaymentsPayout(apiKey: string, payoutAddress: string, amount: number) {
  const url = 'https://api.nowpayments.io/v1/payout';
  const body = {
    address: payoutAddress,
    amount: amount.toString(),
    currency: 'BTC',
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`NowPayments payout failed: ${err}`);
  }
  const data = await resp.json();
  if (data && typeof data === 'object' && 'payout_id' in data) {
    return true;
  }
  throw new Error('NowPayments payout: unexpected response');
}

// Helper: Trigger payout via Coinbase API (real implementation)
async function triggerCoinbasePayout(apiKey: string, payoutAddress: string, amount: number) {
  const url = 'https://api.coinbase.com/v2/accounts/primary/transactions';
  const body = {
    type: 'send',
    to: payoutAddress,
    amount: amount.toString(),
    currency: 'BTC',
    description: 'Mining payout',
  };
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Coinbase payout failed: ${err}`);
  }
  const data = await resp.json();
  if (data && (data as any).data && (data as any).data.id) {
    return true;
  }
  throw new Error('Coinbase payout: unexpected response');
}

// Helper: Get payout provider and API key from Firestore
async function getUserPayoutSettingsFromFirestore(uid: string) {
  const fs = getAdminFirestore();
  const doc = await fs.collection('users').doc(uid).collection('settings').doc('payout').get();
  const data = doc.exists ? doc.data() : {};
  return {
    provider: data?.provider || 'nowpayments', // 'nowpayments' or 'coinbase'
    apiKey: data?.apiKey || '',
    payoutAddress: data?.payoutAddress || '',
  };
}

// --- Firestore Admin Setup for Worker ---
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let firestore: FirebaseFirestore.Firestore | null = null;
function getAdminFirestore() {
  if (!firestore) {
    initializeApp({ credential: applicationDefault() });
    firestore = getFirestore();
  }
  return firestore;
}

// Helper: Get alert settings from Firestore for a user
async function getUserAlertSettingsFromFirestore(uid: string) {
  const fs = getAdminFirestore();
  const doc = await fs.collection('users').doc(uid).collection('settings').doc('alerts').get();
  const data = doc.exists ? doc.data() : {};
  return {
    enabled: data?.enabled !== false, // default true
    chatId: data?.telegramChatId || TELEGRAM_CHAT_ID,
  };
}

async function sendUserTelegramAlertWithFirestore(uid: string, message: string) {
  const settings = await getUserAlertSettingsFromFirestore(uid);
  if (!settings.enabled) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: settings.chatId, text: message })
  });
}

// Ethermine API: Fetch rig stats by wallet address
async function fetchEthermineRigStats(wallet: string) {
  // Ethermine API docs: https://ethermine.org/api/doc
  const url = `https://api.ethermine.org/miner/${wallet}/currentStats`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Failed to fetch Ethermine data');
  const data = await resp.json() as any;
  if (data.status !== 'OK') throw new Error('Ethermine API error: ' + data.message);
  return data.data;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/nicehash-public") {
      try {
        const stats = await fetchNiceHashPublicData();
        return new Response(JSON.stringify(stats), { status: 200, headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response('Failed to fetch public NiceHash data', { status: 500 });
      }
    }
    if (url.pathname === "/api/rigs") {
      if (request.method === "GET") {
        const uid = url.searchParams.get("uid");
        if (!uid) return new Response("Missing uid", { status: 400 });
        const data = await env.RIGS_KV.get(uid);
        return new Response(data || "[]", { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (request.method === "POST") {
        const body = await request.json();
        // Type assertion to help TypeScript
        const { uid, rigData } = body as { uid?: string; rigData?: any };
        if (!uid || !rigData) return new Response("Missing uid or rigData", { status: 400 });
        await env.RIGS_KV.put(uid, JSON.stringify(rigData));
        return new Response("OK", { status: 200 });
      }
      return new Response("Method Not Allowed", { status: 405 });
    }
    if (url.pathname === "/api/ping") {
      return new Response("Hello Miner", { status: 200 });
    }
    return new Response("Not found", { status: 404 });
  },

  // The scheduled handler is invoked at the interval set in our wrangler.jsonc's
  // [[triggers]] configuration.
  async scheduled(event, env, ctx) {
    // Only declare userList once
    const userList = await env.RIGS_KV.list();
    // Example: For each user, fetch NiceHash data and store in KV
    for (const key of userList.keys) {
      const uid = key.name;
      // In production, fetch user's NiceHash API key/secret from KV or user settings
      const apiKey = env.NICEHASH_KEY;
      const apiSecret = env.NICEHASH_SECRET;
      try {
        const rigs = await fetchNiceHashRigData(uid, apiKey, apiSecret);
        await env.RIGS_KV.put(uid, JSON.stringify(rigs));
      } catch (e) {
        // Optionally log or alert on error
      }
    }
    // Update: For each user, fetch HiveOS token and farm ID from KV and update rig data
    for (const key of userList.keys) {
      const uid = key.name;
      const hiveToken = await env.RIGS_KV.get(`hiveos_token:${uid}`);
      const farmId = await env.RIGS_KV.get(`hiveos_farmid:${uid}`);
      if (hiveToken && farmId) {
        try {
          const rigs = await fetchHiveOSRigDataWithFarmId(hiveToken, farmId);
          await env.RIGS_KV.put(uid, JSON.stringify(rigs));
        } catch (e) {
          // Optionally log or alert on error
        }
      }
    }
    // Alert logic: Telegram alert if rig offline > 10 min, using Firestore settings
    for (const key of userList.keys) {
      const uid = key.name;
      const data = await env.RIGS_KV.get(uid, "json");
      if (!data || !Array.isArray(data)) continue;
      for (const rig of data) {
        if (rig.status === "offline" && rig.lastSeen) {
          const lastSeen = new Date(rig.lastSeen).getTime();
          const now = Date.now();
          if (now - lastSeen > 10 * 60 * 1000) { // 10 minutes
            await sendUserTelegramAlertWithFirestore(uid, `ALERT: Rig ${rig.name} (user ${uid}) has been offline for more than 10 minutes!`);
          }
        }
      }
    }
    // Auto payout logic
    for (const key of userList.keys) {
      const uid = key.name;
      // Fetch payout threshold and withdrawal address for user
      const thresholdStr = await env.RIGS_KV.get(`payout_threshold:${uid}`);
      // Get payout provider, API key, and address from Firestore
      const payoutSettings = await getUserPayoutSettingsFromFirestore(uid);
      const withdrawalAddress = payoutSettings.payoutAddress;
      if (!thresholdStr || !withdrawalAddress) continue;
      const threshold = parseFloat(thresholdStr);
      // Fetch user's NiceHash API key/secret/orgId (replace with per-user storage in production)
      const apiKey = env.NICEHASH_KEY;
      const apiSecret = env.NICEHASH_SECRET;
      const orgId = '<YOUR_ORG_ID>';
      try {
        const earnings = await fetchNiceHashEarnings(apiKey, apiSecret, orgId);
        if (earnings >= threshold) {
          // Trigger payout via selected provider
          let payoutResult = false;
          if (payoutSettings.provider === 'coinbase') {
            payoutResult = await triggerCoinbasePayout(payoutSettings.apiKey, withdrawalAddress, earnings);
          } else {
            payoutResult = await triggerNowPaymentsPayout(payoutSettings.apiKey, withdrawalAddress, earnings);
          }
          if (payoutResult) {
            // Add payout history to Firestore
            const fs = getAdminFirestore();
            const payoutId = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
            await fs.collection('users').doc(uid).collection('payouts').doc(payoutId).set({
              timestamp: Date.now(),
              amount: earnings,
              address: withdrawalAddress,
              provider: payoutSettings.provider,
              status: 'success',
              tx: payoutResult,
            });
            await sendUserTelegramAlertWithFirestore(uid, `Auto payout triggered for user ${uid}: ${earnings} BTC sent to ${withdrawalAddress} via ${payoutSettings.provider}`);
          }
        }
      } catch (e) {
        let msg = 'Unknown error';
        if (typeof e === 'object' && e && 'message' in e) {
          msg = (e as any).message;
        } else if (typeof e === 'string') {
          msg = e;
        }
        await sendUserTelegramAlertWithFirestore(uid, `Auto payout error for user ${uid}: ${msg}`);
      }
    }
    // Firestore sync logic
    for (const key of userList.keys) {
      const uid = key.name;
      // Fetch tokens/IDs from KV
      const hiveToken = await env.RIGS_KV.get(`hiveos_token:${uid}`);
      const farmId = await env.RIGS_KV.get(`hiveos_farmid:${uid}`);
      const nicehashApiKey = env.NICEHASH_KEY;
      const nicehashApiSecret = env.NICEHASH_SECRET;
      const ethermineWallet = await env.RIGS_KV.get(`ethermine_wallet:${uid}`);
      let allRigs: any[] = [];
      // HiveOS
      if (hiveToken && farmId) {
        try {
          const hiveRigs = await fetchHiveOSRigDataWithFarmId(hiveToken, farmId);
          allRigs = allRigs.concat(hiveRigs);
        } catch {}
      }
      // NiceHash
      try {
        const nicehashRigs = await fetchNiceHashRigData(uid, nicehashApiKey, nicehashApiSecret);
        allRigs = allRigs.concat(nicehashRigs);
      } catch {}
      // Ethermine
      if (ethermineWallet) {
        try {
          const ethermineStats = await fetchEthermineRigStats(ethermineWallet) as any;
          if (Array.isArray(ethermineStats.workers)) {
            allRigs = allRigs.concat((ethermineStats.workers as any[]).map((w: any) => ({
              id: w.worker,
              name: w.worker,
              hashrate: w.currentHashrate,
              status: w.currentHashrate > 0 ? 'online' : 'offline',
            })));
          }
        } catch {}
      }
      // Save to Firestore: /users/{uid}/rigs/{rigId}
      const fs = await getFirestore();
      for (const rig of allRigs) {
        if (!rig.id) continue;
        await fs.collection('users').doc(uid).collection('rigs').doc(rig.id).set(rig, { merge: true });
      }
    }
    // Fetch rig live stats based on platform
    const fs = await getFirestore();
    for (const key of userList.keys) {
      const uid = key.name;
      // Fetch all rigs for this user from Firestore
      const rigDocs = await fs.collection('users').doc(uid).collection('rigs').get();
      for (const rigDoc of rigDocs.docs) {
        const rig = rigDoc.data();
        let liveStats = {};
        try {
          if (rig.platform === 'NiceHash' && rig.nicehashApiKey && rig.nicehashApiSecret && rig.nicehashOrgId) {
            const stats = await fetchNiceHashRigData(uid, rig.nicehashApiKey, rig.nicehashApiSecret);
            liveStats = stats[0] || {};
          } else if (rig.platform === 'HiveOS' && rig.hiveosToken && rig.hiveosFarmId) {
            const stats = await fetchHiveOSRigDataWithFarmId(rig.hiveosToken, rig.hiveosFarmId);
            liveStats = stats[0] || {};
          } else if (rig.platform === 'Ethermine' && rig.ethermineWallet) {
            const stats = await fetchEthermineRigStats(rig.ethermineWallet);
            liveStats = stats || {};
          } else if (rig.platform === 'Manual') {
            // No live stats for manual rigs
            liveStats = {};
          }
          // Merge live stats into rig document
          await rigDoc.ref.set({ ...rig, ...liveStats, lastUpdated: Date.now() }, { merge: true });
        } catch (err) {
          // Improved error logging
          console.error(`Failed to fetch stats for rig ${rigDoc.id} (platform: ${rig.platform}, user: ${uid}):`, err);
          // Optionally, you could write an error field to the rig doc for UI display
          await rigDoc.ref.set({ ...rig, fetchError: String(err), lastUpdated: Date.now() }, { merge: true });
        }
      }
    }
    // In the scheduled handler, for each user/rig with platform 'HiveOS':
    for (const key of userList.keys) {
      const uid = key.name;
      const fs = await getFirestore();
      // Fetch all rigs for this user from Firestore
      const rigDocs = await fs.collection('users').doc(uid).collection('rigs').get();
      for (const rigDoc of rigDocs.docs) {
        const rig = rigDoc.data();
        if (rig.platform === 'HiveOS' && rig.hiveosToken && rig.hiveosFarmId) {
          try {
            // Fetch all workers for the user's farm
            const url = `https://api2.hiveos.farm/api/v2/farms/${rig.hiveosFarmId}/workers`;
            const resp = await fetch(url, {
              headers: {
                'Authorization': `Bearer ${rig.hiveosToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            });
            if (!resp.ok) throw new Error('Failed to fetch HiveOS workers');
            const rigsData = await resp.json();
            const workers = (rigsData as any).data;
            if (workers && Array.isArray(workers)) {
              for (const worker of workers) {
                // Save each worker's stats to Firestore under /users/{uid}/rigs/{worker.id}
                await fs.collection('users').doc(uid).collection('rigs').doc(worker.id?.toString() || worker.name).set({
                  id: worker.id?.toString() || worker.name,
                  name: worker.name,
                  status: worker.stats?.online ? 'online' : 'offline',
                  hashrate: worker.hashrate || 0,
                  hashrateUnit: 'MH/s',
                  powerConsumption: worker.power || 0,
                  temperature: worker.gpu_stats?.length ? Math.max(...worker.gpu_stats.map((g: any) => g.temp)) : null,
                  fanSpeed: worker.gpu_stats?.length ? Math.max(...worker.gpu_stats.map((g: any) => g.fan)) : null,
                  uptime: worker.stats?.uptime || 0,
                  algorithm: worker.algo || '',
                  pool: worker.pool || '',
                  lastSeen: worker.stats?.updated || Date.now(),
                  gpuDetails: Array.isArray(worker.gpu_stats) ? worker.gpu_stats.map((g: any, idx: number) => ({
                    id: `gpu${idx}`,
                    name: g.name || `GPU ${idx+1}`,
                    temperature: g.temp,
                    fanSpeed: g.fan,
                    hashrate: g.hash,
                    power: g.power,
                  })) : [],
                  lastUpdated: Date.now(),
                  platform: 'HiveOS',
                  hiveosFarmId: rig.hiveosFarmId,
                  hiveosToken: rig.hiveosToken,
                }, { merge: true });
              }
            }
          } catch (err) {
            console.error(`Failed to fetch HiveOS stats for user ${uid}, farm ${rig.hiveosFarmId}:`, err);
          }
        }
      }
    }
  }
} satisfies ExportedHandler<Env>;
// NOTE: You must bundle firebase-admin with your Worker for this to work in production.
