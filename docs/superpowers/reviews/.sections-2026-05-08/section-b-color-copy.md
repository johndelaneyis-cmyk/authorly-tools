# Section B — Color System & Copy/Voice — Authorly

**Color score:** 8.6/10
**Copy/voice score:** 9.4/10
**Combined:** 9.0/10

The palette is disciplined, semantically named, and book-print authentic. Voice is the strongest single quality on the site — it sounds like a peer indie author, not a SaaS. The combined score is held below 9.5 by three concrete, fixable items: ink-mute carries too much load near AA's lower bound, no dark mode (a real gap for a "writers at night" audience), and one error string blames the user. None are launch-blockers; all are cheap to fix.

## Sub-scores

| Sub-dim | Score | Note |
|---|---|---|
| Color tokens | 9 | 8 vars, semantic names, layered surfaces. Could split semantic from reference. |
| State contrast | 7 | Hover/active/disabled good. Focus visual ring (`accent-soft` 5% alpha) is decorative — only the 2px outline carries focus. Genre chips lose contrast when active (paper-on-accent ≈ 6.2:1, but only on focused chip). |
| Dark mode | 4 | None. No `prefers-color-scheme`, no token swap. Real gap for night-writing audience. |
| Color a11y | 8 | Body text 16:1 AAA. ink-mute on paper = 4.73:1 — barely AA, used in many secondary spots. Accent red on paper = 6.2:1 ✅. Success green `#2a7a3a` hardcoded (not tokenized). |
| Voice consistency | 10 | Same peer-author register on all 10 pages. Hero pattern identical. Legal pages same voice. Rare. |
| Action verbs | 9 | Specific and in-frame: "Find comp titles", "Write the blurb", "Recommend categories", "Expand keywords". One generic-ish: "Write headlines" (ads.html:110) and "Write bio" (bio.html:83) — could be sharper. |
| Error microcopy | 8 | Mostly empathetic + actionable. One blame-y string: "That doesn't look like a valid email address" (index.html:287). Generic "Connection trouble" reused. |
| Empty states | 9 | All output panels start `display:none`; tools use clear sample/`<details>` "See an example of what you'll get" — exemplary onboarding. |
| Friction tone | 10 | Privacy & Terms read like a person talking. "I pay the AI bill", "tools that work", "we tell you to verify before publishing for exactly this reason". Best-in-class. |
| AI-slop avoidance | 9 | No "furthermore"/"delve"/"tapestry"/"leverage"/"unlock"/"empower". Em-dash is a real tic (74 across 9 pages) but it's *the* maker's voice tic, not LLM tic. "Curated" appears 4× in KDP context (defensible). |

## Findings

### Critical

None. Site is launch-ready on color/copy axes.

### Important

- **Dark mode absent — real gap for the audience** — `tool.css:5-15` — Authors write at night. The tokens are already semantic (`--paper`, `--ink`, `--ink-2`, `--ink-mute`, `--rule`, `--accent`, `--accent-soft`, `--shadow`) — perfect setup for a `@media (prefers-color-scheme:dark)` override that swaps 6 values. Recommended dark tokens (vanilla, CSP-clean):
  ```css
  @media (prefers-color-scheme:dark){
    :root{
      --paper:#1a1814;        /* was #faf6f0 */
      --paper-2:#22201b;      /* was #fefbf5 */
      --ink:#f0e8d8;          /* was #1a1814 */
      --ink-2:#c8c0b0;        /* was #3a3530 */
      --ink-mute:#8e8a82;     /* was #6b6760 — tuned for >4.5:1 on dark paper */
      --rule:#3a3530;         /* was #e0d5c0 */
      --accent:#d97a7a;       /* was #a83232 — lift chroma so it holds on dark */
      --accent-soft:rgba(217,122,122,.10);
      --shadow:rgba(0,0,0,.4);
    }
  }
  ```
  Verify the noise-texture SVG in `tool.css:27` reads correctly on dark — the `feColorMatrix` opacity (`0.04`) is tuned for paper; you'll likely want a second SVG or `mix-blend-mode:overlay` in dark.

- **`--ink-mute` is doing too much load right at AA threshold** — `tool.css:10` — `#6b6760` on `#faf6f0` ≈ 4.73:1 — passes AA body (4.5:1) by a hair. It's used for: nav links, chip text, char counter, helper "(optional)", footer byline, bottom-of-output remaining-runs notice, sample summary text. Any browser color-extension shift, any user with mild low vision, and several of these strings drop below AA. Tighten to `#5d594f` (≈5.6:1) — still reads as muted, comfortable AA margin.

- **Focus indicator visual hierarchy is muddled** — `tool.css:30, 59, 61` — `:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:2px}` is your real focus ring (6.2:1, ✅). But on inputs you also paint `box-shadow:0 0 0 3px var(--accent-soft)` where `--accent-soft = rgba(168,50,50,.05)` — 5% alpha is functionally invisible. Either bump to ~`.18` so the soft ring actually does something, or remove it and rely on the 2px outline alone. Currently the box-shadow is dead pixels.

- **Accent-on-accent chip text contrast unverified for active state** — `tool.css:67` — `.genre-chip.active{background:var(--accent);color:var(--paper)}` — `#faf6f0` on `#a83232` ≈ 6.2:1, AA ✅. Fine, but worth pinning in a comment because if anyone retunes accent darker, this silently fails.

- **Error string blames input, not situation** — `index.html:287` — `"That doesn't look like a valid email address."` — soft, but the ux-writing rubric prefers *what the field needs* over *what's wrong with what you typed*. Replace with: `"Email needs an @ and a domain (like you@example.com)."` Same shape as your already-good "Please paste at least a paragraph (30+ characters)" pattern — describes the requirement, not the failure.

- **Generic "Connection trouble" reused as catch-all** — `tool.js:197`, `ads.html:227`, `index.html:317` — The string "Connection trouble. Check your internet and try again." (or "Network trouble. Try again in a moment.") is fine once but appears 3× with two different wordings. Pick one canonical line and reuse — currently inconsistent. Suggest: `"Couldn't reach the server. Check your connection and try again."` (active verb, specific recovery, no "trouble" euphemism).

- **Server-side error strings drift in voice** — `functions/api/_lib.js:208-223` — `"AI service is having issues, try again."` / `"AI service rejected the request — try simpler input."` / `"AI service is busy — try again in a minute."` — these are fine but the term "AI service" is system-language. The whole rest of the site says "Anthropic's Claude" or "the AI". Suggest unifying as "Claude" or "the AI": `"Claude is busy — try again in a minute."` Fits voice (intimate, named) and reads less like a status page.

- **Rate-limit message subtly user-blaming on the second word** — `functions/api/_lib.js:107` — `"Daily free limit reached (5 runs per visitor for this tool). Come back tomorrow."` — "Come back tomorrow" is friendly but the parenthetical feels enforce-y. Try: `"You've used today's 5 free runs for this tool. The limit resets at midnight UTC — or grab a Pro slot from the homepage waitlist."` Adds value (recovery + monetization signal in one), removes parenthetical.

### Nice-to-have

- **Token layer split would lift palette discipline** — `tool.css:5-15` — Currently `--accent` is both reference (the red) and semantic (focus, error border-left, chip-active, success-state-on-hover). Split into `--ref-red:#a83232; --semantic-accent:var(--ref-red); --semantic-focus:var(--ref-red); --semantic-danger:var(--ref-red);` — cheap, makes future theme work cleaner, and surfaces the fact that you're using ONE hue for accent + focus + error (which is fine for now but unusual).

- **Success-state green hardcoded twice** — `tool.css:96` (`copy-btn.copied{color:#2a7a3a}`), `tool.css:99` (`copy-all-btn.copied`), `index.html:61` (`.waitlist-status.success`), `feedback.js:47` (`.authorly-feedback-thanks`) — token it: `--success:#2a7a3a` in `:root`. Currently 4 places to update if you ever shift the green.

- **No state for color-blind users on chip-active** — `tool.css:67` — Active genre chip is communicated by background color alone (`accent` red). Pair it with a glyph or weight bump: `.genre-chip.active{font-weight:600}` or add a check: `.genre-chip.active::after{content:" ✓"}`. Currently a deuteranope sees the active chip as a slightly different shade of grey.

- **"Was this useful?" widget uses raw emoji** — `feedback.js:75, 81` — `"👍 Yes"` / `"👎 Not really"` — emoji rendering is platform-dependent. The rest of the site is hand-tuned typography; emoji break the spell on Linux/older Android. Consider replacing with text-only: `"Yes, useful"` / `"Not really"` — no visual loss given the surrounding `Was this useful?` framing.

- **"Write bio" button label is the weakest verb on the site** — `bio.html:83` — Compared to "Find comp titles", "Recommend categories", "Expand keywords" — all specific. "Write bio" is fine but flat. Try: `"Draft my bios"` (matches `Authorly.initTool.remainingNoun:"bio set"` plurality and the "Three variants" framing in the hero).

- **"Write headlines" same issue** — `ads.html:110` — Try: `"Draft 6 headlines"` — concrete count tells the user what they're getting in 2 words.

- **"AI returned an empty response. Try a more detailed input."** — `functions/api/_lib.js:223` — borderline blame-y ("more detailed" implies user under-supplied). Reframe as system: `"Claude didn't generate output for that input. Try adding a sentence or two of detail."`

- **"That's too short." / "That's too long."** fallback messages — `tool.js:173, 177` — never triggered if `cfg.primaryShortMsg/LongMsg` are set (they always are), but the fallbacks are blame-y. If you ever ship without a custom message, the user gets a curt judgement. Replace with: `"Add a bit more detail to continue."` / `"Trim this down to continue."`

- **"Reading…" loading label feels passive** — `tropes.html:154`, `index.html:247` — your tool is *generating*, not *reading*. "Finding tropes" / "Finding comp titles" already exist as `loadingMsg` (the `<p>` content) but the BUTTON says "Reading…". Pick a verb that matches what the tool produces. Suggest: `Finding…` (matches loadingMsg).

- **Em-dash density verges on tic** — site-wide, 74 occurrences across 9 HTML files — em-dashes are a known LLM-output tell and they're also a Darren-voice tic. Most are good. A few are stacked: e.g. `index.html:158` has 4 em-dashes in 2 sentences. Consider replacing some with periods, especially in the hero subs and tool descriptions, to break rhythm. Authors notice.

- **No reduced-data / data-saver hint** — `tool.css` loads Fraunces variable axis with 4 dimensions (`opsz,wght,SOFT,WONK`). Beautiful, but ~150KB on cold load. No `prefers-reduced-data` fallback to a system serif. Cheap to add: `@media (prefers-reduced-data:reduce){body{font-family:Georgia,serif}}` — preserves voice, drops weight.

- **404 CTA assumes context** — `404.html:69` — `"Back to the comp finder →"` — but the user may have arrived from `/blurb` looking for the blurb tool. Consider: `"Back to all tools →"` linking to `/#more` — same friendly tone, more useful destination.

- **Privacy/Terms eyebrow says "Authorly"** — `privacy.html:70`, `terms.html:69` — every tool page eyebrow says "For indie authors" (signals audience). Legal pages eyebrow says just "Authorly" — feels redundant with the logo above it. Replace with `"Plain-English"` or `"Legal"` — adds a beat of voice.

## Ship-now top 3

1. **Add dark mode** (Important) — 9 token swaps, 1 `@media` block, ~15 lines of CSS. Half your audience writes after sundown. This is the single biggest user-experience lift available on the color axis. Vanilla, CSP-clean, no JS.
2. **Tighten `--ink-mute` to `#5d594f`** (Important) — One char-edit on `tool.css:10`. Lifts contrast from 4.73:1 to ~5.6:1 site-wide. AA buffer for color extensions and low-vision users. Zero visual cost.
3. **Fix the email-validation blame copy + unify connection-error string + retire "AI service" phrase in favor of "Claude"** (Important) — three small edits, all one-liners, all tighten the voice. Run a find/replace pass: `index.html:287`, `tool.js:197`, `ads.html:227`, `index.html:317`, `functions/api/_lib.js:107,199,208-223`.

## What Authorly does well

- **Voice is the moat.** "I pay the AI bill. Each generation costs me about two cents." (`index.html:176`) is a sentence no SaaS team writes. The legal pages keep this voice — `terms.html:109`: "If you publish a book description containing AI-generated comp titles and the author or publication year turns out to be wrong, that's on you, not us." Authors will read this and feel addressed by a person.
- **The samples are a masterstroke.** Every tool ships a `<details class="sample"><summary>See an example of what you'll get</summary>` block (`blurb.html:69`, `bio.html:64`, `keywords.html:64`, `tropes.html:67`, `categories.html:64`, `ads.html:67`, `index.html:94`). This is the right way to handle "first-use empty state" — no synthetic placeholder data, real shape, hidden by default. Best-in-class onboarding pattern.
- **Action verbs are concrete and in-frame.** "Find comp titles", "Recommend categories", "Expand keywords", "Find tropes" — every CTA tells the user what they get, in their own working vocabulary. No "Submit", no "Generate", no "Get started".
- **Token discipline is real.** 8 root tokens, layered surfaces (`paper` + `paper-2`), inheritance via `accent-soft` derived from accent — this is how a vanilla CSS palette should look. Most of the changes above are refinements on a working system, not redesigns.
- **The book-print palette nails the audience.** Cream paper (`#faf6f0`), warm ink (`#1a1814`), oxblood accent (`#a83232`), `§` ornaments — the site visually feels like a Penguin Modern Classics interior. For a tool aimed at writers, the design *is* a credibility signal.
- **Anti-AI-slop is genuinely strong.** None of the top LLM tells (`furthermore`, `moreover`, `delve`, `tapestry`, `leverage`, `unlock`, `empower`, `seamless`, `curate` outside the one defensible KDP usage) appear. The em-dash density is the only flag, and reads as Darren's voice tic, not LLM cadence. Authors will notice the absence as much as the presence.
