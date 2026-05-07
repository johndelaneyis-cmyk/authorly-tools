# Reply templates â€” paste-ready

12 most-likely questions across all platforms. Each has a short reply (Twitter/X friendly) and a long reply (Reddit/PH friendly). Pick by platform.

---

## 1. "How do you make money?" / "What's the catch?"

**Short:**
No catch right now. I pay the AI bill out of pocket â€” costs ~$0.02 per generation. Pro tier with unlimited runs is on a waitlist for $9/mo. Free 5-per-tool-per-day stays free forever.

**Long:**
Genuine answer: I don't yet. The basic free tier (5 generations per tool per day per visitor) stays free permanently â€” that's a promise I'm putting in writing. Each generation costs me ~$0.02 on the Anthropic API, which I'm covering personally. If the site gets popular I'll add a Pro tier ($9/mo, unlimited generations + saving past results) for authors who want it. The free tier will outlive me. There's no manuscript upload, no email harvesting, no ads, no analytics that track you (Cloudflare's first-party server logs only).

---

## 2. "Is this just ChatGPT in a wrapper?"

**Short:**
It's Claude Sonnet 4.5 + tool-specific prompts I tuned for Amazon's actual mechanics (50-char keyword slots, 150-char ad limits, 130-180 word blurb best practice). The model is the easy part. The prompts and the rate limiting are the work.

**Long:**
Yes, the core is Claude Sonnet 4.5 â€” best output I tested for craft work. What's not "just a wrapper": each tool's prompt is tuned for the specific Amazon mechanic it serves. The keyword expander knows about Amazon's 50-char per-slot limit and the trick of avoiding mega-bestseller author names. The category recommender knows the actual Kindle Store taxonomy and which categories are accessible vs. dominated by Big 5. The ad headline tool sizes outputs to Amazon's exact 100-150 char custom-text limit + 60-80 char short variants. And there's a feedback loop: every output has a ðŸ‘/ðŸ‘Ž button that tunes the prompts over time. The free tier (5/tool/day) is enforced via Cloudflare KV with SHA-256-hashed IP keys, so I can offer it free without a signup wall.

---

## 3. "Where does my data go?"

**Short:**
Your synopsis goes to Anthropic to generate the output, then it's deleted from my server immediately. Anthropic's policy says they don't train on API data and delete prompts after 30 days for abuse monitoring. I store nothing.

**Long:**
Your input (synopsis, plot, etc.) is sent to Anthropic's Claude API server-side via my key, the response is returned to you, and the request is finished. I don't store your input on Authorly's servers â€” no database, no logs of synopses. Anthropic's policy: they don't train on API data by default, and retain prompts for up to 30 days for abuse monitoring before deletion (their public privacy policy). The only thing my server stores is your IP-hash for rate limiting (auto-deleted after 48 hours) and, if you submit a ðŸ‘/ðŸ‘Ž on an output, the rating + optional comment (no synopsis attached). Privacy policy is /privacy with the exact details.

---

## 4. "Why no signup? How do you stop abuse?"

**Short:**
5 generations per tool per day per IP. Cloudflare KV stores the count, deletes after 48 hours. Bot Fight Mode handles scrapers. Hasn't been abused yet â€” most attempts hit the limit and bounce.

**Long:**
Two layers: per-IP rate limit (5 generations per tool per day) and a global ceiling (2,000 generations/tool/day site-wide) that stops me from getting a surprise $1,000 Anthropic bill. Both are stored in Cloudflare KV with 48-hour TTL. Cloudflare Bot Fight Mode is on for scraper traffic. If someone wanted to abuse, they could rotate IPs â€” but each IP only gets 5 runs and the tools take a synopsis paste, so the scraping ROI is bad. If abuse becomes a problem I'll add a one-time email-magic-link signup (still no password); for now no signup keeps the friction at zero, which I think is the right tradeoff.

---

## 5. "Why these specific 6 tools?"

**Short:**
These are the six things that actually move Amazon ranking for indie authors: comps for ad targeting, blurbs for click-through, keywords for backend search, categories for top-100 visibility, tropes for cover/ad copy, ad headlines for Sponsored Products, bios for author-page conversion. Other tools aren't actually decision-changing.

**Long:**
I picked tools by working backwards from what actually moves the Amazon needle for indie authors. (1) Comp titles: drives ad targeting and back-cover copy. (2) Amazon blurb: the single highest-leverage piece of copy on your detail page. (3) KDP keywords: 7 backend slots, each one is a search-traffic lever. (4) Categories: top-100 placement is binary â€” you're a bestseller or you're not. (5) Tropes: cover, BookTok, ad copy all need them. (6) Ad headlines: sized for Amazon Ads' exact char limits. (7) Bio: conversion on the author page. Tools I deliberately left out: a "fix my plot" tool (pseudoscience), a "find your audience" tool (data we don't have), a "make my book a bestseller" tool (no).

---

## 6. "Will the Pro tier kill the free tier?"

**Short:**
No. Free 5/tool/day stays free forever â€” written into the privacy policy. Pro adds unlimited + history + batch processing for series authors.

**Long:**
The basic free tier (5 generations per tool per day) stays free permanently. I'm putting that in /privacy as a written commitment. Pro tier adds: unlimited generations, save and revisit past results, batch processing for series authors who run a comp/blurb/keyword pass on every book in a series. Pro will probably be ~$9/mo, paid to actually cover my Anthropic bill + a small margin to keep the lights on. There's a waitlist on the homepage if you want to be notified.

---

## 7. "Output didn't fit my book." / "The comps were generic."

**Short:**
That's the prompt's fault, not yours. Click ðŸ‘Ž on the result and tell me why â€” I tune the prompt every weekend based on real feedback. What genre/subgenre? Mind dropping the synopsis you used?

**Long:**
Genuine apology â€” that's a prompt failure, not a you failure. Two things: (1) please click ðŸ‘Ž on the result and add a short comment about what was wrong; that goes into a queue I review every weekend and I tune the system prompt accordingly. (2) for genre-specific weakness, I'd love to know which subgenre â€” some are well-tuned (mystery, romance, literary), some I'm still calibrating (litRPG, niche romance subgenres, certain non-fiction verticals). If you want to share the synopsis you used, DM me and I'll personally regenerate with prompt tuning until we get it right.

---

## 8. "Why not just use ChatGPT directly?"

**Short:**
Two reasons: (1) the prompts here are tuned for Amazon's actual rules (50-char keyword slots, 150-char ad limits) â€” generic ChatGPT doesn't know those. (2) zero friction: paste, click, copy. No sign-in, no API key, no prompt-engineering yourself.

**Long:**
You can â€” and many indie authors do. Two reasons mine exists: (1) prompt engineering for Amazon's specific mechanics is non-trivial. The keyword expander has explicit instructions about the 50-char per-slot limit, about avoiding mega-bestseller author names (Amazon flags those), about which keyword stems Amazon strips automatically. The blurb writer has Amazon-specific format rules (line breaks render but bold/italic don't). You can build that yourself in ChatGPT but it's tedious; here it's preconfigured. (2) Friction matters for authors who don't think of themselves as "AI users" â€” paste, click, copy. No prompt engineering for the user. That's why I think there's a market for this even though the underlying model is the same.

---

## 9. "Is this open source?"

**Short:**
Source code available on GitHub under MIT license — see authorly.tools/terms for details. Backend (Cloudflare Pages Functions) is included. Prompts are in the repo. MIT-licensed.

**Long:**
Yes. github.com/johndelaneyis-cmyk/authorly-tools â€” MIT licensed. Frontend HTML/CSS/JS, all 7 Cloudflare Pages Functions, the system prompts for each tool, the rate-limiting logic â€” all in the repo. You can fork it and run your own. The only thing that's not open source is my Anthropic API key (which is bound to my Cloudflare account and pays for the free tier). PRs welcome â€” especially around prompt tuning and additional tools.

---

## 10. "Can you add [specific tool]?"

**Short:**
Maybe â€” what's the workflow you'd want? Reply with the inputs and outputs you'd expect and I'll add it to the shortlist. Top current asks: cover-blurb writer, series titler, royalty calculator.

**Long:**
Probably yes. Three things help me decide: (1) what inputs the user would paste, (2) what specific output structure they need, (3) why a generic ChatGPT prompt isn't good enough (i.e., what Amazon-specific tuning matters). Drop those three things in a reply and I'll evaluate. Current shortlist based on requests: cover-image-prompt writer for AI illustrators, series-title generator, royalty calculator (KDP/Audible/IngramSpark math), Amazon A+ content drafter.

---

## 11. "Comps are wrong / titles don't exist."

**Short:**
That's a known failure mode â€” Claude occasionally invents books. I have an explicit instruction in the prompt against this but it's not 100%. Always verify on Amazon before using. Click ðŸ‘Ž on any invented one and I'll harden the prompt.

**Long:**
Acknowledging this honestly: AI hallucinated book titles are a real failure mode for any tool like this. The prompt has explicit "if you're not confident a title and author are real, omit it. Five strong is better than seven shaky" instructions, but it's not 100%. Workflow recommendation: always Amazon-search each comp before using. The Terms of Service has a "can contain inaccuracies" disclaimer for exactly this reason. Click ðŸ‘Ž on any invented comp and tell me which one â€” that goes into the prompt-tuning queue, and over time the prompt gets harder. Long-term I want to add a verification step that pings the Goodreads API before returning, but it's not built yet.

---

## 12. "I love this." / "Just used it." / "Great work."

**Short:**
Thank you ðŸ™ â€” it means a lot. If you have 30 seconds, the most useful thing you can do is post which tool you used and what you got back; that's what gets it in front of more authors. And tell me what's missing.

**Long:**
Thank you, genuinely ðŸ™ â€” building tools for a niche audience is a slow signal-to-noise game and feedback like this is what keeps me going. Two asks if you're feeling generous: (1) if you have 30 seconds, post a screenshot of what you got back along with the tool you used â€” word-of-mouth from real authors is the only marketing channel that works for this. (2) reply or DM me with what tool 7 should be. I'm building one a month based on what authors actually ask for.

