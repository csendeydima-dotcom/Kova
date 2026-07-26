import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("landing page contains the Kova product message", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(page, /kova/);
  assert.match(page, /Менше рутини/);
  assert.match(page, /Почати безкоштовно/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
});

test("protected data flows verify identity and ownership", async () => {
  const dashboard = await readFile(
    new URL("app/dashboard/page.tsx", root),
    "utf8",
  );
  const projectRoute = await readFile(
    new URL("app/api/projects/route.ts", root),
    "utf8",
  );
  const taskRoute = await readFile(
    new URL("app/api/tasks/[id]/route.ts", root),
    "utf8",
  );
  const projectEditRoute = await readFile(
    new URL("app/api/projects/[id]/route.ts", root),
    "utf8",
  );

  assert.match(dashboard, /requireChatGPTUser/);
  assert.match(projectRoute, /getChatGPTUser/);
  assert.match(projectRoute, /same-origin/);
  assert.match(taskRoute, /eq\(tasks\.userEmail, user\.email\)/);
  assert.match(projectEditRoute, /export async function PATCH/);
  assert.match(projectEditRoute, /export async function DELETE/);
  assert.match(
    projectEditRoute,
    /eq\(projects\.userEmail, auth\.user\.email\)/,
  );
});

test("registration handoff supports platform email and Google choices", async () => {
  const login = await readFile(new URL("app/login/page.tsx", root), "utf8");
  assert.match(login, /Google/);
  assert.match(login, /email/);
  assert.match(login, /chatGPTSignInPath/);
});

test("worker applies browser security headers", async () => {
  const worker = await readFile(new URL("worker/index.ts", root), "utf8");
  assert.match(worker, /Content-Security-Policy/);
  assert.match(worker, /X-Content-Type-Options/);
  assert.match(worker, /Strict-Transport-Security/);
  assert.match(worker, /Permissions-Policy/);
});
