// ====== CORE ELEMENTS ======
const screenMenu = document.getElementById("screenMenu");
const screenContent = document.getElementById("screenContent");
const yearEl = document.getElementById("year");

// Footer year
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ====== ROUTE TEMPLATES ======
const ROUTES = {
  home: {
    menu: "tpl-menu-home",
    content: "tpl-content-home",
  },
  projects: {
    menu: "tpl-menu-projects",
    content: "tpl-content-projects",
  },
  posts: {
    menu: "tpl-menu-posts",
    content: "tpl-content-posts",
  },
  aiguide: {
    menu: "tpl-menu-aiguide",
    content: "tpl-content-aiguide-overview",
  },
};

// ====== TEMPLATE LOADER ======
function loadTemplate(targetEl, templateId) {
  const tpl = document.getElementById(templateId);
  if (!tpl) {
    console.warn("Template not found:", templateId);
    targetEl.innerHTML = "";
    return;
  }
  targetEl.innerHTML = "";
  targetEl.appendChild(tpl.content.cloneNode(true));
}

// ====== ROUTER ======
function navigate(route) {
  const config = ROUTES[route];
  if (!config) {
    console.warn("Unknown route:", route);
    return;
  }

  loadTemplate(screenMenu, config.menu);
  loadTemplate(screenContent, config.content);

  // Special case: Home attract mode
  if (route === "home") {
    initHomeAttract();
  }
}

// ====== HOME ATTRACT MODE ======
function initHomeAttract() {
  const attract = document.getElementById("homeAttract");
  const active = document.getElementById("homeActive");
  const pressStart = document.getElementById("pressStart");

  if (!pressStart || !attract || !active) return;

  function start() {
    attract.hidden = true;
    active.hidden = false;
  }

  pressStart.addEventListener("click", start);
  pressStart.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      start();
    }
  });
}

// ====== NAV HANDLERS ======
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-route]");
  if (!btn) return;

  e.preventDefault();
  const route = btn.getAttribute("data-route");
  navigate(route);
});

// ====== INITIAL LOAD ======
navigate("home");

// ====== SETTINGS MODAL (SELECT) ======
const settingsModal = document.getElementById("settingsModal");
const openSettings = document.getElementById("openSettings");
const closeSettings = document.getElementById("closeSettings");

function openModal() {
  if (!settingsModal) return;
  settingsModal.hidden = false;
}

function closeModal() {
  if (!settingsModal) return;
  settingsModal.hidden = true;
}

if (openSettings) openSettings.addEventListener("click", openModal);
if (closeSettings) closeSettings.addEventListener("click", closeModal);

// click outside panel closes
if (settingsModal) {
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeModal();
  });
}

// ESC closes
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && settingsModal && !settingsModal.hidden) closeModal();
});
