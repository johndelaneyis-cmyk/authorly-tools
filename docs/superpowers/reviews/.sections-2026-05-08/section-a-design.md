# Section A — Design Taste & UI/UX — Authorly

**Score:** 8.7/10 — Genuinely distinctive book-print aesthetic with disciplined Fraunces variable-font usage, a real point of view (warm cream paper, oxblood accent, § ornaments), and tight cross-page consistency. Knocked from 9.5+ by: (1) prior review's "strict CSP" claim is false — `_headers:7` allows `'unsafe-inline'` for both `script-src` and `style-src`; (2) the homepage `tool-list` uses a 3-column auto-fill grid that reads as the AI-tell "3 equal cards horizontally"; (3) `ads.html` carries 80+ lines of bespoke duplicated JS instead of using the shared `Authorly.initTool` runtime; (4) inline `style=` attrs on a few links plus `style.cssText` in JS still leak into render; (5) `tool-card` and the `output` block sit at identical width/visual weight, blurring "input" vs "result" hierarchy when the answer arrives.

## Sub-scores

| Sub-dimension | Score | Note |
|---|---|---|
| Hierarchy | 8.5 | Hero h1 → eyebrow → ornament → tool-card flow reads cleanly. Soft spot: input panel and output panel are visually identical width with same border, so the answer doesn't feel like a destination. |
| Spacing | 9.0 | Genuinely consistent rhythm — 24/32/48/64/80/96 cascade is intentional. Container is a tight `max-w:720px`, which is right for a single-column reading tool. |
| Typography | 9.5 | Fraunces with `opsz`, `SOFT`, `WONK` variable axes is a real choice. `opsz 144` on display, `opsz 14` on body, italic accent in `<em>` tags. This is craft. |
| Layout | 7.5 | Single-column 720px container is correct for tools, but every page has the SAME structure top-to-bottom — feels samey across the 7 tool pages. No layout variance between e.g. /keywords (single seed input) vs /ads (3 inputs). |
| Cohesion | 9.0 | One CSS file (`tool.css`), one JS runtime (`tool.js`), one footer, one nav — exemplary. Lone defector: ads.html has its own bespoke JS (140+ lines of duplicated logic). |
| Distinctiveness | 9.5 | Cream paper background + SVG noise texture + Fraunces italic + § ornaments + oxblood `#a83232` accent = a clear book-print POV. Reads like Penguin's website, not Tailwind starter #847. |
| Anti-slop | 9.5 | Zero purple gradients. No glassmorphism. No emoji as icons. No "Acme Corp." Real copy throughout. The inline-SVG paper noise is a thoughtful touch. |
| Cross-page consistency | 9.0 | Footer is genuinely unified across all 10 pages (verified). Header is unified. § ornament on every tool page. Same chip row, same card pattern. |
| Responsive | 7.5 | Solid below 600px (container 32/20 padding, hero 40px, body 17px), but lacks tablet (≥768px) breakpoint — content stays narrow on iPad/desktop, leaving large empty side gutters that read as awkward rather than airy. |

## Findings

### Critical (May 26 launch blockers)

- **CSP allows `'unsafe-inline'` — prior review's "strict CSP" claim is incorrect** — `_headers:7` — Current `script-src 'self' 'unsafe-inline'` and `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`. This contradicts the project context and the Slatework v0.3 baseline. Either (a) update the review/messaging to admit Authorly is not strict-CSP, or (b) refactor to remove inline `<style>` blocks from pages, the `style="..."` attrs from `index.html:159,183` and `privacy.html:69` / `terms.html:68`, the bootstrap `<script>` block at top of every page (line ~32 across all pages), and the `note.style.cssText = "..."` in `tool.js:221` and `ads.html:219`, then tighten CSP to remove `'unsafe-inline'` on both directives. Slatework reached strict-CSP — Authorly should match for parity.

- **`ads.html` ships duplicated JS instead of using shared `Authorly.initTool`** — `ads.html:140-240` — 100+ lines of hand-rolled chip-toggle, char-counter, validation, fetch, error-rendering and remaining-counter logic that already exists in `tool.js:119-242`. Two consequences: (1) any bug fixed in `tool.js` is silently un-fixed on `/ads`; (2) `tool.js:221` and `ads.html:219` both set `note.style.cssText = "...background:var(--rule-soft,#f3ede0)"` referencing a CSS var (`--rule-soft`) that does not exist in `tool.css` — every "remaining today" chip on every tool falls back to the hardcoded `#f3ede0`. Refactor `ads.html` to use `initTool` with `extraFields:[{id:"title",name:"title",required:true,errEmpty:"..."},{id:"comps",name:"comps"}]` and add `--rule-soft` to `:root` in `tool.css:5-15` (suggest `#f3ede0` to match the current fallback).

### Important

- **Homepage tool list is the banned "3 equal cards horizontally" pattern** — `tool.css:126` `tool-list{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}` produces a 3-up grid on desktop with six identical-shape cards. This is the canonical AI-tell. Fix: either (a) zigzag/asymmetric — first card 2-col span ("Comp finder is the flagship"), rest in 2 columns; (b) editorial list — small leading roman numerals, generous vertical rhythm, no card chrome at all (just `border-t` between rows, matching the book-print POV); (c) keep the grid but make it 2 columns, larger cards, with a "Live" badge and a one-line tagline that breaks the grid pattern. Option (b) is most on-brand.

- **Input panel and output panel are visually identical** — `tool.css:50` `tool-card` and `tool.css:76-77` `.output` use the same `paper-2` background and same border. When the AI response renders, the user's eye doesn't get a strong "the answer is here now" cue — the output just appears below the same card. Fix: render `.output` with a subtler paper variant or remove its background entirely so it reads as bound-in continuation of the card; OR add a left rule (`border-left:3px solid var(--accent);padding-left:24px;background:transparent`) so the answer feels marked, like a margin annotation. Matches the book/colophon language already in play.

- **No tablet breakpoint — desktop wastes the viewport** — `tool.css:166-172` only has a 600px breakpoint. On 1024–1440px the site shows a 720px column floating in 300+px of empty cream on each side. That's airy on a marketing site; it's lonely on a tools site. Fix: at `≥1024px` either (a) widen container to 880–960px and bump body font to 19px / line-height 1.7; (b) introduce a two-column layout for the homepage tool list and FAQ; (c) keep narrow but add a quiet right-rail with "All tools" navigation so the reader never has to scroll back up. (b) is most useful, (c) is most on-brand.

- **404.html uses `!important` overrides as defensive scaffolding** — `404.html:40` All seven properties on `.notfound-code` are `!important`. The comment explains it's a Dark Reader / extension defense, but `!important` on production CSS is a yellow flag during code review and breaks specificity for any future overrides. Fix: scope the override using a selector with naturally higher specificity (e.g. `body.is-404 .notfound-code` set on `<body class="is-404">`) instead of `!important`. Same effect, no specificity poisoning.

- **`hero.eyebrow` text "For indie authors" is identical on all 7 tool pages** — `index.html:80`, `blurb.html:55`, `bio.html:50`, `keywords.html:50`, `categories.html:50`, `tropes.html:53`, `ads.html:53`. The eyebrow's job is to add specificity, not repeat the same phrase 7 times. Fix: per-page eyebrow — "Marketing copy" (ads, blurb), "Discoverability" (keywords, categories), "Reader-facing" (bio, tropes, comp). Reads less like a template, more like a thoughtful collection.

- **`em`-italic display style — fragile against future content** — `tool.css:42-43` Hero `h1` uses `<em>` for the accent phrase, e.g. "Find the right *comp titles*". When the title doesn't have a natural italicizable phrase (e.g. /404, /bio "Write your *author bio*") it works; but a future tool with a generic title could end up with no em accent and the hero looks bare. Add a fallback: `h1` without `em` should still have weight/color hierarchy via a `:not(:has(em))` rule.

- **Genre chips lack visible focus ring distinct from `.active`** — `tool.css:64-67` `.genre-chip:hover` and `.genre-chip.active` are the only styled states. Keyboard users tabbing through the chip group get a global focus ring (`outline:2px solid var(--accent)` from `tool.css:30`), but it's the same color as `.active`'s background, reducing visibility. Fix: focus ring should be `--ink` outline on chips specifically (or use `outline-offset:4px` to push it clear of the chip's own border).

- **Sample `<details>` summary uses `+` and `−` glyphs that don't share family with body** — `tool.css:104-105` `summary::after{content:"\002B"}` and `\2212` are the right Unicode characters but render in the system fallback font, not Fraunces. They look slightly off-weight against the rest. Fix: either set `font-family:"Fraunces",serif` on the pseudo, OR use a tiny SVG chevron (matches Slatework's icon discipline more cleanly).

- **`waitlist-form` button "Notify me" sits next to a 220px-min email input — on narrow desktop windows (1024–1100px) the form wraps awkwardly** — `index.html:199-203` and `tool.css :flex` settings. Test in a 1100px window: with `flex-wrap:wrap` and the button at full width when wrapped, it goes from inline single-row to stacked. Visual rhythm break. Fix: either fix the button width to `min-width:140px` and let the input stretch, or commit to vertical stacking at all sizes.

- **Tool card padding inconsistency between desktop and mobile** — `tool.css:50` desktop `.tool-card{padding:40px}` and `tool.css:168` mobile `.tool-card{padding:24px}`. Both reasonable, but the input element padding stays `14px 16px` regardless (`tool.css:58`). On mobile, an input with 14px vertical padding inside a 24px-padded card creates a tight ratio that reads as cramped relative to the desktop ratio. Fix: either reduce input padding on mobile or (cleaner) introduce a `--tool-pad` CSS var that scales together.

### Nice-to-have

- **`@media (prefers-reduced-motion)` clobbers all transitions, including reasonable ones** — `tool.css:173-175` `*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}`. Standard pattern but heavy-handed: kills the genuinely useful 0.2s color transitions on links/buttons. Fine for launch; consider scoping to `animation-name:fadeIn` etc. later.

- **Body background uses `background-attachment:fixed` with an SVG noise filter** — `tool.css:28`. On iOS Safari, `background-attachment:fixed` is silently coerced to `scroll` and produces a different look (the noise tiles repaint per scroll frame). Acceptable; consider `background-repeat:repeat;background-attachment:scroll` for parity if iOS users report visual differences.

- **`.tool-list-item:hover{transform:translateY(-2px)}`** — `tool.css:128`. Light, fine. But every tool card moves on hover — a softer alternative: animate the underline on the title only, keep the card stable. More book-typography, less SaaS-card. Optional.

- **OG image is a PNG with no SVG companion shown in nav/preview** — `og.png` (referenced in index.html:16) and `og.svg` exists in root but isn't used in meta. If the SVG renders well at OG dimensions, prefer it; PNG inflates page weight. Optional.

- **No `loading="lazy"` on any imagery** — Authorly is text-only, so this is currently moot. If you ever add author photos / book covers in a future "showcase" section, set baseline now.

- **`.btn-arrow` italic `→` is set with `font-style:italic` but `→` (U+2192) doesn't have an italic variant** — `tool.css:73`. The italic property is no-op on this glyph; Fraunces falls through. Cosmetic; remove `font-style:italic` from `.btn-arrow` to drop a no-op rule.

## Ship-now top 3

1. **Refactor `ads.html` to use `Authorly.initTool` with `extraFields`.** Knocks out the 80+ lines of duplicated JS and the silent `--rule-soft` undefined-var bug in one move. Add `--rule-soft:#f3ede0` to `tool.css:5-15` while you're there. Estimated 25 minutes.

2. **Replace the homepage `.tool-list` 3-up grid with an editorial list.** Single column, top-rule between rows, leading number/dot, generous vertical rhythm, no card chrome. Two CSS classes, fifteen lines. This is the move that elevates the homepage from "well-built" to "designed." Estimated 30 minutes.

3. **Decide and ship strict CSP.** Either drop the "strict CSP" claim from the launch review and project memory, or do the work: lift the bootstrap `<script>` from line ~32 into `tool.js`, kill the four `style="..."` attrs in HTML, replace `note.style.cssText` with a `.remaining-note` class in `tool.css`, then drop `'unsafe-inline'` from both directives in `_headers:7`. Slatework already crossed this line at v0.3; Authorly's review prematurely claims parity. Estimated 90 minutes if doing the refactor; 5 minutes to update the claim.

## What Authorly does well

- **Real font choice with real variable axes.** `font-variation-settings:"opsz" 144,"SOFT" 30,"WONK" 1` (`tool.css:42`) on the hero h1 is the kind of detail that signals "the person who built this read the font's spec sheet." Slatework uses Newsreader display + IBM Plex; Authorly uses Fraunces with WONK enabled. Both are good. Authorly is the more characterful choice.

- **One CSS file. One JS file. One footer. One header.** No `_components/`, no `_partials/`, no build step. The constraint is the design. The unified footer (`tool.css:136-152`) renders identically on all 10 pages because there's exactly one definition.

- **Color system is restrained.** Three neutrals (`--ink`, `--ink-2`, `--ink-mute`), two papers (`--paper`, `--paper-2`), one accent (`--accent` oxblood `#a83232`), one rule. No semantic-token bloat, no dark mode, no "brand-50 through brand-900" Tailwind aliasing. This is what minimal looks like when it's earned.

- **The `§` ornament as a recurring motif.** Hero, footer, sample bullets, summary glyphs — all converge on the section sign. It reads as a deliberate signature, not a placeholder.

- **The `<details class="sample">` "See an example" pattern.** Brilliant trust mechanic. Every tool ships with an example output rendered in the same typography as the real result. New visitors don't have to guess what they'll get. This is more useful than the AI-generated copy in 90% of marketing sites.

## Cross-project notes (Slatework comparison)

**Where Authorly does better than Slatework:**

- **More committed aesthetic POV.** Slatework's hero is a dark slate-board with a chalk-dust radial-gradient animation (`slatework/src/lib/styles.css:226-267`) — a great reveal — but the rest of the site is a fairly conventional white surface + Newsreader display + IBM Plex sans + Plex mono captions. Authorly's cream-paper-with-noise-texture and warm oxblood-accent feels more singular across the entire surface, not just the hero.
- **Tighter file count.** One CSS, one JS, ten HTML pages. Slatework has `src/lib/styles.css` plus implicit page assets and a deeper directory tree.
- **Better example transparency.** Authorly's `<details class="sample">` showing realistic example output on every tool page is a stronger "show, don't tell" mechanic than Slatework's preview widget which is interactive but only shows one tool (the rate calculator).
- **Footer cohesion.** Authorly's bookend `§` ornament + flex link nav + byline (`tool.css:136-152`) is more polished than Slatework's footer. Lift-and-shift candidate for Slatework.

**Where Slatework does better than Authorly:**

- **Strict CSP actually achieved (per project memory).** Authorly's review claimed it; the `_headers` file shows otherwise. Slatework v0.3 closed the inline-style/inline-script gap.
- **Dramatic hero that earns attention.** Slatework's dark slate hero with `chalk-dust` animation, mono caption with pulsing dot, and live-preview widget on the right (`slatework:226-267, 378-492`) gives the homepage a memorable opening shot. Authorly's hero is well-typeset but conventional — eyebrow, h1, sub, ornament — and could borrow some of Slatework's spatial drama on its homepage specifically.
- **Mono-caption rhythm.** Slatework's `.mono-caption` + animated `.dot` (`slatework:132-156`) used as a recurring "live now" marker across the site. Authorly's `.eyebrow` is fine but is just letterspaced uppercase; adding a similar mono "live" indicator to each "Live" tool card on the homepage would reinforce the freshness.
- **Two display fonts in dialogue (Newsreader for editorial gravity, IBM Plex for body/code).** Authorly is single-font (Fraunces everywhere). For a tools site where users paste structured input and read structured output, a complementary mono for character-counts, KDP slot-fills, and "(31/50)" annotations would aid scanning. Currently `.char-count` and `(31/50)` numbers render in Fraunces (a serif) — a mono pair (e.g. JetBrains Mono or IBM Plex Mono) for numeric metadata would lift the data-density utility without breaking the book-print POV.
