const WORKER_ENDPOINT="https://oddly-useful-house-proxy.nik-sales-737.workers.dev";
const i18n={en:{title:"Oddly Useful Emulator",ph:"Paste your prompt here…",run:"Check prompt"},
ru:{title:"Полезный Эмулятор",ph:"Вставьте ваш запрос…",run:"Проверить запрос"},
bg:{title:"Полезен Емулатор",ph:"Поставете вашия текст…",run:"Провери текста"}};
const t=document.getElementById("title"),p=document.getElementById("prompt"),b=document.getElementById("run"),o=document.getElementById("out");
const l=document.getElementById("lang"),th=document.getElementById("theme");
function apply(lang){t.textContent=i18n[lang].title;p.placeholder=i18n[lang].ph;b.textContent=i18n[lang].run}
l.onchange=()=>apply(l.value);apply("en");
th.onchange=()=>document.body.className="theme-"+th.value;
b.onclick=async()=>{o.textContent="…";try{const r=await fetch(WORKER_ENDPOINT+"/prompt-check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:p.value})});const j=await r.json();o.textContent=j.text||j.error||"No response"}catch(e){o.textContent="Error"}};
