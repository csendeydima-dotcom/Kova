"use client";

import { LanguageTabs } from "./LanguageTabs";
import { useLocale } from "./useLocale";

const COPY = {
  uk: {
    nav: "Головна навігація",
    home: "Kova — головна",
    product: "Продукт",
    security: "Безпека",
    open: "Відкрити кабінет",
    login: "Увійти",
    eyebrow: "Робочий простір для фрилансерів",
    titleOne: "Менше рутини.",
    titleTwo: "Більше",
    titleAccent: "зроблено.",
    intro:
      "Kova збирає проєкти, клієнтів і задачі в одному спокійному місці. Щоб ти бачив головне й рухався швидше.",
    start: "Почати безкоштовно",
    preview: "Прев’ю кабінету Kova",
    overview: "Огляд",
    projects: "Проєкти",
    clients: "Клієнти",
    date: "Неділя, 26 липня",
    greeting: "Доброго вечора, Діма.",
    newProject: "Новий проєкт",
    activeProjects: "Активні проєкти",
    monthGrowth: "2 цього місяця",
    income: "Дохід у роботі",
    confirmed: "68% підтверджено",
    completed: "Завершено задач",
    currentProjects: "Поточні проєкти",
    seeAll: "Дивитися всі",
    identity: "Айдентика бренду",
    productDesign: "Дизайн продукту",
    progress: "Прогрес",
    august12: "12 серпня",
    august28: "28 серпня",
    sectionLabel: "Все, що треба. Нічого зайвого.",
    features: [
      ["Проєкти без хаосу", "Бюджет, дедлайн і прогрес завжди перед очима."],
      ["Клієнти поруч", "Уся важлива інформація в одному робочому просторі."],
      ["Фокус на роботі", "Тільки потрібні метрики — без перевантажених таблиць."],
    ],
    securityLabel: "Безпека за замовчуванням",
    securityTitle: "Твої дані — тільки твої.",
    securityText:
      "Вхід через захищений акаунт, перевірка кожної дії на сервері та ізоляція даних між користувачами. Kova зберігає паролі лише у захищеному вигляді.",
    footer: "Створено для тих, хто працює на себе.",
  },
  sk: {
    nav: "Hlavná navigácia",
    home: "Kova — domov",
    product: "Produkt",
    security: "Bezpečnosť",
    open: "Otvoriť pracovný priestor",
    login: "Prihlásiť sa",
    eyebrow: "Pracovný priestor pre freelancerov",
    titleOne: "Menej rutiny.",
    titleTwo: "Viac",
    titleAccent: "hotového.",
    intro:
      "Kova spája projekty, klientov a úlohy na jednom pokojnom mieste. Vždy vidíš to podstatné a napreduješ rýchlejšie.",
    start: "Začať zadarmo",
    preview: "Ukážka pracovného priestoru Kova",
    overview: "Prehľad",
    projects: "Projekty",
    clients: "Klienti",
    date: "Nedeľa, 26. júla",
    greeting: "Dobrý večer, Dima.",
    newProject: "Nový projekt",
    activeProjects: "Aktívne projekty",
    monthGrowth: "2 tento mesiac",
    income: "Rozpracovaný príjem",
    confirmed: "68 % potvrdených",
    completed: "Dokončené úlohy",
    currentProjects: "Aktuálne projekty",
    seeAll: "Zobraziť všetky",
    identity: "Vizuálna identita",
    productDesign: "Produktový dizajn",
    progress: "Pokrok",
    august12: "12. augusta",
    august28: "28. augusta",
    sectionLabel: "Všetko potrebné. Nič navyše.",
    features: [
      ["Projekty bez chaosu", "Rozpočet, termín a pokrok máš vždy na očiach."],
      ["Klienti poruke", "Všetky dôležité informácie v jednom pracovnom priestore."],
      ["Sústredenie na prácu", "Len užitočné metriky — bez preplnených tabuliek."],
    ],
    securityLabel: "Bezpečnosť od začiatku",
    securityTitle: "Tvoje údaje patria iba tebe.",
    securityText:
      "Bezpečné prihlásenie, serverová kontrola každej akcie a oddelené údaje používateľov. Kova uchováva heslá iba v zabezpečenej podobe.",
    footer: "Vytvorené pre ľudí, ktorí pracujú na seba.",
  },
  en: {
    nav: "Main navigation",
    home: "Kova — home",
    product: "Product",
    security: "Security",
    open: "Open workspace",
    login: "Sign in",
    eyebrow: "A workspace for freelancers",
    titleOne: "Less busywork.",
    titleTwo: "More",
    titleAccent: "done.",
    intro:
      "Kova brings projects, clients, and tasks into one calm workspace, so you can see what matters and move faster.",
    start: "Start for free",
    preview: "Kova workspace preview",
    overview: "Overview",
    projects: "Projects",
    clients: "Clients",
    date: "Sunday, 26 July",
    greeting: "Good evening, Dima.",
    newProject: "New project",
    activeProjects: "Active projects",
    monthGrowth: "2 this month",
    income: "Working income",
    confirmed: "68% confirmed",
    completed: "Completed tasks",
    currentProjects: "Current projects",
    seeAll: "View all",
    identity: "Brand identity",
    productDesign: "Product design",
    progress: "Progress",
    august12: "12 August",
    august28: "28 August",
    sectionLabel: "Everything you need. Nothing you don’t.",
    features: [
      ["Projects without chaos", "Budget, deadline, and progress are always in view."],
      ["Clients close at hand", "Every important detail in one workspace."],
      ["Focus on the work", "Only useful metrics — no overloaded spreadsheets."],
    ],
    securityLabel: "Secure by default",
    securityTitle: "Your data stays yours.",
    securityText:
      "Secure sign-in, server-side checks for every action, and isolated user data. Kova stores passwords only in a protected form.",
    footer: "Made for people who work for themselves.",
  },
} as const;

export function HomeClient({ signedIn }: { signedIn: boolean }) {
  const { locale, setLocale } = useLocale();
  const t = COPY[locale];
  const primaryHref = signedIn ? "/dashboard" : "/login";

  return (
    <main>
      <nav className="nav shell" aria-label={t.nav}>
        <a className="brand" href="/" aria-label={t.home}>
          kova<span>.</span>
        </a>
        <div className="nav-links">
          <a href="#product">{t.product}</a>
          <a href="#security">{t.security}</a>
        </div>
        <div className="nav-actions">
          <LanguageTabs locale={locale} onChange={setLocale} />
          <a className="button button-small" href={primaryHref}>
            {signedIn ? t.open : t.login}
          </a>
        </div>
      </nav>

      <section className="hero shell" data-reveal>
        <div className="eyebrow">
          <span className="status-dot" />
          {t.eyebrow}
        </div>
        <h1>
          {t.titleOne}
          <br />
          {t.titleTwo} <em>{t.titleAccent}</em>
        </h1>
        <div className="hero-bottom">
          <p>{t.intro}</p>
          <a className="button button-hero" href={primaryHref}>
            {t.start} <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="product-preview" aria-label={t.preview} data-reveal>
          <div className="preview-sidebar">
            <div className="preview-mark">k.</div>
            <div className="preview-nav active"><span>⌂</span> {t.overview}</div>
            <div className="preview-nav"><span>◇</span> {t.projects}</div>
            <div className="preview-nav"><span>◎</span> {t.clients}</div>
            <div className="preview-person">
              <div className="avatar">DK</div>
              <div><b>Dima</b><small>Freelancer</small></div>
            </div>
          </div>
          <div className="preview-main">
            <div className="preview-head">
              <div><small>{t.date}</small><h2>{t.greeting}</h2></div>
              <div className="fake-button">+ {t.newProject}</div>
            </div>
            <div className="metric-grid">
              <article><small>{t.activeProjects}</small><strong>04</strong><span>↗ {t.monthGrowth}</span></article>
              <article><small>{t.income}</small><strong>€4 280</strong><span>{t.confirmed}</span></article>
              <article className="dark-card"><small>{t.completed}</small><strong>18 / 24</strong><div className="progress"><i /></div></article>
            </div>
            <div className="projects-head"><h3>{t.currentProjects}</h3><span>{t.seeAll} →</span></div>
            <div className="project-row">
              <div className="project-icon coral">N</div>
              <div className="project-name"><b>Nord Studio</b><small>{t.identity}</small></div>
              <div className="row-progress"><span>{t.progress} <b>72%</b></span><div className="progress"><i style={{ width: "72%" }} /></div></div>
              <span className="date-pill">{t.august12}</span>
            </div>
            <div className="project-row">
              <div className="project-icon blue">A</div>
              <div className="project-name"><b>Arka App</b><small>{t.productDesign}</small></div>
              <div className="row-progress"><span>{t.progress} <b>46%</b></span><div className="progress"><i style={{ width: "46%" }} /></div></div>
              <span className="date-pill">{t.august28}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features shell" id="product" data-reveal>
        <div className="section-label">{t.sectionLabel}</div>
        <div className="feature-grid">
          {t.features.map(([title, text], index) => (
            <article key={title} data-reveal>
              <span>0{index + 1}</span><h2>{title}</h2><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="security shell" id="security" data-reveal>
        <div><span className="section-label">{t.securityLabel}</span><h2>{t.securityTitle}</h2></div>
        <p>{t.securityText}</p>
      </section>

      <footer className="shell">
        <a className="brand" href="/">kova<span>.</span></a>
        <p>{t.footer}</p>
        <span>© 2026 Kova</span>
      </footer>
    </main>
  );
}
