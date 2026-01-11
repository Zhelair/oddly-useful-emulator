# House Key Proxy (Cloudflare Worker) — Prompt Check v1

This tiny backend keeps your **DeepSeek API key secret** and enforces:
- **15 Prompt Checks / day** (per passphrase)
- **2000 words max** per prompt
- Reset at **00:00 Europe/Sofia**

## Deploy (free tier)
1) Install Wrangler + login
```bash
npm i -g wrangler
wrangler login
```

2) From this folder:
```bash
wrangler deploy
```

3) Set secrets (required)
```bash
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put ALLOWED_PASSPHRASES
```
For `ALLOWED_PASSPHRASES`, use comma-separated values (example):
`ODDLY-USEFUL-2026`

Optional overrides:
```bash
wrangler secret put DAILY_LIMIT
wrangler secret put MAX_WORDS
```

4) Copy your Worker URL into the site
Edit `assets/data.js`:
```js
house: { endpoint: "https://YOUR-WORKER.yourname.workers.dev", ... }
```

## Notes
- Limits are enforced server-side using a Durable Object.
- This is MVP-grade (simple + safe).