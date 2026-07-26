import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { getDb } from ".";
import { projects, users } from "./schema";

export async function ensureSchema() {
  const d1 = (env as unknown as { DB: D1Database }).DB;
  await d1.batch([
    d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          password_hash TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`,
      ),
    d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY,
          user_email TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        )`,
      ),
    d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS auth_attempts (
          key TEXT PRIMARY KEY,
          attempts INTEGER NOT NULL DEFAULT 0,
          window_started_at INTEGER NOT NULL,
          locked_until INTEGER NOT NULL DEFAULT 0
        )`,
      ),
    d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS email_verifications (
          email TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          expires_at INTEGER NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_sent_at INTEGER NOT NULL
        )`,
      ),
    d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS projects (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_email TEXT NOT NULL,
          name TEXT NOT NULL,
          client TEXT NOT NULL,
          budget INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          due_date TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
        )`,
      ),
    d1
      .prepare(
        `CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          user_email TEXT NOT NULL,
          title TEXT NOT NULL,
          completed INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )`,
      ),
    d1.prepare(
      "CREATE INDEX IF NOT EXISTS projects_owner_idx ON projects (user_email)",
    ),
    d1.prepare(
      "CREATE INDEX IF NOT EXISTS tasks_owner_idx ON tasks (user_email, project_id)",
    ),
    d1.prepare(
      "CREATE INDEX IF NOT EXISTS sessions_owner_idx ON sessions (user_email)",
    ),
    d1.prepare(
      "CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions (expires_at)",
    ),
    d1.prepare(
      "CREATE INDEX IF NOT EXISTS email_verifications_expiry_idx ON email_verifications (expires_at)",
    ),
  ]);

  const userColumns = await d1
    .prepare("PRAGMA table_info(users)")
    .all<{ name: string }>();
  if (!userColumns.results.some((column) => column.name === "password_hash")) {
    try {
      await d1
        .prepare("ALTER TABLE users ADD COLUMN password_hash TEXT")
        .run();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("duplicate column")) throw error;
    }
  }
}

export async function ensureWorkspace(email: string, name: string) {
  await ensureSchema();
  const db = getDb();
  await db
    .insert(users)
    .values({ email, name })
    .onConflictDoUpdate({ target: users.email, set: { name } });
}

export async function userOwnsProject(email: string, projectId: number) {
  const db = getDb();
  const match = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userEmail, email)))
    .limit(1);
  return match.length === 1;
}
