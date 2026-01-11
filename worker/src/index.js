export const ALLOWED_ORIGINS = new Set([
  "https://zhelair.github.io",
]);

function corsHeaders(req) {
  const origin = req.headers.get("Origin") || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://zhelair.github.io";
  const reqHdrs = req.headers.get("Access-Control-Request-Headers") || "";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": reqHdrs || "Content-Type, Authorization, X-Passphrase, X-OU-PASS",
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

function jsonRes(req, status, obj) {
  return withCors(req, new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  }));
}

function ok(req, obj) { return jsonRes(req, 200, obj); }

function parseAllowed(raw) {
  // Accept either JSON array: ["a","b"] OR comma/newline-separated: a,b
  const s = String(raw || "").trim();
  if (!s) return [];
  if (s.startsWith("[")) {
    try {
      const arr = JSON.parse(s);
      return Array.isArray(arr) ? arr.map(x => String(x).trim()).filter(Boolean) : [];
    } catch {
      return [];
    }
  }
  return s.split(/[\n,]+/g).map(x => x.trim()).filter(Boolean);
}

export class RateLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/check") return new Response("Not found", { status: 404 });
    const limit = Number(url.searchParams.get("limit") || "15");
    const now = Date.now();
    const dayKey = new Date(now).toISOString().slice(0, 10); // UTC day
    const data = await this.state.storage.get(dayKey) || { count: 0 };
    data.count += 1;
    await this.state.storage.put(dayKey, data);
    const isAllowed = data.count <= limit;
    return new Response(JSON.stringify({ ok: isAllowed, count: data.count, limit }), {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    });
  }
}

async function checkRateLimit(env, dailyLimit, passphrase) {
  // bucket per passphrase
  const key = `pp:${passphrase || "missing"}`;
  const id = env.RATE_LIMITER.idFromName(key);
  const stub = env.RATE_LIMITER.get(id);
  const res = await stub.fetch(`https://do/check?limit=${encodeURIComponent(String(dailyLimit || 15))}`);
  return await res.json();
}

async function deepseekPromptCheck({ apiKey, model, prompt, system }) {
  const url = "https://api.deepseek.com/chat/completions";
  const payload = {
    model: model || "deepseek-chat",
    messages: [
      { role: "system", content: system || DEFAULT_SYSTEM },
      { role: "user", content: prompt || "" }
    ],
    temperature: 0.2,
    max_tokens: 900
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const txt = await res.text();
  if (!res.ok) throw new Error(`DeepSeek error ${res.status}: ${txt.slice(0, 400)}`);
  const j = JSON.parse(txt);
  const out = j?.choices?.[0]?.message?.content || "";
  return String(out);
}

const DEFAULT_SYSTEM =
  "You are a prompt-check assistant. You DO NOT execute the task. You only improve clarity, give short suggestions, and point out missing info. Keep it concise.";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(request, new Response(null, { status: 204 }));
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return ok(request, { ok: true });
    }

    if (url.pathname !== "/prompt-check") {
      return withCors(request, new Response("Not found", { status: 404 }));
    }

    if (request.method !== "POST") {
      return jsonRes(request, 405, { ok: false, error: "Use POST /prompt-check" });
    }

    let payload = {};
    try {
      payload = await request.json();
    } catch {
      return jsonRes(request, 400, { ok: false, error: "Body must be JSON." });
    }

    const prompt = String(payload.prompt || "").trim();
    if (!prompt) return ok(request, { ok: true, text: "" });

    const model = String(payload.model || "deepseek-chat").trim() || "deepseek-chat";
    const system = String(payload.system || payload.systemPrompt || "").trim();

    // Passphrase validation
    const passphrase =
      String(
        request.headers.get("X-Passphrase") ||
        request.headers.get("X-OU-PASS") ||
        payload.passphrase ||
        payload.code ||
        payload.pass ||
        ""
      ).trim();

    const allowed = parseAllowed(env.ALLOWED_PASSPHRASES);
    if (!allowed.length) {
      return jsonRes(request, 500, { ok: false, error: "Server misconfigured: ALLOWED_PASSPHRASES missing." });
    }
    if (!passphrase || !allowed.includes(passphrase)) {
      return jsonRes(request, 401, { ok: false, error: "Invalid passphrase." });
    }

    const dailyLimit = Number(payload.dailyLimit || env.DAILY_LIMIT || 15);
    const rl = await checkRateLimit(env, dailyLimit, passphrase);
    if (!rl.ok) {
      return jsonRes(request, 429, { ok: false, error: `Daily limit reached (${rl.limit}/day).` });
    }

    const apiKey = String(env.DEEPSEEK_API_KEY || "").trim();
    if (!apiKey) return jsonRes(request, 500, { ok: false, error: "Missing DeepSeek API key (server side)." });

    try {
      const out = await deepseekPromptCheck({ apiKey, model, prompt, system });
      return ok(request, { ok: true, text: out });
    } catch (err) {
      return jsonRes(request, 502, { ok: false, error: err?.message || "Upstream error" });
    }
  }
};
