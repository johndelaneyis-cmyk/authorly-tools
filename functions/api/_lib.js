// Shared helpers for /api/* Cloudflare Pages Functions.
// Centralizes: IP hashing (day-salted), body parsing with size cap, env guard,
// rate-limit checks (per-IP + per-tool + cross-tool ceiling), counter bumps via
// ctx.waitUntil, Anthropic call shape with AbortController timeout + model
// fallback chain on 403 + structured ClaudeError mapped to user-safe responses,
// and a JSON response formatter that emits Retry-After on 429.
//
// File starts with an underscore so Pages does not route it as `/api/_lib`.

const DEFAULT_MODEL = "claude-sonnet-4-6";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_BODY_BYTES = 10_000; // 413 if Content-Length exceeds this
const GLOBAL_DAILY_CEILING = 5_000; // cross-tool — circuit-breaker against runaway cost
const RATE_TTL_SECONDS = 60 * 60 * 48; // 2-day TTL covers day rollover
const ANTHROPIC_TIMEOUT_MS = 55_000;

// Allowed genre enum (mirrors the chip set rendered in HTML).
// Used by validateGenre — defense-in-depth even though slice() also caps.
export const GENRE_ENUM = new Set([
  "",
  "romance",
  "thriller",
  "mystery",
  "fantasy",
  "sci-fi",
  "literary fiction",
  "memoir/non-fiction",
]);

// Default model fallback chain. Walks from primary -> sonnet-4-5 -> dated alias
// -> haiku-4-5 (broadly available). Configurable via ANTHROPIC_FALLBACK_MODELS
// env (comma-separated). Only triggered on 403 (model gating) — other errors
// won't be fixed by switching models so we surface them immediately.
const DEFAULT_FALLBACK_CHAIN = [
  "claude-sonnet-4-5",           // common alias if 4-6 isn't recognized
  "claude-sonnet-4-5-20250929",  // dated alias as a third try
  "claude-haiku-4-5",            // final fallback — broadly available
];

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

// IP becomes a 16-hex-char (64-bit) DAY-SALTED truncated SHA-256. Day-salting
// rotates the fingerprint at UTC midnight so two visits on different days map
// to different hashes — tighter privacy property than a stable hash, and it
// matches Slatework's _lib.js:34-46 pattern. Collision probability at 10k
// unique daily IPs is ~3e-12 (birthday-bound) so 64-bit truncation does not
// weaken the rate-limit; the daily rotation is what does the privacy work.
export async function hashedIp(request) {
  const raw = request.headers.get("CF-Connecting-IP") || "unknown";
  const day = todayUTC();
  return (await sha256Hex(raw + ":" + day)).slice(0, 16);
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
// Genre validator — defense-in-depth even though endpoints slice() input.
// Returns the value verbatim if valid, else "" (safe default — no genre).
// ---------------------------------------------------------------------------
export function validateGenre(raw) {
  const s = String(raw || "").trim();
  return GENRE_ENUM.has(s) ? s : "";
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
// Structured error class so endpoints can give users specific reasons
// instead of swallowing the upstream message into a generic "could not".
// ---------------------------------------------------------------------------
export class ClaudeError extends Error {
  constructor(code, status, bodySnippet, message) {
    super(message || `${code} (${status})`);
    this.name = "ClaudeError";
    this.code = code;          // 'auth' | 'rate_limit' | 'invalid_request' | 'overloaded' | 'timeout' | 'server_error' | 'network' | 'unknown'
    this.status = status;      // upstream HTTP status (or 0 for timeout/network)
    this.bodySnippet = bodySnippet || "";
  }
}

// Single attempt. Throws ClaudeError on failure. Used internally by callClaude.
async function callClaudeOnce(env, { model, system, user, maxTokens, temperature, timeoutMs }) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new ClaudeError("auth", 0, "", "ANTHROPIC_API_KEY not set");
  }
  const reqBody = {
    model,
    max_tokens: maxTokens || 1500,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
  };
  if (typeof temperature === "number") reqBody.temperature = temperature;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs || ANTHROPIC_TIMEOUT_MS);
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
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e && e.name === "AbortError") {
      throw new ClaudeError("timeout", 0, "", `Aborted after ${timeoutMs || ANTHROPIC_TIMEOUT_MS}ms`);
    }
    throw new ClaudeError("network", 0, (e && e.message) || "", "Network error talking to Anthropic");
  }
  clearTimeout(timer);

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const snippet = errText.slice(0, 800);
    let code;
    if (res.status === 401 || res.status === 403) code = "auth";
    else if (res.status === 429) code = "rate_limit";
    else if (res.status === 400 || res.status === 422) code = "invalid_request";
    else if (res.status === 529) code = "overloaded";
    else if (res.status >= 500) code = "server_error";
    else code = "unknown";
    throw new ClaudeError(code, res.status, snippet);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new ClaudeError("server_error", res.status, "", "Anthropic returned malformed JSON");
  }
  const text = (data.content && data.content[0] && data.content[0].text) || "";
  if (!text) {
    throw new ClaudeError("server_error", res.status, "", "Anthropic returned empty content");
  }
  return text;
}

// Multi-step model fallback. If the primary model returns 403 (gating /
// alias / tier issue, NOT a 401 invalid-key issue), retry through the chain.
// Any other error surfaces immediately.
//
// Returns { text } on success, or { error: Response } on failure (the Response
// is already user-safe via userFacingClaudeError).
export async function callClaude(env, opts) {
  const primary = env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const envChain = env.ANTHROPIC_FALLBACK_MODELS
    ? env.ANTHROPIC_FALLBACK_MODELS.split(",").map(s => s.trim()).filter(Boolean)
    : DEFAULT_FALLBACK_CHAIN;
  const chain = [primary, ...envChain.filter(m => m !== primary)];

  let firstErr = null;
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    try {
      const text = await callClaudeOnce(env, { ...opts, model });
      if (i > 0) console.error(`[claude_fallback] primary=${primary} failed, succeeded with ${model}`);
      return { text };
    } catch (err) {
      if (!firstErr) firstErr = err;
      // Only retry on 403 (model gating). Everything else surfaces now.
      if (!(err instanceof ClaudeError && err.code === "auth" && err.status === 403)) {
        return { error: userFacingClaudeError(err) };
      }
      console.error(`[claude_fallback] ${model} returned 403, trying next in chain`);
    }
  }
  return { error: userFacingClaudeError(firstErr) };
}

// ---------------------------------------------------------------------------
// Error translation
// ---------------------------------------------------------------------------
function extractUpstreamDetail(snippet) {
  if (!snippet) return "";
  try {
    const obj = JSON.parse(snippet);
    const inner = obj && obj.error;
    if (inner && typeof inner === "object") {
      const parts = [];
      if (inner.type) parts.push(inner.type);
      if (inner.message) parts.push(inner.message);
      if (parts.length) return parts.join(": ");
    }
    if (obj && obj.message) return String(obj.message);
  } catch {}

  const m1 = /"error"\s*:\s*\{[^}]*?"message"\s*:\s*"((?:[^"\\]|\\.)*)"/m.exec(snippet);
  if (m1) {
    const typeMatch = /"error"\s*:\s*\{[^}]*?"type"\s*:\s*"((?:[^"\\]|\\.)*)"/m.exec(snippet);
    const msg = m1[1].replace(/\\"/g, '"').replace(/\\n/g, " ");
    return typeMatch ? `${typeMatch[1]}: ${msg}` : msg;
  }
  const m2 = /"message"\s*:\s*"((?:[^"\\]|\\.)*)"/m.exec(snippet);
  if (m2) return m2[1].replace(/\\"/g, '"').replace(/\\n/g, " ");
  const m3 = /"error"\s*:\s*\{[^}]*?"type"\s*:\s*"((?:[^"\\]|\\.)*)"/m.exec(snippet);
  if (m3) return m3[1].replace(/\\"/g, '"');
  return "";
}

// Translate a thrown ClaudeError into a Response. Always logs full server-side
// context (with a ref code) for support tickets; user-facing message is trimmed.
export function userFacingClaudeError(err) {
  const ref = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
  if (err instanceof ClaudeError) {
    console.error(`[claude_error] ref=${ref} code=${err.code} status=${err.status} body=${(err.bodySnippet || "").slice(0, 400)}`);
  } else {
    console.error(`[claude_error] ref=${ref} non-ClaudeError name=${err && err.name} message=${err && err.message}`);
  }
  if (!(err instanceof ClaudeError)) {
    return jsonResponse({ error: `Unexpected internal error. Please email hello@authorly.tools (ref ${ref}).` }, 500);
  }

  const upstream = extractUpstreamDetail(err.bodySnippet);
  const upstreamSuffix = upstream ? ` (${upstream.slice(0, 180)}${upstream.length > 180 ? "…" : ""})` : "";

  switch (err.code) {
    case "auth":
      return jsonResponse({
        error: err.status === 401
          ? `Claude rejected the API key. This is on us — please email hello@authorly.tools (ref ${ref}).`
          : `Claude denied the request (HTTP ${err.status}).${upstreamSuffix} If this keeps happening, email hello@authorly.tools (ref ${ref}).`,
      }, 503);
    case "rate_limit":
      return jsonResponse({ error: `Claude is busy — try again in a minute. (ref ${ref})` }, 429);
    case "overloaded":
      return jsonResponse({ error: `Claude is temporarily overloaded — try again in a minute. (ref ${ref})` }, 503);
    case "invalid_request":
      return jsonResponse({
        error: upstream
          ? `Couldn't process the input: ${upstream.slice(0, 180)}. Try shorter or simpler text. (ref ${ref})`
          : `Couldn't process the input. Try shorter or simpler text. (ref ${ref})`,
      }, 400);
    case "timeout":
      return jsonResponse({ error: `Claude took too long to respond and the request timed out. Try again — sometimes shorter input helps. (ref ${ref})` }, 504);
    case "network":
      return jsonResponse({ error: `Network error reaching Claude. Try again in a moment. (ref ${ref})` }, 502);
    case "server_error":
      return jsonResponse({ error: `Claude returned an error (HTTP ${err.status}).${upstreamSuffix} Try again in a few minutes. (ref ${ref})` }, 502);
    default:
      return jsonResponse({ error: `Unexpected error from Claude (HTTP ${err.status}).${upstreamSuffix} (ref ${ref})` }, 502);
  }
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
