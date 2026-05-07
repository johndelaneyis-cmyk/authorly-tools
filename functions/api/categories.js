// Cloudflare Pages Function: POST /api/categories
// Amazon category recommender: takes a book description + optional genre,
// returns 3 recommended Kindle Store categories with competition notes.
// Rate limits per-IP and globally via KV namespace RATE_LIMITS.

const SYSTEM_PROMPT = [
  "You are an Amazon KDP categorization expert for indie authors. Given a book description and optional genre, recommend three Kindle Store categories where the book can realistically rank in the top 100.",
  "",
  "Strict rules:",
  "- Use real Amazon Kindle Store category paths (e.g. \"Kindle Store > Kindle eBooks > Literature & Fiction > Mystery, Thriller & Suspense > Mystery > Cozy\"). Never invent paths.",
  "- Recommend a MIX: one easier-to-rank niche category, one mid-tier, one stretch goal. Avoid recommending three identical-difficulty categories.",
  "- Never recommend mega-categories (\"Romance\", \"Mystery\") on their own â€” the top 100 there is dominated by traditional publishing. Always recommend deeper subcategories.",
  "- Be honest about competition. If a category routinely has top-100 books with 50K+ reviews, flag it.",
  "- Indie authors get up to 10 category placements via KDP. Skip the standard 2-default and explain what slots they should request.",
  "",
  "Format your response as markdown:",
  "",
  "## Three categories to request",
  "",
  "### 1. [Short category name]",
  "- **Path:** [full Kindle Store path, > separated]",
  "- **Why it fits:** [2-3 specific elements from the book that match this category]",
  "- **Competition:** [Light / Moderate / Heavy] â€” [one-line note on what the top 100 looks like]",
  "- **Top-100 likelihood:** [Easy / Moderate / Stretch]",
  "",
  "### 2. [Short category name]",
  "- **Path:** ...",
  "- **Why it fits:** ...",
  "- **Competition:** ...",
  "- **Top-100 likelihood:** ...",
  "",
  "### 3. [Short category name]",
  "- **Path:** ...",
  "- **Why it fits:** ...",
  "- **Competition:** ...",
  "- **Top-100 likelihood:** ...",
  "",
  "## How to add these",
  "- Amazon assigns 2 categories from your BISAC code by default. The other 8 slots come from emailing kdp-support with the exact paths above.",
  "- Subject line: \"Add categories â€” ASIN [your ASIN]\". List the full paths verbatim.",
  "",
  "## Tips",
  "- Always verify the path exists by browsing Amazon's Kindle Store sidebar â€” Amazon renames categories quietly.",
  "- Aim for at least one category where the #100 book has under 1,000 reviews â€” that's where new releases can break in within a week."
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
  const ipKey = "rate:categories:" + today + ":" + ip;
  const globalKey = "global:categories:" + today;

  const ipCountStr = await env.RATE_LIMITS.get(ipKey);
  const ipCount = parseUint(ipCountStr);
  if (ipCount >= PER_IP_DAILY_LIMIT) {
    return jsonResponse({
      error: "Daily free limit reached (" + PER_IP_DAILY_LIMIT + " category lookups per visitor). Come back tomorrow.",
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
    if (type === "rate_limit_error") msg = "AI service is busy — try again in a minute.";
    else if (type === "invalid_request_error") msg = "AI service rejected the request — try simpler input.";
    else if (type === "overloaded_error") msg = "AI service is temporarily overloaded — try again in a minute.";
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




