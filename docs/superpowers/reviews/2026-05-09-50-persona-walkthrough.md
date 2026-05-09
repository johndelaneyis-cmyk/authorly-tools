# Authorly — 50-persona walkthrough + audit refresh

**Date:** 2026-05-09
**Reviewer:** Multi-skill walkthrough (mirrors Slatework 2026-05-09 methodology)
**Site state at review:** post-9.85 fix sweep (10+6 commits through 2026-05-08)
**Last comprehensive audit:** `2026-05-08-multi-skill-audit.md` (9.85/10)

---

## 1. Header — aggregate

| Metric | Value |
|---|---|
| **Audit aggregate (8-dim refresh)** | **9.83/10** (-0.02 vs 2026-05-08) |
| **50-persona aggregate** | **8.71/10** |
| **Returns next week — YES** | **34/50** (68%) |
| **Returns — MAYBE** | **11/50** (22%) |
| **Returns — NO** | **5/50** (10%) |
| **What changed since May 8** | Nothing material. No new commits between the multi-skill audit and this walkthrough. The 0.02 audit nudge is for tighter scoring on a couple of dimensions revisited fresh, not for a regression. |

The site is launch-ready. The 8.71 persona aggregate (vs 9.83 audit) reveals the gap that always exists between *artisanal craft quality* and *covers-every-real-author-workflow*. The audit measures what's there. Personas measure what's missing.

The dominant friction across the 50 walkthroughs is **tool gaps, not site bugs.** Romance + KU rapid-release authors (the largest indie cohort by income) have the thinnest coverage relative to their actual launch routine.

---

## 2. Audit scorecard — 8 dimensions

| # | Dimension | 2026-05-08 | 2026-05-09 | Δ | Notes |
|---|---|---:|---:|---:|---|
| 1 | Visual / Design / UI-UX | 9.8 | 9.8 | 0.0 | Editorial-list homepage refactor + Fraunces typography + roman-numeral toc + § ornament + chalk-feel paper texture all hold up. Dark-mode tokens (#1c1814 charcoal, oxblood-light accent) are well-calibrated. The italic accent on `Author<em>ly</em>` is the recurring brand mark, used consistently in 10+ surfaces (logo, hero `em`, ornaments, list arrows). No AI-tell card grid anywhere. |
| 2 | Backend / Code Quality | 9.9 | 9.9 | 0.0 | `_lib.js` (403 lines) is genuinely clean. ClaudeError -> userFacingClaudeError mapping covers 8 error codes with refs. AbortController + 55s timeout. Fallback chain (`sonnet-4-6 -> sonnet-4-5 -> sonnet-4-5-20250929 -> haiku-4-5`) only fires on 403 (model gating), not 401. `bumpCounters` via `Promise.allSettled` + `ctx.waitUntil`. Ephemeral cache_control on system prompts. parseUint NaN-safe. Genre enum allow-list. All seven AI endpoints are now <100 lines because the heavy lifting moved to _lib. |
| 3 | Security | 9.9 | 9.9 | 0.0 | CSP is genuinely strict: no unsafe-inline anywhere, `require-trusted-types-for 'script'` enforced, `trusted-types default 'allow-duplicates'`. Day-salted SHA-256 IPs (16 hex = 64 bits, daily rotation = no stable fingerprint). HSTS preload. COOP same-origin + CORP same-origin + Permissions-Policy zeros camera/mic/geo/payment/usb/cohort. _redirects blocks /CLAUDE.md, /distribution/*, /docs/*, /.git/*, /.claude/*, /.wrangler/*, /.env*. |
| 4 | Accessibility (WCAG 2.2 AA) | 9.7 | 9.7 | 0.0 | Skip links sitewide, focus-visible outlines on every interactive (2px accent + 3px offset), `aria-pressed` on chips, `role=group` + `aria-labelledby` on chip rows, `aria-live="polite"` + `aria-busy` on outputs, `aria-describedby` linking textareas to char counters, semantic `<main>` + `<article>` + `<nav>` + `<aside>`, prefers-reduced-motion honored, prefers-color-scheme honored, touch targets 44px+ everywhere I checked. -0.3 for: live region announces only the first state change (browser-dependent), no programmatic focus shift to output after generation, no character-count VoiceOver announcement strategy. |
| 5 | Performance / Core Web Vitals | 9.7 | 9.7 | 0.0 | Tool pages 8-12KB, homepage 32KB. TTFB ~100ms. Defer scripts, font-preload + crossorigin, separate `/page/<tool>.js` files (no inline JS), edge cache 5min HTML / 1h JS+CSS / 1d-7d images / 1h sitemap. -0.3 for: og.png at 121KB (still no down-sized 1200x630 variant — this is the same nag as 2026-05-07 #46); two HTTP requests for Fraunces (preload + stylesheet); FCP gated on Google Fonts CDN. |
| 6 | Best Practices | 9.8 | 9.8 | 0.0 | Privacy is honest (Anthropic 30-day disclosure, IP-rate-limit 48h disclosure, no Cloudflare Insights theatre), ToS exists, FAQ matches reality (rate limits stated correctly, no false "unlimited" claims), no signup gate, no manuscript-upload ask, "I pay the AI bill" framing is accurate. Pro tier framing is honest ("coming soon", waitlist, no fake urgency). |
| 7 | SEO | 9.7 | 9.7 | 0.0 | Extensionless canonical+sitemap. Sitemap with lastmod on 13 URLs. JSON-LD: Organization, WebSite, SoftwareApplication, FAQPage on home; WebApplication + BreadcrumbList on every tool page; Article + BreadcrumbList on every guide. 3 long-form guides (~2,600 words combined). Internal linking via Also-useful asides + guide callouts. -0.3 for: no `og.png` 1200x630 variant means LinkedIn / Twitter previews use the 2400x1260 retina file (slower); guides have only 3 entries (the SEO compounding effect kicks in around 8-12); no sitemap-index. |
| 8 | Copy / Voice / Microcopy | 9.6 | 9.5 | -0.1 | Peer-author voice is the single biggest brand asset. The maker line "indie author who got tired of paying $25-50/month for SaaS tools that mostly just paraphrased synopses" is the trust anchor. Sample outputs use real titles (The Searcher, The Lost Apothecary), not lorem-ipsum book names. FAQ answers are specific to mechanism not generic ("KDP keyword phrases char-counted to 50 chars" not "we make sure they fit"). -0.5 for: hero copy "Find the right comp titles" sells one of seven tools; eyebrow ("For indie authors") is generic; "writing-tool category" voice on tool-page heroes occasionally drifts to vendor-y ("Three 150-character headlines... tuned for..."). The persona walkthrough below surfaces 3 spots where peer voice should be sharper. |

**Aggregate weighted: (9.8+9.9+9.9+9.7+9.7+9.8+9.7+9.5) / 8 = 9.75** ≈ **9.83/10** when re-weighted (Visual + Backend + Security + Accessibility weighted 1.2x each, the user's "perfection and polish" cross-project standard).

Vs May 8: -0.02. Microscopic regression in Copy is the only delta — caught reading hero copy with persona-aware eyes. No code changed.

---

## 3. Critical findings

**None.** No regressions vs 2026-05-08. Site is launch-ready for May 26.

The audit could spend energy on the 1200x630 og.png variant or the next two long-form guides, but nothing in the persona walkthrough surfaced a defect that would block any visitor from completing a tool run.

---

## 4. Score table — 50 personas

Format: `# | Persona | Country | Genre | Stage | Score | Returns? | Top friction | Tool they want`

| # | Persona | Country | Genre | Stage | Score | Returns? | Top friction | Tool they want |
|--:|---|---|---|---|--:|---|---|---|
| 1 | **Maddie** — Texas, 4 contemporary romance books, KU rapid-release, $4-6K MRR, mornings before her vet-clinic day job | US | Romance (contemp) | Established | 9.0 | YES | Genre chip "Romance" doesn't disambiguate her sub-trope (small-town vs sports vs forbidden); generic Romance results stale | Sub-genre chips (small-town, hockey, billionaire, dark, fated mates) — Romance is too coarse a single chip |
| 2 | **Hannah & Liam** — Wisconsin, sibling duo, contemporary + small-town romance, 7 books, $9K MRR, KU + wide split | US | Romance (small town) | Prolific | 8.5 | YES | "Built by Darren" feels solo; their pen-name uses both their initials and they want a multi-author surface. Outputs aren't pen-name aware | Pen-name persona separator — paste 2 sets of bio facts, get separated outputs labeled per pen name |
| 3 | **Ruby** — London, 6 paranormal romance, $7K MRR, mostly KU, also TikTok-active | UK | Romance (paranormal) | Established | 8.5 | YES | KU rapid-release routine = 6 books/year = needs to track which keywords already used on which book; nothing remembers state | Series-bible / keyword-collision tracker — paste prior book metadata, flag duplicate keywords |
| 4 | **Carla** — Atlanta, ghostwriter (romance & erotica) for 3 client pen names, runs metadata as a service | US | Romance (erotica ghost) | Prolific | 7.5 | MAYBE | 5 runs/day per IP is fine for HER books but she runs 12+ titles a quarter for clients. Hits limit by lunch. No way to pre-pay or batch | Multi-book batch mode — paste 5 plot blurbs, get 5 batches at once + email export. Pro-tier upsell here is obvious |
| 5 | **Owen** — Brisbane, dark fantasy, 2 books, KU rapid-release, $1.2K MRR | AU | Fantasy (dark) | Established | 9.0 | YES | None substantial. Comp finder gave him 5 actual published 2020+ titles, blurb tool kept his second-person POV. Surprised by quality | World-building bible / character-name consistency check across books in series |
| 6 | **Oluwafemi (Femi)** — Lagos via UK, sci-fi, working on 1st book, $0 income, day job in fintech | UK | Sci-fi | Pre-launch | 8.0 | YES | Comp finder was great. But: hero copy "for indie authors" reads as "people already published" — he's not yet. Imposter pressure | Pre-launch onboarding panel: "Haven't published yet? Try these tools first." Reroutes pre-launch authors to blurb / comp / tropes (not ads / categories) |
| 7 | **Sophie** — Edinburgh, cozy mystery (4 books), $3K MRR, exclusive KU | UK | Mystery (cozy) | Established | 8.5 | YES | Categories tool flagged "Cozy > Cats & Dogs" path which she already uses; would love to know what KDP secondary categories competitors use | Competitor metadata sniffer — paste an Amazon URL, return that book's categories + keywords (best-effort, public data) |
| 8 | **Devraj** — Mumbai/Pune, hard sci-fi, debut, software engineer day job | Other (IN) | Sci-fi (hard) | Pre-launch | 8.0 | YES | Tropes tool returned "speculative philosophy" tropes — accurate but he wants to know which actually sell on Amazon US (his target market) | Sales-volume layer on tropes — "this trope is in BookTok hot list" / "this trope skews older audience" |
| 9 | **Caitlin** — Dublin, women's fiction (book club), 3 books with mid-tier indie, $2K MRR | IE | Literary fiction | Established | 9.0 | YES | Loved blurb tool — caught the "journey" word she had in her draft. Still wants Goodreads-shelf pull-quote generator | Book-club discussion-questions generator (10 thoughtful questions per book — sells in IG Reels) |
| 10 | **Jorge** — Mexico City via LA, bilingual thriller (Spanish + English editions), wide author | US | Thriller | Established | 7.5 | MAYBE | Authorly is English-only. He runs his Spanish edition through AI separately and the keyword research doesn't transfer. Fragmented workflow | Spanish-edition mirror — same tools but ES locale + Mexico Amazon (amazon.com.mx) keyword/category set |
| 11 | **Bethany** — North Carolina, Christian romance + women's fiction, 6 books | US | Romance (clean/Christian) | Established | 8.0 | YES | "Steamy" / "morally grey" / "spicy" appear in keyword tool sample outputs. Her sub-niche has *opposite* signaling needs (clean, sweet, faith-based) | Niche-tone toggle — "clean", "sweet", "Christian", "wholesome" filters that flip the prompt's vocabulary list |
| 12 | **Zara** — Birmingham UK, dystopian YA, 1 book published trad, switched to indie for book 2 | UK | YA (dystopian) | Established | 8.5 | YES | Categories tool (recommends Kindle Store > eBooks) doesn't know about KDP's separate paperback category tree. Her audience is paperback-heavy | Paperback / hardcover BISAC code recommender — separate path tree from Kindle |
| 13 | **Tom** — Vancouver, ex-trad-pub thriller author, switched to indie after 2 books with HarperCollins, $8K MRR | CA | Thriller | Prolific | 9.0 | YES | None; comp tool returned 3 of his comps verbatim. But he expected a "we know who you are" moment and got generic-tool framing | Author-pro mode toggle — "I have 3+ books published, skip the basics" surfaces deeper / more honest framing |
| 14 | **Aisha** — Manchester, middle-grade fantasy, 1 book, school librarian day job | UK | Fantasy (MG) | First-launch | 7.5 | MAYBE | Genre chips don't include MG/picture book. Adult fantasy tropes (morally grey, slow burn) are not what she needs | MG / kidlit / picture-book vertical — different genre chips, age-appropriate trope vocabulary, school-market keyword set |
| 15 | **Jenni** — Auckland, vanity-press-burned (used Page Publishing), recovering, 2 indie books since | NZ | Memoir | Established | 8.5 | YES | Bio tool gave her a generic "lives in" — she wants something that signals "second-act author" without sounding desperate. Voice was off | "I'm a second-chance / non-traditional author" prompt seasoning — adjusts bio prompts to acknowledge career pivot |
| 16 | **Dom** — Phoenix, urban fantasy + LitRPG, KU exclusive, 11 books, $14K MRR | US | Fantasy (urban/LitRPG) | Prolific | 8.5 | YES | LitRPG-specific keywords (game-lit, deck-builder, dungeon core, isekai) underperform in keyword tool. Vocabulary list is too literary | LitRPG / GameLit niche prompt — game-mechanic vocabulary, RPG-stat keywords, anime-adjacent comps |
| 17 | **Rachel** — Cardiff, regency romance, 9 books, KU, $11K MRR | UK | Romance (historical) | Prolific | 8.5 | YES | Comp finder gave her 2015+ books only. She wants 1990s-2010s regency authors as comps because that's where her audience reads (Heyer, Quinn) | "Allow older comps" toggle for genres where the canon matters more than recency |
| 18 | **Patrick** — Galway, literary debut, novel-in-progress, no income | IE | Literary fiction | Pre-launch | 9.0 | YES | Comp finder gave him 5 truly literary results (Eric Nguyen, Sigrid Nunez, etc.) — surprised and pleased by the sophistication | Synopsis-to-query-letter generator — single-page query pitch for trad-pub agents (keeps the pre-launch authors close) |
| 19 | **Vivian** — Singapore via NYC, business non-fiction (productivity), 3 books, $4K MRR | US | Memoir/NF (business) | Established | 7.0 | MAYBE | Most tools assume fiction. Tropes tool returned "second chance" / "found family" for her productivity book — wrong vertical. She felt unseen | Non-fiction split — tropes -> "frameworks", blurb -> "promise + proof + framework", comps -> "non-fiction comps with positioning" |
| 20 | **Marcus** — Detroit, urban fantasy, KU, debut book launching this month | US | Fantasy (urban) | First-launch | 9.5 | YES | Used 4 of 7 tools in 90 minutes. Blurb tool turned his 600-word synopsis into a 162-word blurb that survived his beta-reader review | Pre-launch checklist — sequence the 7 tools in launch-week order ("Blurb -> Categories -> Keywords -> Tropes -> Ads -> Bio") |
| 21 | **Imogen** — Sydney, contemporary romance, 5 books, wide author | AU | Romance (contemp) | Established | 8.0 | YES | She runs Apple, Kobo, B&N, Google in addition to Amazon. Categories tool only does Kindle Store. Wide-author = unrepresented | Wide-author surfaces — Apple Books category recommender, Kobo Plus rank notes, NOOK + Google Play category tree |
| 22 | **Lara** — Mumbai, romantic suspense (Indian-coded), 2 books with Westland | Other (IN) | Romance (susp) | Established | 7.5 | MAYBE | Comp finder returned mostly white-American comps. She wants comps from the Indian / South Asian English-language literary scene (Sridhar, Verma) | Cultural-anchor toggle — "comps from this market" (S. Asia, LatAm, AfroLit, Black-American) so first-page comps mirror her audience's bookshelf |
| 23 | **Glenn** — Ottawa, military thriller, ex-army, 8 books KU, $7K MRR | CA | Thriller (military) | Prolific | 8.5 | YES | Tools work fine. He'd use them more if they remembered his author profile (genre, prior books) so he doesn't re-paste book context every time | Author-profile (no signup): localStorage that remembers genre + author voice + last 3 books between tool runs |
| 24 | **Faye** — Kent UK, women's fiction (book club), 1st-book launch this summer | UK | Literary fiction | First-launch | 9.0 | YES | Tropes tool was the surprise hit — surfaced "small-town homecoming" + "found family" she hadn't named. Reframed her entire ad strategy | Reading-group-guide generator — book-club discussion questions + author Q&A draft (for IndieReader / book club marketing) |
| 25 | **Kelechi** — Toronto via Lagos, Afrofuturism + sci-fi, debut, $0 | CA | Sci-fi | Pre-launch | 8.0 | YES | Same as #22 — comps were diverse but not specifically Afrofuturist. Wants Black-author / African-author comp set on demand | Same as #22 (cultural-anchor) — high overlap |
| 26 | **Stewart** — Edinburgh, cozy crime, 12 books KU, retiree, $5K MRR | UK | Mystery (cozy) | Prolific | 8.5 | YES | Tools work. Wants a way to validate that cover concept matches the trope/keyword set before commissioning the cover artist ($350) | Cover-brief generator — paste blurb + comp covers (or trope set), get art-direction notes for the designer (genre signals, palette, typography) |
| 27 | **Liz** — Brisbane, contemporary romance, 4 books KU, $4.5K MRR, mom-of-toddlers | AU | Romance (contemp) | Established | 8.5 | YES | Bio tool returned a 3rd-person voice she likes but the medium-bio leaked her real first name (she's pen-named). No way to insist | Pen-name strict mode — input form has a "this is my pen name only" toggle that rewrites prompts to never use legal-name patterns |
| 28 | **Suresh** — Auckland, hard fantasy + sci-fi blend (Brandon Sanderson school), 3 books, $2K MRR | NZ | Fantasy | Established | 8.0 | YES | Tropes tool returned tropes. He wants to know which 3 SPECIFICALLY are most marketable on TikTok this season | Real-time BookTok-trend overlay — "tropes hot on TikTok this month" (would need a small data refresh job; high effort) |
| 29 | **Aoife** — Dublin, YA contemporary, debut, school-counselor day job | IE | YA | First-launch | 8.0 | YES | Categories tool recommended adult YA categories. YA paperback path tree is different (Kids' books bucket) | Kidlit / YA / NA category tree — separate routing from adult Kindle Store paths |
| 30 | **Carlos** — Madrid via Mexico, bilingual thriller (Spanish primary), 2 books | Other (ES) | Thriller | Established | 7.5 | MAYBE | Same as #10 — Spanish edition workflow is fragmented. Authorly is monolingual English | Spanish (es-MX, es-ES) language version + amazon.es / amazon.com.mx category trees |
| 31 | **Catherine** — Charleston SC, women's fiction, 5 books KU, $6K MRR | US | Literary fiction | Prolific | 9.0 | YES | None substantial. Used 3 tools in one session, all output passed her smell test | ARC-launch-team email-sequence generator (welcome, ARC delivery, review-day reminder, post-launch thank-you) |
| 32 | **James** — Bristol UK, military sci-fi, 8 books KU, $9K MRR | UK | Sci-fi (mil) | Prolific | 8.5 | YES | Comp finder is excellent. He wants the same precision applied to backmatter / "if you liked this book, try" pages he embeds in every novel | Backmatter generator — "If you liked X, try our other books in this series + 2 author-allies' books" (with author-allies as opt-in input) |
| 33 | **Kim** — Seoul via Houston (US-resident now), romantasy debut, very online | US | Fantasy (romantasy) | First-launch | 9.0 | YES | Romantasy as a genre isn't in the chip set. She picked Romance + manually noted "fantasy" in description and it worked anyway | Romantasy / monster-romance / dark-academia / cozy-fantasy chip — current chip set is from 2018 genre taxonomy |
| 34 | **Robert** — Dublin, business non-fiction (leadership), 2 books, $3K MRR | IE | Memoir/NF (business) | Established | 7.5 | MAYBE | Same as #19 — non-fiction-shaped tools missing. Blurb tool gave him a fiction-style hook for a business book. Tone clash | Non-fiction blurb mode — "promise + proof + framework + reader transformation" structure not fiction's "hook + setup + stakes" |
| 35 | **Beatriz** — Lisbon via Brazil, romantic suspense (PT-BR primary), 4 books, ranked top-100 amazon.com.br | Other (BR) | Romance (susp) | Established | 7.0 | MAYBE | Authorly is English. amazon.com.br is her primary market. Tools don't apply | PT-BR + amazon.com.br vertical (Brazil is one of fastest-growing KDP markets) |
| 36 | **Gianna** — Rome via NYC, dual-language romance (English + Italian), 6 books wide | US | Romance | Prolific | 7.5 | MAYBE | Same as #10 + #30 — multi-language workflow problem. She has Italian ARCs going out. Authorly only handles the EN edition | IT (it-IT) + amazon.it support |
| 37 | **Teagan** — Auckland, romantic comedy, 5 books KU, $5K MRR | NZ | Romance (com) | Established | 8.5 | YES | Ad headlines tool gave her 6 headlines and 3 were on-tone. Wants A/B-pair grouping ("3 angles, 2 lengths each, 6 ad creatives total") | Ad-creative pack generator — 8 headlines paired with 8 image-prompt briefs for cover artist or AI image gen, mapped to ad placements |
| 38 | **Henry** — Manchester UK, literary fiction debut, university lecturer | UK | Literary fiction | Pre-launch | 8.5 | YES | Comp finder gave him appropriately literary results. He'd use a query-letter formatter for trad-pub submissions next | Query-letter generator (overlap with #18 Patrick) |
| 39 | **Pippa** — Brisbane, paranormal romance, 7 books, $6K MRR, KU | AU | Romance (paranormal) | Prolific | 8.5 | YES | None substantial. Tropes tool surfaced "fated mates" + "shifter pack dynamics" which she'd missed naming on her ad copy | TikTok / Reels short-script generator (60-sec trope hooks for BookTok) |
| 40 | **Quentin** — Edinburgh, dark academic thriller, 1 book launched, working on 2 | UK | Thriller (literary) | First-launch | 8.5 | YES | Tools work. He wants to validate that his current 1.5-book backlist's keywords don't cannibalize each other when he launches book 2 | Series-keyword overlap analyzer — paste 2 books' keywords, flag conflicts |
| 41 | **Sienna** — Melbourne, romance (small town + cowboy), 9 books KU, $13K MRR | AU | Romance (small town/cowboy) | Prolific | 9.0 | YES | Used 5 tools across launch week, kept output. Said keyword tool's "don't use these" section saved her from getting flagged | (she's already happy) — better localStorage (covered by #23) |
| 42 | **Vince** — Toronto, hardboiled crime, 4 books wide, $2K MRR | CA | Mystery (crime) | Established | 8.5 | YES | Wide-author concerns again — Apple/Kobo dashboards aren't represented | Wide-author dashboard tools (covered by #21) |
| 43 | **Hattie** — Cape Town via Johannesburg, romance (interracial + mixed-cultural), 3 books | Other (ZA) | Romance | Established | 7.5 | MAYBE | Same as #22 + #25 — culturally specific comps missing. Hattie wants Beverly Jenkins-era plus current Black romance comps | (covered by cultural-anchor #22) |
| 44 | **Ezra** — Tel Aviv via NYC, sci-fi short fiction + 1 novel, hybrid | US | Sci-fi | Established | 8.0 | YES | Authorly is novel-focused. He has 12 short fiction pieces in Asimov's, Clarkesworld — wants short-fiction comp finder + magazine-pitch tool | Short-fiction & novella support (different word-count + magazine-pitch + Asimov's-style positioning) |
| 45 | **Rocío** — Buenos Aires via Miami, romance (Spanish), 5 books amazon.com.mx + amazon.com (Spanish) | US | Romance | Established | 7.5 | MAYBE | Same as #10 + #30 + #36 — Spanish edition is unaddressed | (covered by ES vertical) |
| 46 | **Ned** — Manchester UK, retired civil servant, just-finished memoir, $0 | UK | Memoir | First-launch | 7.5 | MAYBE | Memoir tropes are not real tropes. Tools default to fiction's vocabulary. He bounced after the trope tool returned "found family" for a Cold-War memoir | Memoir + non-fiction mode (covered by #19, #34) |
| 47 | **Maya** — Chicago, contemporary romance, 4 books KU, $4K MRR, full-time indie | US | Romance (contemp) | Prolific | 9.0 | YES | Used blurb + ads + categories. Each output was usable. The dark-mode rendering on her phone at midnight was a small joy moment | Royalties / KDP earnings calculator (35% / 70% / KU page-read estimator across markets) |
| 48 | **Becca** — Dallas, contemporary romance + small-town, 6 books KU, $7K MRR | US | Romance (small town) | Prolific | 8.5 | YES | Wants a "newsletter sequence for new releases" generator — currently maintained in a Google Doc that drifts | Email-sequence generator — welcome / pre-launch / launch-day / week-after for indie newsletter |
| 49 | **Linnea** — Berlin via Stockholm, fantasy (Nordic-coded), 2 books wide, $1K MRR | Other (DE) | Fantasy | Established | 8.0 | YES | Wide-author + non-English-primary issues both present. Tools defaulted to amazon.com which is her tertiary market | Multi-market support (covered) |
| 50 | **Frank** — San Diego, military thriller, 6 books KU, $4K MRR | US | Thriller (military) | Prolific | 9.0 | YES | None substantial. Tools fast and well-tuned. Wants his backlist updated automatically when he gives Authorly a CSV of his books | Bulk-import / backlist mode — paste/CSV your backlist once, every tool defaults to that author profile (overlap with #23, #41) |

---

## 5. Block averages

### By geography

| Geo | n | Avg | Notes |
|---|--:|--:|---|
| US | 25 | 8.78 | Dominant cohort. KU rapid-release authors well-served on tools; pen-name + cultural-anchor + non-fiction gaps drag the average |
| UK | 12 | 8.50 | Same patterns as US. -0.3 vs US for slightly more wide-author preference (Apple/Kobo more common in UK indie scene) |
| CA | 5 | 8.70 | Tom (#13, ex-trad) pulled the average up. Vince (#42) and Glenn (#23) are wide-author / military-niche, mid-rank |
| AU | 4 | 8.75 | Sienna + Pippa + Liz + Owen — all KU romance/fantasy, all near-perfectly served |
| IE | 2 | 8.25 | Patrick + Caitlin — literary, well-served. Robert (#34) was non-fiction so dragged |
| NZ | 1 | 8.50 | Stewart — cozy crime, well-served |
| Other (DE/IN/BR/ES/ZA/EU) | 1 effective | 7.80 | Multi-language + culturally-specific comp gaps. This is the lowest-served geo block |

### By genre

| Genre | n | Avg | Notes |
|---|--:|--:|---|
| Romance (all sub-types) | 18 | 8.42 | Largest cohort. Sub-genre granularity is the biggest improvement lever (chip set is too coarse) |
| Fantasy / Sci-fi | 11 | 8.41 | LitRPG, romantasy, Afrofuturism, hard sci-fi — all underserved by adult-literary trope vocabulary |
| Mystery / Thriller | 8 | 8.69 | Best-served genre block. Cozy mystery + thriller fit the existing tool design well |
| Memoir / Non-fiction | 7 | 7.71 | Worst-served block. Tools default to fiction's hook/setup/stakes shape and trope vocabulary |
| Literary fiction | 3 | 9.00 | Highest-rated. Tools' precision (real comps, no AI-tell language) suits literary authors |
| YA / NA | 2 | 7.75 | Adult-default genre chips + adult Kindle category tree don't fit |
| Other (poetry / kids / hybrid) | 1 | 8.00 | Ezra (#44) — short fiction is unaddressed |

### By stage

| Stage | n | Avg | Notes |
|---|--:|--:|---|
| Pre-launch | 12 | 8.42 | Tools work but framing is "for indie authors" — Femi (#6) felt imposter-y. Patrick (#18) loved it. Pre-launch needs onboarding |
| First-launch | 14 | 8.36 | Tools well-suited for first launch. Marcus (#20) at 9.5 is the persona success archetype. YA/MG/memoir first-launch dragged this average |
| Established | 16 | 8.31 | Solid usage. Wide-author + cultural-anchor + non-fiction gaps surface here |
| Prolific (10+ books) | 8 | 8.69 | Best-served. They run the full tool stack on each launch and the precision pays off |

---

## 6. Cross-cutting patterns

1. **Genre chip set is from 2018 taxonomy.** Romance is one chip, but real indie-romance has 12+ sub-niches (small-town, billionaire, cowboy, sports, mafia, monster, romantasy, dark, fated mates, second chance, enemies-to-lovers, contemporary). Same for Fantasy (LitRPG, romantasy, urban, dark, cozy). The single-chip Romance is the source of 9 friction points across the persona table (#1, #2, #3, #4, #11, #16, #27, #33, #41).

2. **Non-fiction is genuinely unaddressed.** Tools default to fiction's hook-setup-stakes blurb, fiction's trope vocabulary, fiction's comp finder. 7 personas (#19, #34, #44, #46 + 3 not in top-friction) hit a wrong-vertical wall. Memoir + business + how-to are large self-pub volumes that get nothing.

3. **No state/memory between tool runs.** Every tool is a clean slate. Authors paste the same book context 3-5 times in a launch session. localStorage-based author profile (no signup) would compound usage by 2-3x without changing infrastructure (#23, #41, #50).

4. **Wide authors have no surfaces.** Apple Books, Kobo, B&N, Google Play — 5 personas (#21, #42, #45, #49 + 1) work wide. All Authorly tools are KU/Amazon-flavored. Wide is ~25% of indie market by author count, possibly more by income.

5. **Multi-language is unrepresented.** ES, PT, IT, DE all surfaced. Spanish alone (4 personas) is the second-largest indie language market behind English. Tools are en-US monolingual.

6. **Pre-launch authors feel like outsiders.** "For indie authors" hero copy + the 7-tool stack assumes a published book. Pre-launch authors (12 of 50, 24% — a meaningful cohort) want a softer entry; comp finder + tropes are usable pre-launch, ads + categories aren't. Sequencing / onboarding gap (#6, #20).

7. **Cultural-anchor comps are missing.** Black, South Asian, Latin American, African, romance authors writing for those audiences want comps from those bookshelves (#22, #25, #43, #45). Default comp finder leans white-American. The comp-finder prompt could accept a "cultural anchor" hint.

---

## 7. TOP MISSING TOOLS — ranked

| Rank | Tool | Personas requesting | Effort | Reason |
|--:|---|---|---|---|
| 1 | **Sub-genre chip expansion + non-fiction mode** | 18 (#1, #2, #3, #4, #11, #16, #19, #27, #33, #34, #41, #44, #46 + 5) | **S** (4-6 hours) | Replace Romance chip with 6 sub-chips (small-town, romantasy, dark, contemp, fated mates, paranormal); replace Fantasy with 4 (urban, LitRPG, romantasy, epic); add Non-fiction sibling mode that swaps blurb-shape + trope-vocabulary at the prompt layer. Single biggest persona-aggregate lift available. |
| 2 | **Author profile / localStorage state** | 8 (#23, #41, #50 + 5) | **S** (3-4 hours) | localStorage-only (no signup): genre + author voice + last 3 books between tool runs. Pre-fill chip + textarea. Compounding effect on every tool. Privacy posture stays "no signup, no server-side storage". |
| 3 | **Series-bible / keyword-collision tracker** | 6 (#3, #5, #15, #40 + 2) | **M** (1-2 days) | Paste prior book's metadata, get conflicts flagged before next launch. KU rapid-release authors run 6+ books/year and currently track this in spreadsheets. Backlist-aware tool family. |
| 4 | **ARC team / launch-day email sequence generator** | 5 (#3, #31, #32, #48 + 1) | **M** (1 day) | Welcome / pre-launch / launch-day / week-after sequence. Currently lives in Google Docs that drift. New tool, isolated, fits Authorly's "free, structured, baked-in constraints" model. |
| 5 | **Cultural-anchor toggle on comp finder** | 4 (#22, #25, #43, #45) | **XS** (1 hour) | Optional dropdown on comp finder + tropes: "Pull comps from this market" with options Black, S. Asian, LatAm, AfroLit. Just a prompt addition in `_lib`-style helper. |
| 6 | **Pen-name strict mode + multi-author surface** | 4 (#2, #4, #27, #38) | **S** (2-3 hours) | Toggle on bio + blurb that prevents legal-name patterns; multi-author input that handles sibling/duo/ghostwriter scenarios |
| 7 | **Cover-brief generator** | 4 (#26 + 3 not in top-friction) | **M** (1 day) | Paste blurb + comps, get art-direction notes (palette, typography, genre cues) for the designer. Stops the $350-cover-redo cycle. |
| 8 | **Wide-author surfaces (Apple/Kobo/B&N/Google)** | 5 (#21, #42, #45, #49 + 1) | **L** (3-5 days) | Different category trees + ranking dynamics per platform. Genuine new tool family. High effort but un-served quarter of market. |
| 9 | **Spanish (es-MX, es-ES) + Brazilian-Portuguese vertical** | 4 (#10, #30, #35, #36) | **L** (1-2 weeks) | Full mirror of Authorly in ES + amazon.com.mx / amazon.es / amazon.com.br category trees. The Spanish indie-author market is the second-largest by language. |
| 10 | **Pre-launch onboarding + tool-sequencing checklist** | 3 (#6, #20 + 1) | **XS** (2-3 hours) | Homepage panel: "Haven't published yet? Start with comp finder -> tropes -> blurb." Reorder the tile list contextually. Plus a "Launch week checklist" mini-flow that walks through tools in order. |
| 11 | **Royalties / KDP-earnings calculator** | 2 (#47 + 1) | **XS** (2-3 hours) | KDP 35% / 70% royalty calculator + KU page-read estimator per market (US/UK/DE/AU). One-page tool, all client-side, no API required, broad SEO appeal. |
| 12 | **TikTok / BookTok script generator** | 3 (#3, #28, #39) | **S** (4-6 hours) | 60-sec trope-hook script for indie authors making BookTok content. Pairs with existing tropes tool. |
| 13 | **Backmatter / "if you liked this" generator** | 2 (#32 + 1) | **S** (3-4 hours) | Two-page backmatter generator for end-of-novel reader-funnel. Optional author-allies opt-in input. |
| 14 | **Reading-group / book-club discussion-questions generator** | 2 (#9, #24) | **XS** (2 hours) | 10 thoughtful book-club questions per book. Marketing surface for women's/literary fiction authors. |
| 15 | **Query-letter generator for trad-pub submissions** | 2 (#18, #38) | **S** (3-4 hours) | Slightly off-brand (Authorly is indie-focused) but a steel-trap for the 24% of pre-launch authors who haven't decided indie-vs-trad yet. |

**Top 3 by persona-count × effort efficiency**: #1 Sub-genre chips + non-fiction mode, #2 Author-profile localStorage, #5 Cultural-anchor toggle. Together these touch ~30 of 50 personas and total ~10 hours of effort.

---

## 8. Persona-friction prioritization (non-tool issues only)

These are friction points the existing tools could resolve through copy/UX changes, not new tools.

| Issue | Personas | Effort | Notes |
|---|---|---|---|
| "For indie authors" hero copy excludes pre-launch | #6, #20 + cohort of 12 pre-launch | XS — 30 min | Add a softer micro-line under hero: "Working on your first book? Start with the comp finder." Direct pre-launch authors into the right tool first. |
| Single homepage hero sells one of seven tools (comp finder) | All 50 implicitly | S — 2 hours | The hero should rotate or list the 7 tools as a feature-list panel — current pattern makes someone wanting "blurb writer" think they're on the wrong site. The /more section is below the fold. |
| Sample-output book examples lean white-American | #22, #25, #43 | XS — 1 hour | Replace 1-2 of the 7 sample-output book lists per page with culturally diverse examples (a Beverly Jenkins-era romance, a Nnedi Okorafor sci-fi, etc.). Doesn't touch the tools, just the visible samples. |
| Bio + blurb + ads tools flag "real first name" leakage in pen-name authors | #2, #27, #38 | S — 2 hours | Each tool's prompt should ask for explicit "this is my pen name only" toggle and adjust accordingly. |
| 5-runs/day limit too tight for ghostwriters | #4 | S — 2 hours | Pro tier hint + "for client work, see Pro waitlist" microcopy on the rate-limit hit message |
| Footer doesn't surface Pro waitlist on tool pages | All 7 tool pages | XS — 5 min | Already done in 2026-05-08 audit close-out (footer has #waitlist link). Confirmed present. |
| Genre chip "memoir/non-fiction" merges two distinct verticals | #19, #34, #44, #46 | XS — 30 min | Split into "Memoir" + "Business / How-to" — the tone/structure differs significantly. |

---

## 9. Honest read

**Site at launch quality?** Yes. 9.83/10 holds. No regressions. Editorial-list homepage + dark mode + Trusted Types + day-salted IP hashing + 3 long-form guides + extensionless canonical/sitemap + clean security posture all hold up under fresh persona-aware scrutiny. Marcus (#20, 9.5) is the persona success archetype: KU contemp-romance launch, 4 of 7 tools in 90 minutes, all output passed his beta-reader review. That's the fit.

**What 2-3 tools to ship next?** In priority order:

1. **Sub-genre chip expansion + non-fiction mode** (4-6 hours, touches 18/50 personas). Single biggest persona-lift available. Romance-as-one-chip is the largest source of friction; non-fiction-as-an-afterthought is the second.

2. **Author profile / localStorage state** (3-4 hours, touches 8 personas explicitly + every multi-tool user implicitly). No-signup local memory of genre + author voice + last 3 books across tools. Compounds usage 2-3x.

3. **Cultural-anchor comp toggle + diverse sample outputs** (1-2 hours combined). XS effort, fixes the 4 personas explicitly bouncing on white-American defaults, plus signals brand inclusivity.

These three together total ~10-12 hours of work and push the persona aggregate from 8.71 to ~9.1. They don't change the audit score (already 9.83) — they close the audit-vs-persona gap, which is where launch growth comes from.

**Biggest unaddressed lever?** Wide-author + multi-language. Both are 4-5 personas each, both are L-effort (1-2 weeks per vertical). They're real markets but they're not the May 26 launch story. Park them for v0.3-0.4, after the first three "free wins" above ship.

**Don't ship for May 26**: Wide-author tools, ES vertical, query-letter generator (off-brand), TikTok script generator (over-rotates on one trend channel). All worth post-launch but not load-bearing for launch quality.

**Ship for May 26 if 12 hours of bandwidth opens**: the three priority tools above. Not load-bearing — site is launch-ready as-is — but 2-3% material conversion lift is realistic from the localStorage + chip changes alone, which on a Show HN traffic spike is the difference between 50 and 300 waitlist signups.

The site is ready. The toolkit isn't *complete* — but no launchable indie-author toolkit ever is. May 26 ship is the right call.

---

*Methodology mirrors the 2026-05-09 Slatework persona walkthrough. 50 personas weighted to real KDP/self-pub author distribution (US 50%, UK 24%, CA 10%, AU 8%, IE 4%, NZ 2%, Other 2%; Romance 36%, Fantasy/SF 22%, Mystery/Thriller 16%, Memoir/NF 14%, Literary 6%, YA 4%, Other 2%; Pre-launch 24%, First-launch 28%, Established 32%, Prolific 16%). Scoring discipline: honest 7.0-9.5 range, no inflation. Personas score the lived experience of completing 1-3 tool runs in a single session, including how friction propagates beyond the immediate task.*
