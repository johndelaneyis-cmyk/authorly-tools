// Cloudflare Pages Function: POST /api/ads
// Amazon Ads headline generator: takes a book title + description (and
// optional comp titles + genre) and returns ad headlines sized to
// Amazon's 150-character creative limit, plus shorter alternates.
// Rate limits per-IP and globally via KV namespace RATE_LIMITS.

const SYSTEM_PROMPT = [
  "You are an Amazon Ads copywriter for indie authors. Given a book title, description, and optional comp titles or genre, produce 6 ad headlines for Sponsored Products / Sponsored Brands. Three for the standard 150-char Custom Text, three short ones for 80-char placements.",
  "",
  "Strict rules:",
  "- The 150-char headlines MUST be 100-150 characters (Amazon truncates above 150 and pads-looking copy below 100 underperforms).",
  "- The 80-char short headlines MUST be 60-80 characters.",
  "- Lead with the strongest hook (trope, comp signal, or emotional payoff). Avoid generic openers like \"In this gripping...\" or \"A new novel about...\".",
  "- Use sentence case or title case consistently — do not write in ALL CAPS, Amazon flags it.",
  "- Never use trademarked author names (Colleen Hoover, Sarah J. Maas) directly. \"For fans of [comp]\" only with the actual comps the author supplied; never invent comps.",
  "- No exclamation points stacking, no curly quotes (Amazon Ads creative form sometimes mangles them). Plain straight quotes only.",
  "",
  "Format your response as markdown:",
  "",
  "## Standard headlines (100–150 chars)",
  "1. \"[headline]\" (NN/150)",
  "2. \"[headline]\" (NN/150)",
  "3. \"[headline]\" (NN/150)",
  "",
  "## Short headlines (60–80 chars)",
  "1. \"[headline]\" (NN/80)",
  "2. \"[headline]\" (NN/80)",
  "3. \"[headline]\" (NN/80)",
  "",
  "## Why these work",
  "- One short paragraph naming the angle each variant tries (trope, comp, emotional, audience).",
  "",
  "## Tips",
  "- Always test 2-3 headlines simultaneously in Amazon Ads — performance is unpredictable until you have 5,000+ impressions.",
  "- Headlines that name a specific trope (\"enemies to lovers\") often outperform generic emotional pitches in 2025."
].join("\n");

const MIN_DESC_LEN = 30;
const MAX_DESC_LEN = 2000;
const MAX_TITLE_LEN = 200;
const MAX_GENRE_LEN = 60;
const MAX_COMPS_LEN = 200;
const PER_IP_DAILY_LIMIT = 5;
const GLOBAL_DAILY_LIMIT = 2000;
const DEFAULT_MODEL = "claude-sonnet-4-6";

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request format." }, 400);
  }

  const title = String(body.title || "").trim().slice(0, MAX_TITLE_LEN);
  const description = String(body.description || "").trim();
  const comps = String(body.comps || "").trim().slice(0, MAX_COMPS_LEN);
  const genre = String(body.genre || "").trim().slice(0, MAX_GENRE_LEN);

  if (!title) {
    return jsonResponse({ error: "Please enter your book title." }, 400);
  }
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
  const ipKey = "rate:ads:" + today + ":" + ip;
  const globalKey = "global:ads:" + today;

  const ipCountStr = await env.RATE_LIMITS.get(ipKey);
  const ipCount = parseInt(ipCountStr || "0", 10);
  if (ipCount >= PER_IP_DAILY_LIMIT) {
    return jsonResponse({
      error: "Daily free limit reached (" + PER_IP_DAILY_LIMIT + " ad-headline sets per visitor). Come back tomorrow.",
      remaining: 0
    }, 429);
  }

  const globalCountStr = await env.RATE_LIMITS.get(globalKey);
  const globalCount = parseInt(globalCountStr || "0", 10);
  if (globalCount >= GLOBAL_DAILY_LIMIT) {
    return jsonResponse({ error: "Service temporarily unavailable (daily capacity reached). Try again tomorrow." }, 503);
  }

  const userMsg = "Title: " + title + "\n\nDescription:\n" + description + (comps ? "\n\nComp titles: " + comps : "") + (genre ? "\n\nGenre: " + genre : "");

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

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

