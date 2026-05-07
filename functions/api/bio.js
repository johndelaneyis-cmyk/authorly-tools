// Cloudflare Pages Function: POST /api/bio
// Author bio generator. See ./_lib.js for shared plumbing.

import {
  jsonResponse,
  hashedIp,
  parseBodyOrFail,
  envGuard,
  rateCheck,
  bumpCounters,
  callClaude,
  methodNotAllowed,
} from "./_lib.js";

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
  "- Update the long bio whenever you launch a new book — readers Google your name and the About page is what they find.",
].join("\n");

const TOOL = "bio";
const MIN_FACTS_LEN = 30;
const MAX_FACTS_LEN = 1500;
const PER_IP_DAILY_LIMIT = 5;
const PER_TOOL_DAILY_LIMIT = 2000;

export async function onRequestPost(ctx) {
  const { request, env } = ctx;

  const parsed = await parseBodyOrFail(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  const facts = String(body.facts || "").trim();

  if (facts.length < MIN_FACTS_LEN) {
    return jsonResponse({ error: "Please share a few facts (30+ characters): name, what you write, location, anything relevant." }, 400);
  }
  if (facts.length > MAX_FACTS_LEN) {
    return jsonResponse({ error: `Facts too long (max ${MAX_FACTS_LEN} characters). A bio doesn't need a memoir.` }, 400);
  }

  const envErr = envGuard(env);
  if (envErr) return envErr;

  const ipHash = await hashedIp(request);
  const rate = await rateCheck(env, TOOL, ipHash, PER_IP_DAILY_LIMIT, PER_TOOL_DAILY_LIMIT);
  if (rate.blocked) return rate.blocked;

  const userMsg = "Author facts:\n" + facts;

  const claude = await callClaude(env, {
    system: SYSTEM_PROMPT,
    user: userMsg,
  });
  if (claude.error) return claude.error;

  bumpCounters(ctx, env, rate);

  return jsonResponse({
    text: claude.text,
    remaining: Math.max(0, PER_IP_DAILY_LIMIT - (rate.counts.ipCount + 1)),
  });
}

export async function onRequest() {
  return methodNotAllowed();
}
