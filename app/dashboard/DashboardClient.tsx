"use client";

import { useEffect, useMemo, useState } from "react";

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

type Locale = "uk" | "sk" | "en";
type View = "overview" | "projects" | "tasks";

const COPY = {
  uk: {
    overview: "Огляд",
    projects: "Проєкти",
    tasks: "Задачі",
    language: "Мова",
    greeting: "Привіт",
    projectsTitle: "Усі проєкти",
    tasksTitle: "Усі задачі",
    newProject: "Новий проєкт",
    newTask: "Нова задача",
    activeProjects: "Активні проєкти",
    workspace: "У твоєму робочому просторі",
    workingBudget: "Бюджет у роботі",
    allActive: "За всіма активними проєктами",
    completedTasks: "Виконано задач",
    progress: "Крок за кроком — до результату",
    currentProjects: "Поточні проєкти",
    nextTasks: "Наступні задачі",
    total: "всього",
    due: "до",
    edit: "Редагувати",
    project: "Проєкт",
    emptyProjects: "Тут з’явиться твій перший проєкт.",
    emptyTasks: "Список задач порожній.",
    createFirstProject: "Спочатку створи проєкт для цієї задачі.",
    statusActive: "У роботі",
    statusReview: "На перевірці",
    statusDone: "Завершено",
    editProject: "Редагувати проєкт",
    projectName: "Назва проєкту",
    projectNameExample: "Наприклад, Bloom Studio",
    client: "Клієнт або тип роботи",
    clientExample: "Редизайн сайту",
    budget: "Бюджет, €",
    deadline: "Дедлайн",
    status: "Статус",
    delete: "Видалити",
    save: "Зберегти зміни",
    createProject: "Створити проєкт",
    saving: "Зберігаю…",
    close: "Закрити",
    taskName: "Назва задачі",
    taskNameExample: "Підготувати презентацію",
    chooseProject: "Проєкт",
    createTask: "Створити задачу",
    projectCreated: "Проєкт створено",
    projectUpdated: "Проєкт оновлено",
    projectDeleted: "Проєкт видалено",
    taskCreated: "Задачу створено",
    taskUpdateError: "Не вдалося оновити задачу",
    saveProjectError: "Не вдалося зберегти проєкт",
    deleteProjectError: "Не вдалося видалити проєкт",
    createTaskError: "Не вдалося створити задачу",
    markDone: "Позначити виконаною",
    markUndone: "Позначити невиконаною",
    signOut: "Вийти",
  },
  sk: {
    overview: "Prehľad",
    projects: "Projekty",
    tasks: "Úlohy",
    language: "Jazyk",
    greeting: "Ahoj",
    projectsTitle: "Všetky projekty",
    tasksTitle: "Všetky úlohy",
    newProject: "Nový projekt",
    newTask: "Nová úloha",
    activeProjects: "Aktívne projekty",
    workspace: "V tvojom pracovnom priestore",
    workingBudget: "Rozpracovaný rozpočet",
    allActive: "Za všetky aktívne projekty",
    completedTasks: "Dokončené úlohy",
    progress: "Krok za krokom k výsledku",
    currentProjects: "Aktuálne projekty",
    nextTasks: "Nasledujúce úlohy",
    total: "celkom",
    due: "do",
    edit: "Upraviť",
    project: "Projekt",
    emptyProjects: "Tu sa zobrazí tvoj prvý projekt.",
    emptyTasks: "Zoznam úloh je prázdny.",
    createFirstProject: "Najprv vytvor projekt pre túto úlohu.",
    statusActive: "Rozpracované",
    statusReview: "Na kontrolu",
    statusDone: "Dokončené",
    editProject: "Upraviť projekt",
    projectName: "Názov projektu",
    projectNameExample: "Napríklad Bloom Studio",
    client: "Klient alebo typ práce",
    clientExample: "Redizajn webu",
    budget: "Rozpočet, €",
    deadline: "Termín",
    status: "Stav",
    delete: "Odstrániť",
    save: "Uložiť zmeny",
    createProject: "Vytvoriť projekt",
    saving: "Ukladám…",
    close: "Zavrieť",
    taskName: "Názov úlohy",
    taskNameExample: "Pripraviť prezentáciu",
    chooseProject: "Projekt",
    createTask: "Vytvoriť úlohu",
    projectCreated: "Projekt bol vytvorený",
    projectUpdated: "Projekt bol aktualizovaný",
    projectDeleted: "Projekt bol odstránený",
    taskCreated: "Úloha bola vytvorená",
    taskUpdateError: "Úlohu sa nepodarilo aktualizovať",
    saveProjectError: "Projekt sa nepodarilo uložiť",
    deleteProjectError: "Projekt sa nepodarilo odstrániť",
    createTaskError: "Úlohu sa nepodarilo vytvoriť",
    markDone: "Označiť ako dokončené",
    markUndone: "Označiť ako nedokončené",
    signOut: "Odhlásiť sa",
  },
  en: {
    overview: "Overview",
    projects: "Projects",
    tasks: "Tasks",
    language: "Language",
    greeting: "Hello",
    projectsTitle: "All projects",
    tasksTitle: "All tasks",
    newProject: "New project",
    newTask: "New task",
    activeProjects: "Active projects",
    workspace: "In your workspace",
    workingBudget: "Working budget",
    allActive: "Across all active projects",
    completedTasks: "Completed tasks",
    progress: "One step at a time",
    currentProjects: "Current projects",
    nextTasks: "Next tasks",
    total: "total",
    due: "due",
    edit: "Edit",
    project: "Project",
    emptyProjects: "Your first project will appear here.",
    emptyTasks: "Your task list is empty.",
    createFirstProject: "Create a project before adding a task.",
    statusActive: "In progress",
    statusReview: "In review",
    statusDone: "Completed",
    editProject: "Edit project",
    projectName: "Project name",
    projectNameExample: "For example, Bloom Studio",
    client: "Client or type of work",
    clientExample: "Website redesign",
    budget: "Budget, €",
    deadline: "Deadline",
    status: "Status",
    delete: "Delete",
    save: "Save changes",
    createProject: "Create project",
    saving: "Saving…",
    close: "Close",
    taskName: "Task name",
    taskNameExample: "Prepare the presentation",
    chooseProject: "Project",
    createTask: "Create task",
    projectCreated: "Project created",
    projectUpdated: "Project updated",
    projectDeleted: "Project deleted",
    taskCreated: "Task created",
    taskUpdateError: "Could not update the task",
    saveProjectError: "Could not save the project",
    deleteProjectError: "Could not delete the project",
    createTaskError: "Could not create the task",
    markDone: "Mark as completed",
    markUndone: "Mark as incomplete",
    signOut: "Sign out",
  },
} as const;

const LOCALE_CODES: Record<Locale, string> = {
  uk: "uk-UA",
  sk: "sk-SK",
  en: "en-GB",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DashboardClient({
  user,
  initialProjects,
  initialTasks,
  signOutHref,
}: DashboardProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<View>("overview");
  const [locale, setLocale] = useState<Locale>("uk");
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const t = COPY[locale];

  useEffect(() => {
    const saved = window.localStorage.getItem("kova-locale");
    if (saved === "uk" || saved === "sk" || saved === "en") {
      setLocale(saved);
      return;
    }
    const browserLocale = window.navigator.language.toLowerCase();
    if (browserLocale.startsWith("sk")) setLocale("sk");
    else if (browserLocale.startsWith("en")) setLocale("en");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("kova-locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const activeProjects = projects.filter((item) => item.status !== "done");
  const totalBudget = activeProjects.reduce((sum, item) => sum + item.budget, 0);
  const completedTasks = tasks.filter((item) => item.completed).length;
  const firstName = user.name.split(/\s+/)[0] || "friend";
  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project.name])),
    [projects],
  );
  const money = useMemo(
    () =>
      new Intl.NumberFormat(LOCALE_CODES[locale], {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  useEffect(() => {
    const modalOpen = projectModalOpen || taskModalOpen;
    if (!modalOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) closeModals();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [projectModalOpen, taskModalOpen, saving]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(LOCALE_CODES[locale], {
      day: "numeric",
      month: "short",
    }).format(new Date(`${value}T12:00:00`));
  }

  function statusLabel(status: Project["status"]) {
    if (status === "review") return t.statusReview;
    if (status === "done") return t.statusDone;
    return t.statusActive;
  }

  function closeModals(force = false) {
    if (saving && !force) return;
    setProjectModalOpen(false);
    setTaskModalOpen(false);
    setEditingProject(null);
    setError("");
  }

  function openCreateProject() {
    setEditingProject(null);
    setError("");
    setProjectModalOpen(true);
  }

  function openEditProject(project: Project) {
    setEditingProject(project);
    setError("");
    setProjectModalOpen(true);
  }

  function openCreateTask() {
    if (!projects.length) {
      setView("projects");
      setNotice(t.createFirstProject);
      return;
    }
    setError("");
    setTaskModalOpen(true);
  }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
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
      const endpoint = editingProject
        ? `/api/projects/${editingProject.id}`
        : "/api/projects";
      const response = await fetch(endpoint, {
        method: editingProject ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        project?: Project;
        error?: string;
      };
      if (!response.ok || !data.project) {
        throw new Error(data.error || t.saveProjectError);
      }
      setProjects((items) =>
        editingProject
          ? items.map((item) =>
              item.id === data.project!.id ? data.project! : item,
            )
          : [data.project!, ...items],
      );
      setNotice(editingProject ? t.projectUpdated : t.projectCreated);
      closeModals(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : t.saveProjectError,
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    if (!editingProject || saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || t.deleteProjectError);
      }
      setProjects((items) =>
        items.filter((item) => item.id !== editingProject.id),
      );
      setTasks((items) =>
        items.filter((item) => item.projectId !== editingProject.id),
      );
      setNotice(t.projectDeleted);
      closeModals(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : t.deleteProjectError,
      );
    } finally {
      setSaving(false);
    }
  }

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title") || ""),
          projectId: Number(form.get("projectId")),
        }),
      });
      const data = (await response.json()) as { task?: Task; error?: string };
      if (!response.ok || !data.task) {
        throw new Error(data.error || t.createTaskError);
      }
      setTasks((items) => [data.task!, ...items]);
      setNotice(t.taskCreated);
      closeModals(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : t.createTaskError,
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
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ completed: nextCompleted }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setTasks((items) =>
        items.map((item) =>
          item.id === task.id ? { ...item, completed: task.completed } : item,
        ),
      );
      setNotice(t.taskUpdateError);
    }
  }

  const renderProjects = (compact = false) => {
    const list = compact ? projects.slice(0, 4) : projects;
    return (
      <section className={`panel ${compact ? "" : "panel-wide"}`}>
        <div className="panel-head">
          <h2>{compact ? t.currentProjects : t.projectsTitle}</h2>
          <span>
            {projects.length} {t.total}
          </span>
        </div>
        {list.length ? (
          list.map((project, index) => (
            <article className="dash-project" key={project.id}>
              <div className={`project-icon ${index % 2 ? "blue" : "coral"}`}>
                {project.name[0]?.toUpperCase()}
              </div>
              <div>
                <b>{project.name}</b>
                <small>
                  {project.client} · {t.due} {formatDate(project.dueDate)}
                </small>
              </div>
              <div className="project-meta">
                <strong>{money.format(project.budget)}</strong>
                <small className="status-pill">
                  {statusLabel(project.status)}
                </small>
              </div>
              <button
                className="project-edit"
                type="button"
                aria-label={`${t.edit}: ${project.name}`}
                onClick={() => openEditProject(project)}
              >
                {t.edit}
              </button>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <p>{t.emptyProjects}</p>
            <button className="empty-action" type="button" onClick={openCreateProject}>
              + {t.newProject}
            </button>
          </div>
        )}
      </section>
    );
  };

  const renderTasks = (compact = false) => {
    const list = compact ? tasks.slice(0, 5) : tasks;
    return (
      <section className={`panel ${compact ? "" : "panel-wide"}`}>
        <div className="panel-head">
          <h2>{compact ? t.nextTasks : t.tasksTitle}</h2>
          <span>
            {tasks.length} {t.total}
          </span>
        </div>
        {list.length ? (
          list.map((task) => (
            <div
              className={`task-item ${task.completed ? "done" : ""}`}
              key={task.id}
            >
              <button
                type="button"
                className="task-toggle"
                aria-label={task.completed ? t.markUndone : t.markDone}
                aria-pressed={task.completed}
                onClick={() => toggleTask(task)}
              >
                {task.completed ? "✓" : ""}
              </button>
              <div>
                <span className="task-title">{task.title}</span>
                <span className="task-project">
                  {projectNames.get(task.projectId) || t.project}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>{t.emptyTasks}</p>
            <button className="empty-action" type="button" onClick={openCreateTask}>
              + {t.newTask}
            </button>
          </div>
        )}
      </section>
    );
  };

  const pageTitle =
    view === "overview"
      ? `${t.greeting}, ${firstName}.`
      : view === "projects"
        ? t.projectsTitle
        : t.tasksTitle;

  return (
    <main className="dashboard-body">
      <div className="dashboard-shell">
        <aside className="dash-sidebar">
          <a className="brand" href="/">
            kova<span>.</span>
          </a>
          {(
            [
              ["overview", "⌂", t.overview],
              ["projects", "◇", t.projects],
              ["tasks", "✓", t.tasks],
            ] as const
          ).map(([target, icon, label]) => (
            <button
              className={`dash-link ${view === target ? "active" : ""}`}
              type="button"
              aria-pressed={view === target}
              onClick={() => setView(target)}
              key={target}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
          <label className="language-picker">
            <span>{t.language}</span>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
              aria-label={t.language}
            >
              <option value="uk">UA · Українська</option>
              <option value="sk">SK · Slovenčina</option>
              <option value="en">EN · English</option>
            </select>
          </label>
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
                {new Intl.DateTimeFormat(LOCALE_CODES[locale], {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }).format(new Date())}
              </p>
              <h1>{pageTitle}</h1>
            </div>
            <div className="dash-actions">
              <a className="signout" href={signOutHref} title={t.signOut}>
                ↗
              </a>
              <button
                className="button new-project-button"
                type="button"
                onClick={view === "tasks" ? openCreateTask : openCreateProject}
              >
                + {view === "tasks" ? t.newTask : t.newProject}
              </button>
            </div>
          </header>

          {view === "overview" && (
            <>
              <div className="stats">
                <article className="stat-card">
                  <span>{t.activeProjects}</span>
                  <strong>{String(activeProjects.length).padStart(2, "0")}</strong>
                  <small>{t.workspace}</small>
                </article>
                <article className="stat-card">
                  <span>{t.workingBudget}</span>
                  <strong>{money.format(totalBudget)}</strong>
                  <small>{t.allActive}</small>
                </article>
                <article className="stat-card dark">
                  <span>{t.completedTasks}</span>
                  <strong>
                    {completedTasks} / {tasks.length}
                  </strong>
                  <small>{t.progress}</small>
                </article>
              </div>
              <div className="dash-grid">
                {renderProjects(true)}
                {renderTasks(true)}
              </div>
            </>
          )}
          {view === "projects" && renderProjects()}
          {view === "tasks" && renderTasks()}
        </section>
      </div>

      {projectModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModals();
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
          >
            <div className="modal-head">
              <h2 id="project-modal-title">
                {editingProject ? t.editProject : t.newProject}
              </h2>
              <button
                className="modal-close"
                type="button"
                aria-label={t.close}
                onClick={() => closeModals()}
              >
                ×
              </button>
            </div>
            <form key={editingProject?.id ?? "new"} onSubmit={saveProject}>
              <div className="field">
                <label htmlFor="project-name">{t.projectName}</label>
                <input
                  id="project-name"
                  name="name"
                  minLength={2}
                  maxLength={80}
                  required
                  autoFocus
                  defaultValue={editingProject?.name}
                  placeholder={t.projectNameExample}
                />
              </div>
              <div className="field">
                <label htmlFor="client">{t.client}</label>
                <input
                  id="client"
                  name="client"
                  minLength={2}
                  maxLength={80}
                  required
                  defaultValue={editingProject?.client}
                  placeholder={t.clientExample}
                />
              </div>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="budget">{t.budget}</label>
                  <input
                    id="budget"
                    name="budget"
                    type="number"
                    min="0"
                    max="10000000"
                    step="1"
                    required
                    defaultValue={editingProject?.budget}
                    placeholder="1500"
                  />
                </div>
                <div className="field">
                  <label htmlFor="dueDate">{t.deadline}</label>
                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    required
                    defaultValue={editingProject?.dueDate}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="status">{t.status}</label>
                <select
                  id="status"
                  name="status"
                  defaultValue={editingProject?.status ?? "active"}
                >
                  <option value="active">{t.statusActive}</option>
                  <option value="review">{t.statusReview}</option>
                  <option value="done">{t.statusDone}</option>
                </select>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="modal-actions">
                {editingProject && (
                  <button
                    className="delete-button"
                    type="button"
                    disabled={saving}
                    onClick={deleteProject}
                  >
                    {t.delete}
                  </button>
                )}
                <button className="button submit-button" type="submit" disabled={saving}>
                  {saving
                    ? t.saving
                    : editingProject
                      ? t.save
                      : t.createProject}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {taskModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModals();
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
          >
            <div className="modal-head">
              <h2 id="task-modal-title">{t.newTask}</h2>
              <button
                className="modal-close"
                type="button"
                aria-label={t.close}
                onClick={() => closeModals()}
              >
                ×
              </button>
            </div>
            <form onSubmit={createTask}>
              <div className="field">
                <label htmlFor="task-title">{t.taskName}</label>
                <input
                  id="task-title"
                  name="title"
                  minLength={2}
                  maxLength={120}
                  required
                  autoFocus
                  placeholder={t.taskNameExample}
                />
              </div>
              <div className="field">
                <label htmlFor="task-project">{t.chooseProject}</label>
                <select id="task-project" name="projectId" required>
                  {projects.map((project) => (
                    <option value={project.id} key={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <div className="modal-actions">
                <button className="button submit-button" type="submit" disabled={saving}>
                  {saving ? t.saving : t.createTask}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {notice && (
        <div className="toast" role="status">
          <span>✓</span> {notice}
        </div>
      )}
    </main>
  );
}
