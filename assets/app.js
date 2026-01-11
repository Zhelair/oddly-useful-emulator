(function(){
  const data = window.OU_DATA || {};
  const screenMenu = document.getElementById("screenMenu");
  const screenContent = document.getElementById("screenContent");
  const supportUrl = data.supportUrl || "#";
  const premium = data.premium || {};
  const premiumProductUrl = premium.productUrl || supportUrl;
  const premiumPassphrases = Array.isArray(premium.passphrases) ? premium.passphrases : [];
  const houseCfg = data.house || {};
  const HOUSE_ENDPOINT = (houseCfg.endpoint||"").trim();
  const HOUSE_DAILY_LIMIT = Number(houseCfg.dailyLimit||15);
  const HOUSE_MAX_WORDS = Number(houseCfg.maxWords||2000);
  const HOUSE_TZ = (houseCfg.timezone||"Europe/Sofia").trim();

  const LS = {
    premiumUnlocked: "ou_premium_unlocked",
    premiumPass: "ou_premium_pass",
    aiAccess: "ou_ai_access",
    houseUsage: "ou_house_usage",
    tipPcOpened: "ou_tip_pc_opened",
    tipPcFocus: "ou_tip_pc_focus",
    tipPcRun: "ou_tip_pc_run",
	  tipPcGolden: "ou_tip_pc_golden",
	  aiguideSection: "ou_aiguide_section"
};

  // House-key limits (client-side display; server-side enforcement is done by the Worker)
  const sofiaDateKey = ()=>{
    try{
      return new Intl.DateTimeFormat("en-CA",{timeZone: HOUSE_TZ, year:"numeric", month:"2-digit", day:"2-digit"}).format(new Date());
    }catch(e){
      return new Date().toISOString().slice(0,10);
    }
  };
  const getHouseUsage = ()=>{
    const dk = sofiaDateKey();
    let obj = null;
    try{ obj = JSON.parse(localStorage.getItem(LS.houseUsage)||"null"); }catch(e){ obj=null; }
    if(!obj || obj.date!==dk){ obj = {date: dk, count: 0}; localStorage.setItem(LS.houseUsage, JSON.stringify(obj)); }
    return obj;
  };
  const incHouseUsage = ()=>{
    const u = getHouseUsage();
    u.count = (u.count||0) + 1;
    localStorage.setItem(LS.houseUsage, JSON.stringify(u));
    return u;
  };
  const wordCount = (s)=> (String(s||"").trim().match(/\S+/g)||[]).length;

  // HOUSE helper (calls your Cloudflare Worker)
  const HOUSE = {
    promptCheck: async ({ endpoint, passphrase, model, userPrompt, system, dailyLimit }) => {
      const base = String(endpoint || "").replace(/\/+$/, ""); // remove trailing /
      const url = base + "/prompt-check";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Keep header (harder to accidentally log in some tooling), but also include in body for clarity.
          "X-Passphrase": String(passphrase || "")
        },
        body: JSON.stringify({
          access: "included",
          dailyLimit: Number(dailyLimit || 15),
          model: String(model || "deepseek-chat"),
          prompt: String(userPrompt || ""),
          passphrase: String(passphrase || ""),
          system: String(system || "")
        })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `House error ${res.status}`);
      if (!json.text) throw new Error("Empty response from House");
      return String(json.text);
    }
  };

  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("footerSupport").href = supportUrl;

  const ROUTES = {
    home:{menu:"tpl-menu-home", content:"tpl-content-home"},
    projects:{menu:"tpl-menu-projects", content:"tpl-content-projects"},
    posts:{menu:"tpl-menu-posts", content:"tpl-content-posts"},
    aiguide:{menu:"tpl-menu-aiguide", content:"tpl-content-aiguide-overview"},
    about:{menu:"tpl-menu-about", content:"tpl-content-about"},
  };


  const isMobile = ()=> window.matchMedia && window.matchMedia("(max-width: 720px)").matches;

  const AIGUIDE_SECTIONS = [
    { key:"start",   title:"Start Here",           tpl:"tpl-aiguide-start" },
    { key:"hygiene", title:"Hygiene",              tpl:"tpl-aiguide-hygiene" },
    { key:"golden",  title:"Golden Rules",         tpl:"tpl-aiguide-golden" },
    { key:"south",   title:"When it goes South",   tpl:"tpl-aiguide-south" },
    { key:"patterns",title:"Patterns",             tpl:"tpl-aiguide-patterns" },
    { key:"playbooks",title:"Playbooks",           tpl:"tpl-aiguide-playbooks" },
    { key:"examples",title:"Examples",             tpl:"tpl-aiguide-examples" }
  ];

  function getAIGuideSection(){
    const k = (localStorage.getItem(LS.aiguideSection) || "start").trim();
    return AIGUIDE_SECTIONS.some(s=>s.key===k) ? k : "start";
  }

  function setAIGuideActive(sectionKey){
    // highlight left menu buttons (desktop)
    document.querySelectorAll("[data-guide]").forEach(b=>{
      const k = b.dataset.guide;
      b.classList.toggle("is-active", k === sectionKey);
    });
  }

  function renderAIGuideMobileNav(activeKey){
    const host = document.getElementById("aiguideMobile");
    if(!host) return;
    if(!isMobile()){ host.innerHTML=""; return; }
    host.innerHTML = `
      <div class="aiguideTabs">
        <button class="btn btn--primary" data-guide="buddy" type="button">Buddy</button>
        ${AIGUIDE_SECTIONS.map(s=>`<button class="btn ${s.key===activeKey?'is-active':''}" data-guide="${s.key}" type="button">${escapeHtml(s.title)}</button>`).join("")}
      </div>
    `;
  }

  function openAIGuideSection(sectionKey){
    const main = document.getElementById("aiguide-main");
    if(!main) return;
    const sec = AIGUIDE_SECTIONS.find(s=>s.key===sectionKey) || AIGUIDE_SECTIONS[0];
    load(main, sec.tpl);
    localStorage.setItem(LS.aiguideSection, sec.key);
    setAIGuideActive(sec.key);
    renderAIGuideMobileNav(sec.key);
  }

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
    const sec = getAIGuideSection();
    openAIGuideSection(sec);
  }
  function openBuddy(){
    load(screenContent,"tpl-content-aiguide-buddy");
    if(isPremiumUnlocked()) initBuddy("a");
    else showPremiumGate();
  }

  function isPremiumUnlocked(){
    return localStorage.getItem(LS.premiumUnlocked) === "1";
  }

  function showPremiumGate(){
    const main=document.getElementById("buddyMain");
    load(main, "tpl-buddy-locked");
    const buy=document.getElementById("premiumBuy");
    const have=document.getElementById("premiumHave");
    const wrap=document.getElementById("premiumUnlock");
    const pass=document.getElementById("premiumPass");
    const btn=document.getElementById("premiumUnlockBtn");
    const status=document.getElementById("premiumStatus");
    if(buy) buy.href = premiumProductUrl;
    if(have) have.onclick = ()=>{ wrap.hidden=false; pass?.focus(); };
    if(btn) btn.onclick = ()=>{
      const v=(pass?.value||"").trim();
      if(!v){ status.textContent="Paste a passphrase to unlock."; return; }
      const ok = premiumPassphrases.some(p=>String(p).trim()===v);
      if(!ok){ status.textContent="That passphrase doesn’t look right. Try again."; return; }
      localStorage.setItem(LS.premiumUnlocked,"1");
      localStorage.setItem(LS.premiumPass, v);
      status.textContent="✅ Premium enabled for this browser.";
      setTimeout(()=>initBuddy("a"), 450);
    };
  }
  function initBuddy(key){
    const main=document.getElementById("buddyMain");
    const set=(k)=>{
      document.querySelectorAll(".buddy__mod").forEach(b=>b.classList.toggle("is-active", b.dataset.module===k));
      if(k==="a") load(main,"tpl-buddy-module-a");
      if(k==="b") load(main,"tpl-buddy-module-b");
      if(k==="c") load(main,"tpl-buddy-module-c");
      if(k==="d") load(main,"tpl-buddy-module-d");
      if(k==="a") initModuleA();
      if(k==="b") initModuleB();
      if(k==="c") initModuleC();
      if(k==="d") initModuleD();
    };
    document.querySelectorAll(".buddy__mod").forEach(b=>b.onclick=()=>set(b.dataset.module));
    set(key||"a");
  }

  // PROMPT CHECK (DeepSeek)
  const PROMPT_CHECK_SYSTEM = [
    "You are an expert AI prompt reviewer and teacher.",
    "",
    "Your task is NOT to execute the user’s request.",
    "Your task is to analyze the quality of the prompt itself.",
    "",
    "Behave like a calm, precise mentor.",
    "Never judge the user.",
    "Never mock the prompt.",
    "Never add unnecessary verbosity.",
    "",
    "Follow this process exactly:",
    "1) Diagnose how an AI model would likely interpret the prompt.",
    "   - Identify ambiguity, missing context, conflicting instructions, or hidden assumptions.",
    "   - Be factual and concise.",
    "2) Identify what information is missing or under-specified.",
    "   - Examples: goal, audience, format, constraints, success criteria.",
    "   - Do not invent requirements. Only suggest what would improve clarity.",
    "3) Suggest concrete improvements.",
    "   - Use actionable language (“Clarify X”, “Specify Y”).",
    "   - Avoid abstract theory.",
    "4) Produce a revised “Golden Prompt”.",
    "   - Preserve the user’s original intent.",
    "   - Remove ambiguity.",
    "   - Separate planning from execution if relevant.",
    "   - Do NOT add new goals or features.",
    "",
    "Rules:",
    "- Do not execute the task described in the prompt.",
    "- Do not provide final answers to the task itself.",
    "- Do not lecture.",
    "- Do not over-explain.",
    "- If the prompt is already strong, explicitly say so.",
    "",
    "Tone:",
    "- Calm",
    "- Neutral",
    "- Teacher-like",
    "- Respectful",
    "",
    "Output structure must be exactly:",
    "Diagnosis:",
    "- bullet points",
    "",
    "What’s missing:",
    "- bullet points (or “Nothing critical missing”)",
    "",
    "Suggested improvements:",
    "- bullet points",
    "",
    "Golden Prompt:",
    "- a single, clean prompt block",
  ].join("\n");

  function initModuleD(){
    if(!isPremiumUnlocked()) { showPremiumGate(); return; }

    const input=document.getElementById("pcInput");
    const run=document.getElementById("pcRun");
    const out=document.getElementById("pcOut");
    const err=document.getElementById("pcError");
    const status=document.getElementById("pcStatus");
    const accessSel=document.getElementById("pcAccess");
    const usageEl=document.getElementById("pcUsage");
    const modelSel=document.getElementById("pcModel");

    // Access mode (BYO key vs House key)
    const syncAccessUI = ()=>{
      const mode = localStorage.getItem(LS.aiAccess) || "byo";
      if(accessSel) accessSel.value = mode;
      // keep About → Settings dropdown in sync if it exists
      const aboutSel = document.getElementById("aiAccess");
      if(aboutSel) aboutSel.value = mode;
      return mode;
    };
    const updateUsageUI = ()=>{
      const mode = syncAccessUI();
      if(!usageEl) return null;
      if(mode!=="house"){ usageEl.textContent=""; return null; }
      const u = getHouseUsage();
      usageEl.textContent = `Prompt Checks: ${u.count||0} / ${HOUSE_DAILY_LIMIT} today • Resets 00:00 Sofia`;
      return Math.max(0, HOUSE_DAILY_LIMIT-(u.count||0));
    };
    updateUsageUI();
    if(accessSel){
      accessSel.onchange = ()=>{ localStorage.setItem(LS.aiAccess, accessSel.value); updateUsageUI(); };
    }


    const oneTime = (key, fn) => {
      if(localStorage.getItem(key)==="1") return;
      localStorage.setItem(key,"1");
      fn();
    };
    const flashStatus = (txt, ms=2600) => {
      if(!status) return;
      status.textContent = txt || "";
      status.classList.add("is-on");
      setTimeout(()=>{ status.classList.remove("is-on"); status.textContent=""; }, ms);
    };


    oneTime(LS.tipPcOpened, ()=>flashStatus("Prompt Check reviews your prompt — it does not run the task.", 3200));
    if(input){
      input.addEventListener("focus", ()=>{
        if(localStorage.getItem(LS.tipPcFocus)==="1") return;
        localStorage.setItem(LS.tipPcFocus,"1");
        flashStatus("Messy prompts are fine. This tool exists to clean them up.", 2800);
      }, { once:false });
    }
    if(run){
      run.addEventListener("pointerenter", ()=>{
        if(localStorage.getItem(LS.tipPcRun)==="1") return;
        localStorage.setItem(LS.tipPcRun,"1");
        flashStatus("This analyzes clarity, not results.", 2400);
      }, { once:true });
    }

    run.onclick = async ()=>{
      err.textContent="";
      const prompt=(input?.value||"").trim();
      if(!prompt){ err.textContent="There’s nothing to review yet. Paste a prompt to begin."; return; }
      const mode = (localStorage.getItem(LS.aiAccess)||"byo");
      const wc = wordCount(prompt);
      if(wc>HOUSE_MAX_WORDS){ err.textContent=`This prompt is too long (${wc} words). Max is ${HOUSE_MAX_WORDS} words.`; return; }
      let apiKey = (localStorage.getItem("ou_ai_key")||"").trim();
      if(mode==="byo"){
        if(!apiKey){ err.textContent="Prompt Check requires your API key. You can add it in About → Settings."; return; }
      }else{
        const u=getHouseUsage();
        if((u.count||0) >= HOUSE_DAILY_LIMIT){ err.textContent="Daily limit reached. This resets at 00:00 Sofia."; flashStatus("Daily limit reached — come back tomorrow.", 2600); updateUsageUI(); return; }
        if(!HOUSE_ENDPOINT){ err.textContent="House key mode needs a backend proxy. Set house.endpoint in assets/data.js."; return; }
        const pass=(localStorage.getItem(LS.premiumPass)||"").trim();
        if(!pass){ err.textContent="Missing passphrase in this browser. Re-enter Premium passphrase."; return; }
      }
      out.innerHTML = '<div class="pc__empty">Reviewing your prompt…<div class="pc__sub">Thinking like an AI — not executing like one.</div></div>';
      flashStatus("Reviewing your prompt…", 1800);
      try{
        const model = (modelSel?.value||"deepseek-chat").trim();
        let text="";
        if((localStorage.getItem(LS.aiAccess)||"byo")==="byo"){
          text = await deepSeekPromptCheck({ apiKey, model, userPrompt: prompt });
        }else{
          const pass = (localStorage.getItem(LS.premiumPass)||"").trim();
          text = await HOUSE.promptCheck({ endpoint: HOUSE_ENDPOINT, passphrase: pass, model, userPrompt: prompt, system: PROMPT_CHECK_SYSTEM, dailyLimit: HOUSE_DAILY_LIMIT });
          incHouseUsage();
          updateUsageUI();
        }
        const parsed = parsePromptCheck(text);
        renderPromptCheck(out, parsed, text);
        flashStatus("Prompt reviewed.", 2200);
      }catch(ex){
        out.innerHTML = '<div class="pc__empty">Couldn’t reach the model just now.<div class="pc__sub">Try again in a moment.</div></div>';
        err.textContent = ex && ex.message ? ex.message : "Couldn’t reach the model just now. Try again in a moment.";
      }
    };
  }

  async function deepSeekPromptCheck({ apiKey, model, userPrompt }){
    const url = "https://api.deepseek.com/chat/completions";
    const payload = {
      model: model || "deepseek-chat",
      messages: [
        { role: "system", content: PROMPT_CHECK_SYSTEM },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 900
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    if(!res.ok){
      const t = await res.text().catch(()=>"");
      throw new Error(`DeepSeek error ${res.status}: ${t}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content;
    if(!content) throw new Error("Empty response");
    return String(content);
  }

  function parsePromptCheck(text){
    const get = (name) => {
      const re = new RegExp(`(?:${name}):\\s*([\\s\\S]*?)(?=\\n\\s*(Diagnosis|What’s missing|What's missing|Suggested improvements|Golden Prompt):|$)`, "i");
      const m = String(text).match(re);
      return (m && m[1]) ? m[1].trim() : "";
    };
    const diagnosis = get("Diagnosis");
    const missing = get("What’s missing|What's missing");
    const improvements = get("Suggested improvements");
    const golden = get("Golden Prompt");
    return { diagnosis, missing, improvements, golden };
  }

  function toBullets(block){
    const lines = String(block||"").split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const items = lines.map(l=>l.replace(/^[-•\*]\s*/, "")).filter(Boolean);
    return items;
  }

  function renderPromptCheck(container, parsed, raw){
    const diag = toBullets(parsed.diagnosis);
    const miss = toBullets(parsed.missing);
    const impr = toBullets(parsed.improvements);
    const golden = (parsed.golden||"").trim();

    // Fallback: if parsing fails, show raw.
    const ok = (diag.length || miss.length || impr.length || golden);
    if(!ok){
      container.innerHTML = `<div class="pc__section"><div class="pc__h">Result</div><pre class="pc__pre">${escapeHtml(raw)}</pre></div>`;
      return;
    }

    const mkList = (items)=> items.length ? `<ul class="pc__list">${items.map(i=>`<li>${escapeHtml(i)}</li>`).join("")}</ul>` : `<div class="pc__muted">Nothing critical missing.</div>`;
    container.innerHTML = `
      <section class="pc__section">
        <div class="pc__h">Diagnosis</div>
        <div class="pc__sub">How an AI would likely interpret this prompt</div>
        ${mkList(diag)}
      </section>
      <section class="pc__section">
        <div class="pc__h">What’s missing</div>
        ${miss.length ? mkList(miss) : `<div class="pc__muted">Nothing critical missing.</div>`}
      </section>
      <section class="pc__section">
        <div class="pc__h">Suggested improvements</div>
        ${mkList(impr)}
      </section>
      <section class="pc__section pc__section--gold">
        <div class="pc__h">🟡 Golden Prompt</div>
        <div class="pc__sub">Use as-is, or adapt it to your style.</div>
        <pre class="pc__pre" id="pcGolden">${escapeHtml(golden || "(No golden prompt returned)")}</pre>
        <div class="pc__actions">
          <button class="btn btn--primary" id="pcCopyGolden" type="button">Copy</button>
        </div>
      </section>
    `;

    const copyBtn = document.getElementById("pcCopyGolden");
    copyBtn?.addEventListener("click", async()=>{
      const txt = document.getElementById("pcGolden")?.textContent || "";
      await navigator.clipboard.writeText(txt);
      copyBtn.textContent = "Copied.";
      setTimeout(()=>copyBtn.textContent="Copy", 1100);
      if(localStorage.getItem(LS.tipPcGolden)!=="1"){
        localStorage.setItem(LS.tipPcGolden,"1");
        const st=document.getElementById("pcStatus");
        if(st){ st.textContent="Use this as-is, or adapt it to your style."; setTimeout(()=>st.textContent="", 2400); }
      }
    });
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
    const access=document.getElementById("aiAccess");
    const key=document.getElementById("apiKey");
    const status=document.getElementById("settingsStatus");
    provider.value = localStorage.getItem("ou_ai_provider") || "openai";
    access.value = localStorage.getItem(LS.aiAccess) || "byo";
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
    if(g){
      e.preventDefault();
      const k = g.dataset.guide;
      if(k==="buddy") { openBuddy(); return; }
      if(k==="overview") { navigate("aiguide"); return; }
      if(AIGUIDE_SECTIONS.some(s=>s.key===k)) { openAIGuideSection(k); return; }
      return;
    }
  });

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m]));
  }

  navigate("home");
})();