import { useEffect, useState } from "react";
import { api, type User, type Workspace } from "./api";
import { Auth } from "./Auth";
import { Dashboard } from "./Dashboard";
import { Landing } from "./Landing";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [checking, setChecking] = useState(true);
  const path = window.location.pathname;

  useEffect(() => {
    api<{ user: User }>("/api/auth/me")
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!user || path !== "/dashboard") return;
    api<Workspace>("/api/workspace")
      .then(setWorkspace)
      .catch(() => {
        setUser(null);
        window.location.replace("/login");
      });
  }, [user, path]);

  function signedIn(nextUser: User) {
    setUser(nextUser);
    window.location.assign("/dashboard");
  }

  async function logout() {
    await api<void>("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setWorkspace(null);
    window.location.assign("/");
  }

  if (checking) {
    return <main className="app-loading" aria-label="Loading"><div className="loading-mark">kova<span>.</span></div></main>;
  }

  if (path === "/login") {
    if (user) {
      window.location.replace("/dashboard");
      return null;
    }
    return <Auth onSignedIn={signedIn} />;
  }

  if (path === "/dashboard") {
    if (!user) {
      window.location.replace("/login");
      return null;
    }
    if (!workspace) {
      return <main className="app-loading" aria-label="Loading workspace"><div className="loading-mark">kova<span>.</span></div></main>;
    }
    return (
      <Dashboard
        user={workspace.user}
        initialProjects={workspace.projects}
        initialTasks={workspace.tasks}
        onLogout={logout}
      />
    );
  }

  return <Landing signedIn={Boolean(user)} />;
}
