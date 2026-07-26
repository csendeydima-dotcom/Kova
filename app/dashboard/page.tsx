import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projects, tasks } from "@/db/schema";
import { ensureWorkspace } from "@/db/workspace";
import {
  chatGPTSignOutPath,
  requireChatGPTUser,
} from "../chatgpt-auth";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireChatGPTUser("/dashboard");
  await ensureWorkspace(user.email, user.displayName);

  const db = getDb();
  const [projectRows, taskRows] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(eq(projects.userEmail, user.email))
      .orderBy(desc(projects.createdAt)),
    db
      .select()
      .from(tasks)
      .where(eq(tasks.userEmail, user.email))
      .orderBy(tasks.completed, desc(tasks.createdAt)),
  ]);

  return (
    <DashboardClient
      user={{
        name: user.displayName,
        email: user.email,
      }}
      initialProjects={projectRows}
      initialTasks={taskRows}
      signOutHref={chatGPTSignOutPath("/")}
    />
  );
}
