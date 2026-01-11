
/*
 Oddly Useful Emulator — LOCKED API VERSION
 Phase 0: Stability first
 - No BYOK
 - No House / proxy
 - Single private API key
*/

const LOCKED_API_KEY = "sk-164a765f03e146c1bfb4018a5e1e2a6d";
const API_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";
const MODEL = "deepseek-chat";

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.querySelector("button");
  const input = document.querySelector("textarea");
  const resultBox = document.querySelector(".results, #results");

  if (!btn || !input || !resultBox) {
    console.warn("UI elements not found — app.js loaded but UI mismatch.");
    return;
  }

  btn.addEventListener("click", async () => {
    const prompt = input.value.trim();
    if (!prompt) {
      resultBox.textContent = "Please enter a prompt.";
      return;
    }

    resultBox.textContent = "Thinking…";

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOCKED_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: "You are a helpful assistant that reviews prompts for clarity." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        })
      });

      if (!res.ok) {
        throw new Error("API error: " + res.status);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "No response.";
      resultBox.textContent = text;

    } catch (err) {
      console.error(err);
      resultBox.textContent = "Could not reach the model. Try again later.";
    }
  });
});
