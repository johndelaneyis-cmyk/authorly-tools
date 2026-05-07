// Cloudflare Pages Function: POST /api/tropes
// Trope finder: takes a book description + optional genre, returns
// the searchable tropes in the plot ranked by reader-search appeal.
// Rate limits per-IP and globally via KV namespace RATE_LIMITS.

const SYSTEM_PROMPT = [
  "You are a trope analyst for indie authors on Amazon and TikTok. Given a book description, identify the tropes already present in the plot that readers actively search for, plus any low-cost additions the author could lean into.",
  "",
  "Strict rules:",
  "- Use real reader-vocabulary tropes (\"enemies to lovers\", \"morally grey antihero\", \"found family\", \"slow burn\", \"reluctant chosen one\", \"second chance\", \"forced proximity\", \"academic rivals\"). Skip vague labels like \"complex characters\" or \"emotional journey\".",
  "- Only list tropes the description actually supports. If the plot doesn't have enemies to lovers, do not list it.",
  "- Rank tropes by **reader-search appeal**: how often that exact phrase shows up in BookTok captions, Goodreads shelves, and Amazon search bars.",
  "- For each trope, give a one-line evidence snippet from the description and a one-line note on how to lean into it for marketing (cover, tagline, ads, BookTok hooks).",
  "- The \"adjacent\" section is for tropes the book is ONE small revision away from supporting — not random suggestions. Skip it if there are none.",
  "",
  "Format your response as markdown:",
  "",
  "## Tropes already in your plot",
  "1. **trope phrase** — Evidence: [phrase from description]. Lean in by: [tagline/cover/ad angle]",
  "2. **trope phrase** — Evidence: ...",
  "(continue with as many as the description supports, up to 6, ranked by search appeal)",
  "",
  "## Adjacent tropes worth considering",
  "- **trope phrase** — One-line revision that would unlock it",
  "(0-3 items, only if genuinely adjacent)",
  "",
  "## Where to use these",
  "- Amazon ad copy: \"For readers who love [trope X] and [trope Y]\"",
  "- BookTok caption hooks: pair the strongest trope with a 5-second visual",
  "- Back-cover blurb: name 2-3 tropes explicitly — readers shop by trope now",
  "",
  "Always test by searching the trope on Amazon and TikTok — if your book genuinely fits, the comparable books will be obvious."
].join("\n");

const MIN_DESC_LEN = 30;
const MAX_DESC_LEN = 2000;
const MAX_GENRE_LEN = 60;
const PER_IP_DAILY_LIMIT = 5;
const GLOBAL_DAILY_LIMIT = 2000;
const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function onRequestPost({ request, env }) {
    const cl = parseInt(request.headers.get("content-length") || "0", 10);
  if (Number.isFinite(cl) && cl > 10000) {
    return jsonResponse({ error: "Request body too large." }, 413);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request format." }, 400);
  }

  const description = String(body.description || "").trim();
  const genre = String(body.genre || "").trim().slice(0, MAX_GENRE_LEN);

  if (description.length < MIN_DESC_LEN) {
    return jsonResponse({ error: "Please paste at least a paragraph (30+ characters) describing your book." }, 400);
  }
  if (description.length > MAX_DESC_LEN) {
    return jsonResponse({ error: "Description too long (max " + MAX_DESC_LEN + " characters)." }, 400);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: "Service is being configured. Try again in a few minutes." }, 503);
  }
  if (!env.RATE_LIMITS) {
    return jsonResponse({ error: "Service is being configured (rate limiter not bound). Try again shortly." }, 503);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const today = new Date().toISOString().slice(0, 10);
  const ipKey = "rate:tropes:" + today + ":" + ip;
  const globalKey = "global:tropes:" + today;

  const ipCountStr = await env.RATE_LIMITS.get(ipKey);
  const ipCount = parseUint(ipCountStr);
  if (ipCount >= PER_IP_DAILY_LIMIT) {
    return jsonResponse({
      error: "Daily free limit reached (" + PER_IP_DAILY_LIMIT + " trope searches per visitor). Come back tomorrow.",
      remaining: 0
    }, 429);
  }

  const globalCountStr = await env.RATE_LIMITS.get(globalKey);
  const globalCount = parseUint(globalCountStr);
  if (globalCount >= GLOBAL_DAILY_LIMIT) {
    return jsonResponse({ error: "Service temporarily unavailable (daily capacity reached). Try again tomorrow." }, 503);
  }

  const userMsg = "Book description:\n" + description + (genre ? "\n\nGenre: " + genre : "");

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
    let type = "";
    try {
      const errBody = await anthropicRes.json();
      type = (errBody.error && errBody.error.type) || "";
    } catch {}
    let msg = "AI service is having issues. Try again.";
    if (type === "rate_limit_error") msg = "AI service is busy � try again in a minute.";
    else if (type === "invalid_request_error") msg = "AI service rejected the request � try simpler input.";
    else if (type === "overloaded_error") msg = "AI service is temporarily overloaded � try again in a minute.";
    return jsonResponse({ error: msg }, 502);
  }

  const anthropicData = await anthropicRes.json();
  const text = (anthropicData.content && anthropicData.content[0] && anthropicData.content[0].text) || "";

  if (!text) {
    return jsonResponse({ error: "AI returned an empty response. Try a more detailed description." }, 502);
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

function parseUint(s) {
  const n = parseInt(s || "0", 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
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




