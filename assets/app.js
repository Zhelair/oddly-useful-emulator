
/*
 STEP 1 FIX — HOUSE ONLY
 - No BYOK logic
 - No top-level await
 - Always calls House endpoint
*/

(function () {
  if (!window.OU_DATA || !window.OU_DATA.house || !window.OU_DATA.house.endpoint) {
    console.error("HOUSE config missing");
    return;
  }

  const HOUSE = window.OU_DATA.house;

  function qs(id) {
    return document.getElementById(id);
  }

  function setResult(text) {
    const el = qs("results");
    if (el) el.textContent = text;
  }

  async function checkPrompt() {
    const promptEl = qs("promptInput");
    if (!promptEl || !promptEl.value.trim()) {
      setResult("Please enter a prompt.");
      return;
    }

    setResult("Checking prompt…");

    try {
      const res = await fetch(HOUSE.endpoint + "/prompt-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: promptEl.value,
          maxWords: HOUSE.maxWords
        })
      });

      if (!res.ok) {
        throw new Error("House error " + res.status);
      }

      const data = await res.json();
      setResult(data.result || JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      setResult("Couldn’t reach the model right now. Try again in a moment.");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const btn = qs("checkPromptBtn");
    if (btn) btn.addEventListener("click", checkPrompt);
  });
})();
