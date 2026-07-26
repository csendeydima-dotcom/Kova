import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
import { ensureSchema } from "@/db/workspace";
import { and, eq } from "drizzle-orm";

function trustedRequest(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  return !site || site === "same-origin";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  }
  if (!trustedRequest(request)) {
    return Response.json({ error: "Запит відхилено" }, { status: 403 });
  }

  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    const body = (await request.json()) as { completed?: unknown };
    if (!Number.isSafeInteger(id) || id < 1 || typeof body.completed !== "boolean") {
      return Response.json({ error: "Неправильні дані" }, { status: 400 });
    }

    await ensureSchema();
    const db = getDb();
    const [task] = await db
      .update(tasks)
      .set({ completed: body.completed })
      .where(and(eq(tasks.id, id), eq(tasks.userEmail, user.email)))
      .returning();

    if (!task) {
      return Response.json({ error: "Задачу не знайдено" }, { status: 404 });
    }
    return Response.json({ task });
  } catch {
    return Response.json(
      { error: "Не вдалося оновити задачу" },
      { status: 500 },
    );
  }
}
