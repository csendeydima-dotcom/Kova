export type User = { id: number; email: string; name: string };
export type Project = {
  id: number;
  name: string;
  client: string;
  budget: number;
  status: "active" | "review" | "done";
  dueDate: string;
  createdAt: string;
};
export type Task = {
  id: number;
  projectId: number;
  title: string;
  completed: boolean;
  createdAt: string;
};
export type Workspace = { user: User; projects: Project[]; tasks: Task[] };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(body.error || "Request failed");
  return body as T;
}
