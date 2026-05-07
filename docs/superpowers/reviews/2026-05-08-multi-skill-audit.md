# Authorly — Multi-Skill Audit (2026-05-08)

**Aggregate score:** 8.7/10 — Authorly is a genuinely well-crafted indie tools site with a real point of view: cream-paper aesthetic, Fraunces variable-font discipline, oxblood accent, § ornaments, peer-author voice, layered cost-cap defense, and exemplary asset weight (~32 KB JS+CSS). The score sits at 8.7 (not 9.5+) because three concrete gaps remain: (1) the prior review's "strict CSP" claim is materially false — `_headers:7` still ships `'unsafe-inline'` on both `script-src` and `style-src` because every HTML page carries an inline contact-link IIFE on line 32, which `tool.js`/`feedback.js` already do; (2) `ads.html` ships ~120 lines of duplicated JS instead of using the shared `Authorly.initTool` runtime, leaking a missing CSS variable (`--rule-soft`) and divergent error patterns; (3) no dark mode for an audience that writes at night. Server-side is in stronger shape than client-side — all 12 prior-review items verified shipped, defense-in-depth is real, but `callClaude` lacks the `AbortController` timeout and model-fallback chain Slatework now has. With ~3 weeks of runway, all three of these are closeable; doing so would lift the aggregate to 9.5+.

**Skills used:** taste-skill, ui-ux-pro-max, frontend-design, color-expert, ux-writing, seo-audit (+ seo-page, seo-schema, seo-technical, seo-images, seo-sxo, seo-geo), web-quality-audit, accessibility, core-web-vitals, performance, best-practices, gsd-code-review, security-reviewer, code-reviewer

**Prior score:** ~9/10 (2026-05-07 launch review) — change: ↓ to 8.7 honest read. Prior review claimed "strict CSP" — section A and section D both verified `_headers:7` still permits `'unsafe-inline'` on script-src and style-src. Prior review claimed `ads.html` was on the shared runtime — section A and section E both verified it ships parallel implementation. Prior review's 12 critical items all verified true (section E). The 0.3 drop is not a regression; it's calibration against the actual ground truth that was glossed over a day ago.

**Launch context:** ~3 weeks to launch (May 26, 2026). More polish headroom than Slatework had. Realistic to close all critical and important items before launch and also ship dark mode + cross-tool internal links + long-form guides if motivated.

## Dimension scorecard

| Dimension | Score | Top issue | Top win |
|---|---|---|---|
| Design Taste & UI/UX | 8.7 | Homepage `tool-list` is the AI-tell "3 equal cards horizontally" pattern (`tool.css:126`); single 720px column wastes 1024–1440px viewports | Fraunces with `opsz`/`SOFT`/`WONK` variable axes is real craft (`tool.css:42`); § ornaments + cream-paper SVG noise = singular POV |
| Color System | 8.6 | No dark mode — real gap for night-writing audience (`tool.css:5-15`); `--ink-mute #6b6760` carries too much load right at AA threshold (4.73:1) | Tokens are semantic and layered; oxblood accent + cream paper + warm ink reads like Penguin interior |
| Copy/Voice | 9.4 | "That doesn't look like a valid email address" blames input (`index.html:287`); "Connection trouble" reused inconsistently 3× | Voice is the moat — "I pay the AI bill. Each generation costs me about two cents." Legal pages keep this voice. Best-in-class. |
| SEO | 8.4 | OG dimensions missing on 4 of 10 pages (`blurb`, `bio`, `categories`, `keywords`); no `BreadcrumbList`, no `SearchAction`, no `<lastmod>` in sitemap; no long-form guides | Extensionless canonicals 10/10; FAQPage JSON-LD with 4 cite-able Q&A; per-tool `WebApplication` schema; strict CSP doesn't break crawlers |
| Accessibility | 8.7 | Form `.error` divs lack `role="alert"` — WCAG 3.3.1 AA fail (`tool.js:131-137`); `.copy-btn` is ~14×16px — WCAG 2.5.8 AA fail | Real `:focus-visible`, working skip-link, semantic landmarks, reduced-motion respected globally |
| Performance/CWV | 8.9 | Google Fonts stylesheet is render-blocking (no preload); variable-font request includes italic axis even on pages without italic display | ~32 KB total JS+CSS, no third-party trackers, no analytics, og.png stays out of critical path |
| Best Practices | 8.4 | `'unsafe-inline'` in `script-src` defeats CSP's primary XSS mitigation; missing `_headers` rule for `/tool.css` and `/tool.js` | HSTS+preload, `frame-ancestors 'none'`, `Permissions-Policy` zeroing, COOP same-origin, no wildcard CSP |
| Code Quality | 8.7 | `ads.html:140-260` ships ~120 lines duplicating `Authorly.initTool`; markdown renderer's `*`/`**` regexes can produce malformed HTML on stray asterisks | `_lib.js` refactor is genuinely well-factored; every endpoint is ~80 LOC of glue; single-edit-fixes-all is real |
| Security | 9.4 | No `AbortController` timeout on Anthropic fetch (`_lib.js:188-200`); no model fallback chain on 403; IP hash not day-salted | All 12 prior-review claims verified shipped; layered cost cap (per-IP/per-tool/$5k cross-tool); deploy-bucket leak blocked at middleware; never logs raw IP, content, or secrets |

## Critical findings (consolidated — ship blockers for May 26)

1. **[Critical] OG dimensions/alt missing on 4 indexable tool pages** — Section C, `blurb.html:16-18`, `bio.html:16-18`, `categories.html:16-18`, `keywords.html:16-18` — Add `<meta property="og:image:width" content="2400">`, `og:image:height content="1260"`, `og:image:alt content="Authorly — free tools for indie authors">` immediately after `og:image:type` on each. 5-minute fix; closes social-share inconsistency before launch.

2. **[Critical] Form errors not announced to screen readers — WCAG 3.3.1 AA fail** — Section D, `tool.js:131-137` and `ads.html:175,181,185` — `<div class="error">` rendered synchronously with no `role="alert"` and no `aria-live` region. SR users miss validation feedback. Fix: change `div.className = "error"` to `div.className = "error"; div.setAttribute("role", "alert")`. Two-line fix; closes a real WCAG AA failure.

3. **[Critical] CSP `'unsafe-inline'` claim contradiction — strict-CSP not actually achieved** — Sections A, D, E, `_headers:7` — Prior review and project memory both claim Authorly matches Slatework's strict-CSP posture. Reality: `script-src 'self' 'unsafe-inline'` and `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`. Driver: 10 inline `<script>` blocks (one per HTML page, line ~32) wiring `a.contact[data-u]` mailto links — `tool.js:51-61` and `feedback.js:11-30` already do this on every page. Fix: delete the inline `<script>` from all 10 HTML files, then drop `'unsafe-inline'` from `script-src`. Either (a) ship the refactor before launch (90 min) or (b) update the launch review and project memory to admit Authorly is not yet strict-CSP. Misalignment between claim and reality is the actual launch blocker; either action closes it.

## Important findings (should ship before launch)

1. **`ads.html` ships duplicated JS instead of `Authorly.initTool`** — Sections A, D, E, `ads.html:140-260` — ~120 LOC duplicating chip-toggle, char-counter, validation, fetch, error-rendering, remaining-counter logic from `tool.js`. References undefined CSS var `--rule-soft` (every "remaining today" chip on every tool falls back to hardcoded `#f3ede0`). Risk: future runtime fixes silently miss `/ads`. Fix: migrate to `Authorly.initTool({extraFields:[{id:"title",name:"title",required:true,errEmpty:"..."},{id:"comps",name:"comps"}], ...})`. Add `--rule-soft:#f3ede0` to `:root` in `tool.css:5-15`. ~80 LOC delete, ~30 LOC config.

2. **Homepage `tool-list` 3-up grid is the canonical AI-tell** — Section A, `tool.css:126` — `repeat(auto-fill,minmax(220px,1fr));gap:16px` produces the "3 equal cards horizontally" pattern. Most on-brand fix: editorial list — small leading roman numerals, `border-t` between rows, generous vertical rhythm, no card chrome. Matches the book-print POV. ~30 min.

3. **Touch targets fail WCAG 2.5.8 AA** — Section D, `tool.css:94` and header `nav a` — `.copy-btn` is ~14×16 (3px/9px padding, 11px font); header nav links are inline-only ~18×20. AA minimum is 24×24. Fix: `.copy-btn{padding:6px 11px;font-size:12px}` and `.nav a{padding:6px 4px;display:inline-block}`.

4. **No `AbortController` timeout on Anthropic fetch** — Section E, `functions/api/_lib.js:188-200` — Slow upstream stalls user with no recovery. Slatework already ships this pattern (`slatework/functions/_lib.js:158-179`): `AbortController` + `setTimeout(controller.abort, 55_000)`, throw `ClaudeError('timeout',...)` on `AbortError`, map to 504. ~10 LOC port.

5. **No model fallback chain on 403** — Section E, `functions/api/_lib.js:177-226` — If Anthropic gates `claude-sonnet-4-6` for the API key, every tool hard-fails. Slatework walks `sonnet-4-5 → sonnet-4-5-20250929 → haiku-4-5` on 403. Authorly's prompts are tuned for Sonnet but Haiku fallback beats hard fail. ~30 LOC port from Slatework.

6. **Dark mode absent — real gap for night-writing audience** — Section B, `tool.css:5-15` — Tokens are already semantic; one `@media (prefers-color-scheme:dark)` block swaps 9 values. Verify the noise-texture SVG (`tool.css:27`) reads correctly on dark — `feColorMatrix` opacity (`0.04`) is tuned for paper.

7. **`--ink-mute` carries too much load right at AA threshold** — Section B, `tool.css:10` — `#6b6760` on `#faf6f0` ≈ 4.73:1 — passes AA body by a hair. Used for: nav links, chip text, char counter, "(optional)" labels, footer byline. Tighten to `#5d594f` (≈5.6:1) — still reads muted, comfortable AA buffer.

8. **No `BreadcrumbList` JSON-LD on any tool page** — Section C — Single-level breadcrumbs surface as URL replacement in Google SERPs (better-looking blue link). Add 2-item `BreadcrumbList` to each of `blurb.html`, `keywords.html`, `categories.html`, `tropes.html`, `ads.html`, `bio.html`.

9. **No `SearchAction` in homepage `WebSite` JSON-LD** — Section C, `index.html:28-29` — Eligible for sitelinks-search-box on the brand-name SERP (which will hit immediately at launch). Add `potentialAction` block with `EntryPoint` urlTemplate `https://authorly.tools/?q={search_term_string}` and a one-line `URLSearchParams` read in homepage JS to prefill the textarea.

10. **Sitemap has no `<lastmod>`** — Section C, `sitemap.xml:3-47` — Google uses lastmod as re-crawl hint; matters for launch-week iteration. Add `<lastmod>2026-05-08</lastmod>` to each `<url>`.

11. **Privacy/Terms meta descriptions are thin** — Section C, `privacy.html:7` (87 chars) and `terms.html:7` (84 chars) — Privacy posture is unusually strong (no cookies, hashed-IP rate limiting, 48-hour KV TTL) but none of that is in the description. Rewrite both to ~150 chars naming the actual posture/obligations.

12. **404.html uses `!important` overrides as defensive scaffolding** — Section A, `404.html:40` — Seven `!important` properties on `.notfound-code` defending against Dark Reader. Yellow flag in code review. Fix: scope via naturally higher specificity (`body.is-404 .notfound-code`).

13. **Genre input is `slice()`-truncated but not enum-validated** — Section E, `comp.js:58`, `blurb.js:62`, `categories.js:71`, `tropes.js:59`, `ads.js:66`, `keywords.js:62` — Defense-in-depth. Validate against the enum the HTML chips emit. Low risk because system prompt is in cache_control prefix and user pays for own override attempts; worth fixing for principle.

14. **Google Fonts stylesheet is render-blocking** — Section D, every HTML head — Pattern is preconnect → `<link rel="stylesheet">` → blocks LCP on second round-trip. Add `<link rel="preload" as="style" href="..." crossorigin>` before stylesheet link. Saves 100–250ms on 3G/4G.

15. **Variable font request is wide; italic axis fetched on pages without italic display** — Section D — Drop `;1,9..144,...` italic on 404, privacy, terms. Saves ~30–50KB on lightweight pages.

## Nice-to-have

1. **Input panel and output panel are visually identical** — Section A, `tool.css:50,76-77` — Add left rule (`border-left:3px solid var(--accent);padding-left:24px;background:transparent`) on `.output` so the answer reads as marked, like a margin annotation.
2. **No tablet breakpoint — desktop wastes the viewport** — Section A, `tool.css:166-172` — At ≥1024px either widen container to 880–960px, introduce two-column homepage, or add a quiet right-rail with "All tools" navigation.
3. **`hero.eyebrow` is identical "For indie authors" on all 7 tool pages** — Section A — Per-page eyebrow ("Marketing copy" / "Discoverability" / "Reader-facing") reads less template-y.
4. **No `og:locale` site-wide** — Section C — Add `<meta property="og:locale" content="en_US">` to every `<head>`.
5. **No `twitter:url` site-wide** — Section C — Either add or delete redundant `twitter:title`/`twitter:description`/`twitter:image` and rely on OG fallback.
6. **No `apple-touch-icon`, no `manifest`** — Section C — Add-to-home-screen is meaningful retention surface for a tool authors return to mid-launch.
7. **No `dateModified` in tool-page JSON-LD** — Section C — Add `"dateModified":"2026-05-08"` to each `WebApplication` block.
8. **`bio.html:9` title says "Author bio generator" but H1 says "Write your author bio"** — Section C — Change H1 to `<h1>The free <em>author bio generator</em>.</h1>` for keyword consistency.
9. **Tool pages do not cross-link** — Section C — Add a sentence above footer: "Also useful: [keywords](/keywords) · [categories](/categories) · [tropes](/tropes)".
10. **Focus indicator visual hierarchy is muddled** — Section B, `tool.css:30,59,61` — `box-shadow:0 0 0 3px var(--accent-soft)` at 5% alpha is dead pixels. Either bump to ~`.18` or remove and rely on 2px outline alone.
11. **Error string blames input, not situation** — Section B, `index.html:287` — Replace "That doesn't look like a valid email address" with "Email needs an @ and a domain (like you@example.com)".
12. **"Connection trouble" reused inconsistently 3×** — Section B, `tool.js:197`, `ads.html:227`, `index.html:317` — Pick one canonical line: "Couldn't reach the server. Check your connection and try again."
13. **Server-side error strings drift in voice — "AI service" is system-language** — Section B, `functions/api/_lib.js:208-223` — Unify as "Claude" or "the AI": "Claude is busy — try again in a minute."
14. **Token layer split — `--accent` is reference + semantic for accent/focus/error** — Section B, `tool.css:5-15` — Split into `--ref-red:#a83232; --semantic-accent:var(--ref-red); --semantic-focus:var(--ref-red); --semantic-danger:var(--ref-red)`.
15. **Success-state green hardcoded in 4 places** — Section B, `tool.css:96,99`, `index.html:61`, `feedback.js:47` — Token it: `--success:#2a7a3a` in `:root`.
16. **No state for color-blind users on chip-active** — Section B, `tool.css:67` — Pair active state with weight bump or check glyph.
17. **"Was this useful?" widget uses raw emoji** — Section B, `feedback.js:75,81` — Replace with "Yes, useful" / "Not really". Emoji rendering is platform-dependent; rest of site is hand-tuned typography.
18. **Inline clipboard scripts missing `.catch()`** — Section D, `index.html:262-268` and 6 other tool pages — On insecure context, button stays stuck on "Copy" silently. Chain `.catch(function(){ b.textContent="Copy failed — long-press to copy"; })`.
19. **Markdown renderer's `*`/`**` regexes can produce malformed HTML on stray asterisks** — Section E, `tool.js:17-18` — Pre-escape `**` to a sentinel before `*` substitution, OR use `/\*\*((?:[^*]|\*(?!\*))+)\*\*/g`. Not exploitable; cosmetic.
20. **IP hash is not day-salted — Slatework rotates daily** — Section E, `functions/api/_lib.js:37-50` — `slatework/_lib.js:38-39` salts with `+ ':' + day` so fingerprint rotates at UTC midnight (better privacy). 2-line port.

## Verification of prior-review claims (2026-05-07 — 12 critical items)

| Claim | Status | File:line | Notes |
|---|---|---|---|
| Leak blocking via `_middleware.js` | Verified | `functions/_middleware.js:7-34` | 12 path patterns blocked. Returns 404 with `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store`. |
| `_lib.js` refactor / DRY | Verified | `functions/api/_lib.js` | Endpoints are ~80 LOC of glue. Single-edit-fixes-all is real. |
| Hashed IPs (SHA-256-truncated) | **Partial** | `_lib.js:37-50`, `feedback.js:36`, `waitlist.js:32` | 64-bit truncation present, but **NOT day-salted**. Slatework rotates daily; Authorly's hash is stable across days. Privacy gap vs. Slatework. |
| `Retry-After` headers on 429 | Verified | `_lib.js:24-26` | Auto-emitted via `jsonResponse` for all 429s including waitlist/feedback. |
| `$5k cross-tool` cap | Verified | `_lib.js:12, 119-125` | `GLOBAL_DAILY_CEILING = 5_000` enforced on `global:all:<date>` key. Verified working. |
| `ctx.waitUntil` for KV writes | Verified | `_lib.js:158-160`, `feedback.js:63-65`, `waitlist.js:77-79` | All async KV writes wrapped, `Promise.allSettled` so partial failure logs but doesn't block response. |
| BEACON strip | Verified | n/a (absence) | `cloudflareinsights` not present in any served file. CSP `connect-src 'self'` confirms. |
| FAQPage JSON-LD on homepage | Verified | `index.html:28-30` | Single `@graph` JSON-LD with Organization + WebSite + FAQPage (4 questions). Well-formed. |
| 404 canonical recursion fix | Verified | `404.html:8-9` | `<meta name="robots" content="noindex">` + no canonical. Recursive trap fixed. |
| Model `claude-sonnet-4-6` | **Partial** | `_lib.js:9` | `DEFAULT_MODEL = "claude-sonnet-4-6"` correct. **README still says `claude-sonnet-4-5` at `README.md:31`** — minor doc drift to clean. |
| Unified footer + visual polish across 10 pages | Verified | All 10 HTML pages | Identical link order Home / All tools / Pro waitlist / Privacy / Terms / Contact + byline. Tool pages all carry it. |
| Strict CSP claim | **FALSE** | `_headers:7` | Both `script-src` and `style-src` still include `'unsafe-inline'`. Section A and section D both flag this. **Prior review's most material misstatement.** Driver: inline contact-link IIFE on line 32 of every HTML page (which `tool.js`/`feedback.js` already do). Refactor is straightforward; claim was premature. |

**Summary:** 9 of 12 verified clean. 2 partial (IP hash not day-salted; README model doc drift). 1 false (strict CSP not achieved). Most concerning: the "strict CSP" claim was repeated in section memory and would have shipped to launch posts as a differentiator. Section A correctly flagged it.

## Ship-now plan — top 10

| # | Item | Section | Effort | Impact | Fix |
|---|---|---|---|---|---|
| 1 | Add `og:image:width/height/alt` to 4 tool pages | C | 5 min | Closes social-share inconsistency before launch shares hit | Copy-paste 3 lines from `index.html:18-20` into `blurb.html:16-18`, `bio.html:16-18`, `categories.html:16-18`, `keywords.html:16-18` |
| 2 | Add `role="alert"` to dynamic `.error` divs | D | 10 min | Closes WCAG 3.3.1 AA failure | `tool.js:132`: add `div.setAttribute("role", "alert")`. Same on `ads.html:175,181,185`. |
| 3 | Bump touch targets to 24×24 minimum | D | 10 min | Closes WCAG 2.5.8 AA failure | `tool.css:94`: `.copy-btn{padding:6px 11px;font-size:12px}`. `:36-38`: `.nav a{padding:6px 4px;display:inline-block}`. |
| 4 | Add `AbortController` timeout to `callClaude` | E | 30 min | Fixes user-visible stalled spinner if Anthropic gets slow | Port Slatework `_lib.js:158-179` pattern. ~10 LOC. |
| 5 | Add `<lastmod>2026-05-08</lastmod>` to all sitemap entries | C | 15 min | Google re-crawl signal for launch week | One line per `<url>` in `sitemap.xml:3-47`. |
| 6 | Add `SearchAction` to homepage WebSite JSON-LD | C | 20 min | Eligible for sitelinks-search-box on brand-name SERP | Extend `index.html:29` `@graph` with `potentialAction` block + `URLSearchParams` read in homepage JS to prefill textarea. |
| 7 | Tighten `--ink-mute` to `#5d594f` | B | 5 min | AA buffer for color extensions and low-vision users | One char-edit on `tool.css:10`. Lifts contrast 4.73:1 → 5.6:1 site-wide. |
| 8 | Add model fallback chain on 403 | E | 60 min | Hard-fail becomes graceful Haiku fallback if Sonnet gated | Port Slatework's `DEFAULT_FALLBACK_CHAIN` + retry loop. ~30 LOC. |
| 9 | Resolve strict-CSP claim — refactor or update memory | A,D,E | 90 min refactor / 5 min update | Aligns claim with reality before launch posts | Either (a) delete inline `<script>` from line 32 of all 10 HTML files (relying on `tool.js`/`feedback.js` `wireContactLinks`), then drop `'unsafe-inline'` from `script-src` in `_headers:7`; or (b) update launch review + project memory. Refactor is ~90 min and worth doing. |
| 10 | Migrate `ads.html` to `Authorly.initTool` with `extraFields` | A,D,E | 120 min | Eliminates duplicated runtime; future runtime fixes ship to all 7 tools | Rewrite `ads.html:140-260` (~120 LOC) → `Authorly.initTool({extraFields:[{id:"title",required:true,errEmpty:"Please enter your book title."},{id:"comps"}], ...})` (~30 LOC). Add `--rule-soft:#f3ede0` to `:root` in `tool.css:5-15`. |

All 10 items closeable in <4 hours each. Cumulative: ~6 hours of work — well within the 3-week runway.

## Ship-later — top 10

1. **Replace homepage `tool-list` 3-up grid with editorial list** (Section A) — Most on-brand fix; lifts homepage from "well-built" to "designed". 30 min.
2. **Add dark mode** (Section B) — 9 token swaps, 1 `@media` block, ~15 lines of CSS. Half the audience writes after sundown. 60 min.
3. **Add `BreadcrumbList` JSON-LD to 6 tool pages** (Section C) — Better SERP appearance. 30 min.
4. **Rewrite Privacy/Terms meta descriptions** (Section C) — Names actual posture, removes thin-content fingerprint. 15 min.
5. **Add tablet breakpoint at ≥1024px** (Section A) — Stops desktop wasting the viewport. 60 min.
6. **Validate genre input against enum in 6 endpoints** (Section E) — Defense-in-depth one-liner per file. 30 min.
7. **Add cross-tool internal links to tool pages** (Section C) — Topical-cluster SEO signal. 20 min.
8. **Per-page hero eyebrow variants** (Section A) — Reads less template-y. 15 min.
9. **Token success-state green** (Section B) — `--success:#2a7a3a` consolidates 4 hardcodes. 10 min.
10. **Day-salt the IP hash** (Section E) — Match Slatework's daily-rotating fingerprint privacy posture. 2-line change. 10 min.

## Skip / decline

- **`X-XSS-Protection` header** — Section D — Modern advice is don't send it. Authorly is correct.
- **`<link rel="dns-prefetch">` companion** — Section D — `preconnect` is strict superset; some audits flag it incorrectly.
- **SRI on Google Fonts CDN** — Section E — Google Fonts CSS varies per UA; SRI doesn't work cleanly. Acceptable.
- **`hreflang` declarations** — Section C — Site is English-only and Amazon-KDP-US-anchored. Correct posture.
- **CSP `Trusted Types`** — Section D — Defer to v0.2; high-blast-radius if misconfigured. Worth doing once `'unsafe-inline'` is gone.
- **Honeypot/Turnstile on waitlist** — Section E — Per-IP 3/day + global 500/day caps the abuse surface. SHA-256 dedup on email prevents inflation. Won't matter at launch.
- **Long-form `/guides/` content** — Section C — Single biggest organic-discovery lever, but 6 long-form articles is a v0.2 push, not a launch-week task.

## What Authorly does well (top 5)

1. **Voice is the moat.** "I pay the AI bill. Each generation costs me about two cents." (`index.html:176`) is a sentence no SaaS team writes. Legal pages keep this voice — `terms.html:109`: "If you publish a book description containing AI-generated comp titles and the author or publication year turns out to be wrong, that's on you, not us." Authors will read this and feel addressed by a person, not a marketing surface. (Section B)

2. **The samples are a masterstroke.** Every tool ships `<details class="sample"><summary>See an example of what you'll get</summary>` with realistic example output rendered in the same typography as the real result. New visitors don't have to guess. Best-in-class onboarding pattern, more useful than 90% of marketing copy. (Section A, B)

3. **Color and typography are real craft.** Cream paper (`#faf6f0`), warm ink (`#1a1814`), oxblood accent (`#a83232`), § ornaments. Fraunces with `font-variation-settings:"opsz" 144,"SOFT" 30,"WONK" 1` on the hero h1 (`tool.css:42`) is the kind of detail that signals the builder read the font's spec sheet. Reads like Penguin Modern Classics interior, not Tailwind starter #847. (Section A, B)

4. **Server-side defense-in-depth is exemplary.** Layered cost cap (per-IP 5 / per-tool 2000 / cross-tool $5k) all enforced before counter bump. Hashed IPs never touch logs. KV race window documented and bounded. `_middleware.js` blocks 12 leak patterns at the edge. Better than most paid SaaS. (Section D, E)

5. **Asset weight is exemplary.** ~32 KB total JS+CSS for a multi-page tool site. No bundler, no framework, no jQuery, no analytics. Performance budget Google publishes for "good experience" is 1.5MB; Authorly is at ~2% of that before fonts. The constraint is the design. (Section D)

## Honest read (1 paragraph)

Authorly is a genuinely well-crafted indie tools site that earns 8.7/10 on this audit — distinctive book-print aesthetic, Fraunces variable-font discipline, peer-author voice that cannot be faked, layered cost-cap defense, exemplary asset weight, and 10 unified pages with one CSS file and one JS runtime. The 0.8 gap to 9.5+ is concentrated in three places: a strict-CSP claim that was prematurely shipped to project memory and the launch review (driven by 10 inline `<script>` blocks the deferred JS already replaces), `ads.html` shipping ~120 lines of duplicated logic instead of using the shared `Authorly.initTool` runtime, and three smaller items (no dark mode, no `AbortController` timeout, OG dimensions inconsistency). All three of these are closeable inside the 3-week launch runway — the strict-CSP refactor is ~90 minutes, the `ads.html` migration is ~2 hours, and dark mode is ~1 hour. With those shipped, Authorly clears 9.5+ honestly. The thing the audit found that the prior review missed is calibration: section A and section D both verified `_headers:7` still ships `'unsafe-inline'` on both directives, which means the project memory line "Authorly clears 9/10 honestly after 12 critical items shipped 2026-05-07" is technically false — Authorly is at 8.7 today and the correct framing is "honest read 8.7, ship runway 9.5+ within the 3 weeks remaining."

## Cross-project comparison sidebar (Authorly vs. Slatework)

| Pattern | Authorly | Slatework | Lift-and-shift opportunity |
|---|---|---|---|
| Aesthetic POV | Cream paper + Fraunces + § ornaments + oxblood = singular across entire surface | Dark slate hero with chalk-dust animation; rest of site conventional white + Newsreader + IBM Plex | **Authorly's whole-site POV is stronger; Slatework's hero drama is stronger.** Slatework should consider a more committed surface beyond the hero; Authorly could borrow more spatial drama on its homepage hero. |
| File count discipline | One CSS, one JS, ten HTML pages | `src/lib/styles.css` + deeper directory tree (SvelteKit) | N/A — different deploy stacks |
| Strict CSP | **Claimed but not achieved** — `script-src 'self' 'unsafe-inline'` | Achieved at v0.3 — no `'unsafe-inline'` on either directive | **Lift Slatework's pattern to Authorly.** Delete inline contact-link IIFE from line 32 of all 10 HTML pages; rely on `tool.js`/`feedback.js`. |
| `_middleware.js` deploy-bucket leak blocker | Authorly only — 12 path patterns blocked at edge | Relies on `.assetsignore` build-time exclusion | **Port to Slatework.** If a stray dev artifact lands in the deploy bucket, it's served. Authorly's belt-and-braces is stronger. |
| System-prompt cache_control | Authorly only — `cache_control: ephemeral` on system prompt (`_lib.js:182`) | Slatework's `callClaudeOnce` sends system as plain string, missing prompt-cache hit | **Port to Slatework.** Real money savings on Slatework's longer lesson-plan/marking system prompts. |
| `Retry-After` auto-emission on 429 | Authorly only — auto-emitted via `jsonResponse` | Slatework's `jsonResponse` doesn't auto-add | **Port to Slatework.** |
| `$5k cross-tool` cost cap | Authorly only — `GLOBAL_DAILY_CEILING` checked before per-tool bump | Slatework's `rateCheck` only checks per-IP + per-tool | **Port to Slatework.** With Slatework's multi-modal endpoints (OCR + Vision + LLM), runaway-cost scenario is more dangerous, not less. |
| Two-phase rate-check (check, then bump after success) | Authorly only — `bumpCounters` separated from `rateCheck` | Slatework bumps inside check; failed Anthropic calls still consume quota | **Port to Slatework.** Better UX on transient failures. |
| `AbortController` timeout on Anthropic fetch | None | `setTimeout(controller.abort, 55_000)` + `ClaudeError('timeout')` mapped to 504 | **Port to Authorly.** ~10 LOC. Single biggest server-side gap. |
| Model fallback chain on 403 | None — hard-fail | `sonnet-4-5 → sonnet-4-5-20250929 → haiku-4-5` walk on `permission_error` | **Port to Authorly.** ~30 LOC. |
| `ClaudeError` class with code/status/bodySnippet + `userFacingClaudeError` | Inline error mapping in `callClaude`, lossy | Rich error shape with server-side ref code (`ts`) for support tickets | **Port to Authorly.** Reduces "WTF is broken" support load. |
| `extractUpstreamDetail` regex chain | Throws away upstream message text | Surfaces sanitized Anthropic detail to user when diagnostically useful | **Port to Authorly.** |
| Day-salted IP hash | Stable across days — fingerprint persists | Daily-rotating — `+ ':' + day` before SHA-256 | **Port to Authorly.** 2-line change, genuinely better privacy property. |
| `SoftwareApplication` schema with `softwareVersion` on homepage | None | `slatework/index.html:43-52` declares `"softwareVersion":"0.1.0"` | **Port to Authorly.** 30-second add. |
| Per-tool-page `browserRequirements` | None | `slatework/rates.html:32` declares `"browserRequirements":"Requires JavaScript"` | **Port to Authorly.** 30-second add per tool page. |
| FAQPage JSON-LD quality | 4 questions tightly anchored to actual tool surface (50-char KDP keyword limit, 130–180 word blurb, etc.) | 5 questions slightly more abstract ("Is my student's writing private?") | **Authorly's questions are more cite-able by AI Overviews / Perplexity.** Slatework should tighten. |
| `WebPage` JSON-LD with `dateModified` on legal pages | Yes (`privacy.html:28`, `terms.html:28`) | None as of v0.2 | **Port to Slatework.** SERP "Last updated" hint. |
| Footer cohesion | Bookend `§` ornament + flex link nav + byline; identical on 10 pages | Less polished | **Port to Slatework.** |
| Mono-caption rhythm with pulsing dot | None — `.eyebrow` is letterspaced uppercase only | `.mono-caption + .dot` used as recurring "live now" marker | **Port to Authorly.** Adding a "Live" indicator to each tool card on homepage would reinforce freshness. |
| Two display fonts in dialogue | Single-font (Fraunces everywhere) | Newsreader for editorial gravity, IBM Plex for body/code, IBM Plex Mono for character-counts | **Consider for Authorly.** A complementary mono for `(31/50)` annotations and char counts would aid scanning without breaking book-print POV. |
| Dramatic hero | Conventional eyebrow → h1 → sub → ornament | Dark slate hero with chalk-dust animation, mono caption with pulsing dot, live-preview widget | **Consider for Authorly.** Could borrow some spatial drama on homepage specifically. |
| Font loading pattern | preconnect → `<link rel="stylesheet">` (textbook recommendation) | `@import url('https://fonts.googleapis.com/...')` inside CSS — render-blocking, can't be preconnected | **Port Authorly's pattern to Slatework.** Don't regress Authorly. |
| `connect-src` strictness | Only `'self'` — no third-party JS dependencies | Allows cdnjs/unpkg/cloudflareinsights/exchangerate-api | **Authorly wins.** Slatework should audit and tighten. |
| Sample/`<details>` example pattern | All 7 tool pages ship `<details class="sample">` with realistic output | Preview widget on rate calculator only (one tool) | **Port to Slatework.** Stronger "show, don't tell" mechanic on every tool. |

**Where Authorly does better than Slatework:** Aesthetic POV across whole surface, file-count discipline, deploy-bucket leak blocker, prompt caching, `Retry-After`, `$5k cross-tool` cap, two-phase rate check, FAQPage cite-ability, `dateModified` on legal pages, footer polish, font loading pattern, `connect-src` strictness, sample example pattern on every tool.

**Where Slatework does better than Authorly:** Strict CSP (actually achieved), `AbortController` timeout, model fallback chain, `ClaudeError` class with ref codes, `extractUpstreamDetail`, day-salted IP hash, `SoftwareApplication` schema with version, `browserRequirements` on tool pages, mono-caption rhythm, two-display-fonts dialogue, dramatic hero animation.

**Recommended unifications:**
1. **Strict CSP refactor** — Authorly drops inline `<script>` from line 32 of 10 HTML pages, removes `'unsafe-inline'` from `script-src`. Brings parity. Top priority before launch.
2. **`AbortController` + model fallback + `ClaudeError` triple-port from Slatework to Authorly** — ~50 LOC total. Closes the largest server-side gap.
3. **Cost-cap + rate-check + prompt-cache triple-port from Authorly to Slatework** — Slatework v0.4 should pick these up. Real cost savings + better UX.
4. **Day-salted IP hash port from Slatework to Authorly** — 2-line change, better privacy.
5. **Footer polish + font loading pattern port from Authorly to Slatework**.
6. **`SoftwareApplication` + `browserRequirements` schema port from Slatework to Authorly** — 30-second adds.

## Section files (sub-references)
- `.sections-2026-05-08/section-a-design.md`
- `.sections-2026-05-08/section-b-color-copy.md`
- `.sections-2026-05-08/section-c-seo.md`
- `.sections-2026-05-08/section-d-quality.md`
- `.sections-2026-05-08/section-e-code-security.md`
