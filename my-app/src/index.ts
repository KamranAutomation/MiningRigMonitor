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
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PROJECT_ID: string;
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

// --- Firestore REST API helpers ---
async function firestoreGetDoc(env: Env, documentPath: string): Promise<any> {
  const accessToken = await getAccessToken(env);
  const projectId = env.FIREBASE_PROJECT_ID;
  const apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${documentPath}`;
  const res = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Firestore GET failed: ${res.status}`);
  return await res.json();
}

async function firestoreSetDoc(env: Env, documentPath: string, data: any): Promise<any> {
  const accessToken = await getAccessToken(env);
  const projectId = env.FIREBASE_PROJECT_ID;
  const apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${documentPath}`;
  const body = JSON.stringify({ fields: firestoreEncodeFields(data) });
  const res = await fetch(apiUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) throw new Error(`Firestore SET failed: ${res.status}`);
  return await res.json();
}

async function firestoreAddDoc(env: Env, collectionPath: string, data: any): Promise<any> {
  const accessToken = await getAccessToken(env);
  const projectId = env.FIREBASE_PROJECT_ID;
  const apiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}`;
  const body = JSON.stringify({ fields: firestoreEncodeFields(data) });
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!res.ok) throw new Error(`Firestore ADD failed: ${res.status}`);
  return await res.json();
}

function firestoreEncodeFields(data: any): any {
  // Encodes JS object to Firestore REST API fields format
  const encode = (val: any): any => {
    if (val === null) return { nullValue: null };
    if (typeof val === 'boolean') return { booleanValue: val };
    if (typeof val === 'number') return { doubleValue: val };
    if (typeof val === 'string') return { stringValue: val };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(encode) } };
    if (typeof val === 'object') {
      const fields: any = {};
      for (const k in val) fields[k] = encode(val[k]);
      return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
  };
  const fields: any = {};
  for (const k in data) fields[k] = encode(data[k]);
  return fields;
}

function firestoreDecodeFields(fields: any): any {
  // Decodes Firestore REST API fields format to JS object
  const decode = (val: any): any => {
    if ('nullValue' in val) return null;
    if ('booleanValue' in val) return val.booleanValue;
    if ('doubleValue' in val) return val.doubleValue;
    if ('integerValue' in val) return Number(val.integerValue);
    if ('stringValue' in val) return val.stringValue;
    if ('arrayValue' in val) return (val.arrayValue.values || []).map(decode);
    if ('mapValue' in val) {
      const obj: any = {};
      for (const k in val.mapValue.fields) obj[k] = decode(val.mapValue.fields[k]);
      return obj;
    }
    return undefined;
  };
  const obj: any = {};
  for (const k in fields) obj[k] = decode(fields[k]);
  return obj;
}

// --- Google Service Account JWT for Firestore REST API ---
async function getAccessToken(env: Env): Promise<string> {
  // Use Google Service Account credentials from env
  const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/datastore",
    iat: now,
    exp: now + 3600
  };
  // Encode header and payload
  function base64url(input: string) {
    return btoa(input)
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }
  const enc = new TextEncoder();
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const toSign = `${headerB64}.${payloadB64}`;
  // Import private key
  const key = await crypto.subtle.importKey(
    "pkcs8",
    str2ab(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  // Sign
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    enc.encode(toSign)
  );
  function ab2b64url(buf: ArrayBuffer) {
    let bin = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
  const jwt = `${toSign}.${ab2b64url(sig)}`;
  // Exchange JWT for access token
  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  if (!tokenResp.ok) throw new Error("Failed to get Google access token");
  const tokenData = await tokenResp.json() as { access_token: string };
  return tokenData.access_token;
}

function str2ab(str: string): ArrayBuffer {
  // Convert PEM to ArrayBuffer
  const b64 = str.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

// --- Refactored Firestore logic ---
async function getUserPayoutSettingsFromFirestore(uid: string, env: Env) {
  try {
    const doc = await firestoreGetDoc(env, `users/${uid}/settings/payout`);
    const data = doc.fields ? firestoreDecodeFields(doc.fields) : {};
    return {
      provider: data.provider || 'nowpayments',
      apiKey: data.apiKey || '',
      payoutAddress: data.payoutAddress || '',
    };
  } catch {
    return { provider: 'nowpayments', apiKey: '', payoutAddress: '' };
  }
}

async function sendUserTelegramAlertWithFirestore(uid: string, message: string, env: Env) {
  // Optionally, fetch user-specific Telegram chat ID from Firestore
  let chatId = TELEGRAM_CHAT_ID;
  try {
    const doc = await firestoreGetDoc(env, `users/${uid}/settings/telegram`);
    const data = doc.fields ? firestoreDecodeFields(doc.fields) : {};
    if (data.chatId) chatId = data.chatId;
  } catch {}
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message })
  });
}

// --- SCHEDULED HANDLER: Replace all Firestore SDK usage with REST API helpers ---
const handler: ExportedHandler<Env> = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const path = url.pathname;
    let response: Response;
    // --- AUTH CHECK ---
    const auth = requireAuth(request);
    if (!auth && path.startsWith('/api/')) {
      return new Response('Unauthorized', { status: 401 });
    }
    const uid = auth?.uid || '';
    try {
      // --- ALERTS ENDPOINT ---
      if (path === '/api/alerts' && request.method === 'GET') {
        // List alerts for user
        const doc = await firestoreGetDoc(env, `users/${uid}/settings/alerts`);
        const data = doc.fields ? firestoreDecodeFields(doc.fields) : {};
        return Response.json({ alerts: data.alerts || [] });
      }
      if (path === '/api/alerts' && request.method === 'POST') {
        // Add alert for user
        const body = await request.json();
        const doc = await firestoreGetDoc(env, `users/${uid}/settings/alerts`);
        const data = doc.fields ? firestoreDecodeFields(doc.fields) : {};
        const alerts = Array.isArray(data.alerts) ? data.alerts : [];
        alerts.push(body);
        await firestoreSetDoc(env, `users/${uid}/settings/alerts`, { alerts });
        return Response.json({ success: true });
      }
      // --- HISTORY ENDPOINT ---
      if (path === '/api/history' && request.method === 'GET') {
        // List payout history for user
        const accessToken = await getAccessToken(env);
        const projectId = env.FIREBASE_PROJECT_ID;
        const payoutsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/payouts`;
        const res = await fetch(payoutsUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await res.json();
        const docsArr = (data && typeof data === 'object' && 'documents' in data && Array.isArray((data as any).documents)) ? (data as any).documents : [];
        const payouts = docsArr.map((doc: any) => firestoreDecodeFields(doc.fields));
        return Response.json({ payouts });
      }
      // --- SETTINGS ENDPOINT ---
      if (path === '/api/settings' && request.method === 'GET') {
        // Get user settings
        const doc = await firestoreGetDoc(env, `users/${uid}/settings/payout`);
        const data = doc.fields ? firestoreDecodeFields(doc.fields) : {};
        return Response.json({ settings: data });
      }
      if (path === '/api/settings' && request.method === 'POST') {
        // Update user settings
        const body = await request.json();
        await firestoreSetDoc(env, `users/${uid}/settings/payout`, body);
        return Response.json({ success: true });
      }
      // --- RIGS ENDPOINT ---
      if (path === '/api/rigs' && request.method === 'GET') {
        // List all rigs for user
        const accessToken = await getAccessToken(env);
        const projectId = env.FIREBASE_PROJECT_ID;
        const rigsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/rigs`;
        const res = await fetch(rigsUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await res.json();
        const docsArr = (data && typeof data === 'object' && 'documents' in data && Array.isArray((data as any).documents)) ? (data as any).documents : [];
        const rigs = docsArr.map((doc: any) => firestoreDecodeFields(doc.fields));
        return Response.json({ rigs });
      }
      // --- RIG DELETE ENDPOINT ---
      if (path.startsWith('/api/rigs/') && request.method === 'DELETE') {
        try {
          const id = path.split('/').pop();
          if (!id) return Response.json({ error: 'Missing rig id' }, { status: 400 });
          // Delete rig doc from Firestore
          const accessToken = await getAccessToken(env);
          const projectId = env.FIREBASE_PROJECT_ID;
          const rigDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/rigs/${id}`;
          const res = await fetch(rigDocUrl, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!res.ok && res.status !== 404) {
            let errText = '';
            try {
              errText = await res.text();
            } catch {}
            return Response.json({ error: 'Failed to delete rig: ' + errText }, { status: 500 });
          }
          // Add rig id to deletedRigs in Firestore
          try {
            const deletedRigsDoc = await firestoreGetDoc(env, `users/${uid}/settings/deletedRigs`);
            let deletedRigs: string[] = [];
            if (deletedRigsDoc && deletedRigsDoc.fields && deletedRigsDoc.fields.ids && Array.isArray(deletedRigsDoc.fields.ids.arrayValue?.values)) {
              deletedRigs = deletedRigsDoc.fields.ids.arrayValue.values.map((v: any) => v.stringValue);
            }
            if (!deletedRigs.includes(id)) {
              deletedRigs.push(id);
              await firestoreSetDoc(env, `users/${uid}/settings/deletedRigs`, { ids: deletedRigs });
            }
          } catch {}
          return Response.json({ success: true });
        } catch (err) {
          return Response.json({ error: err && typeof err === 'object' && 'message' in err ? (err as any).message : String(err) || 'Unknown error during rig deletion' }, { status: 500 });
        }
      }
      // --- DEFAULT: 404 ---
      return Response.json({ error: 'Not found' }, { status: 404 });
    } catch (err) {
      // Robust error handling
      let msg = 'Unknown error';
      if (typeof err === 'object' && err && 'message' in err) {
        msg = (err as any).message;
      } else if (typeof err === 'string') {
        msg = err;
      }
      // Optionally log error to a logging service here
      return Response.json({ error: msg }, { status: 500 });
    }
  },
  scheduled: async (controller: ScheduledController, env: Env, ctx: ExecutionContext) => {
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
            await sendUserTelegramAlertWithFirestore(uid, `ALERT: Rig ${rig.name} (user ${uid}) has been offline for more than 10 minutes!`, env);
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
      const payoutSettings = await getUserPayoutSettingsFromFirestore(uid, env);
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
            const payoutId = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
            await firestoreSetDoc(env, `users/${uid}/payouts/${payoutId}`, {
              timestamp: Date.now(),
              amount: earnings,
              address: withdrawalAddress,
              provider: payoutSettings.provider,
              status: 'success',
              tx: payoutResult,
            });
            await sendUserTelegramAlertWithFirestore(uid, `Auto payout triggered for user ${uid}: ${earnings} BTC sent to ${withdrawalAddress} via ${payoutSettings.provider}`, env);
          }
        }
      } catch (e) {
        let msg = 'Unknown error';
        if (typeof e === 'object' && e && 'message' in e) {
          msg = (e as any).message;
        } else if (typeof e === 'string') {
          msg = e;
        }
        await sendUserTelegramAlertWithFirestore(uid, `Auto payout error for user ${uid}: ${msg}`, env);
      }
    }
    // Firestore sync logic
    for (const key of userList.keys) {
      const uid = key.name;
      // Fetch deletedRigs list from Firestore
      let deletedRigs: string[] = [];
      try {
        const deletedRigsDoc = await firestoreGetDoc(env, `users/${uid}/settings/deletedRigs`);
        if (deletedRigsDoc && deletedRigsDoc.fields && deletedRigsDoc.fields.ids && Array.isArray(deletedRigsDoc.fields.ids.arrayValue?.values)) {
          deletedRigs = deletedRigsDoc.fields.ids.arrayValue.values.map((v: any) => v.stringValue);
        }
      } catch {}
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
      // Defensive: ensure deletedRigs is an array of strings and lowercase for comparison
      deletedRigs = Array.isArray(deletedRigs) ? deletedRigs.map(r => String(r).toLowerCase()) : [];
      // Filter out deleted rigs from allRigs before saving
      const filteredRigs = allRigs.filter(rig => {
        const rigId = (typeof rig.id === 'string' ? rig.id : String(rig.id || '')).toLowerCase();
        return rigId && !deletedRigs.includes(rigId);
      });
      // Save filtered rigs to Firestore: /users/{uid}/rigs/{rigId}
      for (const rig of filteredRigs) {
        const rigId = (typeof rig.id === 'string' ? rig.id : String(rig.id || ''));
        if (!rigId) continue;
        await firestoreSetDoc(env, `users/${uid}/rigs/${rigId}`, rig);
      }
      // Save filtered rigs to KV as well
      await env.RIGS_KV.put(uid, JSON.stringify(filteredRigs));
      // Failsafe: Remove any deleted rigs that may exist in Firestore
      const accessToken = await getAccessToken(env);
      const projectId = env.FIREBASE_PROJECT_ID;
      for (const deletedId of deletedRigs) {
        const rigDocUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/rigs/${deletedId}`;
        await fetch(rigDocUrl, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    }
    // Fetch rig live stats based on platform
    for (const key of userList.keys) {
      const uid = key.name;
      // Fetch all rigs for this user from Firestore
      // List all rig docs under /users/{uid}/rigs
      const accessToken = await getAccessToken(env);
      const projectId = env.FIREBASE_PROJECT_ID;
      const rigsApiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/rigs`;
      const rigDocsRes = await fetch(rigsApiUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      const rigDocs = await rigDocsRes.json();
      if (!rigDocs || typeof rigDocs !== 'object' || !('documents' in rigDocs) || !Array.isArray(rigDocs.documents)) continue;
      for (const rigDoc of rigDocs.documents) {
        const rig = rigDoc.fields ? firestoreDecodeFields(rigDoc.fields) : {};
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
            liveStats = {};
          }
          // Merge live stats into rig document
          await firestoreSetDoc(env, `users/${uid}/rigs/${rig.id}`, { ...rig, ...liveStats, lastUpdated: Date.now() });
        } catch (err) {
          // Improved error logging
          // Optionally, you could write an error field to the rig doc for UI display
          await firestoreSetDoc(env, `users/${uid}/rigs/${rig.id}`, { ...rig, fetchError: String(err), lastUpdated: Date.now() });
        }
      }
    }
    // In the scheduled handler, for each user/rig with platform 'HiveOS':
    for (const key of userList.keys) {
      const uid = key.name;
      // Fetch all rigs for this user from Firestore
      const accessToken = await getAccessToken(env);
      const projectId = env.FIREBASE_PROJECT_ID;
      const rigsApiUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}/rigs`;
      const rigDocsRes = await fetch(rigsApiUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      const rigDocs = await rigDocsRes.json();
      if (!rigDocs || typeof rigDocs !== 'object' || !('documents' in rigDocs) || !Array.isArray(rigDocs.documents)) continue;
      for (const rigDoc of rigDocs.documents) {
        const rig = rigDoc.fields ? firestoreDecodeFields(rigDoc.fields) : {};
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
                await firestoreSetDoc(env, `users/${uid}/rigs/${worker.id?.toString() || worker.name}`, {
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
                });
              }
            }
          } catch (err) {
            // Optionally log error
          }
        }
      }
    }
  }
};

export default handler;

// --- AUTH MIDDLEWARE PLACEHOLDER ---
function requireAuth(request: Request): { uid: string } | null {
  // TODO: Implement real authentication (e.g., JWT, API key, session cookie)
  // For now, allow all requests (INSECURE!)
  // Example: extract uid from header or query param
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid') || request.headers.get('x-user-uid') || '';
  if (!uid) return null;
  return { uid };
}

// Fetch rig stats from Ethermine public API
async function fetchEthermineRigStats(wallet: string) {
  // Ethermine API docs: https://ethermine.org/api/docs/
  // API endpoint: https://api.ethermine.org/miner/:wallet/dashboard
  const url = `https://api.ethermine.org/miner/${wallet}/dashboard`;
  const resp = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  const data: any = await resp.json();
  if (!data || typeof data !== 'object' || data.status !== 'OK' || !data.data) return {};
  // Return the workers array for compatibility with existing usage
  return {
    workers: Array.isArray(data.data.workers) ? data.data.workers : [],
    currentStatistics: data.data.currentStatistics || {},
  };
}
