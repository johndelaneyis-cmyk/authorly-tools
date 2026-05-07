// Shared helpers for /api/* Cloudflare Pages Functions.
// Centralizes: IP hashing, body parsing with size cap, env guard, rate-limit
// checks (per-IP + per-tool + cross-tool ceiling), counter bumps via
// ctx.waitUntil, Anthropic call shape with sanitized error responses,
// and a JSON response formatter that emits Retry-After on 429.
//
// File starts with an underscore so Pages does not route it as `/api/_lib`.

const DEFAULT_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_BODY_BYTES = 10_000; // 413 if Content-Length exceeds this
const GLOBAL_DAILY_CEILING = 5_000; // cross-tool — circuit-breaker against runaway cost
const RATE_TTL_SECONDS = 60 * 60 * 48; // 2-day TTL covers day rollover

// ---------------------------------------------------------------------------
// JSON response (auto Retry-After on 429)
// ---------------------------------------------------------------------------
export function jsonResponse(data, status, extraHeaders) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...(extraHeaders || {}),
  };
  if (status === 429 && !headers["Retry-After"]) {
    headers["Retry-After"] = String(secondsUntilUtcMidnight());
  }
  return new Response(JSON.stringify(data), { status: status || 200, headers });
}

export async function methodNotAllowed() {
  return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
}

// ---------------------------------------------------------------------------
// Crypto helpers
// ---------------------------------------------------------------------------
export async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// IP becomes a 16-hex-char (64-bit) truncated SHA-256 — collision-resistant
// at our scale, keeps the raw IP out of KV (which is enumerable via wrangler
// kv:key list and is therefore PII storage).
export async function hashedIp(request) {
  const raw = request.headers.get("CF-Connecting-IP") || "unknown";
  return (await sha256Hex(raw)).slice(0, 16);
}

// ---------------------------------------------------------------------------
// Body parser with size cap
// ---------------------------------------------------------------------------
export async function parseBodyOrFail(request) {
  const cl = parseInt(request.headers.get("content-length") || "0", 10);
  if (Number.isFinite(cl) && cl > MAX_BODY_BYTES) {
    return { error: jsonResponse({ error: "Request body too large." }, 413) };
  }
  try {
    return { body: await request.json() };
  } catch {
    return { error: jsonResponse({ error: "Invalid request format." }, 400) };
  }
}

// ---------------------------------------------------------------------------
// Env guard — single 503 with no info-leak about which secret is missing
// ---------------------------------------------------------------------------
export function envGuard(env, opts) {
  const needsAnthropic = !opts || opts.anthropic !== false;
  if (needsAnthropic && !env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: "Service is being configured. Try again in a few minutes." }, 503);
  }
  if (!env.RATE_LIMITS) {
    return jsonResponse({ error: "Service is being configured. Try again shortly." }, 503);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Rate-limit check
// Per-IP daily + per-tool daily + cross-tool global ceiling.
// Returns { blocked: Response } if any cap is hit, or
//         { keys, counts, perIpLimit } when allowed (caller passes to bumpCounters).
// Counters are NOT incremented here.
// ---------------------------------------------------------------------------
export async function rateCheck(env, tool, ipHash, perIpLimit, perToolLimit) {
  const today = todayUTC();
  const ipKey = `rate:${tool}:${today}:${ipHash}`;
  const toolKey = `global:${tool}:${today}`;
  const allKey = `global:all:${today}`;

  const [ipCountStr, toolCountStr, allCountStr] = await Promise.all([
    env.RATE_LIMITS.get(ipKey),
    env.RATE_LIMITS.get(toolKey),
    env.RATE_LIMITS.get(allKey),
  ]);

  const ipCount = parseUint(ipCountStr);
  const toolCount = parseUint(toolCountStr);
  const allCount = parseUint(allCountStr);

  if (ipCount >= perIpLimit) {
    return {
      blocked: jsonResponse({
        error: `Daily free limit reached (${perIpLimit} runs per visitor for this tool). Come back tomorrow.`,
        remaining: 0,
      }, 429),
    };
  }
  if (toolCount >= perToolLimit) {
    return {
      blocked: jsonResponse({
        error: "Service temporarily unavailable (daily capacity reached). Try again tomorrow.",
      }, 503),
    };
  }
  if (allCount >= GLOBAL_DAILY_CEILING) {
    return {
      blocked: jsonResponse({
        error: "Service temporarily unavailable (cross-tool daily capacity reached). Try again tomorrow.",
      }, 503),
    };
  }

  return {
    blocked: null,
    keys: { ipKey, toolKey, allKey },
    counts: { ipCount, toolCount, allCount },
    perIpLimit,
  };
}

// Bump all three counters through ctx.waitUntil so the response commits
// even if KV writes fail. Errors are logged but never block the user.
//
// Race note: KV has no atomic INCR, so concurrent requests at limit-1 can
// each pass the check and both bump to limit. The leak is bounded at
// (perIpLimit × concurrent-requests-from-same-IP) per day — small at our
// 5/day per-tool limit and worth accepting vs the complexity of Durable
// Objects. See docs/superpowers/reviews/2026-05-07-launch-review.md #7.
export function bumpCounters(ctx, env, rate) {
  const { ipKey, toolKey, allKey } = rate.keys;
  const { ipCount, toolCount, allCount } = rate.counts;
  const writes = Promise.allSettled([
    env.RATE_LIMITS.put(ipKey, String(ipCount + 1), { expirationTtl: RATE_TTL_SECONDS }),
    env.RATE_LIMITS.put(toolKey, String(toolCount + 1), { expirationTtl: RATE_TTL_SECONDS }),
    env.RATE_LIMITS.put(allKey, String(allCount + 1), { expirationTtl: RATE_TTL_SECONDS }),
  ]).then(results => {
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        const which = ["ip", "tool", "all"][i];
        console.error(`[rate-limit kv put failed: ${which}]`, r.reason && r.reason.message ? r.reason.message : String(r.reason));
      }
    });
  });
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(writes);
  }
  return writes;
}

// ---------------------------------------------------------------------------
// Anthropic call
// Caller supplies system + user. Errors are mapped to user-safe messages.
// Anthropic error bodies are NEVER passed through to the client.
// ---------------------------------------------------------------------------
export async function callClaude(env, { system, user, maxTokens, temperature }) {
  const model = env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const reqBody = {
    model,
    max_tokens: maxTokens || 1500,
    system,
    messages: [{ role: "user", content: user }],
  };
  if (typeof temperature === "number") reqBody.temperature = temperature;

  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify(reqBody),
    });
  } catch {
    return { error: jsonResponse({ error: "Could not reach AI service. Try again." }, 502) };
  }

  if (!res.ok) {
    let type = "";
    try {
      const errBody = await res.json();
      type = (errBody.error && errBody.error.type) || "";
    } catch {}
    let msg = "AI service is having issues, try again.";
    if (type === "rate_limit_error") msg = "AI service is busy — try again in a minute.";
    else if (type === "invalid_request_error") msg = "AI service rejected the request — try simpler input.";
    else if (type === "overloaded_error") msg = "AI service is temporarily overloaded — try again in a minute.";
    return { error: jsonResponse({ error: msg }, 502) };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { error: jsonResponse({ error: "AI returned a malformed response. Try again." }, 502) };
  }
  const text = (data.content && data.content[0] && data.content[0].text) || "";
  if (!text) {
    return { error: jsonResponse({ error: "AI returned an empty response. Try a more detailed input." }, 500) };
  }
  return { text };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------
function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function secondsUntilUtcMidnight() {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0
  ));
  return Math.max(60, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
}

function parseUint(s) {
  const n = parseInt(s || "0", 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
