# Authorly distribution — automation plan

## Goal
Get your weekly manual time during launch week from "many hours" to **under 10 minutes total**.

## Three tiers, ranked by effort vs payoff

### Tier 0 — Pre-written copy (DONE in this session)
Every post drafted, every anticipated comment reply scripted, every cold email templated. You paste, you don't write.

**Files delivered:**
- `posts.md` — every launch post for every platform, ready to paste
- `replies.md` — 12 anticipated questions + scripted replies
- `cold-emails.md` — 3 templates (newsletter sponsors, YouTubers, BookTok creators)
- `runbook.md` — day-by-day what to paste where, in what order

**Your effort: ~30 min total spread over launch week.**

### Tier 1 — Local auto-scheduler (DONE in this session)
A Python script on your laptop that posts to Reddit, X (Twitter), and Discord webhooks for you on a schedule. Runs once, you walk away.

**Files delivered:**
- `scheduler.py` — fires posts at scheduled times via APIs
- `schedule.json` — when each post fires
- `SETUP.md` — exactly how to provision the 3 API tokens you need (~10 min one-time)

**Your effort: 10 min one-time setup. Then 0 min posting.**

### Tier 2 — Cloud-scheduled (recommended, NOT delivered this session)
Move the scheduler to a Cloudflare Worker with Cron Triggers. Runs even if your laptop is off. Tokens stored as CF env secrets. Costs $0 on the free tier.

**Why I didn't build it now:** requires deploying a Worker (separate from your existing Pages project), wrangler config changes, and OAuth flow setup that benefits from you being in the loop.

**Your effort if you want it later:** 30-min collaboration session to wire it up.

### Tier 3 — Reply monitor + auto-digest (NOT delivered this session)
Polls your launch posts every 15 min for new comments. Sends you a daily digest email with pre-drafted reply options ready to copy-paste.

**Why not now:** needs a Cloudflare Worker + Email Worker setup; same reason as Tier 2.

**Your effort if added:** 1 min/day reading the digest and clicking "send" on pre-drafted replies.

---

## What you actually do during launch week

With Tier 0 + Tier 1 (this session's deliverables):

| Day | Manual action | Time |
|---|---|---|
| Day -1 (setup) | Provision Reddit + X + Discord tokens, paste into `.env` | 10 min |
| Day 0 (launch) | Run `python scheduler.py start` once. Walk away. | 1 min |
| Day 1-7 | Glance at your inbox 1-2× per day, paste a reply from `replies.md` if a comment needs one | 5-10 min/day |
| Day 1 (HN/PH) | Manually paste 2 posts to Hacker News + Product Hunt (no API for these) | 5 min |

**Total launch-week manual time: ~50 minutes spread over 7 days.**

## What this CANNOT automate (and why)

- **Hacker News submissions:** no posting API, intentionally human.
- **Product Hunt launches:** human moderation queue.
- **TikTok/BookTok:** video upload requires session cookies + interactive flow; not worth the engineering.
- **Real-time replies that need judgment:** I'll pre-draft them, you press send.
- **First-time OAuth setup:** Reddit and X require you to log in once; I can't do that for you.

## Recommendation

Start with Tier 0 + Tier 1 today (already built). If launch week is going well and you want to scale, we add Tier 2 + 3 in a follow-up session.

If even 10 min of token setup is too much, **just use Tier 0** — paste-only — and skip the scheduler.
