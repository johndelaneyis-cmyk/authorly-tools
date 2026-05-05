// Cloudflare Pages Function: POST /api/keywords
// KDP keyword expander: takes a seed keyword/phrase + optional genre,
// returns 10 expanded keywords plus a curated 7-slot KDP backend list.
// Rate limits per-IP and globally via KV namespace RATE_LIMITS, keyed
// separately from comp/blurb.

const SYSTEM_PROMPT = [
  "You are a KDP keyword strategist for indie authors. Given a seed keyword and optional genre, return 10 keyword phrases real readers actually search on Amazon, plus a curated 7 for the KDP backend slots.",
  "",
  "Strict rules:",
  "- Each phrase MUST fit Amazon's 50-character per-slot limit.",
  "- Mix head terms (high volume, more competition) with long-tail (lower volume, easier to rank). Avoid filler keywords like \"book\" or \"novel\" — Amazon strips those.",
  "- Use real reader vocabulary: tropes (\"enemies to lovers\", \"morally grey\"), settings (\"small town\", \"academia\"), audience markers (\"for fans of\", \"clean\"), tone signals (\"slow burn\", \"steamy\").",
  "- Never include mega-bestseller author names (Colleen Hoover, Sarah J. Maas) or brand-name comps — Amazon flags these.",
  "- Never include \"book\", \"novel\", \"kindle\", \"ebook\", \"bestseller\", or punctuation that doesn't match real searches.",
  "",
  "Format your response as markdown:",
  "",
  "## 10 keyword phrases",
  "1. **phrase** (NN/50) — type: trope | subgenre | audience | setting | tone",
  "2. **phrase** (NN/50) — type: ...",
  "(continue through 10. Number in parentheses is character count.)",
  "",
  "## Top 7 for your KDP backend slots",
  "- **phrase 1** — covers: [audience/trope/etc.]",
  "- **phrase 2** — covers: ...",
  "- **phrase 3** — covers: ...",
  "- **phrase 4** — covers: ...",
  "- **phrase 5** — covers: ...",
  "- **phrase 6** — covers: ...",
  "- **phrase 7** — covers: ...",
  "",
  "## Don't use these",
  "- One or two specific traps the author might be tempted by (mega-bestseller author names, generic terms Amazon strips, etc.)",
  "",
  "Always test a phrase by searching it on Amazon — if the first page of results doesn't match your book, swap it."
].join("\n");

const MIN_SEED_LEN = 2;
const MAX_SEED_LEN = 80;
const MAX_GENRE_LEN = 60;
const PER_IP_DAILY_LIMIT = 5;
const GLOBAL_DAILY_LIMIT = 2000;
const DEFAULT_MODEL = "claude-sonnet-4-5";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request format." }, 400);
  }

  const seed = String(body.seed || "").trim();
  const genre = String(body.genre || "").trim().slice(0, MAX_GENRE_LEN);

  if (seed.length < MIN_SEED_LEN) {
    return jsonResponse({ error: "Please enter a seed keyword (a word or short phrase)." }, 400);
  }
  if (seed.length > MAX_SEED_LEN) {
    return jsonResponse({ error: "Seed too long (max " + MAX_SEED_LEN + " characters)." }, 400);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: "Service is being configured. Try again in a few minutes." }, 503);
  }
  if (!env.RATE_LIMITS) {
    return jsonResponse({ error: "Service is being configured (rate limiter not bound). Try again shortly." }, 503);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const today = new Date().toISOString().slice(0, 10);
  const ipKey = "rate:keywords:" + today + ":" + ip;
  const globalKey = "global:keywords:" + today;

  const ipCountStr = await env.RATE_LIMITS.get(ipKey);
  const ipCount = parseInt(ipCountStr || "0", 10);
  if (ipCount >= PER_IP_DAILY_LIMIT) {
    return jsonResponse({
      error: "Daily free limit reached (" + PER_IP_DAILY_LIMIT + " keyword expansions per visitor). Come back tomorrow.",
      remaining: 0
    }, 429);
  }

  const globalCountStr = await env.RATE_LIMITS.get(globalKey);
  const globalCount = parseInt(globalCountStr || "0", 10);
  if (globalCount >= GLOBAL_DAILY_LIMIT) {
    return jsonResponse({ error: "Service temporarily unavailable (daily capacity reached). Try again tomorrow." }, 503);
  }

  const userMsg = "Seed keyword: " + seed + (genre ? "\nGenre: " + genre : "");

  let anthropicRes;
  try {
    anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }]
      })
    });
  } catch {
    return jsonResponse({ error: "Could not reach AI service. Try again." }, 502);
  }

  if (!anthropicRes.ok) {
    let detail = "";
    try {
      const errBody = await anthropicRes.json();
      detail = (errBody.error && errBody.error.message) || "";
    } catch {}
    return jsonResponse({
      error: "AI service returned an error. Please try again." + (detail ? " (" + detail.substring(0, 120) + ")" : "")
    }, 502);
  }

  const anthropicData = await anthropicRes.json();
  const text = (anthropicData.content && anthropicData.content[0] && anthropicData.content[0].text) || "";

  if (!text) {
    return jsonResponse({ error: "AI returned an empty response. Try a more specific seed." }, 502);
  }

  const newIpCount = ipCount + 1;
  const newGlobalCount = globalCount + 1;
  await env.RATE_LIMITS.put(ipKey, String(newIpCount), { expirationTtl: 172800 });
  await env.RATE_LIMITS.put(globalKey, String(newGlobalCount), { expirationTtl: 172800 });

  return jsonResponse({
    text: text,
    remaining: Math.max(0, PER_IP_DAILY_LIMIT - newIpCount)
  });
}

export async function onRequest() {
  return jsonResponse({ error: "Method not allowed. Use POST." }, 405);
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
