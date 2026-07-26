import { redirect } from "next/navigation";
import { env } from "cloudflare:workers";
import {
  chatGPTSignInPath,
  getCurrentUser,
  safeRelativePath,
} from "../auth";
import { LoginClient } from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const query = await searchParams;
  const returnTo = safeRelativePath(query.returnTo ?? "/dashboard");
  const googleClientId = (
    env as unknown as { GOOGLE_CLIENT_ID?: string }
  ).GOOGLE_CLIENT_ID;

  return (
    <LoginClient
      returnTo={returnTo}
      chatGPTHref={chatGPTSignInPath(returnTo)}
      googleClientId={googleClientId ?? ""}
    />
  );
}
