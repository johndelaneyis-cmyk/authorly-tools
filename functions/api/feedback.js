// Cloudflare Pages Function: POST /api/feedback
// Captures thumbs-up/thumbs-down + optional comment from each tool result.
// Stored in the existing RATE_LIMITS KV namespace under a `feedback:` prefix.
// Lightweight rate limit by IP to deter spam.

const VALID_TOOLS = new Set(["comp", "blurb", "keywords", "categories", "tropes", "ads", "bio"]);
const VALID_RATINGS = new Set(["up", "down"]);
const MAX_COMMENT_LEN = 1000;
const PER_IP_DAILY_LIMIT = 60; // 6 tools * 5 daily generations + slack for revisions

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request format." }, 400);
  }

  const tool = String(body.tool || "").trim().toLowerCase();
  const rating = String(body.rating || "").trim().toLowerCase();
  const comment = String(body.comment || "").trim().slice(0, MAX_COMMENT_LEN);

  if (!VALID_TOOLS.has(tool)) {
    return jsonResponse({ error: "Unknown tool." }, 400);
  }
  if (!VALID_RATINGS.has(rating)) {
    return jsonResponse({ error: "Rating must be 'up' or 'down'." }, 400);
  }

  if (!env.RATE_LIMITS) {
    return jsonResponse({ error: "Service is being configured. Try again shortly." }, 503);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const today = new Date().toISOString().slice(0, 10);
  const ipKey = "rate:feedback:" + today + ":" + ip;

  const ipCountStr = await env.RATE_LIMITS.get(ipKey);
  const ipCount = parseInt(ipCountStr || "0", 10);
  if (ipCount >= PER_IP_DAILY_LIMIT) {
    return jsonResponse({ error: "Too much feedback from your network today. Try again tomorrow." }, 429);
  }

  // Each piece of feedback gets its own key so we can list and aggregate.
  // Key encodes timestamp so prefix-listing is chronologically ordered.
  const ts = new Date().toISOString();
  const ipHashSuffix = await sha256Hex(ip).then(h => h.slice(0, 8));
  const fbKey = "feedback:" + tool + ":" + ts + ":" + ipHashSuffix;
  const entry = JSON.stringify({ tool, rating, comment: comment || null, ts });

  // 90-day retention so old feedback doesn't accumulate forever in KV
  await env.RATE_LIMITS.put(fbKey, entry, { expirationTtl: 60 * 60 * 24 * 90 });
  await env.RATE_LIMITS.put(ipKey, String(ipCount + 1), { expirationTtl: 172800 });

  return jsonResponse({ ok: true });
}

export async function onRequest() {
  return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
}

async function sha256Hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
