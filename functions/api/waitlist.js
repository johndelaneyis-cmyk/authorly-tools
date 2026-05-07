// Cloudflare Pages Function: POST /api/waitlist
// Pro-tier email capture. Stores entries in the existing RATE_LIMITS KV
// namespace under a `waitlist:<sha256-of-email>` key. Per-IP rate-limit
// uses hashed IP (no plaintext IP in KV); also enforces a daily global
// cap to deter coordinated signup spam.

import { jsonResponse, hashedIp, parseBodyOrFail, envGuard, sha256Hex, methodNotAllowed } from "./_lib.js";

const MIN_EMAIL_LEN = 5;
const MAX_EMAIL_LEN = 254;
const PER_IP_DAILY_LIMIT = 3;
const GLOBAL_DAILY_LIMIT = 500;
const RATE_TTL_SECONDS = 60 * 60 * 48;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost(ctx) {
  const { request, env } = ctx;

  const parsed = await parseBodyOrFail(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  const email = String(body.email || "").trim().toLowerCase();
  if (email.length < MIN_EMAIL_LEN || email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return jsonResponse({ error: "That doesn't look like a valid email address." }, 400);
  }

  const envErr = envGuard(env, { anthropic: false });
  if (envErr) return envErr;

  const today = new Date().toISOString().slice(0, 10);
  const ipHash = await hashedIp(request);
  const ipKey = `rate:waitlist:${today}:${ipHash}`;
  const globalKey = `global:waitlist:${today}`;

  const [ipCountStr, globalCountStr] = await Promise.all([
    env.RATE_LIMITS.get(ipKey),
    env.RATE_LIMITS.get(globalKey),
  ]);
  const ipCount = parseUint(ipCountStr);
  const globalCount = parseUint(globalCountStr);

  if (ipCount >= PER_IP_DAILY_LIMIT) {
    return jsonResponse({ error: "Too many submissions from your network today. Try again tomorrow." }, 429);
  }
  if (globalCount >= GLOBAL_DAILY_LIMIT) {
    return jsonResponse({ error: "We've had a great response today — please try again tomorrow." }, 429);
  }

  // Dedupe by hash so we don't store the email in the key namespace.
  const hash = await sha256Hex(email);
  const waitlistKey = `waitlist:${hash}`;

  const existing = await env.RATE_LIMITS.get(waitlistKey);
  if (existing) {
    return jsonResponse({ ok: true, alreadyOnList: true });
  }

  // Email plaintext is stored in the VALUE (not the key) so we can email
  // when Pro launches. This is disclosed in /privacy.
  const source = String(body.source || "homepage").trim().slice(0, 40) || "homepage";
  const entry = JSON.stringify({ email, ts: new Date().toISOString(), source });

  // Counter writes are best-effort via ctx.waitUntil — failure logs to console
  // rather than blocking the user.
  const writes = Promise.allSettled([
    env.RATE_LIMITS.put(waitlistKey, entry),
    env.RATE_LIMITS.put(ipKey, String(ipCount + 1), { expirationTtl: RATE_TTL_SECONDS }),
    env.RATE_LIMITS.put(globalKey, String(globalCount + 1), { expirationTtl: RATE_TTL_SECONDS }),
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`[waitlist kv put failed: ${["entry", "ip", "global"][i]}]`, r.reason && r.reason.message ? r.reason.message : String(r.reason));
      }
    });
  });
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(writes);
  }

  return jsonResponse({ ok: true, alreadyOnList: false });
}

export async function onRequest() {
  return methodNotAllowed();
}

function parseUint(s) {
  const n = parseInt(s || "0", 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
