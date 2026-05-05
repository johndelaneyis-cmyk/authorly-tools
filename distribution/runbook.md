# Authorly launch runbook — week one

What to do, when to do it, how long it takes. **Total manual time: ~50 minutes spread across 7 days.**

---

## Day -1 (the day before launch) — 15 min

**Setup tasks (one-time):**

1. Read `SETUP.md` and provision API tokens for Reddit, X (Twitter), and Discord webhooks. Paste them into `distribution/.env`. — **10 min**
2. Test that `python scheduler.py test` succeeds for all three platforms (it sends a "test post" you can immediately delete). — **3 min**
3. Have `posts.md` and `replies.md` open in tabs you can ctrl-F. — **1 min**
4. Set Slack/Discord/email notifications to *quiet* on Day 0 — you'll want to focus on launch, not Slack pings. — **1 min**

That's it for prep.

---

## Day 0 (launch day, Monday) — 15 min total

### 9:00 AM ET — kick off the scheduler

```
cd C:/Users/darre/authorly/distribution
python scheduler.py start
```

That single command schedules every Reddit post, every X tweet/thread, every Discord webhook for the next 7 days according to `schedule.json`. The scheduler keeps running in the background and fires posts at the right times.

**Manual time at this step: 1 min.** (Just running the command + confirming "Scheduled 14 posts.")

### 9:30 AM ET — paste the Hacker News post

Hacker News has no API. Open `posts.md` → "Show HN" section → paste into news.ycombinator.com/submit.

**Manual time: 5 min** (paste, hit submit, copy the URL of your post in case it gets traction).

### 10:00 AM ET — paste the Product Hunt launch

Product Hunt allows scheduling but the launch process benefits from being there. Open `posts.md` → "Product Hunt" section. Submit. Then immediately post the "first comment" from the same section as the maker.

**Manual time: 5 min.**

### 11:00 AM ET — first Reddit comment check

The scheduler has already posted r/selfpublish at 9 AM. Check the comments. Use `replies.md` to paste responses to the obvious questions. Don't engage with trolls.

**Manual time: 4 min.**

---

## Day 1 (Tuesday) — 8 min

### Morning (~10 AM)
- Scheduler auto-posts: r/SelfPublishing, X launch thread, LinkedIn post.
- You: scan the previous day's comments. Use `replies.md`.

### Afternoon (~3 PM)
- Hand-send 5 cold emails from `cold-emails.md` to indie-author newsletter editors. Personalize the opener line. — **5 min**
- Reply to 3-5 X mentions if any. — **2 min**

### Evening (~7 PM)
- Glance at HN/PH for late-day comments. — **1 min**

---

## Day 2 (Wednesday) — 8 min

### Morning
- Scheduler auto-posts: Indie Hackers, Discord/Slack messages.

### Afternoon (~2 PM)
- Hand-send 3 cold DMs to BookTok creators from `cold-emails.md`. — **5 min**
- Reply to comments. — **3 min**

---

## Day 3 (Thursday) — 5 min
- Scheduler is mostly idle by now.
- Reply to ongoing comments on r/selfpublish (these threads stay alive 3-4 days).
- If HN got traction (>20 points), make sure you've replied to every top-level comment.

---

## Day 4-5 (Fri-Sat) — 5 min/day
- Reply window. Most engagement is over by Day 4 except for slow-burn Reddit threads.
- Scheduler posts a follow-up X tweet on Day 5 with first-week numbers (waitlist count, daily generations) — schedule.json controls.

---

## Day 6-7 (Sun-Mon) — 5 min total
- Final cleanup. Reply to anything still active.
- **Decision day:** look at numbers (CF Web Analytics dashboard + waitlist KV count). If launch worked, plan Pro tier build. If it didn't, pick one underperforming channel and re-launch differently.

---

## Daily 5-min "comment rounds"

For each launch post that's getting comments (Reddit, HN, PH, LinkedIn, X), do this:

1. Open the post.
2. Read top 3 unread comments.
3. For each: ctrl-F `replies.md` for the closest match, paste, send.
4. If a comment doesn't fit any template, write a short genuine reply — don't overthink it.
5. **Done. Move on. Do not refresh for 4 hours.**

**The trap to avoid:** refreshing every 10 min and replying to every single comment. That kills your week. Two reply rounds per day is plenty.

---

## What "successful launch" looks like

Loose targets for week one. Don't tie self-worth to these.

- **HN:** front page = >40 points + 200 visitors. Realistic: 5-15 points, 30-60 visitors.
- **r/selfpublish:** sticky comment + 100 upvotes = great. Realistic: 30-80 upvotes.
- **Product Hunt:** top 5 of day = great. Realistic: top 20.
- **X:** any tweet >50 likes is unusual; >5 replies is more meaningful.
- **Total launch-week unique visitors:** 800-3,000 if Reddit + HN both move; 300-800 if just one channel works; <200 means the messaging needs revision.
- **Waitlist signups:** 1-3% of unique visitors = healthy intent signal.
- **Tool generations:** 5-15% of visitors generate something. If less, the homepage isn't selling the value.

---

## What to do if it goes viral (50+ generations/min)

1. Check the global rate limit isn't tripping. `comp.js` has GLOBAL_DAILY_LIMIT = 2000 per tool. If hitting that, you'll see "Service temporarily unavailable" errors.
2. Decide: raise the cap and pay more, or let it gracefully cap. If you raise it temporarily, do `wrangler pages secret put` to update env vars.
3. Watch your Anthropic spend. ~$0.02/generation × 5,000 = $100. Reasonable. >50,000 = $1,000. Decision time.
4. Tweet the "we hit X" milestone — viral begets viral.

---

## What to do if it goes nowhere (<100 visitors total)

1. Don't relaunch. Diagnose first.
2. Open the homepage. Read the hero out loud. Does it explain *why someone should care* in 5 seconds? If not, that's the bug.
3. Talk to 3 indie authors (DM or in person). Watch them try the tool. Where do they bounce?
4. Pick the single highest-leverage fix (probably: the headline or the homepage hero).
5. Re-launch in 4 weeks. Don't burn the same channels twice in a month.

---

## Templates I haven't covered

If something happens that none of these templates cover, the rule is: be a person, not a brand. You're an indie author who built a tool, not a company doing PR. That voice converts.
