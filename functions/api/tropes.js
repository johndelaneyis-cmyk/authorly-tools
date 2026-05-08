// Cloudflare Pages Function: POST /api/tropes
// Trope finder. See ./_lib.js for shared plumbing.

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
  "You are a trope analyst for indie authors on Amazon and TikTok. Given a book description, identify the tropes already present in the plot that readers actively search for, plus any low-cost additions the author could lean into.",
  "",
  "Strict rules:",
  "- Use real reader-vocabulary tropes (\"enemies to lovers\", \"morally grey antihero\", \"found family\", \"slow burn\", \"reluctant chosen one\", \"second chance\", \"forced proximity\", \"academic rivals\"). Skip vague labels like \"complex characters\" or \"emotional journey\".",
  "- Only list tropes the description actually supports. If the plot doesn't have enemies to lovers, do not list it.",
  "- Rank tropes by **reader-search appeal**: how often that exact phrase shows up in BookTok captions, Goodreads shelves, and Amazon search bars.",
  "- For each trope, give a one-line evidence snippet from the description and a one-line note on how to lean into it for marketing (cover, tagline, ads, BookTok hooks).",
  "- The \"adjacent\" section is for tropes the book is ONE small revision away from supporting — not random suggestions. Skip it if there are none.",
  "- Tune trope vocabulary to the sub-genre when supplied. Romantasy: fated mates, court politics, dragon bond, magic-system-as-romance. LitRPG / GameLit: dungeon mechanics, leveling system, isekai, deck-builder. Cozy mystery: amateur sleuth, small-town secrets, animal sidekick. Dark romance: morally grey hero, possession, danger kink, captor.",
  "- For Christian/sweet/clean romance: surface only family-safe tropes (faith journey, second chance, forced proximity, small-town homecoming) — avoid heat-coded tropes.",
  "",
  "Format your response as markdown:",
  "",
  "## Tropes already in your plot",
  "1. **trope phrase** — Evidence: [phrase from description]. Lean in by: [tagline/cover/ad angle]",
  "2. **trope phrase** — Evidence: ...",
  "(continue with as many as the description supports, up to 6, ranked by search appeal)",
  "",
  "## Adjacent tropes worth considering",
  "- **trope phrase** — One-line revision that would unlock it",
  "(0-3 items, only if genuinely adjacent)",
  "",
  "## Where to use these",
  "- Amazon ad copy: \"For readers who love [trope X] and [trope Y]\"",
  "- BookTok caption hooks: pair the strongest trope with a 5-second visual",
  "- Back-cover blurb: name 2-3 tropes explicitly — readers shop by trope now",
  "",
  "Always test by searching the trope on Amazon and TikTok — if your book genuinely fits, the comparable books will be obvious.",
].join("\n");

// Non-fiction analog: surface FRAMEWORKS / METHODS / TRANSFORMATIONS, not tropes.
const NONFICTION_SYSTEM_PROMPT = [
  "You are a positioning analyst for indie non-fiction authors on Amazon (memoir, business / how-to, self-help, cookbook). Given a book description, identify the FRAMEWORKS, METHODS, and READER TRANSFORMATIONS the book offers — the non-fiction equivalent of fiction tropes, the things readers search for and shop by.",
  "",
  "Strict rules:",
  "- Surface real reader-vocabulary positioning elements: \"4-step framework,\" \"behavior-change protocol,\" \"daily ritual,\" \"30-day reset,\" \"founder's playbook,\" \"morning routine,\" \"transformation arc,\" \"systems-not-goals,\" \"category-of-one positioning.\" For memoir: \"second-act story,\" \"survivor narrative,\" \"reckoning memoir,\" \"recovery arc,\" \"immigrant story.\" Skip generic phrases like \"life-changing insights.\"",
  "- Only list elements the description actually supports.",
  "- Never use fiction tropes (\"found family,\" \"second chance,\" \"slow burn\") for non-fiction. Those are wrong-vertical signals that hurt discoverability.",
  "- Rank by reader-search appeal: which phrases actually appear in Goodreads shelves, Amazon search, and category descriptors for similar non-fiction books.",
  "",
  "Format your response as markdown:",
  "",
  "## Frameworks & methods already in your book",
  "1. **framework / method phrase** — Evidence: [phrase from description]. Lean in by: [tagline/cover/positioning angle]",
  "2. **phrase** — Evidence: ...",
  "(continue with as many as the description supports, up to 6, ranked by search appeal)",
  "",
  "## Adjacent positioning angles worth considering",
  "- **phrase** — One-line revision that would unlock it",
  "(0-3 items, only if genuinely adjacent)",
  "",
  "## Where to use these",
  "- Amazon ad copy: name the outcome and the framework explicitly",
  "- Subtitle: most non-fiction sales are won in the subtitle — name your strongest framework there",
  "- Back-cover blurb: lead with the promise + framework name; readers shop by outcome",
  "",
  "Always test by searching the phrase on Amazon — if your book genuinely fits the positioning, comparable non-fiction books will be obvious.",
].join("\n");

const TOOL = "tropes";
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
  const userMsg = "Book description:\n" + description
    + (genre ? "\n\nGenre: " + (label || genre) : "")
    + (anchorLabel ? "\n\nCultural anchor — surface tropes that resonate with this audience's bookshelf: " + anchorLabel : "");

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
