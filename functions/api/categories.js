// Cloudflare Pages Function: POST /api/categories
// Amazon Kindle category recommender. See ./_lib.js for shared plumbing.

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
  "You are an Amazon KDP categorization expert for indie authors. Given a book description and optional genre, recommend three Kindle Store categories where the book can realistically rank in the top 100.",
  "",
  "Strict rules:",
  "- Use real Amazon Kindle Store category paths (e.g. \"Kindle Store > Kindle eBooks > Literature & Fiction > Mystery, Thriller & Suspense > Mystery > Cozy\"). Never invent paths.",
  "- Recommend a MIX: one easier-to-rank niche category, one mid-tier, one stretch goal. Avoid recommending three identical-difficulty categories.",
  "- Never recommend mega-categories (\"Romance\", \"Mystery\") on their own — the top 100 there is dominated by traditional publishing. Always recommend deeper subcategories.",
  "- Be honest about competition. If a category routinely has top-100 books with 50K+ reviews, flag it.",
  "- Indie authors get up to 10 category placements via KDP. Skip the standard 2-default and explain what slots they should request.",
  "",
  "Format your response as markdown:",
  "",
  "## Three categories to request",
  "",
  "### 1. [Short category name]",
  "- **Path:** [full Kindle Store path, > separated]",
  "- **Why it fits:** [2-3 specific elements from the book that match this category]",
  "- **Competition:** [Light / Moderate / Heavy] — [one-line note on what the top 100 looks like]",
  "- **Top-100 likelihood:** [Easy / Moderate / Stretch]",
  "",
  "### 2. [Short category name]",
  "- **Path:** ...",
  "- **Why it fits:** ...",
  "- **Competition:** ...",
  "- **Top-100 likelihood:** ...",
  "",
  "### 3. [Short category name]",
  "- **Path:** ...",
  "- **Why it fits:** ...",
  "- **Competition:** ...",
  "- **Top-100 likelihood:** ...",
  "",
  "## How to add these",
  "- Amazon assigns 2 categories from your BISAC code by default. The other 8 slots come from emailing kdp-support with the exact paths above.",
  "- Subject line: \"Add categories — ASIN [your ASIN]\". List the full paths verbatim.",
  "",
  "## Tips",
  "- Always verify the path exists by browsing Amazon's Kindle Store sidebar — Amazon renames categories quietly.",
  "- Aim for at least one category where the #100 book has under 1,000 reviews — that's where new releases can break in within a week.",
].join("\n");

const TOOL = "categories";
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
