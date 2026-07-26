import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { ensureSchema } from "@/db/workspace";
import { and, eq } from "drizzle-orm";

const ALLOWED_STATUSES = new Set(["active", "review", "done"]);

function trustedRequest(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function parseProject(body: Record<string, unknown>) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const client = typeof body.client === "string" ? body.client.trim() : "";
  const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
  const status = typeof body.status === "string" ? body.status.trim() : "";
  const budget = Number(body.budget);

  if (name.length < 2 || name.length > 80) {
    return { error: "Назва має містити від 2 до 80 символів" } as const;
  }
  if (client.length < 2 || client.length > 80) {
    return { error: "Опиши клієнта або тип роботи" } as const;
  }
  if (!Number.isSafeInteger(budget) || budget < 0 || budget > 10_000_000) {
    return { error: "Перевір бюджет" } as const;
  }
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
    Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`))
  ) {
    return { error: "Перевір дедлайн" } as const;
  }
  if (!ALLOWED_STATUSES.has(status)) {
    return { error: "Невідомий статус" } as const;
  }

  return {
    value: {
      name,
      client,
      dueDate,
      budget,
      status: status as "active" | "review" | "done",
    },
  } as const;
}

async function projectRequest(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getChatGPTUser();
  if (!user) {
    return { response: Response.json({ error: "Потрібно увійти" }, { status: 401 }) };
  }
  if (!trustedRequest(request)) {
    return { response: Response.json({ error: "Запит відхилено" }, { status: 403 }) };
  }

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) {
    return { response: Response.json({ error: "Неправильний проєкт" }, { status: 400 }) };
  }
  return { user, id };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await projectRequest(request, context);
  if ("response" in auth) return auth.response;
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Неправильний формат даних" }, { status: 415 });
  }

  try {
    const parsed = parseProject(
      (await request.json()) as Record<string, unknown>,
    );
    if ("error" in parsed) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    await ensureSchema();
    const db = getDb();
    const [project] = await db
      .update(projects)
      .set(parsed.value)
      .where(
        and(
          eq(projects.id, auth.id),
          eq(projects.userEmail, auth.user.email),
        ),
      )
      .returning();

    if (!project) {
      return Response.json({ error: "Проєкт не знайдено" }, { status: 404 });
    }
    return Response.json({ project });
  } catch {
    return Response.json(
      { error: "Не вдалося оновити проєкт" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await projectRequest(request, context);
  if ("response" in auth) return auth.response;

  try {
    await ensureSchema();
    const db = getDb();
    const [project] = await db
      .delete(projects)
      .where(
        and(
          eq(projects.id, auth.id),
          eq(projects.userEmail, auth.user.email),
        ),
      )
      .returning({ id: projects.id });

    if (!project) {
      return Response.json({ error: "Проєкт не знайдено" }, { status: 404 });
    }
    return Response.json({ deleted: true });
  } catch {
    return Response.json(
      { error: "Не вдалося видалити проєкт" },
      { status: 500 },
    );
  }
}
