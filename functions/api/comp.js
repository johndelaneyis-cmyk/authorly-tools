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
} from "./_lib.js";

const SYSTEM_PROMPT = [
  "You are a literary scout for indie authors using Amazon KDP. Given a book description, suggest 5 published comp titles that share specific concrete elements - subgenre, tropes, tone, pacing, setting, target reader.",
  "",
  "Strict rules:",
  "- Only suggest books published 2015 or later (older books dilute Amazon algorithm signal)",
  "- Prefer mid-list and recent breakouts (5K-500K Goodreads ratings); avoid mega-bestsellers (1M+ ratings) unless directly subgenre-relevant",
  "- Never invent a book - if you are not confident a title and author are real, omit it. Five strong is better than seven shaky.",
  "- Each \"why\" must name 2+ specific overlapping elements (tropes, setting, tone, structure) - never generic phrases like \"fans of\" or \"perfect for\"",
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
  const genre = String(body.genre || "").trim().slice(0, MAX_GENRE_LEN);

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

  const userMsg = "Book description:\n" + description + (genre ? "\n\nGenre: " + genre : "");

  const claude = await callClaude(env, {
    system: SYSTEM_PROMPT,
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
