window.OU_DATA = {
  supportUrl: "https://buymeacoffee.com/niksales73l",
  premium: {
    // Where the Premium button should send people.
    // Tip: replace with your BuyMeACoffee *product* link when you create it.
    productUrl: "https://buymeacoffee.com/niksales73l",
    // One global passphrase (simple launch model). Change anytime.
    // Note: this is light protection (works on GitHub Pages without a backend).
    passphrases: ["ODDLY-USEFUL-2026"],
  },
  aboutText: [
    "I build small, thoughtful software projects that are meant to be used — not optimized or exploited.",
    "My work focuses on calm design, privacy-first logic, and tools that reduce friction rather than add pressure.",
    "If something I’ve built is useful to you, supporting the project helps me keep these tools independent, ad-free, and evolving at a human pace."
  ].join("\n\n"),
  projects: [
    { id:"moodkeeper", title:"Moodkeeper", tagline:"Calm, private daily check-ins and reflection.", desc:"Nothing leaves your device. No accounts. No ads. Built for noticing patterns — without pressure, judgment, or optimization.", url:"https://zhelair.github.io/Moodkeeper/" },
    { id:"counter1000", title:"1000 Counter", tagline:"Score tracker for the card game “1000”.", desc:"Fast scoring, history, and fewer arguments at the table. Built for phone use first.", url:"#"},
    { id:"cookonce", title:"Cook Once, Live Free", tagline:"Batch cooking planner (simple & practical).", desc:"Plan a few sessions, eat well for days. Grocery-friendly, budget-aware, and not preachy.", url:"#"},
    { id:"holidayharmony", title:"Holiday Harmony", tagline:"Family mood + memory vault for gatherings.", desc:"A gentle way to keep holidays calmer: quick check-ins, shared notes, no drama graphs.", url:"#"}
  ],
  posts: [
    { id:"why-moodkeeper-exists", title:"Why Moodkeeper exists", date:"2026-01-09", body:"Moodkeeper is a calm, private app for daily check-ins and reflection.\n\nNothing leaves your device. No accounts. No ads.\n\nIt’s built for noticing patterns — without pressure, judgment, or optimization."},
    { id:"golden-way", title:"The Golden Way: build slowly, ship clean", date:"2026-01-10", body:"Golden way:\n- lock decisions before coding\n- change one thing at a time\n- keep a “golden version” that always works\n- only execute when you explicitly say DEPLOY"},
    { id:"ai-hygiene", title:"AI hygiene that saves your sanity", date:"2026-01-10", body:"One chat = one job.\nWhen the task changes, start a new chat.\n\nAlso: don’t paste giant code blocks unless it’s necessary. Ask for a zip / patch instead."}
  ,
    { id:"post_byo_key", date:"2026-01-10", title:"BYO‑Key explained (without the scary parts)",
      body:[
        "BYO‑Key = Bring Your Own API Key. You paste *your* key into Settings, and the app can call an AI model from your browser.",
        "",
        "It does **NOT**:",
        "• Control the user’s ChatGPT UI",
        "• Inject prompts into their account",
        "• Spy on anything",
        "",
        "It **DOES**:",
        "• Let this app send requests on their behalf (from their browser only)",
        "• Use their key",
        "• Store it locally (browser storage) — never on our server",
        "",
        "This enables:",
        "• Prompt checking",
        "• Prompt rewriting",
        "• Guided generation",
        "• “Explain what’s wrong with this prompt”",
        "",
        "Safety tip: treat your key like a toothbrush. Don’t share it."
      ],
      tags:["api","privacy","byo-key"]
    },
    { id:"post_prompt_check", date:"2026-01-10", title:"Prompt Check v1: your calm referee",
      body:[
        "Prompt Check is a small tool that looks at your prompt and returns:",
        "• what’s unclear",
        "• what’s missing",
        "• what constraints to add (format, length, tone, deadline)",
        "• a rewritten “clean prompt” you can copy",
        "",
        "What it refuses to do:",
        "• guess hidden context you didn’t provide",
        "• pretend it saw your files/screenshots",
        "• solve 12 unrelated tasks at once",
        "",
        "Best workflow:",
        "1) Paste prompt",
        "2) Add goal + constraints",
        "3) Use rewritten prompt in your AI chat",
        "4) Iterate (small changes, one goal)"
      ],
      tags:["prompts","workflow","prompt-check"]
	    }],
	  house: {
    endpoint: "",
    dailyLimit: 15,
    maxWords: 2000,
	    timezone: "Europe/Sofia"
	  }
};
