// Cloudflare Pages Function: POST /api/blurb
// Amazon book description writer. See ./_lib.js for shared plumbing.

import {
  jsonResponse,
  hashedIp,
  parseBodyOrFail,
  envGuard,
  rateCheck,
  bumpCounters,
  callClaude,
  methodNotAllowed,
  validateGenre,
} from "./_lib.js";

const SYSTEM_PROMPT = [
  "You are a copywriter who writes Amazon KDP book descriptions for indie authors. Given the author's plot details, produce a structured blurb plus a final ready-to-paste version.",
  "",
  "Strict rules:",
  "- Lead with a punchy hook line (under 18 words). Concrete, specific, never generic (\"a young woman discovers...\" is generic; \"On the morning her sister disappears...\" is concrete).",
  "- Setup must name the protagonist and situation in <=3 sentences. Stakes must be emotional + tangible. Cliffhanger ends on a question or reveal.",
  "- The final composed blurb should be 130-180 words. No markdown. No subheadings. Short paragraphs separated by single blank lines (Amazon respects line breaks but strips bold/italic).",
  "- Match the author's tone (literary, thriller-pacy, cozy, snarky) — do not impose a generic \"epic\" voice.",
  "- Never invent character names or plot points the author didn't supply.",
  "",
  "Format your response as markdown:",
  "",
  "## Hook",
  "[The opening line, in plain prose — not a quote]",
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
  "- Always preview the description on Amazon before publishing — line breaks render but bold/italic do not.",
  "- Lead with the hook line, end with the cliffhanger to drive the click-buy.",
].join("\n");

const TOOL = "blurb";
const MIN_DESC_LEN = 50;
const MAX_DESC_LEN = 2000;
const MAX_GENRE_LEN = 60;
const PER_IP_DAILY_LIMIT = 5;
const PER_TOOL_DAILY_LIMIT = 2000;

export async function onRequestPost(ctx) {
  const { request, env } = ctx;

  const parsed = await parseBodyOrFail(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  const description = String(body.description || "").trim();
  const genre = validateGenre(body.genre);

  if (description.length < MIN_DESC_LEN) {
    return jsonResponse({ error: "Please paste at least a couple of sentences (50+ characters) about your plot." }, 400);
  }
  if (description.length > MAX_DESC_LEN) {
    return jsonResponse({ error: `Plot details too long (max ${MAX_DESC_LEN} characters).` }, 400);
  }

  const envErr = envGuard(env);
  if (envErr) return envErr;

  const ipHash = await hashedIp(request);
  const rate = await rateCheck(env, TOOL, ipHash, PER_IP_DAILY_LIMIT, PER_TOOL_DAILY_LIMIT);
  if (rate.blocked) return rate.blocked;

  const userMsg = "Plot details:\n" + description + (genre ? "\n\nGenre: " + genre : "");

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
