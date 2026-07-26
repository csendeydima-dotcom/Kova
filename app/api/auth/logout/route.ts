import { destroyEmailSession, safeRelativePath } from "@/app/auth";

export async function GET(request: Request) {
  await destroyEmailSession();
  const returnTo = safeRelativePath(
    new URL(request.url).searchParams.get("returnTo") ?? "/",
  );
  return Response.redirect(new URL(returnTo, request.url), 303);
}
