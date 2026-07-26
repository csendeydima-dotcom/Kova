"use client";

import { useMemo, useState } from "react";

type Project = {
  id: number;
  name: string;
  client: string;
  budget: number;
  status: "active" | "review" | "done";
  dueDate: string;
  userEmail: string;
  createdAt: string;
};

type Task = {
  id: number;
  projectId: number;
  title: string;
  completed: boolean;
  userEmail: string;
  createdAt: string;
};

type DashboardProps = {
  user: { name: string; email: string };
  initialProjects: Project[];
  initialTasks: Task[];
  signOutHref: string;
};

const money = new Intl.NumberFormat("uk-UA", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function statusLabel(status: Project["status"]) {
  if (status === "review") return "На перевірці";
  if (status === "done") return "Завершено";
  return "У роботі";
}

export function DashboardClient({
  user,
  initialProjects,
  initialTasks,
  signOutHref,
}: DashboardProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeProjects = projects.filter((item) => item.status !== "done");
  const totalBudget = activeProjects.reduce((sum, item) => sum + item.budget, 0);
  const completedTasks = tasks.filter((item) => item.completed).length;
  const firstName = user.name.split(/\s+/)[0] || "друже";

  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      client: String(form.get("client") || ""),
      budget: Number(form.get("budget") || 0),
      dueDate: String(form.get("dueDate") || ""),
      status: String(form.get("status") || "active"),
    };

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        project?: Project;
        error?: string;
      };
      if (!response.ok || !data.project) {
        throw new Error(data.error || "Не вдалося створити проєкт");
      }
      setProjects((items) => [data.project!, ...items]);
      setModalOpen(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Сталася помилка",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: Task) {
    const nextCompleted = !task.completed;
    setTasks((items) =>
      items.map((item) =>
        item.id === task.id ? { ...item, completed: nextCompleted } : item,
      ),
    );

    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ completed: nextCompleted }),
    });
    if (!response.ok) {
      setTasks((items) =>
        items.map((item) =>
          item.id === task.id ? { ...item, completed: task.completed } : item,
        ),
      );
    }
  }

  return (
    <main className="dashboard-body">
      <div className="dashboard-shell">
        <aside className="dash-sidebar">
          <a className="brand" href="/">
            kova<span>.</span>
          </a>
          <a className="dash-link active" href="/dashboard">
            <span>⌂</span> Огляд
          </a>
          <a className="dash-link" href="#projects">
            <span>◇</span> Проєкти
          </a>
          <a className="dash-link" href="#tasks">
            <span>✓</span> Задачі
          </a>
          <div className="dash-user">
            <div className="avatar">{initials(user.name) || "K"}</div>
            <div>
              <b>{user.name}</b>
              <small>{user.email}</small>
            </div>
          </div>
        </aside>

        <section className="dash-main">
          <header className="dash-top">
            <div>
              <p>
                {new Intl.DateTimeFormat("uk-UA", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(new Date())}
              </p>
              <h1>Привіт, {firstName}.</h1>
            </div>
            <div className="dash-actions">
              <a className="signout" href={signOutHref} title="Вийти">
                ↗
              </a>
              <button
                className="button new-project-button"
                type="button"
                onClick={() => setModalOpen(true)}
              >
                + Новий проєкт
              </button>
            </div>
          </header>

          <div className="stats">
            <article className="stat-card">
              <span>Активні проєкти</span>
              <strong>{String(activeProjects.length).padStart(2, "0")}</strong>
              <small>У твоєму робочому просторі</small>
            </article>
            <article className="stat-card">
              <span>Бюджет у роботі</span>
              <strong>{money.format(totalBudget)}</strong>
              <small>За всіма активними проєктами</small>
            </article>
            <article className="stat-card dark">
              <span>Виконано задач</span>
              <strong>
                {completedTasks} / {tasks.length}
              </strong>
              <small>Крок за кроком — до результату</small>
            </article>
          </div>

          <div className="dash-grid">
            <section className="panel" id="projects">
              <div className="panel-head">
                <h2>Поточні проєкти</h2>
                <span>{projects.length} всього</span>
              </div>
              {projects.length ? (
                projects.map((project, index) => (
                  <article className="dash-project" key={project.id}>
                    <div
                      className={`project-icon ${index % 2 ? "blue" : "coral"}`}
                    >
                      {project.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <b>{project.name}</b>
                      <small>
                        {project.client} · до {formatDate(project.dueDate)}
                      </small>
                    </div>
                    <div className="project-meta">
                      <strong>{money.format(project.budget)}</strong>
                      <small className="status-pill">
                        {statusLabel(project.status)}
                      </small>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">
                  Тут з’явиться твій перший проєкт.
                </div>
              )}
            </section>

            <section className="panel" id="tasks">
              <div className="panel-head">
                <h2>Наступні задачі</h2>
                <span>{tasks.length} всього</span>
              </div>
              {tasks.length ? (
                tasks.map((task) => (
                  <div
                    className={`task-item ${task.completed ? "done" : ""}`}
                    key={task.id}
                  >
                    <button
                      type="button"
                      className="task-toggle"
                      aria-label={
                        task.completed
                          ? `Позначити «${task.title}» невиконаною`
                          : `Позначити «${task.title}» виконаною`
                      }
                      aria-pressed={task.completed}
                      onClick={() => toggleTask(task)}
                    >
                      {task.completed ? "✓" : ""}
                    </button>
                    <div>
                      <span className="task-title">{task.title}</span>
                      <span className="task-project">
                        {projectNames.get(task.projectId) || "Проєкт"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Список задач порожній.</div>
              )}
            </section>
          </div>
        </section>
      </div>

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setModalOpen(false);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-title"
          >
            <div className="modal-head">
              <h2 id="new-project-title">Новий проєкт</h2>
              <button
                className="modal-close"
                type="button"
                aria-label="Закрити"
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={createProject}>
              <div className="field">
                <label htmlFor="project-name">Назва проєкту</label>
                <input
                  id="project-name"
                  name="name"
                  minLength={2}
                  maxLength={80}
                  required
                  autoFocus
                  placeholder="Наприклад, Bloom Studio"
                />
              </div>
              <div className="field">
                <label htmlFor="client">Клієнт або тип роботи</label>
                <input
                  id="client"
                  name="client"
                  minLength={2}
                  maxLength={80}
                  required
                  placeholder="Редизайн сайту"
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="budget">Бюджет, €</label>
                  <input
                    id="budget"
                    name="budget"
                    type="number"
                    min="0"
                    max="10000000"
                    step="1"
                    required
                    placeholder="1500"
                  />
                </div>
                <div className="field">
                  <label htmlFor="dueDate">Дедлайн</label>
                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="status">Статус</label>
                <select id="status" name="status" defaultValue="active">
                  <option value="active">У роботі</option>
                  <option value="review">На перевірці</option>
                </select>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="button submit-button"
                type="submit"
                disabled={saving}
              >
                {saving ? "Зберігаю…" : "Створити проєкт"}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
