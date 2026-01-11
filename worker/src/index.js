// Oddly Useful — House Proxy Worker
// - CORS for GitHub Pages
// - Premium passphrase gate (ALLOWED_PASSPHRASES)
// - Per-passphrase daily rate limit via Durable Object (RATE_LIMITER)
// - DeepSeek prompt-check proxy (server-side API key)

const ALLOWED_ORIGINS = new Set([
  "https://zhelair.github.io",
  // add custom domains later
]);

function corsHeaders(req) {
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "*";
  const reqHdrs = req.headers.get("Access-Control-Request-Headers");
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    // Allow headers we actually use; echoing requested headers keeps devtools happy.
    "Access-Control-Allow-Headers": reqHdrs || "Content-Type, Authorization, X-Passphrase",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function withCors(req, res) {
  const h = new Headers(res.headers);
  const cors = corsHeaders(req);
  for (const [k, v] of Object.entries(cors)) h.set(k, v);
  return new Response(res.body, { status: res.status, headers: h });
}

function jsonError(req, status, message) {
  return withCors(
    req,
    new Response(JSON.stringify({ ok: false, error: message }), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    })
  );
}

function textOk(req, text) {
  return withCors(
    req,
    new Response(text || "", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

function parseAllowedPassphrases(env) {
  const raw = (env.ALLOWED_PASSPHRASES || "").toString();
  // one per line OR comma separated; trim; remove empties
  const parts = raw
    .split(/[\n,]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set(parts);
}

function readPassphrase(request, payload) {
  // Header name is case-insensitive; Cloudflare normalizes, but we handle both.
  const h =
    request.headers.get("X-Passphrase") ||
    request.headers.get("x-passphrase") ||
    request.headers.get("X-PASSPHRASE") ||
    "";
  const p =
    (payload?.passphrase ?? payload?.code ?? payload?.pass ?? payload?.phrase ?? "") || "";
  return String(p || h || "").trim();
}

// Durable Object: rate limit counters per {bucketKey, day}
export class RateLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/check") return new Response("Not found", { status: 404 });

    const now = Date.now();
    const dayKey = new Date(now).toISOString().slice(0, 10);
    const limit = Number(url.searchParams.get("limit") || "15");

    const data = (await this.state.storage.get(dayKey)) || { count: 0 };
    data.count += 1;
    await this.state.storage.put(dayKey, data);

    const ok = data.count <= limit;
    return new Response(JSON.stringify({ ok, count: data.count, limit }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function checkRateLimit(env, dailyLimit, bucketKey) {
  const key = `pp:${bucketKey || "missing"}`; // per-passphrase bucket
  const id = env.RATE_LIMITER.idFromName(key);
  const stub = env.RATE_LIMITER.get(id);
  const res = await stub.fetch(`https://rate/check?limit=${dailyLimit}`);
  return await res.json();
}

async function deepseekPromptCheck({ apiKey, prompt, model }) {
  const url = "https://api.deepseek.com/chat/completions";
  const body = {
    model: model || "deepseek-chat",
    messages: [
      {
        role: "system",
        content:
          "You are a prompt-check assistant. You DO NOT execute the task. You only improve clarity, give short suggestions, and point out missing info. Keep it concise.",
      },
      { role: "user", content: prompt || "" },
    ],
    temperature: 0.2,
    max_tokens: 350,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(`DeepSeek error ${res.status}: ${txt.slice(0, 200)}`);

  const j = JSON.parse(txt);
  const out = j?.choices?.[0]?.message?.content || "";
  return String(out || "");
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      if (request.method === "OPTIONS") {
        return withCors(request, new Response(null, { status: 204 }));
      }

      if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
        return textOk(request, "ok");
      }

      if (url.pathname !== "/prompt-check") {
        return withCors(request, new Response("Not found", { status: 404 }));
      }

      if (request.method !== "POST") {
        return jsonError(request, 405, "Use POST /prompt-check");
      }

      let payload;
      try {
        payload = await request.json();
      } catch {
        return jsonError(request, 400, "Body must be JSON.");
      }

      const prompt = String(payload?.prompt || "").trim();
      if (!prompt) return textOk(request, "");

      const access = String(payload?.access || "included").toLowerCase();
      const model = String(payload?.model || "deepseek-chat").trim();
      const passphrase = readPassphrase(request, payload);

      // Server-side daily limit: default 15; can override via env.DAILY_LIMIT (recommended)
      const dailyLimit = Number(env.DAILY_LIMIT || 15);

      // Included-key mode requires Premium passphrase
      if (access === "included") {
        const allowed = parseAllowedPassphrases(env);
        if (!passphrase) return jsonError(request, 401, "Missing passphrase.");
        if (allowed.size && !allowed.has(passphrase)) return jsonError(request, 401, "Invalid passphrase.");

        // Rate limit per passphrase bucket
        const rl = await checkRateLimit(env, dailyLimit, passphrase);
        if (!rl.ok) return jsonError(request, 429, `Daily limit reached (${rl.limit}/day).`);
      }

      // Use BYO key only when explicitly requested
      const apiKey =
        access === "mykey"
          ? String(payload?.apiKey || payload?.key || "").trim()
          : String(env.DEEPSEEK_API_KEY || "").trim();

      if (!apiKey) return jsonError(request, 500, "Missing DeepSeek API key.");

      const out = await deepseekPromptCheck({ apiKey, prompt, model });
      return textOk(request, out);
    } catch (err) {
      // Critical: ALWAYS include CORS headers even on crashes.
      return jsonError(request, 500, err?.message ? String(err.message) : "Internal error");
    }
  },
};
