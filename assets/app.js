// STEP 1 — HOUSE-ONLY DeepSeek (BYOK removed)
// Friendly fallback included

const HOUSE_ENDPOINT = "https://oddly-useful-house-proxy.nik-sales-737.workers.dev";

async function runPromptCheck(promptText) {
  try {
    const res = await fetch(HOUSE_ENDPOINT + "/prompt-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText })
    });

    if (!res.ok) throw new Error("Service unavailable");

    const data = await res.json();

    if (data && data.content) {
      return data.content;
    }

    return "AI returned no response.";
  } catch (e) {
    return "AI is resting for a moment. Try again shortly.";
  }
}

// Wire into existing UI (non-destructive)
document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.querySelector("#run, .run, [data-run]");
  const promptInput = document.querySelector("#prompt, textarea");
  const output = document.querySelector("#out, .output, pre");

  if (!runBtn || !promptInput || !output) {
    console.warn("Prompt Check UI elements not found. No changes applied.");
    return;
  }

  runBtn.addEventListener("click", async () => {
    output.textContent = "Thinking…";
    const text = await runPromptCheck(promptInput.value || "");
    output.textContent = text;
  });
});