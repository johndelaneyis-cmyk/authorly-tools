# Blog post — One week of Authorly

**Where to post:** dev.to (best fit — building-in-public audience), or your own Substack if you have one. Avoid Medium (paywall friction, less indie-author traffic).
**When:** Day 8 (Monday morning ET, the day after the Day 7 numbers tweet). The tweet drives readers here.
**Length:** ~520 words. Read time ~2:30.

Replace `[bracketed placeholders]` with real numbers from CF Web Analytics + the Pro waitlist KV before posting.

---

**Title:** What I learned from one week of Authorly

**Tagline (for dev.to subtitle):** Building in public, six free tools, and the things I got wrong.

---

A week ago I shipped Authorly — six free tools for indie authors, no signup, no manuscript upload. Comp title finder, KDP keyword expander, Amazon book description writer, category recommender, trope finder, Amazon Ads headlines + author bio generator.

Here's what I expected, what actually happened, and what I'm changing.

## What I expected

The comp finder was the "centerpiece." It's the tool that took the most prompt-tuning, the most evals, the most personal frustration to fix. I assumed it would get the most traffic, the most thank-yous, the most "what else can it do" replies.

I expected the trope finder to be the curiosity tool — fun to demo, lower repeat usage.

## What actually happened

`[X]` unique visitors. `[Y]` total tool generations across the six tools.

The comp finder placed `[3rd]` in usage. The trope finder placed `[1st]`. Author bio generator was a quiet `[2nd]`.

Why? Two patterns:

1. **Trope finder solves a sharper pain.** Authors don't always know which tropes are in their book — but they know they need to put tropes in their ad copy and BookTok hooks. The tool turns plot summary into marketing copy. That's a daily-use moment, not a once-per-launch one.

2. **The author bio generator is invisible until you need it.** People found it through the homepage and came back when query letter season hit. Repeat-visit behavior I didn't predict.

The comp finder still gets used — just less than I'd built it to. The lesson: the tool that fixes the *biggest* pain isn't always the tool people use most. The tool that fixes the *most frequent* pain wins.

## What's coming next

A few things shifted from my pre-launch roadmap based on this week:

- **Pro tier ($9/mo, unlimited)** — `[Y]` people on the waitlist. Shipping next week. Batch processing for series authors is the killer feature people kept asking about.
- **Tool 7** — the Day 3 vote came back: `[winner]`. Building it in week 3.
- **Trope finder gets a v2** — since it's the most-used tool, it deserves more prompt tuning. Adding genre-specific trope vocabularies (romance has different searched-tropes than thriller).

What I'm *not* doing: building a fancier UI, adding social-login, or chasing Pro signups before the basic tools are bulletproof. Indie authors smell that kind of pivot from a mile away.

## The thing I got most right

Pricing. The basic free tier (5 generations per tool per day) gives people enough to ship a real launch without ever hitting the paywall. Most indie authors release one book at a time — 5 comp lookups is more than they'll ever need in a week. The Pro tier is for series authors and pros who run dozens of comparisons per launch. That split feels honest.

## The thing I'd change

I'd ship sooner. I sat on these tools for two weeks polishing prompts before launch. The trope finder ranking #1 means my prompt-tuning instincts were wrong about *which* prompt to polish hardest. Real users would have told me that in 48 hours. Two weeks of solo polish was wasted on the wrong tool.

If you write fiction or non-fiction and self-publish: the tools are at **authorly.tools**. Pro waitlist is on the homepage. Reply with what you wish existed — I'm building tool 8 from your replies.
