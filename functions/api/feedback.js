// Cloudflare Pages Function: POST /api/feedback
// Captures thumbs-up/thumbs-down + optional comment from each tool result.
// Per-IP rate limit uses a hashed IP. Feedback entries get a 90-day TTL.

import { jsonResponse, hashedIp, parseBodyOrFail, envGuard, methodNotAllowed } from "./_lib.js";

const VALID_TOOLS = new Set(["comp", "blurb", "keywords", "categories", "tropes", "ads", "bio"]);
const VALID_RATINGS = new Set(["up", "down"]);
const MAX_COMMENT_LEN = 1000;
const PER_IP_DAILY_LIMIT = 60; // 7 tools × ~5 daily generations + slack for revisions
const RATE_TTL_SECONDS = 60 * 60 * 48;
const ENTRY_TTL_SECONDS = 60 * 60 * 24 * 90; // 90-day retention

export async function onRequestPost(ctx) {
  const { request, env } = ctx;

  const parsed = await parseBodyOrFail(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  const tool = String(body.tool || "").trim().toLowerCase();
  const rating = String(body.rating || "").trim().toLowerCase();
  const comment = String(body.comment || "").trim().slice(0, MAX_COMMENT_LEN);

  if (!VALID_TOOLS.has(tool)) {
    return jsonResponse({ error: "Unknown tool." }, 400);
  }
  if (!VALID_RATINGS.has(rating)) {
    return jsonResponse({ error: "Rating must be 'up' or 'down'." }, 400);
  }

  const envErr = envGuard(env, { anthropic: false });
  if (envErr) return envErr;

  const today = new Date().toISOString().slice(0, 10);
  const ipHash = await hashedIp(request);
  const ipKey = `rate:feedback:${today}:${ipHash}`;

  const ipCountStr = await env.RATE_LIMITS.get(ipKey);
  const ipCount = parseUint(ipCountStr);
  if (ipCount >= PER_IP_DAILY_LIMIT) {
    return jsonResponse({ error: "Too much feedback from your network today. Try again tomorrow." }, 429);
  }

  // Each feedback entry gets its own key so we can list and aggregate.
  // Prefix-listing by tool gives chronological ordering; random suffix
  // dedupes the rare millisecond collision from one IP submitting twice.
  const ts = new Date().toISOString();
  const rand = randomHex(8);
  const fbKey = `feedback:${tool}:${ts}:${ipHash.slice(0, 8)}:${rand}`;
  const entry = JSON.stringify({ tool, rating, comment: comment || null, ts });

  const writes = Promise.allSettled([
    env.RATE_LIMITS.put(fbKey, entry, { expirationTtl: ENTRY_TTL_SECONDS }),
    env.RATE_LIMITS.put(ipKey, String(ipCount + 1), { expirationTtl: RATE_TTL_SECONDS }),
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`[feedback kv put failed: ${["entry", "ip"][i]}]`, r.reason && r.reason.message ? r.reason.message : String(r.reason));
      }
    });
  });
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(writes);
  }

  return jsonResponse({ ok: true });
}

export async function onRequest() {
  return methodNotAllowed();
}

function parseUint(s) {
  const n = parseInt(s || "0", 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}
