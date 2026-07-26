import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/app/auth";
import { trustedMutationRequest } from "@/app/auth-password";
import { getDb } from "@/db";
import { projects, tasks } from "@/db/schema";
import { ensureSchema } from "@/db/workspace";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  }
  if (!trustedMutationRequest(request)) {
    return Response.json({ error: "Запит відхилено" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Неправильний формат даних" }, { status: 415 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const projectId = Number(body.projectId);
    if (title.length < 2 || title.length > 120) {
      return Response.json(
        { error: "Назва задачі має містити від 2 до 120 символів" },
        { status: 400 },
      );
    }
    if (!Number.isSafeInteger(projectId) || projectId < 1) {
      return Response.json({ error: "Обери проєкт" }, { status: 400 });
    }

    await ensureSchema();
    const db = getDb();
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(
        and(eq(projects.id, projectId), eq(projects.userEmail, user.email)),
      )
      .limit(1);
    if (!project) {
      return Response.json({ error: "Проєкт не знайдено" }, { status: 404 });
    }

    const [task] = await db
      .insert(tasks)
      .values({
        projectId,
        userEmail: user.email,
        title,
        completed: false,
      })
      .returning();
    return Response.json({ task }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Не вдалося створити задачу" },
      { status: 500 },
    );
  }
}
