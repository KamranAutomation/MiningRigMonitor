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

// Helper: Get user's Telegram chat ID and alert settings from KV
async function getUserAlertSettings(env: Env, uid: string) {
  const alertEnabled = await env.RIGS_KV.get(`alert_enabled:${uid}`);
  const chatId = await env.RIGS_KV.get(`telegram_chat_id:${uid}`);
  return {
    enabled: alertEnabled !== 'false', // default to true if not set
    chatId: chatId || TELEGRAM_CHAT_ID,
  };
}

async function sendUserTelegramAlert(env: Env, uid: string, message: string) {
  const settings = await getUserAlertSettings(env, uid);
  if (!settings.enabled) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: settings.chatId, text: message })
  });
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
    // Example: For each user, fetch NiceHash data and store in KV
    const userList = await env.RIGS_KV.list();
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
    const userList2 = await env.RIGS_KV.list();
    for (const key of userList2.keys) {
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
    // Scan all user keys in KV (for demo, assume keys are user IDs)
    // In production, you may want to keep a list of user IDs in a separate key
    const list = await env.RIGS_KV.list();
    for (const key of list.keys) {
      const uid = key.name;
      const data = await env.RIGS_KV.get(uid, "json");
      if (!data || !Array.isArray(data)) continue;
      for (const rig of data) {
        // Assume rig.status and rig.lastSeen (ISO string or timestamp)
        if (rig.status === "offline" && rig.lastSeen) {
          const lastSeen = new Date(rig.lastSeen).getTime();
          const now = Date.now();
          if (now - lastSeen > 10 * 60 * 1000) { // 10 minutes
            await sendUserTelegramAlert(env, uid, `ALERT: Rig ${rig.name} (user ${uid}) has been offline for more than 10 minutes!`);
          }
        }
      }
    }
    // A Cron Trigger can make requests to other endpoints on the Internet,
    // publish to a Queue, query a D1 Database, and much more.
    //
    // We'll keep it simple and make an API call to a Cloudflare API:
    let resp = await fetch('https://api.cloudflare.com/client/v4/ips');
    let wasSuccessful = resp.ok ? 'success' : 'fail';

    // You could store this result in KV, write to a D1 Database, or publish to a Queue.
    // In this template, we'll just log the result:
    console.log(`trigger fired at ${event.cron}: ${wasSuccessful}`);

    // Auto payout logic
    const userList3 = await env.RIGS_KV.list();
    for (const key of userList3.keys) {
      const uid = key.name;
      // Fetch payout threshold and withdrawal address for user
      const thresholdStr = await env.RIGS_KV.get(`payout_threshold:${uid}`);
      const withdrawalAddress = await env.RIGS_KV.get(`withdrawal_address:${uid}`);
      if (!thresholdStr || !withdrawalAddress) continue;
      const threshold = parseFloat(thresholdStr);
      // Fetch user's NiceHash API key/secret/orgId (replace with per-user storage in production)
      const apiKey = env.NICEHASH_KEY;
      const apiSecret = env.NICEHASH_SECRET;
      const orgId = '<YOUR_ORG_ID>';
      try {
        const earnings = await fetchNiceHashEarnings(apiKey, apiSecret, orgId);
        if (earnings >= threshold) {
          // Trigger payout
          const payoutResult = await triggerNiceHashPayout(apiKey, apiSecret, orgId, withdrawalAddress, earnings);
          if (payoutResult) {
            await sendUserTelegramAlert(env, uid, `Auto payout triggered for user ${uid}: ${earnings} BTC sent to ${withdrawalAddress}`);
          }
        }
      } catch (e) {
        let msg = 'Unknown error';
        if (typeof e === 'object' && e && 'message' in e) {
          msg = (e as any).message;
        } else if (typeof e === 'string') {
          msg = e;
        }
        await sendUserTelegramAlert(env, uid, `Auto payout error for user ${uid}: ${msg}`);
      }
    }
  }
} satisfies ExportedHandler<Env>;
