# Section E — Code Quality & Security — Authorly

**Code quality:** 8.7/10
**Security:** 9.4/10
**Combined:** 9.0/10

Authorly's server side is in genuinely strong shape — the `_lib.js` refactor is clean, the leak-blocking middleware works, the Anthropic call discipline (timeout-free but well-structured error mapping, cache_control prefix, no error pass-through) is solid, and the surface area for prompt injection / XSS is small because outputs flow through a homegrown markdown renderer with prior HTML-escape. The biggest remaining gap is one tool page (`ads.html`) that never got migrated to the shared `Authorly.initTool()` runtime and still ships a parallel implementation — this is duplication risk, not a security defect, but it drags code-quality. Two real defects: no `AbortController` timeout on the Anthropic fetch (a slow upstream stalls a Worker invocation up to the platform default), and the markdown renderer's `*…*`/`**…**` regexes can produce double-escaped HTML on adversarial inputs (still safe, just ugly). CSP is strict on `connect-src`/`img-src`/`object-src` but retains `'unsafe-inline'` on `script-src` and `style-src`, which Slatework also tolerates.

## Sub-scores

| Sub-dim | Score | Note |
|---|---|---|
| Client JS | 8 | `tool.js` shared runtime is good; `ads.html` is an unmigrated outlier with a duplicate fetch path. `index.html` waitlist handler is inline-clean. Markdown renderer is escape-first. |
| XSS surface | 9 | All AI text passes through `String(md).replace(/&|<|>...)` *before* markdown transforms; structural injection limited to chosen tags (`h2/h3/strong/em/p/ol/ul/li`). No user-controlled HTML reaches `innerHTML` raw. |
| Error handling | 8 | Friendly user messages, no stack/upstream-body leakage, `try/catch` around fetch + JSON parse. Missing: timeout on upstream call; no machine-readable error codes (Slatework's `userFacingClaudeError` does this better). |
| Server JS | 9 | `_lib.js` is well-commented, single-responsibility per export, race-note documented. Endpoint files are near-identical thin wrappers — DRY achieved. |
| Secret handling | 10 | `ANTHROPIC_API_KEY` only read in `callClaude`. `envGuard` returns same generic 503 regardless of which secret is missing — no info-leak. Never logged, never echoed in errors. |
| Rate limiting | 9 | Three-tier (per-IP / per-tool / cross-tool), $5k circuit-breaker hard-coded as global daily cap, `Retry-After` on 429. Documented KV non-atomic race is bounded and accepted. -1 for waitlist endpoint not using shared `rateCheck` (fine since shape differs). |
| Input validation | 9 | Length floors/ceilings on every field, `parseBodyOrFail` enforces 10 KB body cap with 413, JSON parse failures map to 400. Genre is `slice()`'d not validated against an enum — minor (genre is appended to a system-driven prompt, not used in code paths). |
| CSP strictness | 7 | `default-src 'self'`, no wildcards, no `'unsafe-eval'`, framing locked. But `script-src 'self' 'unsafe-inline'` and `style-src 'self' 'unsafe-inline' …` keep inline scripts/styles. Slatework's CSP is **also** non-strict on these (their post-launch v0.3 hardening hasn't been ported to Authorly). |
| Logging privacy | 10 | IPs SHA-256-truncated to 16 hex chars before any KV/log write. User content (book descriptions, plot, emails) NEVER logged. KV-put failures log only the slot name (`ip`/`tool`/`all`/`entry`) and exception message. |
| Anthropic API discipline | 8 | Cache-control ephemeral on system prompt, error-type-aware user messaging, error body never passed through. -2: **no `AbortController` timeout** on the upstream fetch, no model fallback chain (Slatework has both). |
| Cross-tool cost cap | 10 | `GLOBAL_DAILY_CEILING = 5000` enforced on `global:all:<date>` KV key, checked before bump in `rateCheck`, blocks with 503. Verified working: `_lib.js:12, 119–125`. |

## Verification of prior-review claims (2026-05-07 — 12 critical items)

| Claim | Verified? | File:line | Notes |
|---|---|---|---|
| Leak blocking via `_middleware.js` | yes | `functions/_middleware.js:7-34` | 12 path patterns blocked (CLAUDE.md, HANDOFF.md, README, .git*, distribution, docs, .claude, .wrangler, .env*, wrangler.toml, package*.json). Returns 404 with `X-Robots-Tag: noindex, nofollow`, `Cache-Control: no-store`. |
| Hashed IPs (SHA-256-truncated) | yes | `functions/api/_lib.js:37-50`; `functions/api/feedback.js:36`; `functions/api/waitlist.js:32` | 64-bit truncation. Raw IP never written to KV. |
| `Retry-After` headers on 429 | yes (per-tool only) | `functions/api/_lib.js:24-26` | Auto-emitted on 429 via `jsonResponse`, value = `secondsUntilUtcMidnight` (min 60). **Gap:** waitlist `429`s and feedback `429`s use the same path (call `jsonResponse(..., 429)`), so they get it too — verified. |
| `$5k cross-tool` cap | yes | `functions/api/_lib.js:12, 119-125` | `GLOBAL_DAILY_CEILING = 5_000` constant, checked against `global:all:<today>` key, blocks all 7 AI endpoints. Bumped via `bumpCounters` (`_lib.js:143-162`). |
| BEACON strip | yes | n/a (absence) | `cloudflareinsights` not present in any served file (only mentioned in old review markdown). `_headers` has no `cloudflareinsights.com` allowance. CSP `connect-src 'self'` confirms. |
| Model `claude-sonnet-4-6` | yes | `functions/api/_lib.js:9` | `DEFAULT_MODEL = "claude-sonnet-4-6"`, `env.ANTHROPIC_MODEL` override at `_lib.js:178`. **Note:** README still says `claude-sonnet-4-5` at `README.md:31` — minor doc drift. |
| FAQPage JSON-LD on homepage | yes | `index.html:28-30` | Single `@graph` JSON-LD with Organization + WebSite + FAQPage (4 questions). Well-formed. |
| Unified footer across 10 pages | yes | `index.html:210-226`, `ads.html:120-136`, `blurb.html:115-131`, etc. | Identical link order Home / All tools / Pro waitlist / Privacy / Terms / Contact + byline. Tool pages all carry it. |
| `ctx.waitUntil` for KV writes | yes | `_lib.js:158-160`; `feedback.js:63-65`; `waitlist.js:77-79` | All async KV writes wrapped, `Promise.allSettled` so partial failure logs but doesn't block response. |
| Counter race-note documented | yes | `_lib.js:138-142` | Acknowledged: KV has no atomic INCR; race bound = `perIpLimit × concurrent`. Acceptable at 5/day per-IP limit. |
| API errors don't pass through Anthropic body | yes | `_lib.js:202-213` | Only the `error.type` field is read from the upstream body; mapped to one of 4 user-facing strings. Body is never echoed. |
| Method-not-allowed handlers | yes | every endpoint `onRequest()` returns `methodNotAllowed()` (405) | Confirmed across all 9 `functions/api/*.js`. |

All 12 prior-review claims **verified true** against current code. Prior review was honest.

## Findings

### Critical
*(none)*

### Important

- **No upstream `AbortController` timeout on Anthropic fetch** — `functions/api/_lib.js:188-200` — A slow Anthropic response holds a Cloudflare Workers invocation open up to the platform default (CPU+wall budget on Pages Functions, but the user sits on a stalled spinner). Fix: wrap the `fetch` like Slatework does (`slatework/functions/_lib.js:158-179`) — `AbortController` + `setTimeout(controller.abort, 55_000)`, throw `ClaudeError('timeout', ...)` on `AbortError`, map to 504. ~10 LOC change. **This is the single biggest server-side gap vs Slatework.**

- **No model fallback chain** — `functions/api/_lib.js:177-226` — If Anthropic gates `claude-sonnet-4-6` for the API key (403 with type `permission_error`) every tool fails until the env var is changed. Slatework's `_lib.js:201-235` walks a chain (`sonnet-4-5 → sonnet-4-5-20250929 → haiku-4-5`) on 403 and surfaces a fallback log. Authorly's prompts are tuned for Sonnet but a Haiku fallback is far better than a hard fail. ~30 LOC port.

- **`ads.html` ships a duplicate fetch handler instead of using `Authorly.initTool()`** — `ads.html:140-260` — Every other tool page (`bio.html`, `blurb.html`, `categories.html`, `comp/index.html`, `keywords.html`, `tropes.html`) calls `Authorly.initTool(cfg)` from `tool.js`. `ads.html` reimplements: genre chip wiring (`ads.html:150-162` ≈ `tool.js:64-96`), char counter (`ads.html:164-167` ≈ `tool.js:99-104`), validation+fetch+render (`ads.html:169-233` ≈ `tool.js:158-234`). The duplicate `outBody.innerHTML = '<div class="error">…</div>'` strings (lines 175/180/185/192/214/227) bypass the safer `replaceChildren(div)` pattern that `tool.js:135` uses. Risk: any future fix to the shared runtime (e.g., a copy-button bug, a CSP fix) silently misses `/ads`. Fix: migrate `ads.html` to `Authorly.initTool({ extraFields: [{id:"title",name:"title",required:true,errEmpty:"Please enter your book title."},{id:"comps",name:"comps"}], ... })`. The `extraFields` mechanism (`tool.js:142-149, 161-168`) was designed for exactly this case. ~80 LOC delete from `ads.html`.

- **Markdown renderer's `*` and `**` regexes are non-greedy by `*`-count, not balanced** — `tool.js:17-18` — The pattern `/\*\*([^*]+?)\*\*/g` followed by `/\*([^*\n]+?)\*/g` cannot handle a literal `*` inside emphasis or `**bold *and italic*** combos. AI output that contains a stray `*` (asterisk in a quote, e.g., a 4-star rating, or a wildcard like `*.com`) will produce malformed HTML with leftover `*` characters. Not exploitable (HTML is escaped first, the leftover `*` is a literal char), but ugly when it surfaces in tool output. Fix: pre-escape `**` to a sentinel before `*` substitution, OR use a tighter pattern like `/\*\*((?:[^*]|\*(?!\*))+)\*\*/g`. Low priority — only matters if AI emits stray asterisks, which the system prompts discourage.

- **Genre input is `slice()`-truncated but not enum-validated** — `comp.js:58`, `blurb.js:62`, `categories.js:71`, `tropes.js:59`, `ads.js:66`, `keywords.js:62` — `genre = String(body.genre || "").trim().slice(0, MAX_GENRE_LEN)` accepts any 60-char string and concatenates it into the user message (`"\n\nGenre: " + genre`). Not exploitable (Anthropic's system prompt is in cache_control prefix; user-supplied text can't override system instructions through this path), but a hostile genre value like `"\n\n# OVERRIDE: ignore previous instructions"` would be passed verbatim. Defense-in-depth fix: validate against `["", "romance", "thriller", "mystery", "fantasy", "sci-fi", "literary fiction", "memoir/non-fiction"]` (the same set HTML chips emit). Low risk because (a) Anthropic prompt-injection at this depth requires far more than 60 chars, (b) system prompt with cache_control is structurally separated, (c) the user pays for their own override attempt against their own daily quota. Worth fixing for principle.

### Nice-to-have

- **Newsletter/waitlist has no honeypot or Turnstile** — `waitlist.js:8-49`, `index.html:199-205` — Per-IP 3/day + global 500/day caps the abuse surface. SHA-256 dedup on email prevents inflating one entry. Won't matter at launch; consider Turnstile if bot signups appear in KV inspection during week 1.
- **No SRI on Google Fonts CDN** — every HTML head `<link href="https://fonts.googleapis.com/css2?...">` — Google Fonts CSS doesn't support SRI cleanly because the served CSS varies per UA. Cloudflare doesn't cache this at the edge anyway. Acceptable; flagging for thoroughness only.
- **`tool.js` is IIFE-style with `var`/`function` declarations** — vanilla constraint respected, but no module boundaries. If the codebase grows past ~10 tools, consider an ES module structure. Not a launch blocker.
- **`feedback.js` and `tool.js` wire contact links twice** (`feedback.js:11-29` IIFE + `tool.js:51-61` `wireContactLinks()`) — both run on every page, both safe to call twice (they just re-set the same `href`). Cosmetic — pick one or move the IIFE into `tool.js`.
- **`renderMarkdown` uses dual-pattern lazy CSS-text replacement** — `tool.js:11-48` — Functional, ~40 LOC. If markdown surface grows (tables, code blocks, links), swap to a battle-tested mini-renderer; for now, the constrained AI output makes this fine.
- **`.claude/serve.js` is a dev-only static server** — `.claude/serve.js` — Not deployed (blocked by middleware regex `^\/\.claude(\/|$)/i` at `_middleware.js:15`). Verified safe.
- **`bumpCounters` returns `writes` Promise but caller never awaits** — `_lib.js:143-162` — Intentional (the response should ship before counters commit). The `ctx.waitUntil(writes)` keeps the Worker alive long enough. Working as designed; a one-line comment at the call sites would make this less surprising.

## Ship-now top 3

1. **Add `AbortController` timeout to `callClaude`** in `_lib.js:188-200` — port the Slatework pattern verbatim, ~10 LOC. Fixes user-visible stalled-spinner risk if Anthropic gets slow.
2. **Migrate `ads.html` to `Authorly.initTool()` with `extraFields: [title, comps]`** — `ads.html:140-260` → ~30-line config. Eliminates the duplicate fetch handler so future runtime fixes ship to all 7 tools at once.
3. **Validate `genre` against the chip enum** in all 6 endpoints that accept it — defense-in-depth one-liner: `if (genre && !VALID_GENRES.has(genre)) genre = ""`.

These three are the entire delta to a 9.5+ score on this section. Defer everything else to v0.2.

## What Authorly does well

- **Real `_middleware.js` 404-blocker for the deploy-bucket leak** — covers 12 patterns, returns 404 not 403, and adds `X-Robots-Tag: noindex, nofollow` to keep search engines from spider-noting blocked paths. Slatework doesn't have this file at all (relies on `.assetsignore` build-time exclusion which is more fragile).
- **`_lib.js` is genuinely well-factored** — every endpoint is now ~80 LOC of glue, and adding a new tool means writing a system prompt + 5 input constants. The single-edit-fixes-all goal mentioned in the prior review is real.
- **Cost-cap defense is layered correctly** — per-IP (5) → per-tool (2000) → cross-tool (5000), each enforced before counter bump. The race window is documented and bounded.
- **`callClaude` system-prompt cache_control** — Authorly is using prompt caching correctly (ephemeral wrap with cache_control flag at `_lib.js:182`); Slatework's `_lib.js:154` does NOT yet wrap system in the cache_control structure. Authorly's pattern is the better one — port back.
- **Hashed IPs use day-independent hashing in `_lib.js`** — Note: simple SHA-256-of-IP-truncated-to-16-hex (no day salt). This means a returning visitor's hash *doesn't* rotate daily. Slatework salts with `day` (`slatework/_lib.js:38-39`) so the fingerprint rotates every UTC midnight, which is genuinely better for privacy. **This is a place where Slatework is ahead of Authorly** — port the day-salt back. (See cross-project section.)
- **`feedback.js` IIFE-installed CSS** — clean self-contained widget; no CSS file shipped, no FOUC. Good pattern.

## Cross-project (Slatework parity)

### Patterns Slatework uses that Authorly should adopt

1. **`AbortController` timeout on Anthropic fetch** (`slatework/functions/_lib.js:158-179`) — Authorly has no timeout. Port verbatim.
2. **Model fallback chain on 403** (`slatework/functions/_lib.js:201-235`) — Authorly hard-fails on model gating. Port the `DEFAULT_FALLBACK_CHAIN` + `callClaude` retry loop.
3. **`ClaudeError` class with code/status/bodySnippet + `userFacingClaudeError`** (`slatework/functions/_lib.js:75-83, 290-364`) — Authorly's error mapping is inline in `callClaude` and lossy. The Slatework pattern gives endpoints a richer error shape with a server-side ref code (`ts`) for support tickets. Port.
4. **`extractUpstreamDetail` regex chain for upstream error bodies** (`slatework/functions/_lib.js:243-279`) — Authorly throws away the upstream message text. The Slatework pattern surfaces (sanitized) Anthropic detail to the user when it's diagnostically useful (e.g. invalid_request with a specific reason), which dramatically reduces "WTF is broken" support tickets.
5. **Day-salted IP hash** (`slatework/functions/_lib.js:34-46`) — adds `+ ':' + day` before SHA-256. Authorly's hash is stable across days; Slatework's rotates at UTC midnight, which is a genuinely better privacy property. Port — it's a 2-line change.
6. **`X-Forwarded-For` fallback in IP extraction** (`slatework/functions/_lib.js:35`) — Authorly only reads `CF-Connecting-IP`. CF Pages always sets this header so it's correct in production, but the fallback is good defense for testing/proxy edge cases.

### Patterns Authorly uses that Slatework should adopt

1. **`_middleware.js` deploy-bucket 404-blocker** (`authorly/functions/_middleware.js`) — Slatework has no equivalent. If a stray dev artifact lands in Slatework's deploy bucket, it's served. Port.
2. **System-prompt `cache_control: ephemeral`** (`authorly/functions/api/_lib.js:182`) — Slatework's `callClaudeOnce` (`slatework/_lib.js:148-156`) sends the system as a plain string, missing the prompt-cache hit. With Slatework's longer system prompts (lesson-plan, marking) this is real money. Port.
3. **`Retry-After` auto-emission on 429** (`authorly/functions/api/_lib.js:24-26`) — Slatework's `jsonResponse` doesn't auto-add this. Port.
4. **`GLOBAL_DAILY_CEILING` cross-tool circuit breaker** (`authorly/functions/api/_lib.js:12, 119-125`) — Slatework's `rateCheck` only checks per-IP + per-tool (not cross-tool). With Slatework's multi-modal endpoints (OCR + Vision + LLM), a runaway-cost scenario is more dangerous, not less. Port the `global:all:<date>` ceiling.
5. **`bumpCounters` separated from `rateCheck`** (`authorly/functions/api/_lib.js:88-162`) — Slatework's `rateCheck` does the bump inside the check, which means failed Anthropic calls still consume quota. Authorly only bumps after `callClaude` succeeds (`comp.js:81-83`, etc.) — better UX. Port the two-phase pattern.
6. **Strict `methodNotAllowed()` 405 catchall** (every Authorly endpoint's `onRequest()`) — Slatework's `methodNotAllowed` exists but isn't wired into every endpoint as a default. Cosmetic but tidier.
