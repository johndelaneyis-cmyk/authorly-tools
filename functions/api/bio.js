// Cloudflare Pages Function: POST /api/bio
// Author bio generator: takes a few facts about the author and returns
// three bio variants (short, medium, long) sized for KDP, social, and
// query-letter use. Rate limits per-IP and globally via KV namespace
// RATE_LIMITS.

const SYSTEM_PROMPT = [
  "You are a copywriter who writes author bios for indie authors. Given a few facts (name, what they write, location, relevant background, any books published), produce three bio variants sized for different surfaces.",
  "",
  "Strict rules:",
  "- Always write in third person. (\"Marina Whelan writes...\", not \"I write...\")",
  "- Open with a strong verb-led sentence. Avoid \"is the author of\" as the very first phrase — it's the most overused indie-author opener.",
  "- Never invent biographical facts. If the author didn't say they have a cat, don't put a cat in the bio. Working with only the facts supplied is non-negotiable.",
  "- Short bio (Twitter / Goodreads / IG): 150-200 chars. Punchy, one personality detail.",
  "- Medium bio (KDP author page / book back cover): 60-90 words. Adds one credential or location color.",
  "- Long bio (query letter / press kit / About page): 130-170 words. Includes background, books, one warm personality line.",
  "- End the long bio with a soft personal hook (lives in/loves X), never with \"...is currently working on her next novel\" — too generic.",
  "",
  "Format your response as markdown:",
  "",
  "## Short bio (150-200 chars)",
  "[bio text — plain prose, no markdown, no quotes]",
  "",
  "## Medium bio (60-90 words)",
  "[bio text]",
  "",
  "## Long bio (130-170 words)",
  "[bio text]",
  "",
  "## Tips",
  "- Use the medium bio for your KDP author page; the platform truncates the long version on mobile.",
  "- Update the long bio whenever you launch a new book — readers Google your name and the About page is what they find."
].join("\n");

const MIN_FACTS_LEN = 30;
const MAX_FACTS_LEN = 1500;
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

  const facts = String(body.facts || "").trim();

  if (facts.length < MIN_FACTS_LEN) {
    return jsonResponse({ error: "Please share a few facts (30+ characters): name, what you write, location, anything relevant." }, 400);
  }
  if (facts.length > MAX_FACTS_LEN) {
    return jsonResponse({ error: "Facts too long (max " + MAX_FACTS_LEN + " characters). A bio doesn't need a memoir." }, 400);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: "Service is being configured. Try again in a few minutes." }, 503);
  }
  if (!env.RATE_LIMITS) {
    return jsonResponse({ error: "Service is being configured (rate limiter not bound). Try again shortly." }, 503);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const today = new Date().toISOString().slice(0, 10);
  const ipKey = "rate:bio:" + today + ":" + ip;
  const globalKey = "global:bio:" + today;

  const ipCountStr = await env.RATE_LIMITS.get(ipKey);
  const ipCount = parseInt(ipCountStr || "0", 10);
  if (ipCount >= PER_IP_DAILY_LIMIT) {
    return jsonResponse({
      error: "Daily free limit reached (" + PER_IP_DAILY_LIMIT + " bios per visitor). Come back tomorrow.",
      remaining: 0
    }, 429);
  }

  const globalCountStr = await env.RATE_LIMITS.get(globalKey);
  const globalCount = parseInt(globalCountStr || "0", 10);
  if (globalCount >= GLOBAL_DAILY_LIMIT) {
    return jsonResponse({ error: "Service temporarily unavailable (daily capacity reached). Try again tomorrow." }, 503);
  }

  const userMsg = "Author facts:\n" + facts;

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
    return jsonResponse({ error: "AI returned an empty response. Try giving more concrete facts." }, 502);
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
