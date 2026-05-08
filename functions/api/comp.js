// Cloudflare Pages Function: POST /api/comp
// Comp title finder. See ./_lib.js for shared rate-limit / Anthropic plumbing.

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
  validateCulturalAnchor,
  culturalAnchorLabel,
} from "./_lib.js";

const FICTION_SYSTEM_PROMPT = [
  "You are a literary scout for indie authors using Amazon KDP. Given a book description, suggest 5 published comp titles that share specific concrete elements - subgenre, tropes, tone, pacing, setting, target reader.",
  "",
  "Strict rules:",
  "- Only suggest books published 2015 or later (older books dilute Amazon algorithm signal)",
  "- Prefer mid-list and recent breakouts (5K-500K Goodreads ratings); avoid mega-bestsellers (1M+ ratings) unless directly subgenre-relevant",
  "- Never invent a book - if you are not confident a title and author are real, omit it. Five strong is better than seven shaky.",
  "- Each \"why\" must name 2+ specific overlapping elements (tropes, setting, tone, structure) - never generic phrases like \"fans of\" or \"perfect for\"",
  "- When a sub-genre is named (Romantasy, LitRPG, dark romance, cozy mystery, etc.), prioritize comps that explicitly belong to that sub-genre's bookshelf — not adjacent or merely tonally similar.",
  "",
  "Format your response as markdown:",
  "",
  "## 5 comp titles",
  "1. **Title** by Author (Year) - Why: [2+ specific overlaps]",
  "2. **Title** by Author (Year) - Why: [2+ specific overlaps]",
  "3. **Title** by Author (Year) - Why: [2+ specific overlaps]",
  "4. **Title** by Author (Year) - Why: [2+ specific overlaps]",
  "5. **Title** by Author (Year) - Why: [2+ specific overlaps]",
  "",
  "IMPORTANT: do NOT put blank lines between the numbered items - they must be on consecutive lines.",
  "",
  "## Use these in",
  "- Amazon book description: \"for readers who loved X and Y\"",
  "- Amazon Ads: paste author names into the Authors targeting field",
  "- Query letters and back-cover copy",
  "",
  "Always verify titles on Amazon before publishing - AI can get details wrong.",
].join("\n");

// Non-fiction comp finder: positioning-style comps, not vibes-comps.
// Lean toward Atomic Habits / Deep Work / Range / Range-style category positioning.
const NONFICTION_SYSTEM_PROMPT = [
  "You are a positioning scout for indie non-fiction authors using Amazon KDP (memoir, business / how-to, self-help, cookbook). Given a book description, suggest 5 published comp titles that share POSITIONING — same reader, same shelf, same outcome promise — not just topic.",
  "",
  "Strict rules:",
  "- Only suggest books published 2015 or later, unless a foundational text is the actual positioning anchor (Atomic Habits, Deep Work, Mindset, Bird by Bird, etc.) — those may pre-date 2015 if they're the genuine peer.",
  "- Prefer mid-list and recent breakouts (5K-500K Goodreads ratings) plus 1-2 category-defining anchors when relevant. Avoid generic mega-bestsellers (How to Win Friends, Think and Grow Rich) unless directly category-defining.",
  "- Never invent a book. If you are not confident a title and author are real, omit it.",
  "- Each \"why\" must name 2+ specific overlapping elements: outcome promise, framework shape, audience archetype, tone (memoir-driven vs prescriptive vs research-led), category positioning.",
  "- For MEMOIR: comps must share narrative arc (recovery, reckoning, second-act, immigrant, survivor) AND tone (literary, conversational, journalistic).",
  "- Never suggest fiction comps for non-fiction books.",
  "",
  "Format your response as markdown:",
  "",
  "## 5 comp titles",
  "1. **Title** by Author (Year) - Why: [2+ specific positioning overlaps]",
  "2. **Title** by Author (Year) - Why: [2+ specific positioning overlaps]",
  "3. **Title** by Author (Year) - Why: [2+ specific positioning overlaps]",
  "4. **Title** by Author (Year) - Why: [2+ specific positioning overlaps]",
  "5. **Title** by Author (Year) - Why: [2+ specific positioning overlaps]",
  "",
  "IMPORTANT: do NOT put blank lines between the numbered items - they must be on consecutive lines.",
  "",
  "## Use these in",
  "- Amazon book description: \"for readers of X and Y\" (positioning, not just topic)",
  "- Amazon Ads: paste author names into the Authors targeting field",
  "- Subtitle and back-cover positioning",
  "",
  "Always verify titles on Amazon before publishing - AI can get details wrong.",
].join("\n");

const TOOL = "comp";
const MIN_DESC_LEN = 30;
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
  const culturalAnchor = validateCulturalAnchor(body.cultural_anchor);

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
  const anchorLabel = culturalAnchorLabel(culturalAnchor);
  const culturalDirective = anchorLabel
    ? "\n\nCULTURAL ANCHOR: prioritize comps from this market — " + anchorLabel
      + ". The first 3 comps MUST be from this market; the next 2 may be cross-market for breadth. Choose authors whose books readers in this audience actually buy and shelve together."
    : "";
  const userMsg = "Book description:\n" + description
    + (genre ? "\n\nGenre: " + (label || genre) : "")
    + culturalDirective;

  const claude = await callClaude(env, {
    system: isNF ? NONFICTION_SYSTEM_PROMPT : FICTION_SYSTEM_PROMPT,
    user: userMsg,
    temperature: 0.5,
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
