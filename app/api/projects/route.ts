import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { ensureSchema } from "@/db/workspace";

const ALLOWED_STATUSES = new Set(["active", "review"]);

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

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "Потрібно увійти в акаунт" }, { status: 401 });
  }
  if (!trustedRequest(request)) {
    return Response.json({ error: "Запит відхилено" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Неправильний формат даних" }, { status: 415 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const client = typeof body.client === "string" ? body.client.trim() : "";
    const dueDate =
      typeof body.dueDate === "string" ? body.dueDate.trim() : "";
    const status =
      typeof body.status === "string" ? body.status.trim() : "active";
    const budget = Number(body.budget);

    if (name.length < 2 || name.length > 80) {
      return Response.json(
        { error: "Назва має містити від 2 до 80 символів" },
        { status: 400 },
      );
    }
    if (client.length < 2 || client.length > 80) {
      return Response.json(
        { error: "Опиши клієнта або тип роботи" },
        { status: 400 },
      );
    }
    if (
      !Number.isSafeInteger(budget) ||
      budget < 0 ||
      budget > 10_000_000
    ) {
      return Response.json({ error: "Перевір бюджет" }, { status: 400 });
    }
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      Number.isNaN(Date.parse(`${dueDate}T00:00:00Z`))
    ) {
      return Response.json({ error: "Перевір дедлайн" }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.has(status)) {
      return Response.json({ error: "Невідомий статус" }, { status: 400 });
    }

    await ensureSchema();
    const db = getDb();
    const [project] = await db
      .insert(projects)
      .values({
        userEmail: user.email,
        name,
        client,
        budget,
        dueDate,
        status: status as "active" | "review",
      })
      .returning();

    return Response.json({ project }, { status: 201 });
  } catch {
    return Response.json(
      { error: "Не вдалося зберегти проєкт. Спробуй ще раз." },
      { status: 500 },
    );
  }
}
