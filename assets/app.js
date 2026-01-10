(function(){
  const data = window.OU_DATA || {};
  const screenMenu = document.getElementById("screenMenu");
  const screenContent = document.getElementById("screenContent");
  const supportUrl = data.supportUrl || "#";

  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("footerSupport").href = supportUrl;

  const ROUTES = {
    home:{menu:"tpl-menu-home", content:"tpl-content-home"},
    projects:{menu:"tpl-menu-projects", content:"tpl-content-projects"},
    posts:{menu:"tpl-menu-posts", content:"tpl-content-posts"},
    aiguide:{menu:"tpl-menu-aiguide", content:"tpl-content-aiguide-overview"},
    about:{menu:"tpl-menu-about", content:"tpl-content-about"},
  };

  function load(tgt, id){
    const tpl = document.getElementById(id);
    tgt.innerHTML = "";
    if (tpl) tgt.appendChild(tpl.content.cloneNode(true));
  }

  function navigate(route){
    const r = ROUTES[route] || ROUTES.home;
    load(screenMenu, r.menu);
    load(screenContent, r.content);

    if(route==="home") initHome();
    if(route==="projects") initProjects();
    if(route==="posts") initPosts();
    if(route==="aiguide") initAIGuide();
    if(route==="about") initAbout();
  }

  // HOME
  function initHome(){
    const attract=document.getElementById("homeAttract");
    const active=document.getElementById("homeActive");
    const press=document.getElementById("pressStart");
    if(!press) return;
    const start=()=>{ attract.hidden=true; active.hidden=false; pickFeatured(); };
    press.onclick=start;
    press.onkeydown=(e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); start(); } };
  }
  function pickFeatured(){
    const list=(data.projects||[]).filter(p=>p&&p.title);
    if(!list.length) return;
    const pick=()=>list[Math.floor(Math.random()*list.length)];
    renderFeatured(pick());
    const next=document.getElementById("featuredNext");
    if(next) next.onclick=()=>renderFeatured(pick());
  }
  function renderFeatured(p){
    document.getElementById("featuredTitle").textContent = p.title;
    document.getElementById("featuredDesc").textContent = p.tagline || p.desc || "";
    document.getElementById("featuredLaunch").href = p.url || "#";
  }

  // PROJECTS
  function initProjects(){
    const listEl=document.getElementById("projectsList");
    const detail=document.getElementById("projectDetail");
    if(!listEl||!detail) return;
    listEl.innerHTML="";
    (data.projects||[]).forEach((p,i)=>{
      const b=document.createElement("button");
      b.type="button"; b.className="menu__item"; b.textContent=p.title;
      b.onclick=()=>renderProject(p, detail, b, listEl);
      listEl.appendChild(b);
      if(i===0) setTimeout(()=>b.click(),0);
    });
  }
  function renderProject(p, detail, btn, listEl){
    listEl.querySelectorAll(".menu__item").forEach(x=>x.classList.remove("is-active"));
    btn.classList.add("is-active");
    detail.innerHTML = '<div class="card__body"></div>';
    const body=detail.querySelector(".card__body");
    body.innerHTML = `
      <h2 class="card__title">${escapeHtml(p.title||"")}</h2>
      <p class="card__desc">${escapeHtml(p.desc||p.tagline||"")}</p>
      <div class="card__actions">
        <a class="btn btn--primary" href="${p.url||"#"}" target="_blank" rel="noopener">Launch</a>
      </div>`;
  }

  // POSTS
  function initPosts(){
    const listEl=document.getElementById("postsList");
    const detail=document.getElementById("postDetail");
    if(!listEl||!detail) return;
    listEl.innerHTML="";
    (data.posts||[]).forEach((p,i)=>{
      const b=document.createElement("button");
      b.type="button"; b.className="menu__item"; b.textContent=p.title;
      b.onclick=()=>renderPost(p, detail, b, listEl);
      listEl.appendChild(b);
      if(i===0) setTimeout(()=>b.click(),0);
    });
  }
  function renderPost(p, detail, btn, listEl){
    listEl.querySelectorAll(".menu__item").forEach(x=>x.classList.remove("is-active"));
    btn.classList.add("is-active");
    detail.innerHTML = '<div class="card__body"></div>';
    const body=detail.querySelector(".card__body");
    body.innerHTML = `
      <h2 class="card__title">${escapeHtml(p.title||"")}</h2>
      <p class="card__desc">${escapeHtml(p.date||"")}</p>
      <p class="card__desc">${escapeHtml(p.body||"")}</p>`;
  }

  // AI GUIDE
  function initAIGuide(){
    // overview buttons handled by global click
  }
  function openBuddy(){
    load(screenContent,"tpl-content-aiguide-buddy");
    initBuddy("a");
  }
  function initBuddy(key){
    const main=document.getElementById("buddyMain");
    const set=(k)=>{
      document.querySelectorAll(".buddy__mod").forEach(b=>b.classList.toggle("is-active", b.dataset.module===k));
      if(k==="a") load(main,"tpl-buddy-module-a");
      if(k==="b") load(main,"tpl-buddy-module-b");
      if(k==="c") load(main,"tpl-buddy-module-c");
      if(k==="a") initModuleA();
      if(k==="b") initModuleB();
      if(k==="c") initModuleC();
    };
    document.querySelectorAll(".buddy__mod").forEach(b=>b.onclick=()=>set(b.dataset.module));
    set(key||"a");
  }

  function initModuleA(){
    const out=document.getElementById("aOutput");
    document.getElementById("aGenerate").onclick=()=>{
      const role=(document.getElementById("aRole").value||"").trim();
      const goal=(document.getElementById("aGoal").value||"").trim();
      const wants=[];
      if(document.getElementById("aWStructure").checked) wants.push("clear structure");
      if(document.getElementById("aWSteps").checked) wants.push("step-by-step");
      if(document.getElementById("aWShort").checked) wants.push("short & direct");
      if(document.getElementById("aWExamples").checked) wants.push("examples");
      if(document.getElementById("aWWarnings").checked) wants.push("warnings / missing constraints");
      const tone=document.querySelector('input[name="aTone"]:checked')?.value||"direct";
      out.value=[
        "Intro / Working Agreement Context:",
        role?`You are helping me as: ${role}.`:"You are helping me as: my AI assistant.",
        goal?`My main goal: ${goal}.`:"My main goal: work clearly and practically.",
        wants.length?`In answers, prioritize: ${wants.join(", ")}.`:"In answers, prioritize clarity and usefulness.",
        `Tone: ${tone}.`,
        "",
        "Rules:",
        "- If my request is vague, ask 1–3 clarifying questions or propose sensible assumptions.",
        "- Keep it practical. Prefer free, simple solutions.",
        "- Don’t dump huge code blocks unless I ask; otherwise give patches / files."
      ].join("\n");
    };
    document.getElementById("aCopy").onclick=async()=>navigator.clipboard.writeText(out.value||"");
    document.getElementById("aReset").onclick=()=>{
      document.getElementById("aRole").value=""; document.getElementById("aGoal").value="";
      document.querySelectorAll('#buddyMain input[type="checkbox"]').forEach(c=>c.checked=false);
      out.value="(Generated prompt will appear here)";
    };
  }

  function goldenRules(mode){
    if(mode==="soft") return "Golden Way (Soft):\n- Ask what matters most (time, simplicity, looks, budget)\n- Suggest 1–2 options\n- Tiny change first\n- Wait for DEPLOY before big code";
    if(mode==="strict") return "Golden Way (Strict):\n- Refuse final outputs if key decisions are missing\n- List what must be clarified\n- One change at a time\n- Keep a working 'golden' version\n- Only execute when I say: DEPLOY";
    return "Golden Way (Standard):\n- Lock decisions first\n- One change at a time\n- Keep a stable 'golden' version\n- No big code dumps unless asked; prefer zip/patch\n- Only execute when I say: DEPLOY";
  }
  function initModuleB(){
    const out=document.getElementById("bOutput");
    const mode=()=>document.querySelector('input[name="bMode"]:checked')?.value||"standard";
    document.getElementById("bGenerate").onclick=()=>{ out.value=goldenRules(mode()); };
    document.getElementById("bCopy").onclick=async()=>navigator.clipboard.writeText(out.value||"");
    document.getElementById("bExample").onclick=()=>{
      out.value=[goldenRules(mode()),"", "Example usage:",
      "User: Let's align on layout first (no code).",
      "AI: Great. 1) Menu placement? 2) Theme names? 3) Mobile behavior?",
      "User: Decisions locked. DEPLOY.",
      "AI: (Now provides the zip / patch.)"].join("\n");
    };
  }
  function initModuleC(){
    const EX={
      planapp:{bad:"I have an idea for an app. Can you help me build it?",
        improved:"I want to build a productivity app. Can you suggest features and a UI?",
        golden:"I want to explore an app idea.\nBefore suggesting features:\n- ask clarifying questions\n- define the core problem\n- identify what this app is NOT\nDo not suggest UI or features yet.",
        why:"Problem-first thinking stops random feature lists and gives you control."},
      promptcraft:{bad:"Write me a perfect prompt for anything.",
        improved:"Write a prompt to help me plan a small web app.",
        golden:"Help me plan a small web app.\nConstraints:\n- free tools only\n- mobile-friendly\n- one change at a time\nAsk questions first. Then propose a tiny next step. Wait for DEPLOY before big code.",
        why:"Constraints + staging prevents chaos and keeps the output usable."},
      fixidea:{bad:"This idea is broken. Fix it.",
        improved:"Here’s my idea. Please point out problems and suggest improvements.",
        golden:"I will paste my idea.\nYour job:\n1) identify the 3 biggest risks\n2) propose 2 simpler versions\n3) suggest a first experiment that costs €0\nKeep it direct. No fluff.",
        why:"You get diagnosis, options, and action — not endless theory."}
    };
    const sel=document.getElementById("cExampleSelect");
    const render=(k)=>{const e=EX[k]||EX.planapp;
      document.getElementById("cBad").textContent=e.bad;
      document.getElementById("cImproved").textContent=e.improved;
      document.getElementById("cGolden").textContent=e.golden;
      document.getElementById("cWhy").textContent=e.why;
    };
    sel.onchange=()=>render(sel.value); render(sel.value);
  }

  // ABOUT
  function initAbout(){
    document.getElementById("aboutText").textContent = data.aboutText || "";
    document.getElementById("aboutSupport").href = supportUrl;

    const saved = localStorage.getItem("ou_theme") || "retro";
    document.body.dataset.theme = saved;
    document.querySelectorAll('input[name="theme"]').forEach(r=>{
      r.checked = r.value===saved;
      r.onchange=()=>{ if(!r.checked) return; document.body.dataset.theme=r.value; localStorage.setItem("ou_theme", r.value); };
    });

    const provider=document.getElementById("aiProvider");
    const key=document.getElementById("apiKey");
    const status=document.getElementById("settingsStatus");
    provider.value = localStorage.getItem("ou_ai_provider") || "openai";
    key.value = localStorage.getItem("ou_ai_key") || "";
    provider.onchange=()=>{ localStorage.setItem("ou_ai_provider", provider.value); status.textContent=""; };
    key.oninput=()=>{ localStorage.setItem("ou_ai_key", key.value); status.textContent=""; };
    document.getElementById("clearKey").onclick=()=>{ localStorage.removeItem("ou_ai_key"); key.value=""; status.textContent="Key cleared (local only)."; };
    document.getElementById("testKey").onclick=()=>{ status.textContent = key.value.trim()? "Key saved locally. (API test will be added later.)" : "Paste a key first."; };
  }

  // global click handler
  document.addEventListener("click",(e)=>{
    const r=e.target.closest("[data-route]");
    if(r){ e.preventDefault(); navigate(r.dataset.route); return; }
    const g=e.target.closest("[data-guide]");
    if(g){ e.preventDefault(); if(g.dataset.guide==="buddy") openBuddy(); if(g.dataset.guide==="overview") navigate("aiguide"); return; }
  });

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
  }

  navigate("home");
})();