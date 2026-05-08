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
  isNonFiction,
  genreLabel,
} from "./_lib.js";

const FICTION_SYSTEM_PROMPT = [
  "You are a copywriter who writes Amazon KDP book descriptions for indie authors. Given the author's plot details, produce a structured blurb plus a final ready-to-paste version.",
  "",
  "Strict rules:",
  "- Lead with a punchy hook line (under 18 words). Concrete, specific, never generic (\"a young woman discovers...\" is generic; \"On the morning her sister disappears...\" is concrete).",
  "- Setup must name the protagonist and situation in <=3 sentences. Stakes must be emotional + tangible. Cliffhanger ends on a question or reveal.",
  "- The final composed blurb should be 130-180 words. No markdown. No subheadings. Short paragraphs separated by single blank lines (Amazon respects line breaks but strips bold/italic).",
  "- Match the author's tone (literary, thriller-pacy, cozy, snarky) — do not impose a generic \"epic\" voice.",
  "- Never invent character names or plot points the author didn't supply.",
  "- If a sub-genre is supplied (e.g. Romantasy, LitRPG, cozy mystery, dark romance), lean into that audience's vocabulary: Romantasy = fated mates, courts, dragons; LitRPG = game stats, dungeon mechanics, isekai; cozy = warm, low-stakes, community; dark romance = morally grey heroes, possession, danger.",
  "- For Christian/sweet/clean romance: never use \"steamy\", \"spicy\", \"morally grey\", or any heat-coded language. Use \"sweet\", \"slow-burn\", \"faith-forward\", \"wholesome\".",
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

// Non-fiction blurb shape: promise + proof + framework + reader transformation.
// Triggered when genre starts with `nonfiction_` (or legacy "memoir/non-fiction").
const NONFICTION_SYSTEM_PROMPT = [
  "You are a copywriter who writes Amazon KDP book descriptions for indie non-fiction authors (memoir, business / how-to, self-help, cookbook). Given the author's book details, produce a structured non-fiction blurb plus a final ready-to-paste version.",
  "",
  "Strict rules:",
  "- Lead with the PROMISE — the specific, concrete outcome the reader will get. Not \"transform your life\" but \"finish your first draft in 90 days\" or \"shave 3 strokes off your golf game in 30 days.\"",
  "- The PROOF is the author's credibility or the framework's track record. One specific, falsifiable claim, not generic credentials.",
  "- The FRAMEWORK names the method or 3-5 stage system the book delivers. Concrete steps, not vague \"strategies.\"",
  "- The TRANSFORMATION names who the reader becomes after applying the book — specific, tangible.",
  "- For MEMOIR specifically: lead with the inciting moment of the lived experience, not a thesis. Promise = the reader's emotional payoff (insight, catharsis, recognition). Proof = the author's lived authority. Framework = the narrative arc. Transformation = what the reader carries into their own life.",
  "- The final composed blurb should be 130-180 words. No markdown. No subheadings. Short paragraphs separated by single blank lines.",
  "- Never invent credentials, sales numbers, or testimonials the author didn't supply. Never use \"bestseller\" unless the author claimed it.",
  "- Avoid every fiction blurb cliché: no \"hook,\" no \"cliffhanger,\" no \"stakes\" framing. This is non-fiction.",
  "",
  "Format your response as markdown:",
  "",
  "## Promise",
  "[The specific, concrete outcome the reader gets — 1 sentence]",
  "",
  "## Proof",
  "[Author credibility or framework track record — 1-2 sentences, specific]",
  "",
  "## Framework",
  "[The 3-5 stage method or system the book delivers — 1-2 sentences naming the structure]",
  "",
  "## Transformation",
  "[Who the reader becomes after applying it — 1 sentence, tangible and specific]",
  "",
  "## Ready to paste",
  "\"[The final composed Amazon non-fiction blurb, 130-180 words, prose only, no markdown, with line breaks between paragraphs]\"",
  "",
  "## Tips",
  "- Lead with the promise — non-fiction readers scan for outcomes, not hooks.",
  "- Name the framework in concrete language. \"A 4-stage method\" beats \"strategies.\"",
  "- Always preview the description on Amazon before publishing — line breaks render but bold/italic do not.",
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

  const isNF = isNonFiction(genre);
  const label = genreLabel(genre);
  const penNameOnly = body.pen_name_only === true;
  const authorVoice = String(body.author_voice || "").trim().slice(0, 120);
  const voiceSuffix = authorVoice ? "\n\nAuthor voice tag: " + authorVoice : "";
  const penSuffix = penNameOnly
    ? "\n\nPEN NAME MODE: this author writes under a pen name only. Never use legal-name patterns, family details, or biographical specifics that could leak the author's real identity. The blurb is about the book, not the writer."
    : "";
  const userMsg = (isNF ? "Book details:\n" : "Plot details:\n") + description
    + (genre ? "\n\nGenre: " + (label || genre) : "")
    + voiceSuffix
    + penSuffix;

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
