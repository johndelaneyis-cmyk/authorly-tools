# Authorly Launch Plan — May 19-28, 2026

**Goal:** Get Authorly in front of indie KDP authors and the broader maker community over a coordinated 10-day window. Optimize for **real-author signal** first (waitlist + feedback votes + emails), high-stakes Show HN second.

**Approach:** Manual, no autoposter. Same shape as Slatework's May 7-14 playbook, deconflicted by ~2 weeks so Slatework reply window has cooled and single-human bandwidth isn't split.

**Account:** Reddit `u/Authorly` (or `u/authorly_maker` if taken). No personal X handle — see `~/.claude/projects/.../memory/user_authorly_identity.md`.

---

## Day-by-day schedule

### Thu May 7 → Sun May 17 — Setup window (any day, ~10 min total)

Manual user actions (see `manual-steps.md`):
1. Add `reddit@authorly.tools` alias in Cloudflare Email Routing → forward to `darrenhuiwork@gmail.com` (same destination as `hello@authorly.tools` and Slatework's `reddit@`).
2. Register Reddit account at `reddit.com/register` using that alias. Pick `u/Authorly` if available, else `u/authorly_maker`, `u/by_authorly`, `u/authorly_indie`. Avoid `u/authorlyofficial`.
3. Set bio: *"Indie author. Building free tools for self-publishing at authorly.tools."* Do **not** add the URL anywhere subreddit-scoped yet.
4. (Optional) Register an HN account at `news.ycombinator.com/signup` using `hn@authorly.tools` alias. Pick `Authorly` if available — single-purpose accounts are fine on HN.

### Mon May 18 → Sun May 24 — Seasoning (7 days, 20-30 min/day max)

Goal: ~50-100 comment karma on the indie-author Reddit account, no submissions, no URL drops. See `seasoning-playbook` section below for what to comment on.

Don't grind. 3-5 substantive comments per day across 2-3 subs is plenty. The point is to build pattern-of-helpfulness, not max karma.

### Tue May 26 — Reddit launch

- **9am UK / 4am ET:** Post to `r/selfpublish` (the bigger, more active indie sub). Use draft at `posts/r-selfpublish.md`.
- **2pm UK / 9am ET:** If first post is welcomed (no removal, some upvotes), post to `r/SelfPublishing` (the older, smaller variant) with the slightly rephrased opener. Use draft at `posts/r-selfpublishing.md`.
- **Hold:** `r/eroticauthors` and `r/IndieAuthorClub` for Wed (don't blast everywhere on day 1 — looks like coordinated promotion).

### Wed May 27 — Show HN + secondary Reddit

- **2pm UK / 9am ET sharp.** Peak HN front-page traffic. Use draft at `posts/show-hn.md`.
- **Be available 4-6 hours after submission** to respond to comments. Top response in first 90 minutes is the single biggest predictor of whether the post climbs.
- **6pm UK / 1pm ET:** Post to `r/IndieAuthorClub` (smaller, friendlier, allows resource shares).

### Thu May 28 — IndieHackers + niche Reddit

- Post to IndieHackers anytime in the day; IH posts persist. Use draft at `posts/indiehackers.md`. Maker-story format, longer than Reddit/HN.
- **Afternoon:** Post to `r/eroticauthors` (only if you have comment karma there — they're protective). Skip if you haven't seasoned that specific sub.

### Fri May 29 → Sun May 31 — Reply window + observe

- No new posts. Read all comments across all venues. Note recurring questions, objections, requested features.
- This feeds into **step D (marketing infra)** — newsletter content + SEO blog comes from real-comment patterns.
- If HN got traction (>20 points), make sure you've replied to every top-level comment.

### Mon Jun 1 — Decision day

- Look at the numbers (Cloudflare Web Analytics, waitlist KV count, feedback KV count).
- If launch worked: plan Pro tier build (Stripe + signup + KV history per user).
- If it didn't: pick **one** underperforming channel and re-launch differently in 4 weeks. Don't burn the same channels twice in a month.

---

## Reddit seasoning playbook

### Subreddits to engage with (7-day rotation)

| Subreddit | Subs | Why | What to comment on |
|---|---:|---|---|
| `r/selfpublish` | 250K+ | Primary launch target — must season | Cover design Q's, KDP keyword strategy, Amazon ads, ARC reader sourcing, blurb feedback threads |
| `r/SelfPublishing` | 80K+ | Secondary launch target — must season | Same shape, slightly older crowd |
| `r/IndieAuthorClub` | 30K+ | Friendly, smaller, mods active | Anything author-craft-related |
| `r/eroticauthors` | 30K+ | KDP-savvy genre-specific | KDP keyword limits, dungeon strategies, ad spend ROI |
| `r/PubTips` | 1M+ | Trad-pub focused — DON'T launch here, but DO comment | Query letters, agent etiquette (different lane, stays clean) |
| `r/writing` | 4M+ | Broad — must be careful | Craft questions only. No KDP, no marketing, no tools chatter. |

### What to comment on (good shapes)

- **"What's a fair price/length for an Amazon book description?"** — share the 130-180 word best practice, the hook/setup/stakes/cliffhanger structure. Real knowledge from building blurb.html.
- **"How do I find good comp titles?"** — the post-2015 + Goodreads ratings count framework. Don't mention any tool. The reasoning IS the value.
- **"Are KDP categories worth fighting for?"** — yes, top-100 placement is binary. Niche/mid-tier/stretch picking strategy.
- **"How do I write Amazon Ads headlines that don't get rejected?"** — Amazon's 150-char Sponsored Products limit, 80-char short variant. Specific, technical, real.
- **"Tropes feel cringe — do I actually need them?"** — yes, for cover/ad/BookTok. Marketing != craft. Honest answer.
- **"Is ChatGPT good enough for [author task]?"** — answer honestly: yes for ideation, no for repeated structure (KDP slot limits, ad char counts, category taxonomy). Don't shill, just be right.

### Anti-patterns (auto-removal or shadow-ban risk)

- **DO NOT** mention `authorly.tools` in any comment during seasoning. Not even in passing. Not even "btw I'm building something similar."
- **DO NOT** comment on a thread, then create a post that links to your site. Reddit's anti-spam pattern recognizers catch this.
- **DO NOT** crosspost or DM strangers your URL.
- **DO NOT** use a phrase like "I built a tool that…" — even unrelated to Authorly — it pattern-matches as setup-for-promo.
- **DO NOT** comment from a brand-new account on `r/selfpublish` — auto-mod will remove for low karma. Comment on `r/IndieAuthorClub` and `r/SelfPublishing` first to build karma, then move to the bigger sub.

### What "good seasoning" looks like

After 7 days you should have ~15-25 comments across 3-5 subreddits, ~50-100 total comment karma, and at least one comment that someone replied to with a follow-up question. That last one matters most: it's the proof that your tone reads as helpful indie author, not promo bot.

---

## Launch post strategy

### Title formulas that work

- **r/selfpublish:** "I built a free comp-title finder for indie authors — no signup, no manuscript upload" (existing draft in `posts/r-selfpublish.md`)
- **r/SelfPublishing:** "Free Amazon-optimization toolkit for indie authors (no signup, paid for the AI bill myself)" (existing draft)
- **r/IndieAuthorClub:** "Free toolkit for indie KDP authors — six tools, no signup, would love feedback"
- **Show HN:** "Show HN: Authorly – Six free Amazon KDP tools for indie authors"
- **IndieHackers:** "Launched a free indie-author toolkit after getting tired of paying $50/mo for prompted-LLM SaaS"

### Anticipated comment patterns (prep responses)

Most are pre-drafted in `../replies.md` (12 templates, short + long variants). Key ones:

| Comment | Where it shows up | How to respond |
|---|---|---|
| "How do you make money?" | All venues | Honest: I pay the AI bill out-of-pocket (~$0.02/gen). Pro tier waitlist exists ($9/mo unlimited). Free 5/tool/day stays free forever — written in /privacy. |
| "Is this just ChatGPT in a wrapper?" | All venues | It's Claude Sonnet 4.5 + tool-specific prompts tuned for Amazon's actual mechanics (50-char keyword slots, 150-char ad limits, 130-180 word blurb best practice). The model is the easy part. |
| "Where does my data go?" | Reddit + IH | Server-side AI calls via my key → response → done. No DB. Anthropic's 30-day abuse-monitoring retention. Privacy policy at /privacy.html. |
| "Why no signup?" | All venues | 5/tool/day per-IP via Cloudflare KV with SHA-256-hashed IPs. 48hr TTL. Zero friction is the right tradeoff for the indie crowd. |
| "Output didn't fit my book" / "comps were generic" | All venues | That's a prompt failure, not yours. Click 👎 + leave a comment on the result. Genre? Subgenre? I tune prompts every weekend based on real feedback. |
| "Looks like AI slop" / "Just a wrapper" | HN only | Acknowledge: yes, AI is the engine. The value is in the structured prompts that know Amazon's exact char limits, the rate limiting that keeps it free, and the feedback loop that tunes prompts on real 👎 votes. Cheaper than the SaaS tools that wrap the same models. |
| "What about [genre/subgenre I write]?" | All venues | "Some are well-tuned (mystery, romance, literary), some I'm calibrating (litRPG, niche romance subgenres, certain non-fiction verticals). DM the synopsis you used and I'll personally regenerate with prompt tuning." |

### What to avoid in posts

- Hyperbole. "Game-changing" / "revolutionary" / "10x" — auto-downvote on HN, eye-roll on Reddit.
- Emojis (any). Reads as marketing.
- Calls to action other than "feedback wanted." No "Sign up!" "Buy now!" "Share if you agree!"
- Mentioning Slatework, justpromptit, or any other project. Keep each post about Authorly only.
- Mentioning the launch dates of other venues. Each post stands alone.
- Using "Built by Darren" inline in post body — that's for the footer/maker line on the site. In posts you're an author commenting from a maker account; identity is implicit.

---

## Success metrics

**Don't measure traffic.** Measure these instead:

- **Comments with substance** (not "cool"): target 15+ across all venues by Friday May 29.
- **Genre/subgenre requests:** any author asks "what about [my genre]?" — that's a fit signal. Target 5+.
- **Bug reports / typo flags:** real users testing real tools. Target 3+.
- **Waitlist signups:** noise but not zero — target 50+. >100 is a real signal.
- **Direct emails to hello@authorly.tools:** higher signal than waitlist. Target 5+.
- **👍 votes via /api/feedback:** harder to game than upvotes. Target 30+ across all tools.

If by Saturday May 30 you have <2 substance comments and <1 genre request, the positioning is wrong, not the product. The fix is post-launch reposition, not more polish.

---

## What this launch is NOT trying to do

- It's not trying to rank on Google for "indie author tools." That's step D (marketing infra), 4-12 weeks.
- It's not trying to convert sign-ups to revenue. The Pro tier is a waitlist — no rev model yet on purpose.
- It's not trying to look like a real company. It's trying to look like a real indie author who built a real thing — that's the trust signal at this stage.
- It's not trying to beat Slatework's launch numbers. Different audience, different urgency, different platforms.

---

## Post-launch (Mon Jun 1 onwards)

This is where step D begins. By then you'll have:
- A list of genres/subgenres to recalibrate (from comments)
- A list of features authors actually want (from emails)
- A few quoted bits from authors saying nice things (testimonials for the newsletter)
- A first weekly newsletter draft based on what surfaced
- Concrete waitlist + feedback-vote numbers to decide whether Pro tier is worth building

D is its own brainstorm. Not in scope for this doc.

---

## Cross-project notes

- **Slatework reply window** ends ~May 19. Authorly seasoning starts May 18 (1 day overlap acceptable — different subs, different account).
- **No promotional cross-pollination.** Don't link from Slatework site to Authorly or vice versa during launch week. Keep them as independent projects in the public eye.
- **Reuse pattern, not copy.** This playbook is structurally the same as Slatework's `2026-05-07-launch-plan.md`. Adapted content for indie-author market.
