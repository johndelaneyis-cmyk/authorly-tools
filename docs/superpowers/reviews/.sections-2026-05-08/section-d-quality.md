# Section D — Quality — Authorly

**A11y:** 8.7/10
**Perf/CWV:** 8.9/10
**Best practices:** 8.4/10
**Combined:** 8.7/10

A solid, launch-ready posture. Strict CSP-style discipline almost everywhere
except `script-src` (which still permits `'unsafe-inline'`), measured asset
budget, real focus rings, real reduced-motion handling, no third-party
trackers, working skip links, real semantic structure, and a unified shared
CSS/JS runtime. The remaining gap to 9.5+ is concentrated in three areas:
(1) the `'unsafe-inline'` script-src loophole driven by 8 lines of duplicated
inline JS that the deferred `tool.js` already does, (2) form-error live regions
missing `role="alert"`, and (3) a few touch-target / placeholder / late-font
items that are cheap to close.

## Sub-scores

| Sub-dim | Score | Note |
|---|---|---|
| Semantic HTML | 9 | Real `<header>/<main>/<nav>/<footer>`, single h1 per page, logical heading hierarchy. |
| Keyboard nav | 9 | Focus-visible everywhere, working skip link, native buttons. Skip link uses legacy `left:-9999px` pattern (functional). |
| Forms a11y | 7.5 | Labels associated, but `.error` divs lack `role="alert"` — SR users miss validation feedback. Waitlist `aria-live="polite"` is correct. |
| Color contrast | 9 | All non-placeholder text passes AA (verified on the four `--ink*` tokens against `--paper`/`--paper-2`). Placeholder unstyled — browser default ~4.0:1 marginal. |
| Touch targets | 7 | `.copy-btn` is ~14×16px (font 11px, padding 3px 9px) — fails 24×24 AA. Header nav links inline-only — fail too. |
| Reduced motion | 9.5 | `@media (prefers-reduced-motion:reduce)` zeros animation/transition durations site-wide; `html{scroll-behavior:smooth}` not overridden but not a vestibular trigger at this scale. |
| LCP | 8.5 | LCP element is the H1 (text). Font preconnects ✓, but Google Fonts CSS isn't preloaded; FCP/LCP each blocked on 1 stylesheet round-trip. og.png is 121KB but only loaded by social scrapers (not user). |
| CLS | 9 | No images on tool pages; font is `display:swap` but Fraunces metric mismatch with Georgia fallback — small text-size shift on swap. No CLS-prone late-injected content. |
| INP | 9 | Vanilla handlers small; no long tasks; markdown render is O(n) over ~kB output. Submit-on-Enter, debouncing not needed. |
| Asset weight | 9.5 | tool.css 13KB, tool.js 10.6KB, feedback.js 5.8KB, og.svg 1.8KB, favicon.svg 0.4KB — total ~32KB JS+CSS, well under budget. |
| Caching | 9 | `_headers` hits all the right cadences: HTML 5min+SWR3600, static SVG 1d+SWR1wk, JS 1h+SWR1d. Missing entry for `/tool.css` and `/tool.js` (defaults to no rule). |
| Image strategy | 9 | No raster images on user pages. og.png 121KB stays out of critical path. og.svg dimensions in HTML say 2400×1260 but file is 1200×630 — minor metadata mismatch, no rendering impact. |
| Font strategy | 7.5 | Preconnect ✓; `display=swap` ✓; but stylesheet itself isn't preloaded, no `size-adjust`/`ascent-override` to match Georgia fallback metrics → small swap-shift. Variable font request includes both upright and italic axes — could subset. |
| Security headers | 8 | HSTS+preload, X-Frame-Options DENY, nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy locked, COOP/CORP same-origin, frame-ancestors 'none'. **`script-src 'self' 'unsafe-inline'` is the lone weak spot.** |

## Findings

### Critical (Lighthouse fails / WCAG AA fails)

- **`'unsafe-inline'` in `script-src`** — `_headers:7` — Defeats CSP's primary
  XSS mitigation. Slatework already runs without it. Driver: a duplicated 1-line
  inline IIFE on lines 32 of every HTML file (`document.querySelectorAll("a.contact[data-u]...`)
  that wires contact mailto. **Fix:** delete the inline script (every page already
  loads `feedback.js` and `tool.js` which both call `wireContactLinks()` —
  `feedback.js:11-30` and `tool.js:51-61`); then drop `'unsafe-inline'` from
  `script-src`. Removes ~10 LOC × 10 pages and tightens CSP from "unsafe-inline-script-src" (effectively no XSS protection from CSP) to the same posture Slatework ships.

- **Form errors not announced to screen readers** — `tool.js:131-137`, `ads.html:175-187` — `<div class="error">` is shown synchronously but has no `role="alert"` and isn't inside an `aria-live` region. Validation messages on too-short / too-long / network-fail input are silently rendered for SR users. **Fix:** in `tool.js:132` change `div.className = "error"` to `div.className = "error"; div.setAttribute("role", "alert")`. Same on `ads.html:175`, `ads.html:181`, `ads.html:185`. WCAG 3.3.1 (Error Identification) — currently fails AA.

### Important

- **Touch targets fail WCAG 2.5.8 AA** — `tool.css:94` (`.copy-btn` 3px/9px padding, 11px font) and header nav `tool.css:36-38` (no padding on `.nav a`). 24×24px minimum is the AA threshold; copy buttons are ~14×16, header nav links are roughly 18×20. **Fix:** `.copy-btn{padding:6px 11px;font-size:12px}` and `.nav a{padding:6px 4px;display:inline-block}`. Affects every tool page.

- **`'unsafe-inline'` in `style-src`** — `_headers:7` — Less critical than script-src (style injection is harder to weaponize), but every HTML page has a `<style>` block of page-specific overrides. **Fix path:** consolidate the page-specific styles into per-page CSS variables on `<body data-page="blurb">` selectors inside `tool.css`, or accept it as a deliberate trade-off and document. Slatework keeps `'unsafe-inline'` in style-src too — consistent with that posture, so accept-as-is is defensible.

- **Google Fonts stylesheet is render-blocking** — `index.html:37` and identical in 9 other pages. Pattern: preconnect → `<link rel="stylesheet">` → blocks LCP on a second round-trip to fonts.googleapis.com. **Fix:** add `<link rel="preload" as="style" href="...fonts.googleapis.com/css2?family=Fraunces..." crossorigin>` before the stylesheet link, or inline the small `@font-face` block. Estimated LCP improvement: 100–250ms on 3G/4G.

- **Variable font request is wide** — fetches Fraunces with `ital,opsz,wght,SOFT,WONK@0,9..144,300..900,0..100,0..1;1,9..144,300..900,0..100,0..1`. That's both upright and italic axes plus the optical-size, weight, SOFT and WONK axes for both. **Fix:** the site only uses italic on emphasis (em) and a handful of accent characters — drop the `;1,9..144,...` italic axis on pages that don't use italic display sizes (404, privacy, terms). For pages that do, the request is justified. Saves ~30–50KB on the lightweight pages.

- **`X-XSS-Protection` not set, but neither is the new equivalent** — Slatework also omits it. Modern advice: don't send it. Authorly is correct. (No change needed; flagged for completeness — prior review may have asked.)

- **No `_headers` rule for `/tool.css` and `/tool.js`** — `_headers:1-31` — Cloudflare default applies. The catch-all `/*` block at `_headers:1` only sets security headers (no Cache-Control). **Fix:** add `/tool.css` and `/tool.js` rules with `Cache-Control: public, max-age=3600, stale-while-revalidate=86400` (mirroring `/feedback.js`). Cuts subsequent-page-load CSS+JS reads by 99% within the SWR window.

- **Inline `<script>` for clipboard tools missing `.catch()`** — `index.html:262-268`, `keywords.html:175-181`, `bio.html:151-155`, `categories.html:172-178`, `tropes.html:166-172`, `ads.html:246-253`, `blurb.html:172-177` — `navigator.clipboard.writeText().then(...)` chains without `.catch`. On insecure-context (rare on Pages, but possible behind a non-HTTPS proxy or in old Safari) the promise rejects silently, leaving the button stuck on "Copy" with no user feedback. **Fix:** chain `.catch(function(){ b.textContent="Copy failed — long-press to copy"; })` on each writeText call. Trivial UX-resilience gain.

### Nice-to-have

- **Font metric override** — `tool.css:21` declares `font-family:"Fraunces",Georgia,serif` with `font-display:swap` upstream, but no `@font-face size-adjust/ascent-override` to match Georgia metrics. Result: small text-shift on font swap. **Fix:** define a local `@font-face Fraunces-Fallback` with `size-adjust:107%; ascent-override:90%` (numbers from the [Capsize](https://seek-oss.github.io/capsize/) generator for Fraunces vs Georgia). Drops swap CLS to near-zero. Nice-to-have because Fraunces ships from Google Fonts via the link — to do this right needs self-hosting the woff2.

- **Skip-link uses legacy `left:-9999px` pattern** — `tool.css:162` — Works, but the modern recommended hide pattern is `clip-path:inset(50%);clip:rect(0 0 0 0);` etc. (already used for `.visually-hidden` on line 161). **Fix:** unify to the same pattern. No functional change; consistency win.

- **og.png dimensions metadata mismatch** — `index.html:18-19` declares `og:image:width 2400 og:image:height 1260`, but the actual `og.svg` is 1200×630 and `og.png` may also be 1200×630 (file is 121KB). **Fix:** either re-render the PNG at 2400×1260 (sharper on Retina social previews) or correct the meta to `1200`/`630`. Social previews work either way; the lie is small but noticeable to crawler tooling.

- **Placeholder text contrast unstyled** — `index.html:116`, `keywords.html:99`, `categories.html:98`, etc. Browser default placeholder is ~50% of input color → on `#1a1814` over `#faf6f0` ≈ 4.1:1. **Fix:** `::placeholder{color:#8a857d;opacity:1}` on textareas/inputs in `tool.css` to lock at ~4.7:1. WCAG technically excludes placeholders from contrast requirements, but several jurisdictions' interpretive guidance includes them now.

- **Inline waitlist style block on homepage could move to tool.css** — `index.html:40-64` — ~20 lines of waitlist CSS appears once on the home page. Moving it to `tool.css` adds ~600 bytes everywhere but cleans up the index head and removes one inline-CSS surface. Worth it only when removing `'unsafe-inline'` from style-src is also on the table.

- **`ads.html` has bespoke fetch logic instead of `Authorly.initTool`** — `ads.html:140-258` — Every other tool page uses `Authorly.initTool({...})` (50 LOC config). ads.html duplicates ~120 LOC of fetch/error/genre-chip wiring. The shared runtime supports `extraFields:[{id,name,required,errEmpty}]` (`tool.js:142-149` and `tool.js:159-167`), which is exactly what ads.html needs for `title` (required) and `comps` (optional). **Fix:** rewrite `ads.html`'s inline script to use `Authorly.initTool({extraFields:[{id:"title",name:"title",required:true,errEmpty:"Please enter your book title."},{id:"comps",name:"comps"}], ...})`. Reduces ~120 LOC to ~30, eliminates the only divergence in tool init code, and fixes a second copy of the missing-`role="alert"` issue in one stroke.

- **No `<link rel="dns-prefetch">` companion** — Already have `preconnect` to fonts.googleapis.com and fonts.gstatic.com — no further action needed; `preconnect` is the strict superset of `dns-prefetch` and the browser handles the fallback automatically. (Flagged because some audits still recommend both — they shouldn't.)

- **CSP could enforce `Trusted Types`** — `_headers:7` — Adding `require-trusted-types-for 'script'; trusted-types default;` would be a meaningful upgrade once `'unsafe-inline'` is gone, since `Authorly.renderMarkdown` (`tool.js:10-48`) writes to `outBody.innerHTML`. The renderer already escapes `&<>` first (`tool.js:11-14`), so it's safe; wrapping it in a Trusted-Types policy makes that contract enforceable. Defer until after launch — diff cost ~10 lines, blast radius if misconfigured is "site goes blank."

## Ship-now top 3

1. **Drop the inline contact-link `<script>` at line 32 of every HTML page**, then remove `'unsafe-inline'` from `script-src` in `_headers`. The deferred `tool.js`/`feedback.js` already wire those links. Buys the biggest single security upgrade for ~10 line deletions × 10 pages and zero functional regression. (Verify by `grep -n "querySelectorAll(\"a.contact" *.html` before removal — 10 occurrences expected.)

2. **Add `role="alert"` to every dynamically-rendered `.error` div** (`tool.js:132`, `ads.html:175,181,185`). Two-line fix; closes the WCAG 3.3.1 AA failure.

3. **Bump `.copy-btn` padding to `6px 11px` and `.nav a` to `padding:6px 4px;display:inline-block`** in `tool.css:94` and `:36-38`. Fixes WCAG 2.5.8 AA (touch target 24×24) site-wide in ~3 lines.

## What Authorly does well

- **Strict CSP except for one weakness.** Everything except `'unsafe-inline'` in script-src is the gold-standard posture: `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`, no wildcards, no `data:` script, no third-party domains.
- **Real focus management.** `:focus-visible` outline, working skip-link, no `outline:none` overrides, native buttons with `aria-pressed` for the genre chip group.
- **Reduced-motion respected globally** via the standard `@media (prefers-reduced-motion:reduce){...}` block in `tool.css:173-175`.
- **Caching strategy is correct for an indie tool.** Short HTML cache + long static cache + SWR everywhere means edits ship in <5 minutes globally without sacrificing repeat-visit performance.
- **Asset weight is exemplary.** ~32KB total JS+CSS for a multi-page tool site. No bundler, no framework, no jQuery, no analytics. The performance budget Google publishes for "good experience" is 1.5MB; Authorly is at ~2% of that before fonts.
- **No third-party trackers at all.** No GA, no GTM, no Hotjar, no Cloudflare Insights script. Zero `connect-src` exfiltration surface.
- **Defensive function-side architecture.** `_lib.js` centralizes IP hashing, body-size cap, env guard with no info-leak, KV race-bounded rate limiting, sanitized AI error mapping, and `ctx.waitUntil` for non-blocking counter writes. That's better than most paid SaaS.
- **Unified footer + heading hierarchy across all 10 pages.** Reviewed all of: 404, ads, bio, blurb, categories, index, keywords, privacy, terms, tropes — same nav order, same skip-link target convention, same h1→h2→h3 progression.

## Cross-project (Slatework parity)

- **CSP is tighter than Slatework on `connect-src`** (Slatework allows cdnjs/unpkg/cloudflareinsights/exchangerate-api; Authorly only `'self'`). Authorly wins on this axis because it has no third-party JS dependencies.
- **CSP is looser than Slatework on `script-src`** — Slatework has no `'unsafe-inline'` because all scripts are linked files. Authorly has `'unsafe-inline'` only because of the duplicated contact-link IIFE on line 32 of each HTML page. Removing those 10 inline blocks brings parity. Recommended.
- **Font loading is better than Slatework.** Slatework `@import url('https://fonts.googleapis.com/css2?...')` inside CSS (`src/lib/styles.css:1`) is render-blocking and can't be preconnected without a separate hint. Authorly's `<link rel="preconnect">` + `<link rel="stylesheet">` pattern is the textbook recommendation. Don't regress to match Slatework — fix Slatework instead.
- **Caching strategy parity.** Both `_headers` files use the same 5min+SWR3600 / 1d+SWR1wk cadence. Authorly missing rules for `/tool.css` and `/tool.js` (Slatework has rules for `/src/lib/*` blanket). Add them.
- **`worker-src 'self' blob:` and `img-src ... blob:`** are in Slatework's CSP because of currency calculator features — Authorly correctly omits them. Don't add unless a tool needs them.
- **`og:image` strategy** — both ship a static SVG and a rendered PNG. Authorly's homepage `og.svg` does not match the `og:image:width/height` declared in HTML (1200×630 actual vs 2400×1260 declared). Slatework's analogous OG appears consistent. Fix.
- **Function-side rate-limiting and body-size guards (`_lib.js`)** are Authorly-only — Slatework has no equivalent server functions. No parity expected.

