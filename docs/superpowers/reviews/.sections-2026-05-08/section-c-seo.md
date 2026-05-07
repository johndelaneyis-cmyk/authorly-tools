# Section C — SEO — Authorly

**Score: 8.4/10** — Authorly's SEO foundation is genuinely strong: extensionless canonicals, a complete sitemap that mirrors them, FAQPage + Organization + WebSite + WebApplication JSON-LD, strict-CSP-compatible markup, and per-page titles/descriptions tuned for high-intent author-tool keywords. The drag is uneven OG metadata (width/height/alt missing on 4 of 10 pages), no BreadcrumbList anywhere, no SearchAction on the homepage WebSite node, sitemap has no `<lastmod>`, no `og:locale` / `apple-touch-icon` / `manifest`, no `<h2>` on the index above-the-fold tool card to lift the comp-finder topic score, and the `<meta name="description">` on `/privacy` is generic ("How Authorly handles data...") in a way that telegraphs identical-phrasing fingerprint to other privacy pages. None of the gaps block launch; together they're the difference between 8.4 and 9.5.

## Sub-scores

| Sub-dim | Score | Note |
|---|---:|---|
| Title/meta per page | 9 | All 10 pages have unique, keyword-led titles in the 27–58 char band and 84–169 char descriptions. Privacy/Terms descriptions are the only thin ones. |
| Canonical/OG/Twitter | 7 | Canonicals correct on 10/10. og:image:width/height/alt only on 6/10 (missing blurb, bio, categories, keywords). twitter:url missing on 10/10. og:locale missing site-wide. |
| H1 hierarchy | 8 | One H1 per page, descriptive. -2 because index.html's H1 is "Find the right comp titles for your book" but the H2 immediately below ("Comp title finder") is buried inside `tool-card`; no H2 with the high-intent keyword "comp titles" in the document outline crawler-visible above the fold. |
| Internal linking | 7 | Header nav cross-links all tools via `/#more` anchor (deep-links into homepage, not direct page-to-page). No cross-tool linking inside tool pages (e.g. blurb page does not link to keywords page). Footer covers Home/Tools/Pro waitlist/Privacy/Terms. |
| Schema/JSON-LD | 9 | Organization + WebSite + FAQPage on home, WebApplication on every tool page, WebPage on legal pages. -1 for no SearchAction in WebSite node, no BreadcrumbList on tool pages, no `dateModified` in any tool-page JSON-LD. |
| Sitemap/robots | 8 | All 9 indexable URLs listed; extensionless; matches canonicals; correctly disallows `/api/`. -2 for no `<lastmod>`, no `xmlns:image`, robots has no LLM-bot policy. |
| Image SEO | 7 | og.png is 121 KB (4× the homepage transfer) — large but justified at 2400×1260 retina. og.svg is 1.8 KB and unused. No `<img>` tags in the entire site (icon-as-svg system), so traditional alt-text scoring is N/A. The `aria-hidden` on the section ornament is correct. |
| Technical headers | 9 | HSTS preload, strict CSP, X-Frame DENY, COOP same-origin, Permissions-Policy zeroing dangerous APIs. -1 for missing `Link: rel="canonical"` HTTP header (only in-HTML canonical present) and no `X-Robots-Tag: noindex` on `/api/*` from the function layer. |
| Content depth | 7 | Tool pages are well-structured (eyebrow, H1, hero-sub, tool-card, sample `<details>`, genre chips, CTA) but the body copy averages ~110 words pre-tool. No long-form companion content (no "How to write an Amazon book description: 2026 guide" anywhere). For a high-intent vertical with established competitors, that's the single biggest organic-discovery ceiling. |
| AI search readiness | 9 | FAQPage JSON-LD on homepage with 4 well-shaped questions = directly cite-able by ChatGPT/Perplexity. Tool descriptions are factual, scoped, and already cite specific Amazon constraints (50-char keyword limit, 130–180 word blurb, 150-char Sponsored Products ad). -1 for no `llms.txt` or `.well-known/ai-policy.txt`, no JSON-LD `mainEntity` on tool pages tying to a definitive answer paragraph. |

---

## Per-page snapshot (all 10 pages)

| Page | Title len | Desc len | Canonical | OG | OG dims | Schema | H1 | Notes |
|---|---:|---:|---|---|---|---|---|---|
| `/` (index.html) | 41 | 169 | ✓ extensionless | ✓ full | ✓ w/h/alt | Organization + WebSite + FAQPage | "Find the right comp titles for your book." | FAQPage has 4 Q&A, no SearchAction in WebSite |
| `/blurb` (blurb.html:6) | 46 | 168 | ✓ | ✓ partial | ✗ no width/height/alt | WebApplication | "Write your Amazon blurb." | Title repeats "Authorly" twice (in title and OG site name) |
| `/keywords` (keywords.html:6) | 38 | 132 | ✓ | ✓ partial | ✗ no width/height/alt | WebApplication | "Find the right KDP keywords." | |
| `/categories` (categories.html:6) | 45 | 153 | ✓ | ✓ partial | ✗ no width/height/alt | WebApplication | "Pick the right Amazon categories." | |
| `/tropes` (tropes.html:6) | 31 | 156 | ✓ | ✓ full | ✓ w/h/alt | WebApplication | "Find the tropes readers search for." | |
| `/ads` (ads.html:6) | 36 | 150 | ✓ | ✓ full | ✓ w/h/alt | WebApplication | "Write your Amazon Ads headlines." | |
| `/bio` (bio.html:6) | 34 | 132 | ✓ | ✓ partial | ✗ no width/height/alt | WebApplication | "Write your author bio." | Tool name "Author bio generator" not in title (just "Author bio generator — Authorly") — actually IS, mismatch noted below |
| `/privacy` (privacy.html:6) | 31 | 87 | ✓ | ✓ full | ✓ w/h/alt | WebPage + dateModified | "Privacy Policy" | desc is thin ("How Authorly handles data when you use the tools") |
| `/terms` (terms.html:6) | 30 | 84 | ✓ | ✓ full | ✓ w/h/alt | WebPage + dateModified | "Terms of Service" | desc is thin ("The terms you agree to when you use Authorly's free tools for indie authors") |
| `/404` (404.html:6) | 28 | 60 | ✗ removed (correct) | ✓ full | ✓ w/h/alt | none (correct — noindex) | "Page not found." | Has noindex meta + no canonical (recursive trap from prior review **is fixed**) |

---

## Findings

### Critical

- **`og:image:width` / `og:image:height` / `og:image:alt` missing on 4 indexable tool pages** — `blurb.html:16-18`, `bio.html:16-18`, `categories.html:16-18`, `keywords.html:16-18`. The other 6 HTML files have all three. LinkedIn and Facebook crawlers fall back to fetching the image to measure it; without dimension hints, social previews render slower and sometimes blank on first share. Fix: add the same three lines (`<meta property="og:image:width" content="2400">`, `<meta property="og:image:height" content="1260">`, `<meta property="og:image:alt" content="Authorly &mdash; free tools for indie authors">`) immediately after each `<meta property="og:image:type" content="image/png">` line in those 4 files.

### Important

- **No `SearchAction` in the homepage WebSite node** — `index.html:28-29` declares `WebSite` but omits `potentialAction`. For a tool site that *is* a search interface (the user pastes input → gets results), adding a `SearchAction` makes the homepage eligible for Google's sitelinks-search-box. Fix: extend the `WebSite` node with `"potentialAction":{"@type":"SearchAction","target":{"@type":"EntryPoint","urlTemplate":"https://authorly.tools/?q={search_term_string}"},"query-input":"required name=search_term_string"}` — and the homepage JS reads `?q=` to prefill the textarea (one-line `URLSearchParams` read).

- **No `BreadcrumbList` JSON-LD on any tool page** — 6 tool pages have a single-level structure (Home > Tool) but no Schema.org breadcrumb. Even single-level breadcrumbs surface as the URL replacement in Google SERPs (better-looking blue link). Fix: add `BreadcrumbList` to the JSON-LD block on each of `blurb.html`, `keywords.html`, `categories.html`, `tropes.html`, `ads.html`, `bio.html`. Two items each — Home and the tool.

- **Sitemap has no `<lastmod>`** — `sitemap.xml:3-47`. Google uses lastmod as a re-crawl hint. For a launch where copy will iterate post-launch, this matters. Fix: add `<lastmod>2026-05-08</lastmod>` (or the actual file mtime) to each `<url>`. Generated from `git log --format=%cs -1 -- <file>` per-page if you want literal accuracy.

- **No `og:locale` on any of the 10 pages** — Open Graph treats omission as `en_US` by default, but explicit declaration helps when content is rendered on non-en social platforms. Fix: add `<meta property="og:locale" content="en_US">` to every `<head>`.

- **No `twitter:url` on any of the 10 pages** — `og:url` is set everywhere but the corresponding Twitter card meta is missing. X/Twitter falls back to the canonical link, but explicit declaration is the spec. Fix: add `<meta name="twitter:url" content="https://authorly.tools/{path}">` to every `<head>` — or alternatively delete the redundant `twitter:title`/`twitter:description`/`twitter:image` (they all already mirror `og:*`) and rely on the OG fallback. Pick one.

- **No `apple-touch-icon`, no `manifest`** — `favicon.svg` ships (`index.html:10`) but iOS Safari add-to-home-screen and Chrome PWA install both look for `apple-touch-icon` (180×180 PNG) and `site.webmanifest`. For a tool site that authors will return to mid-book-launch, add-to-home-screen is a meaningful retention surface. Fix: ship a 180×180 `apple-touch-icon.png`, a `site.webmanifest` declaring `name`, `short_name`, `theme_color`, `background_color`, two icon sizes (192/512). Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` and `<link rel="manifest" href="/site.webmanifest">` to every `<head>`.

- **Privacy page meta description is thin and generic** — `privacy.html:7`: `"How Authorly handles data when you use the tools. No cookies, no trackers, no accounts."` is 87 chars. The actual privacy posture is unusually strong (no cookies, hashed-IP rate limiting, no accounts, 48-hour KV TTL, EU-friendly Anthropic processing) — none of that is in the description. Fix: rewrite to ~150 chars: `"Authorly's privacy policy. No cookies, no trackers, no accounts; only an SHA-256 hash of your IP for rate limiting, auto-deleted after 48 hours."`

- **Terms page meta description is similarly thin** — `terms.html:7`: 84 chars, one sentence. Fix: rewrite to ~150 chars naming the actual obligations.

- **No `<h2>` between hero and tool-card on tool pages** — every tool page has `<h1>` in `.hero` then jumps straight to `<h2 class="tool-title">` inside `.tool-card`, but the in-page outline lands the H2 on the tool name (e.g. `<h2 class="tool-title">KDP keyword expander</h2>` at `keywords.html:61`) rather than a query-shaped phrase. Crawlers parse outline order, so the homepage outline today reads: H1=`Find the right comp titles for your book`, H2=`Comp title finder`, H2=`More tools.`, H2=`Built for indie authors.` That's readable but loses the keyword density a tool-listing page would benefit from. Fix (low-touch): rename `<h2 class="tool-title">` to a question form on the homepage only — e.g. `<h2 class="tool-title">What books are similar to mine?</h2>` for the comp finder. Tool pages: keep their H2 as the noun phrase ("KDP keyword expander") — already correct as anchor for `/keywords`.

- **No `dateModified` in tool-page JSON-LD** — `blurb.html:25-27`, `keywords.html:25-27`, etc. Google uses `dateModified` for freshness signals. Fix: add `"dateModified":"2026-05-08"` to each `WebApplication` block. Sync to deploy date via build step or just commit alongside copy edits.

- **`bio.html:9` canonical is correct but the `<title>` says "Author bio generator — Authorly" while the H1 is "Write your author bio."** — the keyword phrase "author bio generator" is in the title (good for SEO) but absent from the H1 (less good for E-E-A-T relevance scoring). Fix: change `bio.html:51` H1 to `<h1>The free <em>author bio generator</em>.</h1>` so title and H1 share the high-intent keyword.

- **Tool pages do not cross-link** — `blurb.html`, `keywords.html`, `categories.html`, `tropes.html`, `ads.html`, `bio.html` all link back to `/` and to `/#more` and to legal/contact, but they do not link **to each other**. A user on `/blurb` who has just generated a description can't click directly to `/keywords` without going home first. SEO impact: missing internal-linking topical-cluster signal. Fix: add a `.tool-list` mini-component to each tool page (4 sibling tools, omit current), or simpler: drop a single sentence above the footer like "Also useful: [keywords](/keywords) · [categories](/categories) · [tropes](/tropes)".

- **No long-form content / no blog / no `/guides` directory** — for a high-intent vertical (indie author tools) where competitors include Publisher Rocket ($199 one-time, ranks for "KDP keyword tool"), KDSPY ($47/year, ranks for "amazon category research"), and 25+ free guides on Reedsy/Self-Publishing School, Authorly's only indexable content is 6 thin tool wrappers + privacy + terms + 404. The tool pages are 8–12 KB each; the average competitor's "How to write an Amazon book description" guide is 3,000–5,000 words. Recommendation: post-launch (v0.2), publish 6 long-form companion guides, one per tool, at `/guides/{slug}` (e.g. `/guides/amazon-book-description`, `/guides/kdp-keyword-research`). Each guide links to its tool with an internal anchor and provides the deep, cite-able content that AI Overviews/Perplexity surface. This is the single biggest organic-discovery lever and Authorly currently has none of it.

### Nice-to-have

- **Homepage `WebSite` node could include `inLanguage`** — extend with `"inLanguage":"en-US"` for completeness.

- **No `Link: rel="canonical"` HTTP header** — `_headers:1-10` sets security but no canonical reinforcement at the header layer. One-line addition per page-class block. Same finding as prior review #50.

- **No `X-Robots-Tag` on `/api/*` responses** — `functions/_middleware.js:25-32` correctly emits `X-Robots-Tag: noindex, nofollow` on the blocked-path 404 path, but the actual `/api/*` function responses (in `functions/api/*.js`) don't. They are JSON `Content-Type: application/json` which crawlers shouldn't touch anyway, and `robots.txt:3` disallows `/api/`, so this is defense-in-depth only.

- **No `<link rel="alternate" hreflang="en">` declarations** — site is English-only and Amazon-KDP (US-anchored) only, so this is correct posture for now. Note for v0.2 if Spanish/German Amazon expansion ever happens.

- **Sitemap could declare `<image:image>`** for the og.png — minor, only matters if Google Images becomes a meaningful traffic source (unlikely for tool pages).

- **No `humans.txt` or `.well-known/security.txt`** — same finding as prior review #62. Receiving vuln reports cleanly, plus a tiny SEO E-E-A-T signal.

- **No `llms.txt`** — emerging standard (proposed by Answer.AI Sept 2025) for sites to declare an LLM-friendly content map. For a content-heavy vertical (which Authorly will become if guides ship), worth adding pre-launch as a 30-second file. For the current 10-page state, optional.

- **Meta keywords absent on every page** — Google ignores it, Bing/Yandex barely use it, but for a 5-keyword belt-and-braces signal it's a 30-second add. Skip if the answer is "intentionally omitted."

- **`og.svg` is 1.8 KB and not referenced anywhere I can see** — orphan asset. Either reference it (some platforms prefer SVG for crisp scaling) or remove.

- **No structured `softwareVersion` on tool-page WebApplication schemas** — `blurb.html:25-27` and siblings omit it. Add `"softwareVersion":"0.1.0"` once a release-tagging convention exists. Slatework's `index.html:48` already has this — pattern parity.

- **No NewsArticle or HowTo schema on the homepage About paragraph** — the About copy ("Built by Darren — an indie author who got tired of paying $25–50/month for SaaS tools that mostly just paraphrased synopses") is genuinely unique narrative content that benefits from `Person` schema linking back to the Organization. Low priority but easy win for E-E-A-T.

- **404 page is excluded from sitemap correctly** but has no `<meta name="googlebot" content="noindex">` distinct from the generic `<meta name="robots" content="noindex">` (which already covers all crawlers including Googlebot). Same posture, no fix needed — note for completeness.

---

## Ship-now top 3

1. **Add `og:image:width` / `og:image:height` / `og:image:alt` to the 4 tool pages missing them** — `blurb.html`, `keywords.html`, `categories.html`, `bio.html`. Three lines each, copy-paste from `index.html:18-20`. Closes the social-share inconsistency in 5 minutes.
2. **Add `<lastmod>2026-05-08</lastmod>` to all 9 `<url>` entries in `sitemap.xml`.** One-line per entry. Google re-crawl signal for launch week.
3. **Add `SearchAction` to the homepage `WebSite` JSON-LD block at `index.html:29`.** Five lines added to the existing `@graph`. Eligible for sitelinks-search-box on the homepage SERP — material for the May 26 launch where the brand-name query "authorly" will appear immediately.

---

## What Authorly does well

- **Extensionless canonicals on 10/10 pages, perfectly mirroring the sitemap and the actual served URLs.** The single biggest defect Slatework had at the same readiness point is genuinely fixed here.
- **FAQPage JSON-LD with 4 well-shaped questions on the homepage.** All four answers are factual, specific, and cite-able by ChatGPT/Perplexity verbatim. The "Why use this instead of ChatGPT or Claude?" answer in particular is a direct LLM-citation magnet — it names specific Amazon constraints (50-char KDP keyword limit, 130–180 word Amazon blurb, 150-char Sponsored Products headline limit, 80-char Sponsored Brands).
- **Per-page WebApplication schema on every tool page** with consistent shape: `applicationCategory:BusinessApplication`, `operatingSystem:Any`, `isAccessibleForFree:true`, `offers:{price:0,priceCurrency:USD}`. Crawler-friendly, eligible for Google's "free" badge in the SERP.
- **Strict CSP that does not break SEO crawlers** — `_headers:7` allows fonts.googleapis.com for stylesheet, fonts.gstatic.com for fonts, self for everything else. No wildcard, no `unsafe-eval`. Crawlers see clean HTML, fonts load, JSON-LD renders.
- **Privacy/Terms pages have proper `WebPage` schema with `dateModified`** (`privacy.html:28`, `terms.html:28`). Already a signal Google can use to display "Last updated" in the SERP.
- **404 page is correctly noindex with the canonical removed** (was a recursive trap in prior review, now fixed). `404.html:8-9`.
- **Title tag pattern is consistent and keyword-led** — every tool page leads with the high-intent phrase ("Amazon book description writer", "KDP keyword expander", "Amazon category recommender", "Trope finder", "Amazon Ads headlines", "Author bio generator") then `— Authorly`. Crawler parses keyword first, brand second — the right order for a brand with no SERP equity yet.
- **Meta descriptions are 84–169 chars across the board** — none truncated, none under 80. Only privacy/terms are thin in *content*, not in *length*.
- **No JS-required content for crawlers** — every H1, H2, paragraph, and JSON-LD block is in the static HTML. The tool runtime (`tool.js`) only enhances; the page is fully indexable with JS off.
- **Robots.txt correctly disallows `/api/`** while allowing everything else. Sitemap is referenced. Clean.
- **`functions/_middleware.js` correctly emits `X-Robots-Tag: noindex, nofollow`** on blocked-doc paths (CLAUDE.md, distribution/, docs/). Belt-and-braces with the `_redirects` 404 rule.

---

## Cross-project (Slatework parity check)

**Patterns Authorly is missing that Slatework has:**
- **`SoftwareApplication` schema on the homepage** with explicit `softwareVersion` — `slatework/index.html:43-52` declares `"softwareVersion":"0.1.0"`. Authorly's homepage has only Organization + WebSite + FAQPage; no SoftwareApplication node and no version anywhere in the tool-page WebApplication blocks.
- **Per-tool-page schema includes `browserRequirements`** — `slatework/rates.html:32` declares `"browserRequirements":"Requires JavaScript"`. Authorly's WebApplication blocks (e.g. `blurb.html:25-27`) omit this.
- **Slatework's robots.txt disallows `/tests/`** in addition to `/api/`. Authorly's repo has no `tests/` directory at root, so this is moot — but if test fixtures ever land at the root, the rule will need to be added.

**Patterns Authorly has that Slatework is missing (or has worse):**
- **Authorly's FAQPage JSON-LD has 4 high-quality cite-able questions** that mirror the on-page FAQ block exactly (`index.html:29` JSON-LD vs. `index.html:269-296` HTML). Slatework's `index.html:53-100` has 5 questions but they're slightly more abstract ("Is my student's writing private?", "How does it stay free?"). Authorly's questions are more keyword-anchored to the actual tool surface.
- **Authorly's per-tool `WebApplication` schema is on 6/6 tool pages.** Slatework has it on `rates.html` (verified) but the SvelteKit-emitted tool pages render schema slightly differently across the site — Slatework's homepage is the cleaner reference, Authorly's tool-pages are the cleaner reference.
- **Authorly has a `WebPage` JSON-LD block with `dateModified` on `/privacy` and `/terms`.** Slatework's privacy/terms pages (per Slatework's launch review) had no JSON-LD as of v0.2.
- **Authorly's `_headers` enforces a stricter CSP** (`script-src 'self' 'unsafe-inline'` only — no third-party JS allowed) compared to Slatework's older permissive CSP. This is post-strict-CSP-refactor at Slatework, so they should be roughly equivalent now, but Authorly's deploy never had the permissive phase.
- **Authorly's `_redirects` + `functions/_middleware.js` belt-and-braces approach to blocking docs** is more thorough than Slatework's exclusion-via-build-boundary approach. Different deploy stacks (CF Pages vs. SvelteKit-on-CF-Pages), but the security posture is at least as strong.

**Net cross-comparison:** Authorly's SEO is roughly on par with or slightly tighter than Slatework's at the same launch-readiness point, with the exception of `SoftwareApplication`+`softwareVersion` on the homepage and `browserRequirements` on tool pages (both 30-second adds). FAQPage Q&A quality favors Authorly. Long-form content depth favors neither (both are thin tool-wrapper sites; both will need a `/guides/` push in v0.2 to compete with Reedsy/Self-Publishing School type incumbents).
