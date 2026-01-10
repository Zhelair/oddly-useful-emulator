// Minimal router + internal AI Guide / Buddy switching

const screenMenu = document.getElementById("screenMenu");
const screenContent = document.getElementById("screenContent");
const yearEl = document.getElementById("year");
const supportLink = document.getElementById("supportLink");

if (yearEl) yearEl.textContent = new Date().getFullYear();

// Support link (global)
const cfg = window.OU_CONFIG || {};
const supportUrl = cfg.supportUrl || "https://buymeacoffee.com/YOURNAME";
if (supportLink) supportLink.href = supportUrl;

const ROUTES = {
  home: { menu: "tpl-menu-home", content: "tpl-content-home" },
  projects: { menu: "tpl-menu-projects", content: "tpl-content-projects" },
  posts: { menu: "tpl-menu-posts", content: "tpl-content-posts" },
  aiguide: { menu: "tpl-menu-aiguide", content: "tpl-content-aiguide-overview" },
  about: { menu: "tpl-menu-about", content: "tpl-content-about" },
};

function loadTemplate(targetEl, templateId) {
  const tpl = document.getElementById(templateId);
  if (!tpl) { targetEl.innerHTML = ""; return; }
  targetEl.innerHTML = "";
  targetEl.appendChild(tpl.content.cloneNode(true));
}

function setActiveMenuButton(container, selector, matchKey, matchValue) {
  container.querySelectorAll(selector).forEach(btn => {
    const val = btn.getAttribute(matchKey);
    btn.classList.toggle("is-active", val === matchValue);
  });
}

function navigate(route) {
  const config = ROUTES[route] || ROUTES.home;
  loadTemplate(screenMenu, config.menu);
  loadTemplate(screenContent, config.content);

  if (route === "home") initHomeAttract();
  if (route === "aiguide") initAiGuide("overview");
  if (route === "about") initAbout();
}

function initHomeAttract() {
  const attract = document.getElementById("homeAttract");
  const active = document.getElementById("homeActive");
  const pressStart = document.getElementById("pressStart");
  if (!pressStart || !attract || !active) return;

  function start() { attract.hidden = true; active.hidden = false; }
  pressStart.addEventListener("click", start);
  pressStart.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); start(); }
  });
}

// ===== AI GUIDE internal switching =====
function initAiGuide(view) {
  // Ensure menu active state
  const menu = document.getElementById("screenMenu");
  if (menu) setActiveMenuButton(menu, "[data-guide]", "data-guide", view);

  if (view === "buddy") {
    loadTemplate(screenContent, "tpl-content-aiguide-buddy");
    initBuddy("a");
  } else if (view === "modules") {
    loadTemplate(screenContent, "tpl-content-aiguide-modules");
  } else {
    loadTemplate(screenContent, "tpl-content-aiguide-overview");
  }
}

function initBuddy(moduleKey) {
  const main = document.getElementById("buddyMain");
  if (!main) return;

  const map = { a: "tpl-buddy-module-a", b: "tpl-buddy-module-b", c: "tpl-buddy-module-c" };
  loadTemplate(main, map[moduleKey] || map.a);

  // activate button styling
  document.querySelectorAll(".buddy__mod[data-module]").forEach(btn => {
    btn.classList.toggle("is-active", btn.getAttribute("data-module") === moduleKey);
  });

  // Hook module behaviors
  if (moduleKey === "a") hookModuleA();
  if (moduleKey === "b") hookModuleB();
  if (moduleKey === "c") hookModuleC();
}

function hookModuleA() {
  const out = document.getElementById("aOutput");
  const gen = document.getElementById("aGenerate");
  const reset = document.getElementById("aReset");
  const copy = document.getElementById("aCopy");

  if (!out || !gen || !reset || !copy) return;

  function buildPrompt() {
    const role = (document.getElementById("aRole")?.value || "").trim();
    const goal = (document.getElementById("aGoal")?.value || "").trim();
    const tone = document.querySelector('input[name="aTone"]:checked')?.value || "direct";
    const pace = document.querySelector('input[name="aPace"]:checked')?.value || "think";

    const wants = [];
    if (document.getElementById("aWStructure")?.checked) wants.push("structured responses");
    if (document.getElementById("aWSteps")?.checked) wants.push("step-by-step explanations when useful");
    if (document.getElementById("aWShort")?.checked) wants.push("short, direct answers");
    if (document.getElementById("aWExamples")?.checked) wants.push("examples");
    if (document.getElementById("aWWarnings")?.checked) wants.push("warnings about missing constraints");

    const wantsLine = wants.length ? ("Prefer: " + wants.join(", ") + ".") : "Prefer clear structure and honest feedback.";

    const toneLine = tone === "strict"
      ? "You may challenge weak or sloppy prompts directly. Be professional, not rude."
      : (tone === "gentle" ? "Be patient and supportive, and explain terms briefly when first used." : "Be honest and direct, without being rude.");

    const paceLine = pace === "fast"
      ? "Respond quickly if possible, but flag uncertainty."
      : "Pause and think before answering. Do not rush to generate.";

    const roleLine = role ? `Context: The user is a ${role}.` : "";
    const goalLine = goal ? `Main goal: ${goal}.` : "";

    return [
      "Intro / Working Agreement",
      "",
      roleLine,
      goalLine,
      "",
      "You are assisting a human who values clear thinking over fast answers.",
      "",
      "Before generating results:",
      "- clarify goals if they are vague",
      "- separate thinking from execution",
      "- point out missing constraints or assumptions",
      "",
      wantsLine,
      toneLine,
      paceLine,
      "",
      "If a request is underspecified or premature:",
      "- explain what is missing",
      "- suggest a better framing",
      "- do not rush to produce output",
      "",
      "Treat prompts as design documents, not wishes."
    ].filter(Boolean).join("\n");
  }

  gen.addEventListener("click", () => { out.value = buildPrompt(); });
  reset.addEventListener("click", () => { out.value = "(Generated prompt will appear here)"; });

  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(out.value);
      copy.textContent = "Copied";
      setTimeout(() => (copy.textContent = "Copy"), 900);
    } catch {
      copy.textContent = "Copy failed";
      setTimeout(() => (copy.textContent = "Copy"), 900);
    }
  });
}

function hookModuleB() {
  const out = document.getElementById("bOutput");
  const gen = document.getElementById("bGenerate");
  const copy = document.getElementById("bCopy");
  if (!out || !gen || !copy) return;

  const base = [
    "Golden Way of Building",
    "",
    "You are assisting in building ideas, prompts, or systems using a disciplined process.",
    "",
    "Follow these rules strictly:",
    "",
    "1. Separate phases",
    "- Thinking and planning come first.",
    "- Execution comes only after decisions are clear.",
    "",
    "2. Do not rush",
    "- If requirements are unclear, pause.",
    "- Ask clarifying questions instead of guessing.",
    "",
    "3. Lock decisions",
    "- When a decision is agreed, treat it as locked.",
    "- Do not re-open locked decisions unless explicitly asked.",
    "",
    "4. One change at a time",
    "- Do not add multiple features or ideas in one step.",
    "- Warn if a request introduces scope creep.",
    "",
    "5. Respect readiness",
    "- Do not generate final outputs unless explicitly requested.",
    "- Treat premature generation as a mistake.",
    "",
    "6. Use the control word “DEPLOY”",
    "- Only when the user explicitly says “DEPLOY” may you finalize, generate, or execute.",
    "- Until then, focus on thinking, structure, and validation.",
    "",
    "7. Be honest",
    "- Point out weak assumptions.",
    "- Say when something is underspecified.",
    "- Prefer clarity over speed or politeness.",
    "",
    "The goal is a stable, understandable result — not a fast one."
  ].join("\n");

  function build(mode) {
    if (mode === "strict") {
      return base + "\n\nIn strict mode:\n- Refuse to generate outputs if key decisions are missing.\n- State what must be clarified before proceeding.\n- Prioritize long-term stability over short-term progress.";
    }
    if (mode === "soft") {
      return base + "\n\nIn soft mode:\n- Remind the user when steps are skipped.\n- Allow execution, but warn about potential consequences.";
    }
    return base;
  }

  gen.addEventListener("click", () => {
    const mode = document.querySelector('input[name="bMode"]:checked')?.value || "standard";
    out.value = build(mode);
  });

  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(out.value);
      copy.textContent = "Copied";
      setTimeout(() => (copy.textContent = "Copy"), 900);
    } catch {
      copy.textContent = "Copy failed";
      setTimeout(() => (copy.textContent = "Copy"), 900);
    }
  });
}

function hookModuleC() {
  const sel = document.getElementById("cExampleSelect");
  if (!sel) return;

  const EX = {
    tetris: {
      bad: "Build me a Tetris game in JavaScript with sound, scoring, mobile support, and nice UI.",
      improved: "I want to build a simple Tetris game in JavaScript. Can you help me plan it and then write the code?",
      golden:
`I want to build a simple Tetris-like game in JavaScript.

First, help me define scope:
- basic mechanics only
- no sound
- desktop only

Then, propose a step-by-step plan without writing code.

Do not generate code yet.
We will deploy later.`,
      why: "Scope is locked, phases are separated, and execution is gated. This prevents feature soup and messy output."
    },
    planapp: {
      bad: "I have an idea for an app. Can you help me build it?",
      improved: "I want to build a productivity app. Can you suggest features and a UI?",
      golden:
`I want to explore an app idea.

Before suggesting features:
- ask clarifying questions
- help me define the core problem
- identify what this app is not

Do not suggest UI or features yet.`,
      why: "Problem-first thinking stops random feature lists and gives the user control."
    },
    fixidea: {
      bad: "My app feels messy. Can you improve it?",
      improved: "My app has too many features and feels confusing. What should I fix?",
      golden:
`My app feels overloaded.

First:
- help me identify where scope creep happened
- list decisions that were never explicitly made

Do not propose fixes yet.`,
      why: "Diagnosis before treatment prevents random refactoring and builds a clear fix plan."
    },
    promptcraft: {
      bad: "Write me a great prompt for Midjourney.",
      improved: "I want a Midjourney prompt for a cinematic image.",
      golden:
`Help me write a prompt.

First, ask me about:
- purpose of the image
- mood
- where it will be used

Then, propose one structured prompt.

Do not generate variations yet.`,
      why: "Prompt writing becomes a process. The user learns how prompts are built instead of collecting junk."
    }
  };

  function render(key) {
    const e = EX[key] || EX.tetris;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set("cBad", e.bad);
    set("cImproved", e.improved);
    set("cGolden", e.golden);
    const why = document.getElementById("cWhy"); 
    if (why) why.textContent = e.why;
  }

  sel.addEventListener("change", () => render(sel.value));
  render(sel.value);
}

// ===== ABOUT: settings + support =====
function initAbout() {
  // Support link in About page
  const aboutSupportLink = document.getElementById("aboutSupportLink");
  if (aboutSupportLink) aboutSupportLink.href = supportUrl;

  // Theme radio
  const storedTheme = localStorage.getItem("ou_theme") || "ps";
  document.body.classList.remove("theme-nes","theme-ps","theme-xbox");
  document.body.classList.add("theme-" + storedTheme);

  document.querySelectorAll('input[name="theme"]').forEach(r => {
    r.checked = (r.value === storedTheme);
    r.addEventListener("change", () => {
      localStorage.setItem("ou_theme", r.value);
      document.body.classList.remove("theme-nes","theme-ps","theme-xbox");
      document.body.classList.add("theme-" + r.value);
    });
  });

  // AI key store (BYO-key)
  const provider = document.getElementById("aiProvider");
  const apiKey = document.getElementById("apiKey");
  const testKey = document.getElementById("testKey");
  const saveKey = document.getElementById("saveKey");
  const clearKey = document.getElementById("clearKey");
  const status = document.getElementById("settingsStatus");

  const savedProvider = localStorage.getItem("ou_ai_provider") || "openai";
  const savedKey = localStorage.getItem("ou_ai_key") || "";

  if (provider) provider.value = savedProvider;
  if (apiKey) apiKey.value = savedKey;

  function setStatus(msg) { if (status) status.textContent = msg; }

  if (saveKey) saveKey.addEventListener("click", () => {
    localStorage.setItem("ou_ai_provider", provider?.value || "openai");
    localStorage.setItem("ou_ai_key", apiKey?.value || "");
    setStatus("Saved locally in your browser.");
  });

  if (clearKey) clearKey.addEventListener("click", () => {
    localStorage.removeItem("ou_ai_provider");
    localStorage.removeItem("ou_ai_key");
    if (provider) provider.value = "openai";
    if (apiKey) apiKey.value = "";
    setStatus("Cleared.");
  });

  if (testKey) testKey.addEventListener("click", () => {
    const key = (apiKey?.value || "").trim();
    if (!key) return setStatus("No key found. Paste your key, then Save.");
    setStatus("Key present. (Real API test is coming later.)");
  });
}

// ===== GLOBAL CLICK ROUTING =====
document.addEventListener("click", (e) => {
  const routeBtn = e.target.closest("[data-route]");
  if (routeBtn) {
    e.preventDefault();
    navigate(routeBtn.getAttribute("data-route"));
    return;
  }

  const guideBtn = e.target.closest("[data-guide]");
  if (guideBtn) {
    e.preventDefault();
    const view = guideBtn.getAttribute("data-guide");
    // keep menu active state
    const menu = document.getElementById("screenMenu");
    if (menu) setActiveMenuButton(menu, "[data-guide]", "data-guide", view);
    initAiGuide(view);
    return;
  }

  const modBtn = e.target.closest("[data-module]");
  if (modBtn) {
    e.preventDefault();
    initBuddy(modBtn.getAttribute("data-module"));
    return;
  }
});

// Initial load
navigate("home");
