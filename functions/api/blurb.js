// Cloudflare Pages Function: POST /api/blurb
// Generates an Amazon book description (blurb) from plot details.
// Calls Anthropic Claude API server-side using Worker secret ANTHROPIC_API_KEY.
// Rate limits per-IP and globally via KV namespace RATE_LIMITS, keyed separately
// from the comp finder so a visitor gets their own quota for each tool.

const SYSTEM_PROMPT = [
  "You are a copywriter who writes Amazon KDP book descriptions for indie authors. Given the author's plot details, produce a structured blurb plus a final ready-to-paste version.",
  "",
  "Strict rules:",
  "- Lead with a punchy hook line (under 18 words). Concrete, specific, never generic (\"a young woman discovers...\" is generic; \"On the morning her sister disappears...\" is concrete).",
  "- Setup must name the protagonist and situation in <=3 sentences. Stakes must be emotional + tangible. Cliffhanger ends on a question or reveal.",
  "- The final composed blurb should be 130-180 words. No markdown. No subheadings. Short paragraphs separated by single blank lines (Amazon respects line breaks but strips bold/italic).",
  "- Match the author's tone (literary, thriller-pacy, cozy, snarky) â€” do not impose a generic \"epic\" voice.",
  "- Never invent character names or plot points the author didn't supply.",
  "",
  "Format your response as markdown:",
  "",
  "## Hook",
  "[The opening line, in plain prose â€” not a quote]",
  "",
  "## Setup",
  "[2-3 sentences introducing protagonist + world + inciting incident]",
  "",
  "## Stakes",
  "[1-2 sentences on what the protagonist stands to lose, and why it matters emotionally]",
  "",
  "## Cliffhanger",
  "[1 sentence that ends on a question or reveal that drives the buy]",
  "",
  "## Ready to paste",
  "\"[The final composed Amazon blurb, 130-180 words, prose only, no markdown, with line breaks between paragraphs]\"",
  "",
  "## Tips",
  "- Always preview the description on Amazon before publishing â€” line breaks render but bold/italic do not.",
  "- Lead with the hook line, end with the cliffhanger to drive the click-buy."
].join("\n");

const MIN_DESC_LEN = 50;
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
    return jsonResponse({ error: "Please paste at least a couple of sentences (50+ characters) about your plot." }, 400);
  }
  if (description.length > MAX_DESC_LEN) {
    return jsonResponse({ error: "Plot details too long (max " + MAX_DESC_LEN + " characters)." }, 400);
  }

  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: "Service is being configured. Try again in a few minutes." }, 503);
  }
  if (!env.RATE_LIMITS) {
    return jsonResponse({ error: "Service is being configured (rate limiter not bound). Try again shortly." }, 503);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const today = new Date().toISOString().slice(0, 10);
  // Separate prefix from comp finder so each tool has its own daily quota.
  const ipKey = "rate:blurb:" + today + ":" + ip;
  const globalKey = "global:blurb:" + today;

  const ipCountStr = await env.RATE_LIMITS.get(ipKey);
  const ipCount = parseUint(ipCountStr);
  if (ipCount >= PER_IP_DAILY_LIMIT) {
    return jsonResponse({
      error: "Daily free limit reached (" + PER_IP_DAILY_LIMIT + " blurbs per visitor). Come back tomorrow.",
      remaining: 0
    }, 429);
  }

  const globalCountStr = await env.RATE_LIMITS.get(globalKey);
  const globalCount = parseUint(globalCountStr);
  if (globalCount >= GLOBAL_DAILY_LIMIT) {
    return jsonResponse({ error: "Service temporarily unavailable (daily capacity reached). Try again tomorrow." }, 503);
  }

  const userMsg = "Plot details:\n" + description + (genre ? "\n\nGenre: " + genre : "");

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
    return jsonResponse({ error: "AI returned an empty response. Try a more detailed synopsis." }, 502);
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




