import { getCurrentUser } from "./auth";

const features = [
  {
    number: "01",
    title: "Проєкти без хаосу",
    text: "Бюджет, дедлайн і прогрес завжди перед очима.",
  },
  {
    number: "02",
    title: "Клієнти поруч",
    text: "Уся важлива інформація в одному робочому просторі.",
  },
  {
    number: "03",
    title: "Фокус на роботі",
    text: "Тільки потрібні метрики — без перевантажених таблиць.",
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  const primaryHref = user ? "/dashboard" : "/login";

  return (
    <main>
      <nav className="nav shell" aria-label="Головна навігація">
        <a className="brand" href="/" aria-label="Kova — головна">
          kova<span>.</span>
        </a>
        <div className="nav-links">
          <a href="#product">Продукт</a>
          <a href="#security">Безпека</a>
        </div>
        <a className="button button-small" href={primaryHref}>
          {user ? "Відкрити кабінет" : "Увійти"}
        </a>
      </nav>

      <section className="hero shell" data-reveal>
        <div className="eyebrow">
          <span className="status-dot" />
          Робочий простір для фрилансерів
        </div>
        <h1>
          Менше рутини.
          <br />
          Більше <em>зроблено.</em>
        </h1>
        <div className="hero-bottom">
          <p>
            Kova збирає проєкти, клієнтів і задачі в одному спокійному місці.
            Щоб ти бачив головне й рухався швидше.
          </p>
          <a className="button button-hero" href={primaryHref}>
            Почати безкоштовно <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div
          className="product-preview"
          aria-label="Прев’ю кабінету Kova"
          data-reveal
        >
          <div className="preview-sidebar">
            <div className="preview-mark">k.</div>
            <div className="preview-nav active">
              <span>⌂</span> Огляд
            </div>
            <div className="preview-nav">
              <span>◇</span> Проєкти
            </div>
            <div className="preview-nav">
              <span>◎</span> Клієнти
            </div>
            <div className="preview-person">
              <div className="avatar">ДК</div>
              <div>
                <b>Діма</b>
                <small>Freelancer</small>
              </div>
            </div>
          </div>
          <div className="preview-main">
            <div className="preview-head">
              <div>
                <small>Неділя, 26 липня</small>
                <h2>Доброго вечора, Діма.</h2>
              </div>
              <div className="fake-button">+ Новий проєкт</div>
            </div>
            <div className="metric-grid">
              <article>
                <small>Активні проєкти</small>
                <strong>04</strong>
                <span>↗ 2 цього місяця</span>
              </article>
              <article>
                <small>Дохід у роботі</small>
                <strong>€4 280</strong>
                <span>68% підтверджено</span>
              </article>
              <article className="dark-card">
                <small>Завершено задач</small>
                <strong>18 / 24</strong>
                <div className="progress">
                  <i />
                </div>
              </article>
            </div>
            <div className="projects-head">
              <h3>Поточні проєкти</h3>
              <span>Дивитися всі →</span>
            </div>
            <div className="project-row">
              <div className="project-icon coral">N</div>
              <div className="project-name">
                <b>Nord Studio</b>
                <small>Айдентика бренду</small>
              </div>
              <div className="row-progress">
                <span>
                  Прогрес <b>72%</b>
                </span>
                <div className="progress">
                  <i style={{ width: "72%" }} />
                </div>
              </div>
              <span className="date-pill">12 серпня</span>
            </div>
            <div className="project-row">
              <div className="project-icon blue">A</div>
              <div className="project-name">
                <b>Arka App</b>
                <small>Дизайн продукту</small>
              </div>
              <div className="row-progress">
                <span>
                  Прогрес <b>46%</b>
                </span>
                <div className="progress">
                  <i style={{ width: "46%" }} />
                </div>
              </div>
              <span className="date-pill">28 серпня</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features shell" id="product" data-reveal>
        <div className="section-label">Все, що треба. Нічого зайвого.</div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article key={feature.number} data-reveal>
              <span>{feature.number}</span>
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="security shell" id="security" data-reveal>
        <div>
          <span className="section-label">Безпека за замовчуванням</span>
          <h2>Твої дані — тільки твої.</h2>
        </div>
        <p>
          Вхід через захищений акаунт, перевірка кожної дії на сервері та
          ізоляція даних між користувачами. Kova не зберігає паролі.
        </p>
      </section>

      <footer className="shell">
        <a className="brand" href="/">
          kova<span>.</span>
        </a>
        <p>Створено для тих, хто працює на себе.</p>
        <span>© 2026 Kova</span>
      </footer>
    </main>
  );
}
