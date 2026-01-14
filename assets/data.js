window.OU_DATA = {
  supportUrl: "https://buymeacoffee.com/niksales73l",
  premium: {
    // Where the Premium button should send people.
    // Tip: replace with your BuyMeACoffee *product* link when you create it.
    productUrl: "https://buymeacoffee.com/niksales73l/e/498764",
    // One global passphrase (simple launch model). Change anytime.
    // Note: this is light protection (works on GitHub Pages without a backend).
    passphrases: ["ODDLY-USEFUL-2026","ODDLY-USEFUL","Nikitos","Family-2026","Wealth-2026","Prosperity-2026"]
  },
  aboutText: [
    "I build small, thoughtful software projects that are meant to be used — not optimized or exploited.",
    "My work focuses on calm design, privacy-first logic, and tools that reduce friction rather than add pressure.",
    "If something I’ve built is useful to you, supporting the project helps me keep these tools independent, ad-free, and evolving at a human pace."
  ].join("\n\n"),
  projects: [
    {
      id: "moodkeeper",
      title: "Moodkeeper",
      tagline: "Calm, private daily check-ins and reflection.",
      desc: "Nothing leaves your device. No accounts. No ads. Built for noticing patterns — without pressure, judgment, or optimization.",
      url: "https://zhelair.github.io/Moodkeeper/"
    },
    {
      id: "counter1000",
      title: "1000 Counter",
      tagline: "Score tracker for the card game “1000”.",
      desc: "Fast scoring, history, and fewer arguments at the table. Built for phone use first.",
      url: "#"
    },
    {
      id: "cookonce",
      title: "Cook Once, Live Free",
      tagline: "Batch cooking planner (simple & practical).",
      desc: "Plan a few sessions, eat well for days. Grocery-friendly, budget-aware, and not preachy.",
      url: "#"
    },
    {
      id: "holidayharmony",
      title: "Holiday Harmony",
      tagline: "Family mood + memory vault for gatherings.",
      desc: "A gentle way to keep holidays calmer: quick check-ins, shared notes, no drama graphs.",
      url: "#"
    }
  ],
  posts: [
    {
      id: "why-moodkeeper-exists",
      title: "Why Moodkeeper exists",
      date: "2026-01-09",
      body: "Moodkeeper is a calm, private app for daily check-ins and reflection.\n\nNothing leaves your device. No accounts. No ads.\n\nIt’s built for noticing patterns — without pressure, judgment, or optimization."
    },
    {
      id: "golden-way",
      title: "The Golden Way: build slowly, ship clean",
      date: "2026-01-10",
      body: "Golden way:\n- lock decisions before coding\n- change one thing at a time\n- keep a “golden version” that always works\n- only execute when you explicitly say DEPLOY"
    },
    {
      id: "ai-hygiene",
      title: "AI hygiene that saves your sanity",
      date: "2026-01-10",
      body: "One chat = one job.\nWhen the task changes, start a new chat.\n\nAlso: don’t paste giant code blocks unless it’s necessary. Ask for a zip / patch instead."
    },
    {
      id: "post_byo_key",
      title: "BYO‑Key explained (without the scary parts)",
      date: "2026-01-10",
      body: [
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
      ].join("\n")
    },
    {
      id: "post_prompt_check",
      title: "Prompt Check v1: your calm referee",
      date: "2026-01-10",
      body: [
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
      ].join("\n")
    }
  ],
  translations: {
  "ru": {
    "ui": {
      "nav_home": "Главная",
      "nav_projects": "Проекты",
      "nav_posts": "Заметки",
      "nav_aiguide": "AI-гид",
      "nav_about": "О проекте",
      "menu": "МЕНЮ",
      "press_start": "НАЖМИТЕ START",
      "launch": "Открыть",
      "another": "Ещё",
      "select_project": "Выберите проект",
      "pick_left": "Выберите в списке слева.",
      "select_post": "Выберите заметку",
      "drafts_allowed": "Черновики приветствуются",
      "support_optional": "Поддержка — по желанию",
      "theme": "Тема",
      "themes_hint": "Темы меняют только внешний вид (цвет и контраст). Макет остаётся тем же.",
      "ai_byok": "AI (ваш ключ)",
      "byok_hint": "Ключ хранится только в вашем браузере (localStorage). Мы его не получаем и нигде не сохраняем. Вы можете удалить ключ, очистив данные сайта.",
      "provider": "Провайдер",
      "access": "Доступ",
      "api_key": "API‑ключ",
      "paste_key": "Вставьте ключ…",
      "test_key": "Проверить ключ",
      "clear_key": "Очистить",
      "house_note": "Ключ "
    },
    "aboutText": [
        "Я создаю небольшие и продуманные программные проекты, предназначенные для использования — а не для оптимизации или эксплуатации.",
        "Моя работа сосредоточена на спокойном дизайне, приватности и инструментах, которые уменьшают трение, а не добавляют давление.",
        "Если что-то из этого оказалось для вас полезным, поддержка проекта помогает сохранять эти инструменты независимыми, без рекламы и с человеческим темпом развития."
      ].join("\n\n"),
    "projects": [
      {
        "id": "moodkeeper",
        "title": "Moodkeeper",
        "tagline": "Спокойные и приватные ежедневные заметки и наблюдения.",
        "desc": "Ничего не покидает ваше устройство. Без аккаунтов. Без рекламы. Создано, чтобы замечать закономерности — без давления, оценок и оптимизации.",
        "url": "https://zhelair.github.io/Moodkeeper/"
      },
      {
        "id": "counter1000",
        "title": "1000 Counter",
        "tagline": "Счётчик очков для карточной игры «1000».",
        "desc": "Быстрый подсчёт очков, история партий и меньше споров за столом. В первую очередь — для телефона.",
        "url": "#"
      },
      {
        "id": "cookonce",
        "title": "Cook Once, Live Free",
        "tagline": "Простой планировщик пакетной готовки.",
        "desc": "Запланируйте несколько сессий — и ешьте спокойно несколько дней. Удобно для магазинов, бюджета и реальной жизни. Без нравоучений.",
        "url": "#"
      },
      {
        "id": "holidayharmony",
        "title": "Holiday Harmony",
        "tagline": "Семейное настроение и «сейф памяти» для встреч.",
        "desc": "Мягкий способ сделать праздники спокойнее: короткие отметки настроения, общие заметки — без графиков драмы.",
        "url": "#"
      }
    ],
    "posts": [
      {
        "id": "why-moodkeeper-exists",
        "title": "Зачем существует Moodkeeper",
        "date": "2026-01-09",
        "body": "Moodkeeper — это спокойное и приватное приложение для ежедневных заметок и наблюдений.\n\nНичего не покидает ваше устройство. Без аккаунтов. Без рекламы.\n\nОно создано, чтобы замечать закономерности — без давления, оценок и оптимизации."
      },
      {
        "id": "golden-way",
        "title": "Золотой путь: работать медленно, выпускать аккуратно",
        "date": "2026-01-10",
        "body": "Золотой путь:\n- фиксируйте решения до начала кода\n- меняйте по одной вещи за раз\n- держите «золотую версию», которая всегда работает\n- выполняйте изменения только после явного слова DEPLOY"
      },
      {
        "id": "ai-hygiene",
        "title": "AI-гигиена, которая бережёт ваше спокойствие",
        "date": "2026-01-10",
        "body": "Один чат — одна задача.\nКогда задача меняется, начинайте новый чат.\n\nИ ещё: не вставляйте огромные блоки кода без необходимости. Лучше попросить архив или патч."
      },
      {
        "id": "post_byo_key",
        "title": "BYO‑Key: простое объяснение без страшных слов",
        "date": "2026-01-10",
        "body": "BYO‑Key = Bring Your Own API Key. Вы вставляете свой ключ в настройках, и приложение может обращаться к AI прямо из вашего браузера.\n\nЭто НЕ означает:\n• контроль вашего интерфейса ChatGPT\n• внедрение подсказок в ваш аккаунт\n• слежку\n\nЭто означает:\n• запросы отправляются от вашего имени\n• используется ваш ключ\n• ключ хранится локально в браузере — не на сервере\n\nЭто позволяет:\n• проверку промптов\n• переписывание промптов\n• управляемую генерацию\n• разбор того, что в промпте не так\n\nСовет по безопасности: относитесь к ключу как к зубной щётке. Не делитесь им."
      },
      {
        "id": "post_prompt_check",
        "title": "Prompt Check v1: спокойный арбитр",
        "date": "2026-01-10",
        "body": "Prompt Check — это небольшой инструмент, который показывает:\n• что в промпте неясно\n• чего не хватает\n• какие ограничения стоит добавить\n• переписанный «чистый промпт» для копирования\n\nЧего он не делает:\n• не угадывает скрытый контекст\n• не притворяется, что видел ваши файлы\n• не решает 12 разных задач сразу\n\nРекомендуемый процесс:\n1) Вставьте промпт\n2) Добавьте цель и ограничения\n3) Используйте переписанный вариант в AI-чате\n4) Итерации — небольшими шагами"
      }
    ]
  }
},
  house: {
    endpoint: "https://oddly-useful-house-proxy.nik-sales-737.workers.dev",
    dailyLimit: 15,
    maxWords: 2000,
    timezone: "Europe/Sofia"
  }
};