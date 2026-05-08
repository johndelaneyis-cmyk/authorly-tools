// Cloudflare Pages Function: POST /api/ads
// Amazon Ads headline generator. See ./_lib.js for shared plumbing.

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
  isNonFiction,
  genreLabel,
} from "./_lib.js";

const FICTION_SYSTEM_PROMPT = [
  "You are an Amazon Ads copywriter for indie authors. Given a book title, description, and optional comp titles or genre, produce 6 ad headlines for Sponsored Products / Sponsored Brands. Three for the standard 150-char Custom Text, three short ones for 80-char placements.",
  "",
  "Strict rules:",
  "- The 150-char headlines MUST be 100-150 characters (Amazon truncates above 150 and pads-looking copy below 100 underperforms).",
  "- The 80-char short headlines MUST be 60-80 characters.",
  "- Lead with the strongest hook (trope, comp signal, or emotional payoff). Avoid generic openers like \"In this gripping...\" or \"A new novel about...\".",
  "- Use sentence case or title case consistently — do not write in ALL CAPS, Amazon flags it.",
  "- Never use trademarked author names (Colleen Hoover, Sarah J. Maas) directly. \"For fans of [comp]\" only with the actual comps the author supplied; never invent comps.",
  "- No exclamation points stacking, no curly quotes (Amazon Ads creative form sometimes mangles them). Plain straight quotes only.",
  "- Tune to sub-genre when supplied. Romantasy / dark / paranormal: lean into trope-naming. LitRPG: name the game-mechanic hook. Cozy: warmth + light stakes. Christian/clean: never use \"steamy\", \"spicy\", or heat-coded words; use \"sweet\", \"slow-burn\", \"faith-forward\".",
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
  "- Headlines that name a specific trope (\"enemies to lovers\") often outperform generic emotional pitches in 2025.",
].join("\n");

// Non-fiction Amazon Ads: outcome-focused, not curiosity-focused.
const NONFICTION_SYSTEM_PROMPT = [
  "You are an Amazon Ads copywriter for indie non-fiction authors (memoir, business / how-to, self-help, cookbook). Given a book title, description, and optional comp titles or sub-genre, produce 6 ad headlines for Sponsored Products / Sponsored Brands. Three for the standard 150-char Custom Text, three short ones for 80-char placements.",
  "",
  "Strict rules:",
  "- The 150-char headlines MUST be 100-150 characters. The 80-char short headlines MUST be 60-80 characters.",
  "- Lead with the OUTCOME or PROMISE, not curiosity hooks. Non-fiction readers click ads that name a specific result (\"finish your first draft in 90 days\", \"shave 5 strokes off your golf game\") not literary teasers.",
  "- For memoir: lead with the lived-experience marker (second-act, recovery, reckoning) + emotional payoff for the reader.",
  "- Never use fiction-style hooks (\"In this gripping...\", \"A novel about...\", \"For fans of [fiction trope]\").",
  "- Use sentence case or title case consistently — do not write in ALL CAPS, Amazon flags it.",
  "- Never use trademarked author names. Comp pairings only when the author supplied real non-fiction comps.",
  "- No exclamation points stacking, no curly quotes. Plain straight quotes only.",
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
  "- One short paragraph naming the angle each variant tries (outcome, framework, audience, comp).",
  "",
  "## Tips",
  "- Always test 2-3 headlines simultaneously in Amazon Ads — performance is unpredictable until you have 5,000+ impressions.",
  "- Outcome-named headlines (\"build a 7-figure agency in 24 months\") consistently outperform curiosity-driven non-fiction headlines.",
].join("\n");

const TOOL = "ads";
const MIN_TITLE_LEN = 1;
const MAX_TITLE_LEN = 200;
const MIN_DESC_LEN = 30;
const MAX_DESC_LEN = 2000;
const MAX_COMPS_LEN = 200;
const MAX_GENRE_LEN = 60;
const PER_IP_DAILY_LIMIT = 5;
const PER_TOOL_DAILY_LIMIT = 2000;

export async function onRequestPost(ctx) {
  const { request, env } = ctx;

  const parsed = await parseBodyOrFail(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  const title = String(body.title || "").trim().slice(0, MAX_TITLE_LEN);
  const description = String(body.description || "").trim();
  const comps = String(body.comps || "").trim().slice(0, MAX_COMPS_LEN);
  const genre = validateGenre(body.genre);

  if (title.length < MIN_TITLE_LEN) {
    return jsonResponse({ error: "Please enter your book title." }, 400);
  }
  if (description.length < MIN_DESC_LEN) {
    return jsonResponse({ error: "Please paste at least a paragraph (30+ characters) describing your book." }, 400);
  }
  if (description.length > MAX_DESC_LEN) {
    return jsonResponse({ error: `Description too long (max ${MAX_DESC_LEN} characters).` }, 400);
  }

  const envErr = envGuard(env);
  if (envErr) return envErr;

  const ipHash = await hashedIp(request);
  const rate = await rateCheck(env, TOOL, ipHash, PER_IP_DAILY_LIMIT, PER_TOOL_DAILY_LIMIT);
  if (rate.blocked) return rate.blocked;

  const isNF = isNonFiction(genre);
  const label = genreLabel(genre);
  const authorVoice = String(body.author_voice || "").trim().slice(0, 120);
  const userMsg = `Title: ${title}

Description:
${description}`
    + (comps ? `\n\nComp titles: ${comps}` : "")
    + (genre ? `\n\nGenre: ${label || genre}` : "")
    + (authorVoice ? `\n\nAuthor voice tag: ${authorVoice}` : "");

  const claude = await callClaude(env, {
    system: isNF ? NONFICTION_SYSTEM_PROMPT : FICTION_SYSTEM_PROMPT,
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
