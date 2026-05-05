# Authorly launch posts — paste-ready

All copy below is final. Don't tweak unless you have a strong reason — small variations across platforms are intentional.

---

## 1. r/selfpublish — Reddit

**Post on:** Monday morning (~9 AM ET).
**Title:** I built a free comp-title finder for indie authors — no signup, no manuscript upload
**Flair:** Marketing
**Body:**

Hey r/selfpublish,

I got tired of paying $25/mo for tools that mostly just pad blurbs with adjectives, so I built a small set of free ones aimed at the actually-painful parts of indie publishing. Six tools, all live now at **authorly.tools**:

- **Comp title finder** — paste your synopsis, get 5 real published comps with reasons
- **Amazon book description writer** — structured blurb (hook/setup/stakes/cliffhanger) + a 130-180 word ready-to-paste version
- **KDP keyword expander** — one seed keyword → 10 phrases, plus a curated 7 sized for KDP backend slots
- **Category recommender** — 3 Kindle Store categories with paths you can email to KDP support, with honest competition reads
- **Trope finder** — surfaces the tropes already in your plot for cover/ad/BookTok marketing
- **Amazon Ads headlines** — 3 at the 150-char Sponsored Products length + 3 short ones at 80 chars
- **Author bio generator** — short/medium/long sized for social, KDP, query letters

No signup. No manuscript upload. 5 free generations per tool per day per visitor (more than enough for most launches). I pay the AI bill so you don't have to. Pro tier coming if there's interest, but the basic 5/day is staying free forever.

Powered by Claude Sonnet 4.5 — best output I tested for this kind of craft work.

Built it because I'm an indie author who got tired of the SaaS-tool tax. If you try it, I'd love to hear what's missing — what's the one tool you wish existed?

Link: https://authorly.tools

---

## 2. r/SelfPublishing — Reddit (different sub)

**Post on:** Monday afternoon (~3 PM ET, after r/selfpublish has had its morning pass).
**Title:** Free Amazon-optimization toolkit for indie authors (no signup, paid for the AI bill myself)

Same body as r/selfpublish but rephrase the opening sentence to:

> I'm an indie author who built six small tools to skip the $25-50/mo SaaS-tool tax for stuff like comp finding, blurbs, KDP keywords. Free, no signup, no upload-your-manuscript.

Then continue with the bullet list and rest of the post.

---

## 3. X (Twitter) launch thread

**Post on:** Tuesday morning (~10 AM ET).
**Format:** 8-tweet thread.

**Tweet 1/8:**
After 18 months of paying $25-50/mo for indie-author SaaS tools that mostly just paraphrased my synopsis, I built six free ones that actually do the work.

authorly.tools — no signup, no manuscript upload.

**Tweet 2/8:**
**Comp title finder.** Paste your synopsis. Get 5 real, published, commercially viable comps with reasons each fits — tropes, tone, structure, pacing. Cited by Goodreads ratings count, all post-2015.

**Tweet 3/8:**
**Amazon book description writer.** Type your plot. Out comes a labeled breakdown (hook/setup/stakes/cliffhanger) + a 130-180 word ready-to-paste blurb sized for KDP. One Copy button, you're done.

**Tweet 4/8:**
**KDP keyword expander.** One seed → 10 phrases real readers search on Amazon, plus the top 7 to slot straight into your KDP backend. Each phrase character-counted against Amazon's 50-char limit.

**Tweet 5/8:**
**Category recommender.** Three Kindle Store categories where your book can realistically rank top 100. Niche / mid-tier / stretch, with the full paths you paste into a kdp-support email. With honest competition reads.

**Tweet 6/8:**
**Trope finder.** Pulls the tropes already in your plot — enemies-to-lovers, forced proximity, slow burn — with marketing angles for each. For ads, BookTok, back-cover blurbs.

**Tweet 7/8:**
**Amazon Ads headlines + Author bio generator.** 6 ad variants at Amazon's exact char limits + 3 author bios sized for social/KDP/query letters.

5 free runs per tool per day. I pay the AI bill. Pro tier (unlimited) coming.

**Tweet 8/8:**
If you try it: what's the one tool you wish existed? Reply, I'm building.

authorly.tools

---

## 4. Hacker News — Show HN

**Post on:** Wednesday morning (~9 AM ET — best HN traffic).
**Manual post (no API).**
**Title:** Show HN: Authorly – Six free Amazon KDP tools for indie authors
**URL:** https://authorly.tools
**Text:**

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

---

## 5. Product Hunt — launch

**Post on:** Thursday at midnight Pacific (PH timezone) — that's 3 AM ET.
**Manual post (PH has API but launches need human moderation).**
**Tagline (60 chars):** Free Amazon KDP tools for indie authors. No signup.
**Description (260 chars):**
Six free tools for self-publishing authors: comp titles, Amazon blurbs, KDP keywords, category picks, trope finding, ad headlines, author bios. No signup, no manuscript upload. Powered by Claude. 5 free runs/tool/day.

**First comment (you post this from your maker account immediately after launch):**

Hey PH 👋

I'm Darren — indie author. Built Authorly because I was paying $50/mo for a SaaS that mostly just paraphrased my synopsis. Six tools, all free, no signup.

If you write fiction or non-fiction and self-publish, the tools that actually move the needle for you on Amazon — comp titles, KDP keywords, category placement, ad headlines — should not cost more than your editor.

Three things I'd love feedback on:
1. What's the one indie-author task that should be a tool but isn't?
2. Output quality — does the comp finder pick books that actually match yours?
3. What's missing from the Pro tier (coming) that would make you pay?

Try it: https://authorly.tools

---

## 6. LinkedIn

**Post on:** Tuesday afternoon (~2 PM ET).
**Format:** Long-form (no images).

After 18 months of paying $25-50/month for indie-author tools that mostly just paraphrased my synopsis, I built six free ones that actually do the craft work.

→ Comp title finder
→ Amazon book description writer
→ KDP keyword expander
→ Category recommender
→ Trope finder
→ Amazon Ads headline generator + author bio generator

The pattern I noticed in the indie-author SaaS market: most tools wrap GPT-3.5-era prompts in a $30 subscription. The model has improved 10x since; the prompts haven't.

What I built differently:
1. Each tool's prompt is tuned for the specific Amazon mechanic it serves (50-char keyword slots, 150-char ad limits, 130-180 word blurb best practice).
2. No accounts, no manuscript upload. Server-side AI calls so you don't need an API key.
3. 5 free runs per tool per day. I pay the AI bill. The basic free tier stays free.

Built on Cloudflare Pages with Anthropic Claude Sonnet 4.5 doing the craft work. ~$0.02 per generation on my end.

If you self-publish — or know someone who does — the link is in the comments. Would love to hear what's missing.

#indieauthors #selfpublishing #kdp #amazonkdp #booktok #buildinpublic

(In first comment, reply to your own post:) https://authorly.tools

---

## 7. Indie Hackers

**Post on:** Wednesday afternoon (~2 PM ET).
**Title:** Launched a free indie-author toolkit after getting tired of paying $50/mo for prompted-LLM SaaS

**Body:**

After 18 months of paying for indie-author SaaS tools that wrap GPT-3.5-era prompts in $30 subscriptions, I built free alternatives. Six tools, all live: comp titles, Amazon blurbs, KDP keywords, category picks, trope finding, ad headlines, author bios.

**Stack:** Cloudflare Pages + Pages Functions + Claude Sonnet 4.5. ~$0.02 per generation. Free tier (5/tool/day) stays free; Pro tier waitlist is live for unlimited.

**Why I think this works:** indie authors are a great freemium audience — willing to pay for tools that move the Amazon needle, intolerant of bait-and-switch pricing, very loud on Reddit and BookTok when something's good.

**What I'd love feedback on:**
- Pricing for the Pro tier — leaning $9/mo unlimited, $29/mo with batch processing for series authors.
- Whether the basic 5/tool/day free tier hurts conversion or builds trust.
- What tool 7 should be — current shortlist: cover-blurb writer, series titler, royalty calculator.

https://authorly.tools

---

## 8. Indie author Discord/Slack messages

**Where to post:** 20BooksTo50K Discord, Author Marketing Discord, KDP Authors Slack, your local writer's group.
**When:** spread Tuesday-Thursday across servers (don't blast all in one day).

**Message:**
Hey 👋 I'm an indie author and I just shipped a thing that might help — six free Amazon KDP tools (comp finder, blurb writer, KDP keywords, category picks, trope finder, Amazon Ads, author bio). No signup, no manuscript upload, paid for the AI bill myself. Genuinely free, not freemium-scammy.

If you've ever wanted to test if your synopsis is comp-able, try the first tool. Other 5 are linked from the homepage.

authorly.tools

(Server permitting — happy to delete if this is too promotional, just lurking otherwise!)

---

## 9. BookTok — 3 video scripts

Each is 30 seconds. Film vertical, your face + screen recording.

### Script A: The pain-point hook

> "POV: you spent $50 on a comp-title finder that gave you Colleen Hoover. *(typing)* I'm an indie author and I built a free one that actually works. *(screen recording: paste a synopsis, hit enter, results appear)* Five real published comps, reasons each fits, and a Copy button for the back-cover blurb. *(beat)* No signup. No upload. authorly.tools. Link in bio."

### Script B: The "look how easy" demo

> "If you're self-publishing and you don't have your KDP keywords sorted yet, watch this. *(screen)* I type 'small town billionaire romance.' *(loading)* Out come ten phrases, character-counted, plus the top seven to paste into KDP backend. *(close-up of Copy buttons)* Free. No signup. authorly.tools."

### Script C: The "shut down a competitor" hook

> "Indie authors — stop paying $40/month for tools that just paraphrase your synopsis. *(screen flicker through 6 tools)* Six free tools: comps, blurbs, KDP keywords, categories, tropes, ad headlines. I pay the AI bill. You don't. authorly.tools. Save this video for your next launch."

---

## 10. Email signature update

Add this to your email signature for launch week:

```
Darren | indie author
authorly.tools — free Amazon KDP tools (no signup)
```
