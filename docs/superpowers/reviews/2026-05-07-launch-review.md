# Authorly Launch Review (2026-05-07)

## Executive summary

Authorly is **structurally further along than Slatework was at the same readiness review** — the single biggest defect Slatework needed fixing (canonical/sitemap pointing at `.html` URLs that 308-redirect) is **already correct here**. Identity discipline in shipped HTML is clean across all 10 pages (`Built by Darren · 2026` × 10, no surname, no `@handle`, no legal email). Page weights are tight (8–12 KB tool pages, 32 KB homepage), TTFB is ~100 ms, security headers are on par with Slatework, and the seven AI endpoints have well-tuned prompts with proper input validation, model defaults to a current Sonnet ID, and the Anthropic key never leaks into logs or error bodies.

The single blocker — and it's a serious one — is **content exposure on the deploy bucket**: Cloudflare Pages serves anything in the project root, and there are no excludes. As a result `CLAUDE.md` (operator legal email, GitHub identity, the explicit "never reference legal name" rule, Discord webhook rotation status, test-tweet ID, KV key schemas) AND the entire `distribution/` tree (including the May 26 launch playbook committed earlier today, scheduler.py source, every pre-written launch post, anti-pattern list, manual user steps) are all live at `https://authorly.tools/`. That single Cloudflare Pages misconfiguration ships the operator's identity and the full Reddit/HN/IH playbook to anyone who curls the site.

Beyond that: a smaller cluster of real defects worth fixing before launch — a "5 searches per day" homepage About line that contradicts the actual rate limit, raw plaintext IPs as rate-limit KV keys (undisclosed PII), a missing FAQPage JSON-LD despite a real four-question FAQ block, no Retry-After on 429s, a recursive `/404` canonical (same Slatework miss), seven AI endpoints copy-pasted with no `_lib.js` so any backend fix has to be applied seven times, and a dormant Cloudflare Insights `BEACON_TOKEN` placeholder still in `feedback.js` paired with a CSP allowance for an analytics tracker that isn't loaded.

**Verdict: NOT soft-launch-ready until the deploy-bucket leak (Critical #1 + #2 + #3) is closed.** The other 9 Critical items are each <30 minutes; many are duplicated across endpoints and become one-fix-applies-to-all the moment a `functions/api/_lib.js` shared module exists. After Critical #1–#3, Authorly drops back to genuinely launch-ready posture and the rest of the Important list is a v0.2 backlog you can clear during the May 18–24 seasoning window.

**Total findings: 65** across 3 audit dimensions (frontend 28, backend 28, infrastructure 26 raw → 65 after dedup of cross-cutting issues).

---

## Pillar scoresheet

| Pillar | Score | Notes |
|---|---:|---|
| **Product clarity & differentiation** | 8 / 10 | Strong value prop ("indie author who got tired of paying $50/mo for prompted-LLM SaaS"), seven well-scoped tools that map to real Amazon mechanics, FAQ + maker line build trust. -2 for the "Five free searches per day per visitor" misframing on the homepage About paragraph (line 262) which contradicts the actual 5/tool/day implementation. |
| **Visual & UX design** | 8 / 10 | Clean Fraunces typography, consistent shell across the 6 tool pages, real shared `tool.js` runtime, sample-output `<details>` UX is excellent, reduced-motion honored, skip links sitewide, escapeHtml on every renderer. -2 for footer divergence across 3 templates, Inter+Fraunces split on legal pages vs Fraunces-only elsewhere, and the inline contact-link wiring missing on all 6 tool pages despite the explicit HANDOFF rule. |
| **Code quality & architecture** | 5 / 10 | Frontend is **good** — shared `tool.js`, escapeHtml-first, sample-output convention. **Backend is 7× copy-pasted** — `comp.js`/`blurb.js`/`keywords.js`/`categories.js`/`tropes.js`/`ads.js`/`bio.js` are 1080 lines total, ~150 each, with `jsonResponse` defined nine times and the same rate-limit/Anthropic-call pattern repeated. There is no `_lib.js`. Every backend Critical below has to be applied seven times until that's fixed. |
| **Security posture** | 5 / 10 | Excellent in shipped HTML (strict CSP, HSTS preload, X-Frame DENY, COOP same-origin, Permissions-Policy zeroing dangerous APIs, no `unsafe-eval`). Backend security is clean (CF-Connecting-IP trusted source, Anthropic key never logged, max_tokens bounded). -5 for the deploy-bucket leak (CLAUDE.md + distribution/ exposes operator identity and full launch playbook), raw IP in KV keys (undisclosed PII), counter race + counter-desync, and global ceiling that allows $168/day worst-case Anthropic spend. |
| **Performance & reliability** | 9 / 10 | TTFB ~100 ms across every probed page, page transfer 8–12 KB on tool pages and 32 KB on the homepage, edge cache doing the right thing on static HTML, no font-preload bloat. -1 for og.png at 121 KB (4× the homepage size — single largest asset, retina-fine but bigger than ideal). |
| **SEO & discoverability** | 8 / 10 | Sitemap + canonicals are extensionless and consistent (Slatework's biggest defect is *not* present here), JSON-LD Organization + WebSite on home, WebApplication on tool pages, robots.txt + sitemap.xml correctly wired. -2 for missing FAQPage schema on the homepage despite a real FAQ block, no JSON-LD on privacy/terms, no `og:image:width/height/alt` declared, no `lastmod` in sitemap. |
| **Trust & identity discipline** | 3 / 10 | In **shipped HTML**, identity discipline is genuinely clean (10/10) — `Built by Darren · 2026` on every page, no surname, no `@handle`, no legal email. **But** CLAUDE.md publicly served at `/CLAUDE.md` (200 OK, 7,591 b) leaks `johndelaneyis@gmail.com`, the GitHub repo path `johndelaneyis-cmyk/authorly-tools`, AND the explicit rule *"never reference the legal name in public-facing copy"* — which becomes a public document the moment the file is served. The pen-name privacy strategy is undone by serving the rule that defines it. -7. |
| **Distribution & launch readiness** | 5 / 10 | Manual playbook is locked (`distribution/launch-2026-05-26/`), Twitter X thread is opt-in (test tweet ID `2051733906961866880`), 7-day seasoning + Tue/Wed/Thu launch sequence mirrors Slatework's pattern. -2 for Discord webhook rotation status still flagged as "needs rotation as of 2026-05-05" (today is 2026-05-07), Reddit account is a manual user task before May 18 setup window. -3 for the launch playbook itself (the entire `distribution/launch-2026-05-26/` tree committed today) being publicly served at the live site. |

**Overall weighted: 6.4 / 10** — drags below soft-launch-ready primarily because of the deploy-bucket leak. Without that single class of issue, the score would be ~8.0 / 10 and the verdict would be "soft-launch-ready, fix-this-week list is small". The leak is the load-bearing problem.

For comparison: **Slatework launch review scored 7.5 / 10**. Authorly's frontend is structurally tighter than Slatework's was, but Authorly's deploy hygiene is meaningfully worse (Slatework has fewer ancillary docs at the repo root and `docs/superpowers/` is correctly excluded from the deploy by virtue of being inside the SvelteKit `src/` boundary).

---

## Critical (fix before public launch)

1. **`CLAUDE.md` is publicly served at `https://authorly.tools/CLAUDE.md`.** `200 OK`, `Content-Type: text/markdown`, 7,591 bytes. Contents include: the operator's legal email (`johndelaneyis@gmail.com`), the GitHub repo path (`johndelaneyis-cmyk/authorly-tools`), the explicit instruction *"never reference the legal name or `johndelaneyis@gmail.com` in public-facing copy"* (which itself becomes public the moment the file is served), the `DISCORD_WEBHOOK_AUTHORLY` rotation note ("Needs rotation as of 2026-05-05" with leak history), the test-tweet ID `2051733906961866880`, the full env-var inventory, and a KV key schema (`feedback:<tool>:<ts>:<ip-hash>` etc.) that hands an attacker the exact payload shape to forge feedback. **Cloudflare Pages does not respect `.gitignore` or any default-deny rule for repo-root files** — anything committed to `main` ships. **Fix:** move `CLAUDE.md` to `.claude/CLAUDE.md` (the `.claude/` directory is already in `.gitignore` per the repo's `.gitignore` line 13), commit a deletion of the root file, redeploy. Verify `curl https://authorly.tools/CLAUDE.md` returns 404. Then **rotate the Discord webhook now** if the rotation hasn't already happened.

2. **Entire `distribution/` tree is publicly served.** Every probed file returned 200 OK:
   - `https://authorly.tools/distribution/PLAN.md` (3,423 b)
   - `https://authorly.tools/distribution/SETUP.md` (4,576 b — names every required secret env var, including `REDDIT_PASSWORD`)
   - `https://authorly.tools/distribution/scheduler.py` (14,787 b — full source of the posting bot, including OAuth flow shapes)
   - `https://authorly.tools/distribution/posts.md` (11,538 b — every pre-written launch post for every platform)
   - `https://authorly.tools/distribution/replies.md` (10,755 b — pre-scripted replies; also contains the `johndelaneyis-cmyk` GitHub link)
   - `https://authorly.tools/distribution/runbook.md`, `cold-emails.md`, `requirements.txt`, `schedule.json`
   - **`https://authorly.tools/distribution/launch-2026-05-26/launch-plan.md` (12,074 b — committed today)**
   - **`https://authorly.tools/distribution/launch-2026-05-26/manual-steps.md` (7,279 b — committed today)**
   - **`https://authorly.tools/distribution/launch-2026-05-26/posts/show-hn.md`, `indiehackers.md`, plus four `r-*` Reddit posts (committed today)**
   No actual secrets in these files (`.env` is correctly gitignored; `https://authorly.tools/distribution/.env` returns 404), but a launch playbook serves a competitor an exact day-by-day outreach calendar plus pre-written copy that they can preempt or counter-post against. The seasoning anti-pattern list (*"DO NOT mention `authorly.tools` in any comment during seasoning"*) is itself useful intelligence to anyone watching the indie-author Reddit subs. **Fix:** add a `_redirects` block returning 404 for `/distribution/*`, `/CLAUDE.md`, `/HANDOFF.md`, `/README.md`, `/.gitignore`, `/docs/*`. Better long-term fix: relocate `distribution/` and `docs/` outside the deploy directory (or add a Cloudflare Pages build configuration that excludes them from the publish output). The launch playbook isn't a deploy artifact.

3. **Default `Cache-Control` on the leaked paths is `public, max-age=0, must-revalidate`** — the no-rule fallback. Means the leak is also re-fetched on every request, which makes the access pattern visible in CF logs and amplifies the cost of leaving them up. Mentioned as part of the #1/#2 fix, but worth noting that the lack of any explicit rule for "don't serve docs" compounds the issue.

4. **Rate-limit KV keys embed the raw plaintext IP, not a hashed IP.** `comp.js:70` (and identical lines in `blurb.js:74`, `keywords.js:73`, `categories.js:81`, `tropes.js:69`, `ads.js:79`, `bio.js:67`, `waitlist.js:33`) build the per-IP rate key as `"rate:<tool>:" + today + ":" + ip`, where `ip` is `request.headers.get("CF-Connecting-IP")` — the visitor's plaintext IP. KV is operationally accessible via `wrangler kv:key list --prefix=rate:comp:` and the response will display every IP that has ever submitted a request, by date. That's PII the privacy page does not disclose. **Fix:** hash the IP before composing the key, the same way `feedback.js:47` already does (`sha256Hex(ip).then(h => h.slice(0, 8))`). The `feedback.js` precedent in this same repo proves the pattern.

5. **"Five free searches per day per visitor" misrepresents the rate limit on the homepage.** `index.html` line 262 says *"Five free searches per day per visitor"* in the About paragraph, which a reader parses as 5 total across all 7 tools. The actual KV scheme keyed `rate:<tool>:YYYY-MM-DD:<ip>` gives **5 per tool per day**, which line 280 in the FAQ states correctly: *"Five free runs per tool per day per visitor"*. **Fix:** change line 262 to `"Five free runs per tool per day"` to match line 280 — otherwise a user who hits their first 5/day on the homepage thinks the whole site is locked for the day.

6. **No `Retry-After` header on 429 responses.** When per-IP cap is hit, all seven AI endpoints return `429` with `{ error, remaining: 0 }` (e.g. `comp.js:75-80`) but no `Retry-After` header. Frontend has no machine-readable signal of when the limit resets, so well-behaved client libraries (or any future automated client) cannot back off correctly. **Fix:** in `jsonResponse`, when status is `429`, also emit `Retry-After: <seconds-until-UTC-midnight>`. Compute as `Math.floor((endOfUtcDay - now) / 1000)`.

7. **Counter race at boundary lets one extra request through per concurrency window.** In every AI endpoint (e.g. `comp.js:73-80`), the read-then-compare-then-write sequence is non-atomic. Two requests from the same IP that arrive simultaneously when `ipCount = PER_IP_DAILY_LIMIT - 1` both read `4`, both pass the `ipCount >= 5` check, both call Anthropic, and both write `5`. The same race exists on the global cap (`comp.js:82-86`) where a launch surge can leak many requests. KV has no atomic INCR. **Fix options:** (a) accept the leak and document — per-IP cost is bounded; (b) reduce `GLOBAL_DAILY_LIMIT` from 2000 by ~5%; (c) add a `// race acceptable: see audit #7` comment. CFs Durable Objects would solve atomically but is overkill for now.

8. **Counter-desync if KV write fails.** `comp.js:130-135` (and identical in every AI endpoint): `await env.RATE_LIMITS.put(ipKey, String(newIpCount), { expirationTtl: 172800 })` runs after Anthropic returned 200. If the KV write fails (CF KV has no documented uptime SLA), the call returns the response anyway because the put is awaited but its result is discarded. The Anthropic call already succeeded *and was billed*; the counter never advanced. The user can hit Anthropic forever in this state. **Fix:** wrap the puts in a try/catch and log to a separate KV key `errors:<tool>:<date>` — or use `ctx.waitUntil()` so the put runs out-of-band but the response is committed only after both writes are scheduled.

9. **Global ceiling at 2000/tool/day = 14,000 requests across all 7 tools — a runaway prompt loop or a coordinated abuse pattern will burn ~$168/day before the cap fires.** `comp.js:37`, `blurb.js:43`, `keywords.js:43`, `categories.js:51`, `tropes.js:39`, `ads.js:44`, `bio.js:38`. Each tool independently allows 2000 requests/day. The per-IP cap is 5/day, so a 400-IP botnet could sustain max global throughput (5 × 400 = 2000 requests/IP per tool) — at Sonnet 4.5 pricing of ~$0.012/typical 1500-token completion that's $24/tool × 7 = $168/day in worst-case Anthropic costs. **Fix:** add a single cross-tool ceiling: `global:all:YYYY-MM-DD` capped at 5000 (or whatever the user's daily Anthropic budget × 0.7 supports), and refuse any AI request once that's hit. Alternatively, lower per-tool to 500/day across the board.

10. **`BEACON_TOKEN` placeholder still in shipped JS.** `feedback.js` line 11: `const BEACON_TOKEN = "REPLACE_WITH_CF_BEACON_TOKEN";`. The `if (!BEACON_TOKEN || BEACON_TOKEN === "REPLACE_WITH_CF_BEACON_TOKEN") return;` guard prevents harm, but: (a) the placeholder string is visible in source view; (b) `_headers` line 7 explicitly allow-lists `https://static.cloudflareinsights.com` for both `script-src` and `connect-src`, so the page advertises infrastructure for a tracker that isn't actually loaded; (c) `privacy.html` line 87 explicitly states *"We do not run separate analytics on top of this"* — currently true, but accidental token paste would silently contradict the privacy page. Pick one: install the real token (then privacy.html line 87 needs an analytics bullet added) or delete the IIFE at lines 10–18 and the `cloudflareinsights.com` entries from the CSP. *Note: unlike Slatework, the privacy page here does not lie about analytics — but the dormant placeholder + CSP allowance is still cruft that should ship cleanly.*

11. **No `FAQPage` JSON-LD on the homepage despite a real FAQ block.** `index.html` lines 25–26 declare `Organization` + `WebSite` but the page has a real four-question FAQ in `<details class="sample">` blocks at lines 269–296 (Why use this instead of ChatGPT, How is this free, Do you store my plot, Why no signup). Same gap as Slatework #17. Adding `FAQPage` schema would surface those as Google rich results. **Fix:** extend the `@graph` to include a `FAQPage` entry that mirrors the four `<details>` blocks.

12. **404 page canonical is recursive trap.** `404.html` line 9: `<link rel="canonical" href="https://authorly.tools/404">`. Cloudflare Pages serves `404.html` for missing paths, and `/404.html` itself 308-redirects to `/404` — so the canonical points at a redirect. The page does have `<meta name="robots" content="noindex">` at line 8 which mostly defangs this, but the recursive canonical is the same defect Slatework had (#32). **Fix:** drop the `<link rel="canonical">` from `404.html` line 9 entirely — the noindex already does the work — or point it at `/`.

---

## Important (fix this week)

13. **Inline contact-link wiring missing on the six tool pages.** `CLAUDE.md` line 105 explicitly states *"Inline contact-link wiring stays in every HTML page (the one-line `<script>` near the bottom). It's a reliability fallback for `feedback.js`. Don't remove either layer."* That inline `document.querySelectorAll("a.contact[data-u][data-d]").forEach(...)` snippet is present in `index.html` line 323, `privacy.html` line 130, `terms.html` line 133 — but **absent from `blurb.html`, `keywords.html`, `categories.html`, `tropes.html`, `ads.html`, `bio.html`**. Tool pages currently rely on `feedback.js` (with retry-on-DOMContentLoaded at lines 25–45) AND on `tool.js` `wireContactLinks()` (called inside `Authorly.initTool()` at line 120). Both are defer scripts so they should fire before paint, but if either script fails to load (CDN flake, browser extension blocking JS, parse error), the tool-page footer's `<a class="contact" data-u="hello" data-d="authorly.tools">Contact</a>` ships with no `href`. **Fix:** add the same one-line inline `<script>` to all six tool pages above the `<script src="/tool.js">` block.

14. **Empty `<a class="contact">` text in privacy/terms paragraph links produces zero-width clickable areas without JS.** `privacy.html` lines 100, 110, 119; `terms.html` line 122. The inline script at `privacy.html` line 130 / `terms.html` line 133 fills `textContent` at runtime, so this works in practice — but a user with JS disabled (or whose connection drops the inline script) sees a blank space mid-sentence ("email   with the subject"). **Fix:** add a CSS fallback: `.contact:empty::before{content:"hello@authorly.tools"}`, or pre-fill `textContent` with `hello@authorly.tools` literal (the address is already in the data attributes, so scrape-resistance via the `data-u`/`data-d` split is preserved by that alone).

15. **Privacy page meta and copy reference only the comp finder.** `privacy.html` line 7 (meta description), line 14 (og:description), line 79 (`<h2>What we collect when you use the comp title finder</h2>`), line 92 (*"Your book description and selected genre are sent to Anthropic..."*), line 81 (*"The book description you paste into the form."*). The site has 7 tools. Bio (`/bio`) collects author facts, not a book description; ads (`/ads`) collects title + comps + description; keywords collects a seed phrase. **Fix:** rename the H2 to "What we collect when you use any of the tools" and restate as *"Whatever text you paste into the tool's form (book description, plot details, author facts, or seed keyword)"*.

16. **Footer markup diverges across 3 page templates.** Tool pages use `<p>Authorly · Home · Privacy · Terms · Contact</p>` then `<p>Built by Darren · 2026</p>` (e.g. `blurb.html` 115–116). Homepage uses a single line: `<p>Built by Darren · 2026 · Feedback · Privacy · Terms</p>` (`index.html` 315). Privacy/Terms use a flex two-column with separate `<span>` elements (`privacy.html` 121–127). The 404 page uses yet another two-column layout. **Fix:** pick one footer template and reuse. Recommended: tool-page format ("Authorly · Home · Privacy · Terms · Contact" then `Built by Darren · 2026`).

17. **Seven AI endpoints are 95% copy-pasted.** `comp.js`, `blurb.js`, `keywords.js`, `categories.js`, `tropes.js`, `ads.js`, `bio.js` — 1,080 lines total, ~150 each. They share: JSON parse + 400 on failure, env-key check, env-RATE_LIMITS check, IP read, today string, KV read × 2, cap check × 2, user-msg compose, Anthropic POST, response shape, error shape, `jsonResponse` helper. Only the prompt, the slug, the input field name, and one error string differ. `jsonResponse` is defined identically in 9 files. **Fix:** create `functions/api/_lib.js` with `rateCheck(env, tool, ip, perIp, global)`, `callClaude(env, system, user, max_tokens)`, `jsonResponse(data, status)`, and `extractIp(request)`. Each endpoint becomes ~30 lines. Without this, every backend Critical above has to be applied seven times and they will drift.

18. **No CORS preflight handler — same-origin posture is fine but undocumented.** Live probe `OPTIONS https://authorly.tools/api/comp` returns `405 {"error":"Method not allowed. Use POST."}`. Same Slatework finding (#8). Fine for the current frontend, but any future "embed Authorly's blurb tool on Substack" or third-party usage will fail at the preflight. **Fix:** add `onRequestOptions({ request })` that returns 204 with `Access-Control-Allow-Origin: https://authorly.tools` (or specific allowlist), `Access-Control-Allow-Methods: POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`, `Vary: Origin`, `Access-Control-Max-Age: 86400`.

19. **`DEFAULT_MODEL = "claude-sonnet-4-5"` hardcoded in all 7 AI endpoints.** Same Slatework finding (#30). Sonnet 4.6 is current (and Opus 4.7 is what the user is on); Sonnet 4.5 is on the deprecation list. Each endpoint already supports `env.ANTHROPIC_MODEL` override. **Fix:** pin to `claude-sonnet-4-6-20260101` (or current dated ID) and set `ANTHROPIC_MODEL` in CF Pages env vars as the override path. One-line change per file (or refactor via #17).

20. **Anthropic error-body fragment leaked to client.** `comp.js:115-120` (and identical in every AI endpoint): trims to 120 chars but doesn't sanitize. In adversarial conditions Anthropic might return a message that includes user-supplied content. **Fix:** map Anthropic error types (`error.type`) to a fixed set of user-facing strings. `rate_limit_error` → "AI service is busy, try again in a minute"; `invalid_request_error` → "AI service rejected the request, please try simpler input"; everything else → "AI service is having issues, try again". Don't pass through the message body.

21. **`parseInt(ipCountStr || "0", 10)` accepts garbage silently.** `comp.js:74` (and every AI endpoint): if KV ever stores a non-numeric value at a `rate:` key (operational mistake, manual edit, future migration bug), `parseInt("garbage", 10)` returns `NaN`, and `NaN >= PER_IP_DAILY_LIMIT` is `false`, which **defeats the rate limit silently**. **Fix:** `const ipCount = Number.isFinite(parseInt(ipCountStr || "0", 10)) ? parseInt(ipCountStr || "0", 10) : 0` — or fail-closed with a 503.

22. **No body size cap before `request.json()`.** Every endpoint trusts CF Pages' default body limit (~100MB). A malicious 50MB JSON body parses successfully, then validation rejects it as "too long" — the parse cost was paid. **Fix:** check `request.headers.get("content-length")` first and return `413 Payload Too Large` if > 10000 bytes.

23. **`waitlist.js` stores plaintext email *inside* the KV value.** `waitlist.js:54`: `const entry = JSON.stringify({ email, ts: ..., source })`. The KV *key* is correctly hashed (line 43), but the JSON value at that key includes the original email in plaintext. `wrangler kv:key get waitlist:<hash>` will reveal it. The privacy page should disclose this OR the email plaintext should be removed from the value (which would defeat the purpose of having a waitlist). **Decision:** if `privacy.html` discloses email-storage to enable Pro-tier launch comms, mark OK and move on. If it doesn't, either update privacy or migrate waitlist storage to a managed list (Buttondown, ConvertKit) that the user has already vetted via Slatework.

24. **`waitlist.js` has no global cap.** Lines 35-39 enforce a 3/day per-IP cap but no global ceiling. A coordinated signup campaign could write large data to KV. **Fix:** add a `global:waitlist:<date>` ceiling at, say, 500/day; reject above with a "We've had a great response today, please try tomorrow" message.

25. **Privacy/terms pages use `Inter` and `Fraunces` while every other page uses just `Fraunces`.** `privacy.html` line 26 and `terms.html` line 26 import both fonts; `body` uses Inter. Tool pages use Fraunces for everything. The legal pages feel like a different site. **Fix:** switch the legal pages to Fraunces-only.

26. **Privacy/terms page CSS inlined despite `/tool.css` existing.** `privacy.html` lines 27–56 and `terms.html` lines 27–56 are 30 lines of inline CSS that duplicate ~80% of `tool.css`. Both pages also use a slightly different colour palette (`--paper:#f6efe1` vs `tool.css#faf6f0`, `--ink:#1a1a1a` vs `#1a1814`). **Fix:** include `<link rel="stylesheet" href="/tool.css">` on legal pages and drop the inline block, OR align the inline-CSS values to the `tool.css` palette.

27. **Pro tier $9/month claim is asserted twice without a way to opt out.** `index.html` line 280 in the FAQ specifies *"The Pro tier ($9/month, unlimited, with batch processing for series authors)"*; line 262 in the About says *"Pro tier with unlimited searches coming soon."* If the price changes before launch, both lines need updating. **Fix:** state the price once in the FAQ, leave the About as just "Pro tier coming soon" so price isn't asserted twice.

28. **Tool-page footers have no link back to the homepage's Pro waitlist.** Tool pages list Home / Privacy / Terms / Contact but a user who's just clicked Generate has no pointer to the waitlist. **Fix:** add `<a href="/#waitlist">Pro waitlist</a>` to the tool-page footer.

29. **Hidden-label CSS uses two different patterns.** `index.html` line 304 uses `class="visually-hidden"` (good — `tool.css` line 142 has the modern clip-path). But `index.html` line 144 (`.skip-link`) and `tool.css` line 143 use `position:absolute;left:-9999px` — same as Slatework #18. Off-screen positioning works but is the legacy pattern. Lower priority; skip-link being off-screen-until-focused is a deliberate accessibility convention.

30. **`details.sample` toggle handler bound twice on the homepage.** `index.html` lines 326 and lines 512–520 both register `toggle` listeners on the same `details.sample` elements. Two `scrollIntoView` calls per toggle. Pick one.

31. **`renderMarkdown` regex doesn't handle `### h3` consistently between homepage and shared `tool.js`.** `index.html` line 405 (homepage's inline `renderMarkdown`) handles only `## h2`; `tool.js` lines 15–16 handles both `### h3` and `## h2`. If the comp endpoint returns `### Subhead` markdown, the homepage renders it as `<p>### Subhead</p>` while `/blurb` renders it correctly. **Fix:** reuse `Authorly.renderMarkdown` from `tool.js` on the homepage and delete the inline duplicate at lines 404–435.

32. **`primaryLongMsg` set only on `bio.html` line 109; the other 5 tool pages omit it.** `tool.js` line 178 falls back to `"That's too long."` for the other tools. **Fix:** add a per-tool `primaryLongMsg` to each (e.g. blurb: `"Plot details too long — keep it under 2000 chars (≈400 words)."`).

33. **Privacy page H1 says "Privacy policy" (lowercase 'p') but page title says "Privacy Policy".** `privacy.html` line 6 vs line 74. Cosmetic. Same for `terms.html` line 6 vs line 74.

34. **Identical `jsonResponse` defined in 9 files.** `comp.js:148-156`, `blurb.js:147-155`, `keywords.js:146-154`, `categories.js:154-162`, `tropes.js:142-150`, `ads.js:152-160`, `bio.js:140-148`, `waitlist.js:71-79`, `feedback.js:67-75`. Same fix as #17.

35. **Error shape disagreement: empty Anthropic response returns 502, but should be 500.** `comp.js:127`, etc. 502 implies the proxy received a bad response from upstream — defensible, but inconsistent with the rest of the file's status codes (502 is also used for "Could not reach AI service").

36. **`anthropic-version: 2023-06-01` is a 3-year-old API version (every endpoint).** Anthropic continues to support this version, but newer features (extended thinking, prompt caching, structured outputs) require newer versions. **Fix:** pin to `2025-01-01` or whatever current works for Sonnet 4.5/4.6 if the user wants prompt caching benefits at launch traffic.

37. **No `temperature` setting on any AI call.** Anthropic's default is 1.0 — fine for creative copy (blurb, ads, bio) but produces inconsistent comp-finder output. **Fix:** for `comp.js`, `categories.js`, `keywords.js`, `tropes.js` (factual lookups), set `temperature: 0.5`. For `blurb.js`, `ads.js`, `bio.js` (creative), keep default.

38. **`og:image` declared but no `og:image:width` / `og:image:height` meta.** PNG is 2400 × 1260 (correct 1.9:1). Facebook's debugger and LinkedIn's preview render faster when dimensions are declared. **Fix:** add to every page that has og tags (10 files):
```html
<meta property="og:image:width" content="2400">
<meta property="og:image:height" content="1260">
<meta property="og:image:alt" content="Authorly — free tools for indie authors">
```

39. **`/privacy` and `/terms` have no JSON-LD blocks.** Fine for SEO (these aren't pages you want to rank), but adding minimal `WebPage` schema with `dateModified` lets the privacy page surface its "Last updated: May 4, 2026" line in rich results.

40. **`hello@authorly.tools` literal address appears in `index.html` line 263 plain-text inside the contact `<a>`.** Every other `a.contact` element on the site is empty inside (relying on JS to fill text). Bots scraping plain text WILL hit this one. **Fix:** either remove the literal address (let the inline script fill it), or accept that the address is public and stop using empty `data-u`/`data-d` placeholders elsewhere — pick one model.

41. **`twitter:url` meta tag not set on any page.** Open Graph `og:url` is set on every page but the corresponding `twitter:url` is missing. Either add `twitter:url` everywhere or delete the redundant `twitter:title`/`twitter:description`/`twitter:image` (which all duplicate `og:*`).

42. **Cache-Control on `/api/*` not set in `_headers`** — each function returns `no-store` via `jsonResponse`. Fine, but the comment in `_headers` line 30 ("# API responses are already no-store from each function — no rule needed here.") relies on every future function author remembering this. **Fix:** add belt-and-braces `/api/*` rule in `_headers` setting `Cache-Control: no-store`.

43. **No `LICENSE` file at the repo root.** README.md says the source is on GitHub, but the repo has no LICENSE — so the implied "MIT-licensed" claim in `replies.md` (line 90, 93) isn't backed by a license file. **Fix:** either commit `LICENSE` (which then ships at `/LICENSE`) or edit `replies.md` to drop the open-source claim.

44. **Discord webhook rotation status is still "needs rotation as of 2026-05-05".** Today is 2026-05-07. CLAUDE.md says the webhook URL leaked into claude-mem logs. The new manual playbook (committed today) abandons the Discord channel entirely so this is moot for launch — but if any future automation re-enables Discord, the webhook is compromised history. **Fix:** rotate now even though it's not on the launch path.

---

## Nice-to-have (v0.2 backlog)

45. **Cache-Control on `/feedback.js` set to `max-age=3600`** in `_headers` line 25 with no fingerprint in the URL. After fixing #10, users who first loaded the file in the prior hour still hit the placeholder code. Acceptable but a fingerprinted URL (`/feedback.js?v=2026-05-07`) would invalidate immediately.

46. **`og.png` is 121,282 bytes (118 KB)** — 4× the homepage transfer size. Single largest asset. **Fix:** generate a 1200 × 630 variant under 50 KB and serve as `og.png`, keep 2400 × 1260 as `og@2x.png`.

47. **`<details class="sample">` "Was this useful?" feedback widget appended below results has no debounce.** `feedback.js` lines 117–137. Clicking 👍/👎 again selects-and-deselects the toggle visual but does NOT post duplicates (the actual POST is gated behind the Send button). **The Slatework feedback duplicate-bug is NOT present here** — keep it that way.

48. **Tool pages have no breadcrumb back to "All tools".** Header nav offers `Home / Tools / About` (`blurb.html` 47–49) which uses `/#more` to anchor. A "← All tools" link above the H1 would be the convention. Note: `tool.css` line 152 hides the "Tools" link on mobile (`@media (max-width:600px) .nav a:nth-child(2){display:none}`) — verify intentional.

49. **Sitemap doesn't declare `lastmod`.** **Fix:** add `<lastmod>2026-05-07</lastmod>` per URL — Google uses it as a hint for re-crawl frequency.

50. **`Link: rel=canonical` HTTP header isn't present** (only the in-HTML `<link rel="canonical">`). Adding it as a header is a 1-line `_headers` change and reinforces the canonical signal for non-HTML responses.

51. **`Strict-Transport-Security` is set to `max-age=63072000; includeSubDomains; preload`** — value is correct. **Verify** that `authorly.tools` is on the HSTS preload list at https://hstspreload.org/ before launch. The directive is set, but only the preload list submission makes browsers respect `preload` from a fresh state.

52. **No prompt caching enabled.** Anthropic's prompt caching saves ~90% on cached input tokens for repeated system prompts. Every tool sends the same system prompt every time. Adding `system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }]` cuts cost by ~80% on repeat traffic. Requires API version bump (#36).

53. **No structured request logging.** No way to know which tool is most-used or which seed inputs are most common. Adding `console.log({ tool, ip_hash, ts, status })` (without prompt or response body) to each endpoint would help post-launch decisions. **Don't log the prompt or completion** (PII risk).

54. **Genre chips are rendered on tool pages but `bio.html` line 109 has no `.genre-chip` markup** — that's by design (bios don't need genre), but `buildBody()` line 148 sets `body.genre = genre.selected` only if `genre` truthy, so bio submissions don't include `genre` at all. Confirm `/api/bio` doesn't require it (per backend audit, it doesn't — `bio.js` accepts `facts` only).

55. **No `meta name="keywords"` on any page.** Slatework is the same. Search engines mostly ignore it; mention as "intentionally omitted" or add 5-keyword tags for SEO completeness.

56. **No structured `softwareVersion` or `dateModified` in JSON-LD.** Adding `"dateModified":"2026-05-07"` to each schema lets Google use a fresh-content signal.

57. **`og.svg` is also served (200 OK, ~4,861 b est.)** — fine, but is it referenced anywhere? If not, drop it.

58. **The 404 page transfer size (4,422 b vs Slatework's 2,157 b) is 2× larger** because the inline CSS is per-page and not shared from `tool.css`. Worth normalizing post-launch.

59. **`Permissions-Policy` could add more directives** (`accelerometer=(), gyroscope=(), magnetometer=(), midi=(), clipboard-read=(self), display-capture=(), encrypted-media=(), fullscreen=(self), picture-in-picture=()`). Defensive depth.

60. **No `Cross-Origin-Embedder-Policy` (COEP) header.** COOP is set to `same-origin`. Currently nothing on the site needs `SharedArrayBuffer`, so leave it off — note for v0.2.

61. **The waitlist form has no honeypot, no Turnstile, no CSRF token.** Endpoint hashes emails and dedups. Consider Turnstile if launch traffic surfaces bot signups.

62. **No `humans.txt`, no `security.txt`** at the repo root. `.well-known/security.txt` is a nice-to-have for receiving vuln reports.

63. **`hreflang` and `lang` attributes** — every HTML file has `<html lang="en">` (good), but no `hreflang="en-US"` in OG tags. Authorly is currently English-only and Amazon-KDP-focused, so this is fine for launch.

64. **Feedback KV key uses ISO timestamp + 8-byte IP hash** — collision space is 32 bits, possible at high scale. Add a 4-char random suffix.

65. **`bio.js` prompt has dense formatting** — readability would improve with bullets. Doesn't hurt output.

---

## What's working well (don't change)

- **All 10 canonical/og:url tags are extensionless already.** This is the single biggest fix Slatework needed and Authorly already has it right (cross-checked all 9 sitemap entries against their `<link rel="canonical">` tags). Don't break this.
- **Identity discipline in shipped HTML is genuinely clean.** Footer reads `Built by Darren · 2026` everywhere (verified by grep — 10 matches), no surname anywhere, no `@handle`, no `johndelaneyis@gmail.com` in shipped HTML. The phantom `@delanyarrows` from earlier sessions has not reappeared.
- **CSP is strict and matches what's loaded.** `_headers` line 7 allow-lists exactly Google Fonts CSS, Google Fonts files, self for everything else. No `'unsafe-eval'`, no wildcard image sources beyond `data:`. Only mismatch is the unused `cloudflareinsights.com` allowance (#10).
- **Reduced-motion is honored.** `tool.css` lines 154–156 and `index.html` line 141 both suppress all animations under `prefers-reduced-motion:reduce`. Both files agree.
- **Skip links are present on every page.** `index.html` line 171, all six tool pages line 41, privacy/terms line 59. The 404 page has nav but no skip link (acceptable — it's all content, no main).
- **Touch targets meet 44px on every standard interactive element.** `.btn` is 14px+28px padding (≈48px tall), input fields are 14px padding × 18px font (≈46px). Phone QA passes.
- **No mojibake.** Grep across all 10 HTML files for `â€` / `Â§` / `âœ` patterns returned zero hits. Pack B's mojibake risk is currently controlled. (One hit in CLAUDE.md line 95 is the documentation pattern itself, not a real defect — but that file is leaking, see Critical #1.)
- **`escapeHtml` neutralizes model output before insertion.** `tool.js` lines 11–14 escape `&` `<` `>` before any markdown matching. XSS via model-injected `<script>` is not viable.
- **The shared `tool.js` runtime is a real architectural win.** Six tool pages share validation, char counter, genre chips, feedback widget hookup, and the markdown renderer through one ~270-line module. Don't undo this. (Then do the same for the backend — see #17.)
- **`<details class="sample">` "See an example of what you'll get" pattern is excellent UX.** Lowers the bar to first use because the user sees the output shape before pasting anything. Present on all six tool pages and the homepage's tool. Keep.
- **`waitlist.js` correctly hashes the email before using it as a KV key.** SHA-256 hex of the lowercased email is the right pattern; no email plaintext appears in the key namespace.
- **`feedback.js` correctly hashes the IP before key-suffix.** 8 hex chars = 32 bits, fine for daily traffic at expected volume.
- **The model defaults to `claude-sonnet-4-5` (a current model) and respects `env.ANTHROPIC_MODEL` override.** Better than Slatework's prior state. Worth bumping to 4.6 (#19) but no hardcoded retired model anywhere.
- **Each AI endpoint's prompt is good.** Specifies format, explicitly forbids common AI-output failures ("never invent a book", "never ALL CAPS", "exactly 130-180 words"), ends with a "verify before publishing" footer. Trope finder's "only list tropes the description actually supports" rule is the kind of guardrail that prevents the most embarrassing AI failure mode (hallucinated tropes).
- **Input length validation is enforced before checking the env vars.** A malformed request fails cheaply without revealing whether the API key is provisioned. Good security hygiene.
- **`Cache-Control: no-store` on every API response.** Prevents CDN or browser from caching AI responses.
- **The Anthropic key is read from `env.ANTHROPIC_API_KEY` only and never logged.** No `console.log(env)`, no error message echoes the key. Verified across all 9 functions.
- **All 9 endpoints export `onRequestPost` AND `onRequest`, so non-POST requests get a clean 405 with the same JSON error shape.** Better than Slatework's pre-fix state which returned 404 HTML for non-POST (Slatework #8).
- **Same-origin posture is correct.** Browsers can only call these endpoints from `authorly.tools` HTML because no `Access-Control-Allow-Origin` is emitted.
- **Privacy posture is honest, not theatre.** No mention of Cloudflare Insights since it's not actually loaded; explicit Anthropic 30-day retention disclosure; explicit IP-rate-limit retention (48 h); GDPR/UK-GDPR/CCPA rights paragraph.
- **Per-tool rate-limit prefix isolation.** A heavy comp-finder user still gets 5 keyword searches, 5 categories, etc. Right call.

---

## Live probe results

### Pages

| Path | Status | Size | TTFB | Title (start) |
|---|---:|---:|---:|---|
| `/` | 200 | 32,133 b | 0.098 s | Authorly — Free Tools for Indie Authors |
| `/blurb` | 200 | 9,455 b | 0.120 s | Amazon book description writer — Authorly |
| `/keywords` | 200 | 10,382 b | 0.097 s | KDP keyword expander — Authorly |
| `/categories` | 200 | 9,184 b | 0.099 s | Amazon category recommender — Authorly |
| `/tropes` | 200 | 8,786 b | 0.099 s | Trope finder — Authorly |
| `/ads` | 200 | 11,897 b | 0.097 s | Amazon Ads headlines — Authorly |
| `/bio` | 200 | 8,017 b | 0.092 s | Author bio generator — Authorly |
| `/privacy` | 200 | 9,142 b | 0.093 s | Privacy Policy - Authorly |
| `/terms` | 200 | 8,792 b | 0.093 s | Terms of Service - Authorly |
| `/404` (deliberately bad) | 404 | 4,422 b | — | Page not found - Authorly |

### Static assets (selected)

| Path | Status | Cache-Control | Notes |
|---|---:|---|---|
| `/favicon.svg` | 200 | `public, max-age=86400, stale-while-revalidate=604800` | OK |
| `/og.png` | 200 | `public, max-age=14400, must-revalidate` | 121,282 b — 4× the homepage |
| `/feedback.js` | 200 | `public, max-age=14400, stale-while-revalidate=86400` | OK |
| `/sitemap.xml` | 200 | `public, max-age=3600` | OK |
| `/robots.txt` | 200 | `public, max-age=14400` | OK |
| **`/CLAUDE.md`** | **200** | `public, max-age=0, must-revalidate` | **CRITICAL — content leak (#1)** |
| **`/README.md`** | **200** | `public, max-age=0, must-revalidate` | Public, contains repo identity — acceptable |
| **`/.gitignore`** | **200** | `public, max-age=0, must-revalidate` | Public — low-grade info disclosure |
| **`/distribution/*`** | **200** | `public, max-age=0, must-revalidate` | **CRITICAL — full launch playbook leak (#2)** |
| `/_headers` | 404 | `no-store` | OK — config not served |

### API endpoint behaviour

| Endpoint | GET | POST `{}` | OPTIONS |
|---|---|---|---|
| `/api/comp` | 405 clean | 400 with input-min message | 405 (#18) |
| `/api/blurb` | 405 clean | 400 | 405 |
| `/api/keywords` | 405 clean | 400 | 405 |
| `/api/categories` | 405 clean | 400 | 405 |
| `/api/tropes` | 405 clean | 400 | 405 |
| `/api/ads` | 405 clean | 400 | 405 |
| `/api/bio` | 405 clean | 400 | 405 |
| `/api/feedback` | 405 clean | 400 ("Unknown tool") | 405 |
| `/api/waitlist` | 405 clean | 400 ("invalid email") | 405 |

All 9 endpoints return clean `405 {"error":"Method not allowed. Use POST."}` for non-POST methods (better than Slatework's old behaviour which returned 404 HTML). All return `400` with the JSON error shape on bad input. **No `Access-Control-Allow-Origin` is emitted anywhere** — same-origin posture, intentional and correct. **No `Retry-After`** on the 429 path (defect #6). Secret handling is clean: `ANTHROPIC_API_KEY` never logged, never appears in error messages.

### Identity / mojibake / year sweeps across the repo

- **Identity sweep** (`delany|Delany|@delanyarrows|johndelaneyis|delaneyis`): zero hits in served `.html`, `.css`, `.js`. Three hits in source: `CLAUDE.md` (1 — `johndelaneyis@gmail.com` and `johndelaneyis-cmyk/authorly-tools`), `distribution/cold-emails.md:60`, `distribution/replies.md:90,93`. **All three files are publicly served per Critical #1 + #2** — fixing those closes this sweep.
- **Year sweep** (`© 2025|2025 Author|Built by .* · 2025`): zero hits across all `.html` files. Every footer reads `Built by Darren · 2026`. Clean.
- **Mojibake sweep** (`â€|â†|Â§|âœ`): zero hits in `.html`, `.js`, `.md`, `.css`. One hit in `CLAUDE.md` line 95 — that's the mojibake pattern itself, used as documentation. Clean.

---

## Recommended remediation order

### Wave 1 — pre-launch blockers (~45 minutes)

1. **Move `CLAUDE.md` → `.claude/CLAUDE.md`** + add `_redirects` rules:
   ```
   /CLAUDE.md       /404.html  404
   /distribution/*  /404.html  404
   /docs/*          /404.html  404
   /HANDOFF.md      /404.html  404
   /README.md       /404.html  404
   /.gitignore      /404.html  404
   ```
   Verify each path returns 404 after deploy. (10 min)

2. **Rotate the Discord webhook** referenced in CLAUDE.md (5 min, manual user task in Discord Server Settings).

3. **Fix the rate-limit framing on the homepage** — `index.html` line 262 → `"Five free runs per tool per day per visitor"`. (1 min)

4. **Drop the recursive `/404` canonical** — `404.html` line 9 (1 min).

5. **Decide on Cloudflare Web Analytics** — install `BEACON_TOKEN` and add a privacy bullet, OR delete the IIFE at `feedback.js:10-18` and the `cloudflareinsights.com` entries from `_headers:7`. (10 min)

6. **Add inline contact-link wiring to the 6 tool pages** (5 min).

7. **Bump `DEFAULT_MODEL` to `claude-sonnet-4-6`** in all 7 endpoints (5 min, or set `ANTHROPIC_MODEL` in CF Pages env vars).

### Wave 2 — backend hardening (~2 hours)

8. **Build `functions/api/_lib.js`** with `rateCheck`, `callClaude`, `jsonResponse`, `extractIp` helpers. Refactor all 9 endpoints to use them. (90 min)

9. **In `_lib.extractIp`, hash the IP** before composing the rate-limit key. Same SHA-256-truncate pattern as `feedback.js:47`. (5 min, after #8 lands)

10. **In `_lib.jsonResponse`, emit `Retry-After` on 429.** (5 min)

11. **Add a single cross-tool global daily cap** at 5000 (or 70% of daily Anthropic budget). One KV check `global:all:<date>`. (15 min)

12. **Wrap counter-puts in try/catch + `ctx.waitUntil()`** to prevent counter-desync if KV write fails. (10 min)

### Wave 3 — polish (~1 hour, can land during seasoning week May 18-24)

13. Add `FAQPage` JSON-LD to homepage (15 min).

14. Add minimal `WebPage` JSON-LD to privacy + terms (10 min).

15. Add `og:image:width/height/alt` to all 10 head sections (10 min).

16. Privacy page rewrite to cover all 7 tools (lines 7, 14, 79, 81, 92) (15 min).

17. Footer normalization across the 3 templates (10 min).

After Waves 1+2+3, Authorly is structurally launch-ready, the backend has a single-edit-fixes-all model, and the v0.2 backlog (items #25–65) is genuinely "nice-to-have" — no defects on the critical path.

---

## What this review is NOT trying to do

- It's not trying to redesign the visual language. The Fraunces typography + sample-output convention + maker line is working — keep that.
- It's not trying to add features. The seven-tool scope is correct for launch; tool 7 is a v0.2 question.
- It's not trying to push Pro tier. Waitlist signal is the test; build Pro after launch surfaces real demand.
- It's not gating on any of the v0.2 nice-to-haves.

The single load-bearing question is whether the deploy bucket leak (Critical #1 + #2) gets closed before any traffic hits the site. Until that's fixed, every visitor (including a competitor doing recon during the May 18-24 seasoning window) gets the operator's identity, the GitHub repo, and the full Reddit launch playbook served on a 200 OK.

---

*Audit subagents wrote granular per-dimension findings in `.claude/audit-2026-05-07/{frontend,backend,infrastructure}.md` — preserved for reference. This master review deduplicates and reorders by severity.*
