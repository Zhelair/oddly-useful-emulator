// Cloudflare Worker: Oddly Useful House Proxy
// Purpose: provide a small backend so GitHub Pages can use an "included" DeepSeek key.
//
// Required secrets:
//   - DEEPSEEK_API_KEY
// Optional secrets:
//   - ALLOWED_PASSPHRASES   (comma-separated, e.g. "ODDLY-USEFUL-2026,BETA-HOUSE-ACCESS")
//   - ALLOWED_ORIGINS       (comma-separated origins allowed for CORS)

const DEFAULT_ALLOWED_ORIGINS = [
  "https://zhelair.github.io",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];

function csvToSet(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
  );
}

function pickCorsOrigin(origin, env) {
  const configured = csvToSet(env.ALLOWED_ORIGINS);
  const allowList = configured.size ? configured : new Set(DEFAULT_ALLOWED_ORIGINS);

  // If caller didn't send Origin (e.g., curl), just don't echo anything.
  if (!origin) return "";

  return allowList.has(origin) ? origin : "";
}

function withCors(headers, origin) {
  if (!origin) return headers;
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-OU-PASS");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");
  return headers;
}

function jsonResponse(obj, { status = 200, origin = "" } = {}) {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });
  withCors(headers, origin);
  return new Response(JSON.stringify(obj), { status, headers });
}

function textResponse(text, { status = 200, origin = "" } = {}) {
  const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8" });
  withCors(headers, origin);
  return new Response(text, { status, headers });
}

function requirePassphrase(req, env) {
  const allowed = csvToSet(env.ALLOWED_PASSPHRASES);
  if (!allowed.size) return null; // passphrase check disabled

  const provided = (req.headers.get("X-OU-PASS") || "").trim();
  if (!provided) return "Missing passphrase";
  if (!allowed.has(provided)) return "Invalid passphrase";
  return null;
}

async function callDeepSeek({ apiKey, prompt, model }) {
  const url = "https://api.deepseek.com/v1/chat/completions";
  const payload = {
    model: model || "deepseek-chat",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a prompt doctor. You DO NOT execute the user's task. You only evaluate the prompt and improve it. " +
          "Return a compact, structured analysis with: diagnosis, missing, improvements, golden_prompt."
      },
      { role: "user", content: String(prompt || "").slice(0, 4000) }
    ]
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = null; }

  return { ok: resp.ok, status: resp.status, text, data };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = pickCorsOrigin(req.headers.get("Origin") || "", env);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return textResponse("ok", { status: 204, origin });
    }

    if (url.pathname === "/health") {
      return jsonResponse({ ok: true, name: "oddly-useful-house-proxy" }, { origin });
    }

    if (url.pathname !== "/prompt-check" || req.method !== "POST") {
      return jsonResponse({ error: "Not found" }, { status: 404, origin });
    }

    const passErr = requirePassphrase(req, env);
    if (passErr) {
      return jsonResponse({ error: passErr }, { status: 401, origin });
    }

    if (!env.DEEPSEEK_API_KEY) {
      return jsonResponse(
        {
          error: "House key missing",
          hint: "Set the Worker secret DEEPSEEK_API_KEY, then redeploy."
        },
        { status: 500, origin }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, { status: 400, origin });
    }

    const userPrompt = (body && body.prompt) ? String(body.prompt) : "";
    const model = (body && body.model) ? String(body.model) : "deepseek-chat";

    if (!userPrompt.trim()) {
      return jsonResponse({ error: "Empty prompt" }, { status: 400, origin });
    }

    const r = await callDeepSeek({ apiKey: env.DEEPSEEK_API_KEY, prompt: userPrompt, model });

    if (!r.ok) {
      // Extra hint for the most common issue we hit tonight.
      const maybeBadKey = r.status === 401 || r.status === 403;
      return jsonResponse(
        {
          error: "DeepSeek request failed",
          status: r.status,
          hint: maybeBadKey ? "DeepSeek rejected the included key. Re-set DEEPSEEK_API_KEY secret to a valid DeepSeek key, then redeploy." : undefined,
          raw: r.data || r.text
        },
        { status: 502, origin }
      );
    }

    // Return what the UI expects.
    const content = r.data?.choices?.[0]?.message?.content || "";
    return jsonResponse({ ok: true, content }, { origin });
  }
};
