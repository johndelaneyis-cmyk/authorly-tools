# Authorly Launch — Manual user steps

Things only you can do. Walk through these in order. Total time across the 22-day window: ~2 hours, mostly seasoning. Setup itself is ~15 min.

---

## Phase 1 — Setup (do any time before Mon May 18)

### A. Add `reddit@authorly.tools` Cloudflare Email Routing alias (~3 min)

1. Go to Cloudflare dashboard → `authorly.tools` zone → Email → Email Routing → Routing rules.
2. Custom address: `reddit`, destination: `darrenhuiwork@gmail.com` (same destination as `hello@`).
3. Save. Send a test email from another account to verify it arrives.

(Optional — same flow for `hn@authorly.tools` if you want a separate HN inbox.)

### B. Register Reddit account (~5 min)

1. Open `reddit.com/register` in a private window (so it doesn't conflict with any existing personal Reddit session).
2. Email: `reddit@authorly.tools`.
3. Username preference order:
   - `Authorly`
   - `authorly_maker`
   - `by_authorly`
   - `authorly_indie`
   - **AVOID:** `authorlyofficial`, `authorlyhq` — read brand-y, attract removal.
4. Verify email (link arrives in your `darrenhuiwork@gmail.com` inbox).
5. Profile setup:
   - Display name: same as username
   - Bio: *"Indie author. Building free tools for self-publishing at authorly.tools."*
   - Avatar: optional. If you set one, use the favicon from the site (just download `https://authorly.tools/favicon.svg` → convert to PNG → upload).
6. **Do NOT** post anything yet. The seasoning phase starts May 18.

### C. (Optional) Register HN account (~3 min)

1. `news.ycombinator.com/signup`.
2. Email: `hn@authorly.tools` (after you've added that alias).
3. Username: `Authorly` if available.
4. No profile setup needed — HN doesn't have one.

### D. Update Authorly project memory (I'll do this autonomously when you confirm setup is done)

Once you've created the Reddit account, paste the chosen username into chat (e.g. "Reddit account is `u/Authorly`") and I'll update:
- `~/.claude/projects/.../memory/project_authorly.md` (or create one if missing)
- This launch playbook to replace `u/Authorly` placeholders with the actual handle
- Any draft post that mentions the maker handle

---

## Phase 2 — Seasoning (Mon May 18 → Sun May 24, ~30 min/day)

You comment, never post. URL never appears. Goal is ~50-100 comment karma + at least one comment that someone replied to.

### Daily routine

1. Open the Reddit account you created.
2. Sort `r/IndieAuthorClub` by "new" (start small/friendly). Find a thread where you have real knowledge.
3. Leave a substantive comment (3-5 sentences min). No URL. No tool name.
4. Repeat in 1 more sub: `r/SelfPublishing` first few days, `r/selfpublish` once you have a few comments under your belt.
5. **Total: 3-5 comments per day across 2 subs.** Don't grind.

### What to comment on

See `launch-plan.md` → "Reddit seasoning playbook" → "What to comment on (good shapes)" — it has 6 categories with concrete topic patterns. The first one (Amazon book description structure) is a layup because you've literally tuned the blurb prompt around it.

### What to avoid

See `launch-plan.md` → "Anti-patterns". Critical: don't mention `authorly.tools`, don't say "I built a tool that…", don't comment on a thread then post a launch link in another thread within the same hour.

### When you feel done

After ~7 days of seasoning, you should have:
- 15-25 comments
- 50-100 comment karma
- At least one comment with a follow-up reply

If on Sun May 24 you don't have a follow-up reply yet, do one more day of seasoning before launching. The proof-of-tone matters.

---

## Phase 3 — Launch week (Tue May 26 → Thu May 28)

### Tue May 26 — Reddit launch

**4am ET / 9am UK:** Open `posts/r-selfpublish.md` in this directory. Copy the title, copy the body. Paste into `reddit.com/r/selfpublish/submit`. Set flair to "Marketing". Submit.

**9am ET / 2pm UK:** If your `r/selfpublish` post is sitting at >0 upvotes and not removed, do the same for `r/SelfPublishing` using `posts/r-selfpublishing.md`. (If `r/selfpublish` got removed: skip secondary post, debug what got flagged, retry next day.)

**Throughout the day:** Check Reddit comments every 2-3 hours. Use `../replies.md` for prepared answers. Don't refresh constantly.

### Wed May 27 — Show HN

**9am ET / 2pm UK sharp.** This is non-negotiable on timing — peak HN traffic window. Open `posts/show-hn.md`. Paste title + URL + text into `news.ycombinator.com/submit`.

**Set aside 4-6 hours** to be available for comments. Top response in the first 90 minutes determines whether the post climbs. Use `../replies.md` "long" variants for HN — that crowd reads.

**1pm ET / 6pm UK:** Post to `r/IndieAuthorClub` using `posts/r-indieauthorclub.md` (TODO: extract from `posts.md` r/selfpublish content, lightly adapted).

### Thu May 28 — IndieHackers + niche Reddit

**Anytime:** Post to IndieHackers using `posts/indiehackers.md`. IH posts persist on the homepage for hours/days, so timing is less critical.

**Afternoon (only if you have karma there):** Post to `r/eroticauthors`. Skip if you didn't comment in that sub during seasoning.

### Daily comment rounds (Wed-Sun)

For each launch post that's getting comments:
1. Open the post.
2. Read top 3 unread comments.
3. For each: ctrl-F `../replies.md` for the closest match, paste, send.
4. If a comment doesn't fit any template, write a short genuine reply — don't overthink it.
5. **Done. Move on. Do not refresh for 4 hours.**

The trap: refreshing every 10 min and replying to every comment. That kills your week. Two reply rounds per day is plenty.

---

## Phase 4 — Decision day (Mon Jun 1, ~10 min)

Open these dashboards:
1. **Cloudflare Web Analytics** for `authorly.tools`. Note: 7-day uniques, top pages, top referrers.
2. **Wrangler waitlist count:**
   ```
   cd C:/Users/darre/authorly
   npx wrangler@latest kv key list --binding=RATE_LIMITS --prefix=waitlist: --remote 2>&1 | grep -c '^- '
   ```
   (Or wait for me to do it via the Cloudflare API once you confirm the wrangler auth is working.)
3. **Feedback votes:** same wrangler command but `--prefix=feedback:`.

**Decision:**
- Waitlist >50 + ≥3 substance comments + ≥1 genre request → Pro tier worth scoping. Tell me, I'll plan the build.
- <50 waitlist but ≥3 substance comments → positioning works, traffic is the bottleneck. Plan a step-D push (newsletter, SEO, BookTok) before another launch.
- <50 waitlist + <3 substance comments → positioning is wrong. Don't relaunch. Brainstorm what to change first.

---

## What I (Claude) will do autonomously while you do the manual steps

After you confirm Reddit account is set up:
- Update launch-plan.md and the post drafts with your actual `u/Authorly` username
- Identify 5-10 specific Reddit threads suitable for seasoning (with links + draft comment outlines)
- Watch the Slatework reply window cool down (May 13-19) and surface anything blocking the Authorly window
- Pre-stage anticipated edge-case comment responses beyond the 12 already in `../replies.md`
- After launch: scan all venues for negative comments needing nuanced reply, draft those for you to paste

You can always paste a Reddit thread URL or comment screenshot into chat and I'll draft a reply in ~30s.
