# Show HN — Wednesday May 27, 9am ET / 2pm UK SHARP

**Where:** `news.ycombinator.com/submit`
**Account:** `Authorly` (or whichever HN username you registered)

**Critical:** timing is non-negotiable. 9am ET on a Wednesday is peak HN front-page traffic. Posting at 8:55am or 9:05am is fine; posting at 11am loses you the window.

---

## Title

```
Show HN: Authorly – Six free Amazon KDP tools for indie authors
```

(en-dash between Authorly and "Six" — HN convention for "Show HN: [name] – [description]". Don't use a hyphen.)

---

## URL

```
https://authorly.tools
```

---

## Text

```
Hi HN,

I'm an indie author who got tired of paying $25-50/mo per SaaS tool for things like comp-finding and blurb-writing. Built a small alternative: six tools, all free, no signup.

Stack: Cloudflare Pages + Pages Functions, Anthropic Claude Sonnet 4.5 server-side via my API key, KV for per-IP rate limiting (5 generations/tool/day).

Architectural notes for the curious:
- Single repo, ~3000 LOC total. Static HTML + functions/api/*.js endpoints.
- Each tool is its own page + its own function. No build step, no framework.
- Rate limiting per-tool keyed by SHA-256(IP) so concurrent tools don't share quota.
- All prompts are version-controlled and tuned through real feedback (I have a /api/feedback endpoint that captures 👍/👎 on every output).
- ~$0.01-0.04 per generation in API costs. ~$3/day if it gets popular. Cheaper than the SaaS tools that wrap the same models.

What I'd love feedback on:
1. Output quality on the comp finder — are the suggestions actually useful for your genre?
2. Whether the prompt structure shows through too obviously (it's intentionally structured, but I don't want it to feel mechanical).
3. What tool 7 should be.

https://authorly.tools
```

---

## First 90 minutes — the make-or-break window

**Set a timer for 90 minutes after submission.** Top response speed determines if the post climbs to the front page.

Likely first questions on HN (more skeptical crowd than Reddit):

1. **"Just a wrapper around Claude. Why does this exist?"**
   → Use the long version of `replies.md` #2 + the architectural angle: "Yes, the model is the easy part. The hard part is each tool's prompt knowing Amazon's exact char limits (50-char keyword slots, 130-180 word blurb best practice, 150-char ad headlines), the rate limiting that lets it stay free, and the feedback loop that tunes prompts on real 👎 votes."

2. **"How do you avoid getting your API key drained?"**
   → "Per-IP rate limit (5/tool/day) + global ceiling (2,000/tool/day) both in CF KV. SHA-256-hashed IP keys, 48hr TTL. CF Bot Fight Mode for scrapers. Could rotate IPs, but each IP only gets 5 runs and the input is a synopsis paste — scraping ROI is bad."

3. **"Why no signup though?"**
   → "Friction kills adoption for the indie-author crowd. The KV rate limiter is enough so far. If abuse becomes real, I'll add an email-magic-link signup (still no password). For now, no signup."

4. **"What if Anthropic raises prices?"**
   → "Then I either eat margin or move to a cheaper model. Free tier (5/tool/day) stays free either way — that's a written commitment in /privacy."

5. **"AI slop concern" / "Output is generic"**
   → Acknowledge honestly. "Some genres are well-tuned (mystery, romance, literary), others I'm calibrating. The /api/feedback 👎 button is wired up specifically so I can see which generations failed and which subgenres need prompt work. DM me a synopsis that didn't work and I'll regenerate with prompt tuning."

6. **"What's the business model?"**
   → "Pro tier waitlist for $9/mo unlimited + saved history + batch processing for series authors. Currently zero signups → zero pressure. Free tier stays free regardless."

---

## What to avoid in HN responses

- Don't get defensive on "wrapper" criticism. Acknowledge + add the technical detail (char limits, rate limiting, feedback loop). HN respects technical specificity.
- Don't use marketing voice. Plain, direct, slightly self-deprecating works.
- Don't mention r/selfpublish numbers from yesterday. Each platform is independent.
- Don't say "thanks" to every comment. Address the substance.
