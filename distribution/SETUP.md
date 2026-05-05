# Distribution scheduler — one-time setup

10 minutes total. After this, the scheduler can auto-post for you.

## What you'll create

| Service | What you need | Where to get it |
|---|---|---|
| Reddit | Username, password, app client ID, app client secret | https://www.reddit.com/prefs/apps |
| X (Twitter) | API key + secret + access token + access token secret | https://developer.twitter.com (free tier) |
| Discord | Webhook URL per server you want to post to | Server settings → Integrations → Webhooks |

You don't need all three. Skip any platform you don't want to auto-post to.

---

## Reddit setup (3 min)

1. Visit https://www.reddit.com/prefs/apps while logged in.
2. Click **"Create App"** at the bottom.
3. Fill in:
   - **name:** `authorly-launch-poster`
   - **type:** select **script**
   - **description:** `personal launch poster`
   - **about url:** leave blank
   - **redirect uri:** `http://localhost:8080` (won't be used)
4. Click **Create app**.
5. The page now shows your app. You need:
   - **client_id:** the random string just under "personal use script" at the top of the app card.
   - **client_secret:** the longer string labeled "secret".
   - **username:** your Reddit username.
   - **password:** your Reddit password.

Add these to `.env` (see below).

---

## X (Twitter) setup (5 min)

1. Visit https://developer.x.com (or developer.twitter.com — they alias).
2. Sign in with your X account.
3. Apply for the Free tier (auto-approved): "Sign up for Free Access". Answer the questionnaire honestly — say you're posting your own content for product launches.
4. Once approved (usually instant), go to **Projects & Apps** → **Add App**.
5. Name it `authorly-launch-poster`.
6. Under "App permissions", switch to **Read and Write**.
7. Under **Keys and tokens**:
   - Generate **API Key and Secret** — copy both.
   - Generate **Access Token and Secret** under "Authentication Tokens" — copy both.
8. Add all four to `.env`.

**Important:** the Free tier limits you to 50 posts per 24 hours. The scheduler does 8 posts (the X thread) so you're well under. Don't crank up the schedule.

---

## Discord webhook setup (1 min per server)

For each indie-author server you can post to:

1. Open the server in Discord.
2. Server settings (or click the server name → Server Settings) → **Integrations** → **Webhooks** → **New Webhook**.
3. Name it `authorly-launch`. Pick the channel you want to post to.
4. Click **Copy Webhook URL** — it looks like `https://discord.com/api/webhooks/...`.
5. Add to `.env` as `DISCORD_WEBHOOK_<SERVERNAME>=...`.

You can have multiple. The scheduler posts to all of them.

⚠️ **Use only servers where self-promotion is allowed.** Most indie-author Discords have a #self-promo or #share-your-work channel — webhook into those, not general chat.

---

## Create .env

Copy this template into `distribution/.env`:

```
# Reddit
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USERNAME=
REDDIT_PASSWORD=

# X / Twitter (free tier)
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_TOKEN_SECRET=

# Discord webhooks (add as many as you want)
DISCORD_WEBHOOK_20BOOKS=
DISCORD_WEBHOOK_KDPCHAT=
# DISCORD_WEBHOOK_OTHERSERVER=

# Site URL (used for analytics tagging)
SITE_URL=https://authorly.tools
```

Fill in your tokens. Save.

⚠️ **`.env` is in `.gitignore` already.** Do not commit it. Do not screenshot it.

---

## Test the setup

```
cd C:/Users/darre/authorly/distribution
pip install -r requirements.txt
python scheduler.py test
```

This sends a test post to each platform you configured (Reddit: a private message to yourself, X: a single tweet that says "scheduler test", Discord: a "test" message to each webhook). Confirm each arrives, delete the X tweet manually.

If any platform fails, the script tells you which credential is broken.

---

## Run for real on launch day

```
python scheduler.py start
```

That's it. The scheduler runs in the foreground (or background — instructions in `scheduler.py --help`). It fires posts according to `schedule.json`.

**Tip:** run it in a screen/tmux session, or use `nohup`:

```
nohup python scheduler.py start > scheduler.log 2>&1 &
```

Now your laptop can sleep and the schedule keeps running. Check `scheduler.log` periodically.

---

## What if you miss the launch window?

If the scheduler died or your laptop slept, you can replay missed posts:

```
python scheduler.py replay --since "2026-05-12T09:00:00"
```

It posts everything that was scheduled after that timestamp but didn't fire.
