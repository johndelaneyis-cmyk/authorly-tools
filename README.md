# Authorly

Free tools for indie authors. Find real comp titles, write better blurbs, research KDP keywords, pick categories, find tropes, write Amazon Ads headlines, write author bios.

Live at https://authorly.tools

## Stack

- Static frontend (HTML/CSS/JS) — vanilla, no build, strict CSP (`'self'` only on script-src and style-src; only Google Fonts allowed for stylesheets/fonts)
- Cloudflare Pages hosting + Pages Functions for `/api/*`
- Anthropic Claude Sonnet 4.6 (with day-salted IP fingerprint, AbortController timeout, model fallback chain to Sonnet 4.5 and Haiku 4.5 on 403)

## Project structure

```
authorly/
├── index.html               # landing page + comp finder UI
├── blurb.html, bio.html, categories.html, keywords.html, tropes.html, ads.html
├── 404.html, privacy.html, terms.html
├── tool.css                 # shared styles for all 10 pages (with prefers-color-scheme dark)
├── tool.js                  # shared client runtime (Authorly.initTool)
├── feedback.js              # thumbs-up/down feedback widget
├── page/
│   └── {slug}.js            # per-page init scripts (extracted from inline <script> for strict CSP)
├── functions/
│   ├── _middleware.js       # leak blocker — blocks 12 deploy-bucket leak patterns at the edge
│   └── api/
│       ├── _lib.js          # shared rate-limit + AbortController + ClaudeError + fallback chain
│       ├── comp.js, blurb.js, bio.js, categories.js, keywords.js, tropes.js, ads.js
│       ├── feedback.js, waitlist.js
├── _headers                 # security headers (strict CSP, HSTS, etc) + per-asset cache rules
├── _redirects
├── manifest.webmanifest     # PWA add-to-home-screen
├── sitemap.xml, robots.txt
├── og.png, og.svg, favicon.svg
├── docs/                    # superpowers reviews, audits
├── .gitignore
└── README.md
```

## Setup (Cloudflare Pages)

1. Connect this repo to Cloudflare Pages (no build command, output directory `/`)
2. In project Settings -> Environment variables, add:
   - `ANTHROPIC_API_KEY` (production + preview)
   - `ANTHROPIC_MODEL` = `claude-sonnet-4-6` (optional override; default in code)
   - `ANTHROPIC_FALLBACK_MODELS` = `claude-sonnet-4-5,claude-sonnet-4-5-20250929,claude-haiku-4-5` (optional override; default chain in code)
3. KV namespace binding: `RATE_LIMITS` -> a Cloudflare KV namespace
4. Settings -> Custom domains -> add `authorly.tools` and `www.authorly.tools`

## Local dev

Open any `*.html` directly in a browser to test the static UI. The `/api/*` endpoints require Cloudflare Pages or `wrangler pages dev .` to work.