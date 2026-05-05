"""Authorly launch scheduler — auto-posts to Reddit, X (Twitter), and Discord on a schedule.

Usage:
    python scheduler.py test                  # send a no-op test post to each configured platform
    python scheduler.py start                 # run the schedule from schedule.json (foreground)
    python scheduler.py start --launch-date YYYY-MM-DD   # set day-0 to a specific date (default: today UTC)
    python scheduler.py replay --since ISO    # re-fire posts after the given timestamp that didn't fire
    python scheduler.py status                # show what's fired and what's pending

The scheduler tracks fired posts in `fired.json` so it never double-posts.
Configuration via .env (see SETUP.md).
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Lazy imports per platform — only required if you've configured that platform.
ROOT = Path(__file__).parent
SCHEDULE_FILE = ROOT / "schedule.json"
FIRED_FILE = ROOT / "fired.json"
ENV_FILE = ROOT / ".env"


def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    # Also read from os.environ as a fallback
    for k, v in os.environ.items():
        env.setdefault(k, v)
    return env


def load_fired():
    if not FIRED_FILE.exists():
        return {}
    try:
        return json.loads(FIRED_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_fired(fired):
    FIRED_FILE.write_text(json.dumps(fired, indent=2), encoding="utf-8")


def read_post_body(rel_path):
    p = ROOT / rel_path
    return p.read_text(encoding="utf-8")


# ----------------------- Platform handlers -----------------------

def post_reddit(env, post, body):
    try:
        import praw
    except ImportError:
        print("[reddit] praw not installed. Run: pip install praw")
        return False
    if not all(env.get(k) for k in ("REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USERNAME", "REDDIT_PASSWORD")):
        print("[reddit] missing credentials in .env, skipping")
        return False
    try:
        reddit = praw.Reddit(
            client_id=env["REDDIT_CLIENT_ID"],
            client_secret=env["REDDIT_CLIENT_SECRET"],
            username=env["REDDIT_USERNAME"],
            password=env["REDDIT_PASSWORD"],
            user_agent="authorly-launch-poster/1.0 by " + env["REDDIT_USERNAME"],
        )
        sub = reddit.subreddit(post["subreddit"])
        kwargs = {"title": post["title"], "selftext": body}
        if post.get("flair"):
            # Find a flair_id matching the requested label
            for f in sub.flair.link_templates.user_selectable():
                if f["flair_text"] and post["flair"].lower() in f["flair_text"].lower():
                    kwargs["flair_id"] = f["flair_template_id"]
                    break
        submission = sub.submit(**kwargs)
        print(f"[reddit] posted to /r/{post['subreddit']}: https://reddit.com{submission.permalink}")
        return True
    except Exception as e:
        print(f"[reddit] FAILED: {e}")
        return False


def post_twitter(env, post, thread_body):
    try:
        import tweepy
    except ImportError:
        print("[twitter] tweepy not installed. Run: pip install tweepy")
        return False
    if not all(env.get(k) for k in ("TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN_SECRET")):
        print("[twitter] missing credentials in .env, skipping")
        return False
    try:
        client = tweepy.Client(
            consumer_key=env["TWITTER_API_KEY"],
            consumer_secret=env["TWITTER_API_SECRET"],
            access_token=env["TWITTER_ACCESS_TOKEN"],
            access_token_secret=env["TWITTER_ACCESS_TOKEN_SECRET"],
        )
        # Split thread on '---' separators
        tweets = [t.strip() for t in thread_body.split("\n---\n") if t.strip()]
        prev_id = None
        for tweet in tweets:
            if len(tweet) > 280:
                print(f"[twitter] WARNING: tweet exceeds 280 chars ({len(tweet)}), truncating: {tweet[:100]}...")
                tweet = tweet[:277] + "..."
            kwargs = {"text": tweet}
            if prev_id is not None:
                kwargs["in_reply_to_tweet_id"] = prev_id
            r = client.create_tweet(**kwargs)
            prev_id = r.data["id"]
            print(f"[twitter] tweet posted: id={prev_id}")
            time.sleep(2)  # gentle pacing between tweets
        return True
    except Exception as e:
        print(f"[twitter] FAILED: {e}")
        return False


def post_discord(env, post, body):
    try:
        import urllib.request
        import urllib.error
    except ImportError:
        print("[discord] urllib unavailable (very weird Python install)")
        return False
    webhooks = [(k, v) for k, v in env.items() if k.startswith("DISCORD_WEBHOOK_") and v]
    if not webhooks:
        print("[discord] no DISCORD_WEBHOOK_* env vars, skipping")
        return False
    success = 0
    for name, url in webhooks:
        try:
            payload = json.dumps({"content": body, "username": "Authorly"}).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "Authorly-Launch-Scheduler (https://authorly.tools, 1.0)",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                if 200 <= resp.status < 300:
                    print(f"[discord] posted to {name}: status {resp.status}")
                    success += 1
                else:
                    print(f"[discord] {name}: unexpected status {resp.status}")
        except Exception as e:
            print(f"[discord] {name}: FAILED: {e}")
    return success > 0


def post_manual_reminder(env, post, body):
    """Just prints a reminder for platforms with no posting API (HN, PH, LinkedIn, IH).
    The body is shown so you can ctrl-c / ctrl-v immediately."""
    print("=" * 70)
    print(f"MANUAL POST REMINDER: {post['id']}")
    print(f"Platform: {post['platform']}")
    print(f"Notes: {post.get('_note', '')}")
    print("-" * 70)
    print(body)
    print("=" * 70)
    return True


# ----------------------- Scheduler core -----------------------

PLATFORM_HANDLERS = {
    "reddit": post_reddit,
    "twitter": post_twitter,
    "discord": post_discord,
    "linkedin_manual": post_manual_reminder,
    "indie_hackers_manual": post_manual_reminder,
    "hacker_news_manual": post_manual_reminder,
    "product_hunt_manual": post_manual_reminder,
}


def fire_post(env, post, fired):
    handler = PLATFORM_HANDLERS.get(post["platform"])
    if not handler:
        print(f"[scheduler] unknown platform {post['platform']!r} for post {post['id']}")
        return False
    if "thread_file" in post:
        body = read_post_body(post["thread_file"])
    elif "body_file" in post:
        body = read_post_body(post["body_file"])
    else:
        print(f"[scheduler] post {post['id']!r} has no thread_file or body_file")
        return False
    print(f"\n[scheduler] firing post {post['id']!r} on {post['platform']}")
    ok = handler(env, post, body)
    fired[post["id"]] = {
        "platform": post["platform"],
        "fired_at": datetime.now(timezone.utc).isoformat(),
        "success": bool(ok),
    }
    save_fired(fired)
    return ok


def compute_fire_time(launch_date, post):
    day = post["day"]
    hh, mm = post["time_utc"].split(":")
    fire_dt = datetime.combine(launch_date.date(), datetime.min.time(), tzinfo=timezone.utc) + timedelta(
        days=day, hours=int(hh), minutes=int(mm)
    )
    return fire_dt


def cmd_test(env):
    print("[test] sending test posts to configured platforms\n")

    # Reddit: send a private message to yourself
    if all(env.get(k) for k in ("REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USERNAME", "REDDIT_PASSWORD")):
        try:
            import praw
            reddit = praw.Reddit(
                client_id=env["REDDIT_CLIENT_ID"],
                client_secret=env["REDDIT_CLIENT_SECRET"],
                username=env["REDDIT_USERNAME"],
                password=env["REDDIT_PASSWORD"],
                user_agent="authorly-launch-poster/1.0",
            )
            reddit.redditor(env["REDDIT_USERNAME"]).message(
                subject="Authorly scheduler test",
                message="If you see this, your Reddit credentials are working.",
            )
            print("[test] Reddit: OK (PM sent to yourself)")
        except Exception as e:
            print(f"[test] Reddit: FAILED — {e}")
    else:
        print("[test] Reddit: not configured")

    # Twitter: post a single tweet
    if all(env.get(k) for k in ("TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_TOKEN_SECRET")):
        try:
            import tweepy
            client = tweepy.Client(
                consumer_key=env["TWITTER_API_KEY"],
                consumer_secret=env["TWITTER_API_SECRET"],
                access_token=env["TWITTER_ACCESS_TOKEN"],
                access_token_secret=env["TWITTER_ACCESS_TOKEN_SECRET"],
            )
            r = client.create_tweet(text=f"authorly scheduler test {datetime.now(timezone.utc).isoformat()}")
            print(f"[test] Twitter: OK — id={r.data['id']} (you can delete this tweet)")
        except Exception as e:
            print(f"[test] Twitter: FAILED — {e}")
    else:
        print("[test] Twitter: not configured")

    # Discord: post a test message to each webhook
    webhooks = [(k, v) for k, v in env.items() if k.startswith("DISCORD_WEBHOOK_") and v]
    if webhooks:
        import urllib.request
        for name, url in webhooks:
            try:
                payload = json.dumps({"content": f"authorly scheduler test ({name})"}).encode("utf-8")
                req = urllib.request.Request(
                    url,
                    data=payload,
                    headers={
                        "Content-Type": "application/json",
                        "User-Agent": "Authorly-Launch-Scheduler (https://authorly.tools, 1.0)",
                    },
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
                    print(f"[test] Discord {name}: OK ({resp.status})")
            except Exception as e:
                print(f"[test] Discord {name}: FAILED — {e}")
    else:
        print("[test] Discord: no webhooks configured")


def cmd_start(env, launch_date_str=None):
    schedule = json.loads(SCHEDULE_FILE.read_text(encoding="utf-8"))
    fired = load_fired()
    if launch_date_str:
        launch_date = datetime.fromisoformat(launch_date_str).replace(tzinfo=timezone.utc)
    else:
        launch_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    print(f"[scheduler] launch date (UTC): {launch_date.date().isoformat()}")
    print(f"[scheduler] {len(schedule['posts'])} posts in schedule, {len(fired)} already fired")

    while True:
        now = datetime.now(timezone.utc)
        next_post = None
        next_time = None
        for post in schedule["posts"]:
            if post["id"] in fired:
                continue
            t = compute_fire_time(launch_date, post)
            if t <= now:
                # Overdue — fire immediately.
                fire_post(env, post, fired)
                continue
            if next_time is None or t < next_time:
                next_time = t
                next_post = post

        if next_post is None:
            print("[scheduler] all posts fired or scheduled. exiting.")
            return

        wait_seconds = (next_time - now).total_seconds()
        print(f"[scheduler] next post: {next_post['id']} at {next_time.isoformat()} (sleeping {int(wait_seconds)}s)")
        time.sleep(min(wait_seconds, 600))  # wake every 10 min max so Ctrl+C is responsive


def cmd_replay(env, since_iso):
    """Re-fire posts whose scheduled time is between `since` and now and that haven't fired."""
    schedule = json.loads(SCHEDULE_FILE.read_text(encoding="utf-8"))
    fired = load_fired()
    since = datetime.fromisoformat(since_iso).replace(tzinfo=timezone.utc) if "T" in since_iso else datetime.fromisoformat(since_iso + "T00:00:00").replace(tzinfo=timezone.utc)
    launch_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    for post in schedule["posts"]:
        if post["id"] in fired:
            continue
        t = compute_fire_time(launch_date, post)
        if since <= t <= datetime.now(timezone.utc):
            fire_post(env, post, fired)


def cmd_status():
    if not SCHEDULE_FILE.exists():
        print("schedule.json not found")
        return
    schedule = json.loads(SCHEDULE_FILE.read_text(encoding="utf-8"))
    fired = load_fired()
    launch_date = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    print(f"{'POST':<28} {'PLATFORM':<22} {'FIRE AT (UTC)':<22} STATUS")
    print("-" * 90)
    for post in schedule["posts"]:
        t = compute_fire_time(launch_date, post)
        status = "FIRED" if post["id"] in fired else ("OVERDUE" if t < datetime.now(timezone.utc) else "SCHEDULED")
        print(f"{post['id']:<28} {post['platform']:<22} {t.isoformat():<22} {status}")


def main():
    parser = argparse.ArgumentParser(description="Authorly launch scheduler")
    sub = parser.add_subparsers(dest="cmd", required=True)
    sub.add_parser("test", help="send a test post to each configured platform")
    s = sub.add_parser("start", help="run the schedule from schedule.json")
    s.add_argument("--launch-date", help="ISO date (UTC) for day-0; default: today UTC")
    r = sub.add_parser("replay", help="re-fire posts since a given timestamp")
    r.add_argument("--since", required=True, help="ISO timestamp (e.g. 2026-05-12T09:00:00)")
    sub.add_parser("status", help="show fired/pending posts")
    args = parser.parse_args()

    env = load_env()
    if args.cmd == "test":
        cmd_test(env)
    elif args.cmd == "start":
        cmd_start(env, args.launch_date)
    elif args.cmd == "replay":
        cmd_replay(env, args.since)
    elif args.cmd == "status":
        cmd_status()


if __name__ == "__main__":
    main()
