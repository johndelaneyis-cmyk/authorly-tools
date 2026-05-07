// Cloudflare Pages Function: POST /api/keywords
// KDP keyword strategist. See ./_lib.js for shared plumbing.

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
  "You are a KDP keyword strategist for indie authors. Given a seed keyword and optional genre, return 10 keyword phrases real readers actually search on Amazon, plus a curated 7 for the KDP backend slots.",
  "",
  "Strict rules:",
  "- Each phrase MUST fit Amazon's 50-character per-slot limit.",
  "- Mix head terms (high volume, more competition) with long-tail (lower volume, easier to rank). Avoid filler keywords like \"book\" or \"novel\" — Amazon strips those.",
  "- Use real reader vocabulary: tropes (\"enemies to lovers\", \"morally grey\"), settings (\"small town\", \"academia\"), audience markers (\"for fans of\", \"clean\"), tone signals (\"slow burn\", \"steamy\").",
  "- Never include mega-bestseller author names (Colleen Hoover, Sarah J. Maas) or brand-name comps — Amazon flags these.",
  "- Never include \"book\", \"novel\", \"kindle\", \"ebook\", \"bestseller\", or punctuation that doesn't match real searches.",
  "",
  "Format your response as markdown:",
  "",
  "## 10 keyword phrases",
  "1. **phrase** (NN/50) — type: trope | subgenre | audience | setting | tone",
  "2. **phrase** (NN/50) — type: ...",
  "(continue through 10. Number in parentheses is character count.)",
  "",
  "## Top 7 for your KDP backend slots",
  "- **phrase 1** — covers: [audience/trope/etc.]",
  "- **phrase 2** — covers: ...",
  "- **phrase 3** — covers: ...",
  "- **phrase 4** — covers: ...",
  "- **phrase 5** — covers: ...",
  "- **phrase 6** — covers: ...",
  "- **phrase 7** — covers: ...",
  "",
  "## Don't use these",
  "- One or two specific traps the author might be tempted by (mega-bestseller author names, generic terms Amazon strips, etc.)",
  "",
  "Always test a phrase by searching it on Amazon — if the first page of results doesn't match your book, swap it."
].join("\n");

const TOOL = "keywords";
const MIN_SEED_LEN = 2;
const MAX_SEED_LEN = 80;
const MAX_GENRE_LEN = 60;
const PER_IP_DAILY_LIMIT = 5;
const PER_TOOL_DAILY_LIMIT = 2000;

export async function onRequestPost(ctx) {
  const { request, env } = ctx;

  const parsed = await parseBodyOrFail(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  const seed = String(body.seed || "").trim();
  const genre = String(body.genre || "").trim().slice(0, MAX_GENRE_LEN);

  if (seed.length < MIN_SEED_LEN) {
    return jsonResponse({ error: "Please enter a seed keyword (a word or short phrase)." }, 400);
  }
  if (seed.length > MAX_SEED_LEN) {
    return jsonResponse({ error: `Seed too long (max ${MAX_SEED_LEN} characters).` }, 400);
  }

  const envErr = envGuard(env);
  if (envErr) return envErr;

  const ipHash = await hashedIp(request);
  const rate = await rateCheck(env, TOOL, ipHash, PER_IP_DAILY_LIMIT, PER_TOOL_DAILY_LIMIT);
  if (rate.blocked) return rate.blocked;

  const userMsg = "Seed keyword: " + seed + (genre ? "\nGenre: " + genre : "");

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
