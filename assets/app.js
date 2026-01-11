
/*
 Oddly Useful Emulator — LOCKED API VERSION
 Phase 0: Stability first
 - No BYOK
 - No House / proxy
 - Single private API key
*/

const LOCKED_API_KEY = "PASTE_YOUR_PRIVATE_API_KEY_HERE";
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
      const res = await fetch(fetch("https://api.deepseek.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY_HERE"
  },
  body: JSON.stringify({
    model: "deepseek-chat",
    messages: [
      { role: "user", content: promptText }
    ],
    temperature: 0.7
  })
})
.then(res => res.json())
.then(data => {
  console.log("DeepSeek response:", data);

  const text =
    data?.choices?.[0]?.message?.content ||
    "No response from model.";

  resultsEl.textContent = text;
})
.catch(err => {
  console.error(err);
  resultsEl.textContent = "Error contacting AI.";
});
