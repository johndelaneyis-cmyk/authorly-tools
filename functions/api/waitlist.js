// Cloudflare Pages Function: POST /api/waitlist
// Email capture for the "Pro tier coming soon" callout. Stores entries in
// the existing RATE_LIMITS KV namespace under a `waitlist:` prefix to
// avoid requiring a new binding. Deduplicates by SHA-256 hash of the
// lowercased email. Per-IP submit cap to deter spam.

const MIN_EMAIL_LEN = 5;
const MAX_EMAIL_LEN = 254;
const PER_IP_DAILY_LIMIT = 3;
// RFC 5322 is brutal; this matches what Amazon and most sane validators accept.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request format." }, 400);
  }

  const email = String(body.email || "").trim().toLowerCase();

  if (email.length < MIN_EMAIL_LEN || email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return jsonResponse({ error: "That doesn't look like a valid email address." }, 400);
  }

  if (!env.RATE_LIMITS) {
    return jsonResponse({ error: "Service is being configured. Try again shortly." }, 503);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const today = new Date().toISOString().slice(0, 10);
  const ipKey = "rate:waitlist:" + today + ":" + ip;

  const ipCountStr = await env.RATE_LIMITS.get(ipKey);
  const ipCount = parseInt(ipCountStr || "0", 10);
  if (ipCount >= PER_IP_DAILY_LIMIT) {
    return jsonResponse({ error: "Too many submissions from your network today. Try again tomorrow." }
  // Global cap to deter coordinated signup campaigns
  const globalKey = "global:waitlist:" + today;
  const globalCountStr = await env.RATE_LIMITS.get(globalKey);
  const globalCount = parseInt(globalCountStr || "0", 10);
  if (globalCount >= 500) {
    return jsonResponse({ error: "We've had a great response today, please try again tomorrow." }, 503);
  }, 429);
  }

  // Dedupe by hash so we don't store the email in the key itself.
  const hash = await sha256Hex(email);
  const waitlistKey = "waitlist:" + hash;

  const existing = await env.RATE_LIMITS.get(waitlistKey);
  if (existing) {
    // Idempotent — same email getting added twice is fine, treat as success.
    return jsonResponse({ ok: true, alreadyOnList: true });
  }

  // Write the entry. Source defaults to "homepage"; clients may override
  // (e.g. specific tool pages later). Cap source length defensively.
  const source = String(body.source || "homepage").trim().slice(0, 40) || "homepage";
  const entry = JSON.stringify({ email, ts: new Date().toISOString(), source });

  await env.RATE_LIMITS.put(waitlistKey, entry);
  await env.RATE_LIMITS.put(ipKey, String(ipCount + 1), { expirationTtl: 172800 });
  await env.RATE_LIMITS.put(globalKey, String(globalCount + 1), { expirationTtl: 172800 });

  return jsonResponse({ ok: true, alreadyOnList: false });
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

