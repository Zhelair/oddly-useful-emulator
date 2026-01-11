# Oddly Useful — House Proxy Worker (fixed)

This version:
- always returns CORS headers (even on errors)
- enforces Premium passphrase via `ALLOWED_PASSPHRASES`
- rate limits **per passphrase** (15/day by default) via Durable Object `RATE_LIMITER`

## Required secrets / vars (Cloudflare Dashboard or Wrangler)
- `DEEPSEEK_API_KEY` (secret)
- `ALLOWED_PASSPHRASES` (secret) — one per line (or comma-separated)
- optional: `DAILY_LIMIT` (var) — default 15

## Deploy (wrangler)
```bash
npm i -g wrangler
wrangler login
wrangler deploy
```

After deploy, your app should call:
`https://oddly-useful-house-proxy.<your-subdomain>.workers.dev/prompt-check`
