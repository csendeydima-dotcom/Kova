import { getCurrentUser } from "./auth";
import { HomeClient } from "./HomeClient";

export default async function Home() {
  const user = await getCurrentUser();
  return <HomeClient signedIn={Boolean(user)} />;
}
