"use client";
import Link from "next/link";
import { useEffect, useState, createContext, useContext } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Github,
  LogOut,
  Download,
  User as UserIcon,
} from "lucide-react";
import { api } from "@/lib/client";

type User = { id: string; email: string; username?: string | null };
type InstallPrompt = Event & { prompt: () => Promise<void> };

const Auth = createContext<{
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
}>({ user: null, loading: true, refresh: async () => {} });

export const useAuth = () => useContext(Auth);

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setUser((await api("/api/auth/me")).user);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch(() => {});
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const installHandler = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallPrompt);
    };
    const network = () => setOnline(navigator.onLine);
    network();
    window.addEventListener("beforeinstallprompt", installHandler);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    return () => {
      window.removeEventListener("beforeinstallprompt", installHandler);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
    };
  }, []);

  return (
    <Auth.Provider value={{ user, loading, refresh }}>
      <div className="site">
        <header className="header">
          <Link href="/" className="brand" aria-label="WeDrop home">
            <span className="brand-icon">
              <ArrowDown size={21} />
            </span>
            WeDrop<span className="beta">BETA</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/create">Create Drop</Link>
            <Link href="/my-drops">My Drops</Link>
            {user && (
              <Link href="/account" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <UserIcon size={14} />
                {user.username ? `@${user.username}` : "Account"}
              </Link>
            )}
            {install && (
              <button
                className="nav-button"
                onClick={async () => {
                  await install.prompt();
                  setInstall(null);
                }}
              >
                <Download size={15} />
                Install
              </button>
            )}
            {user ? (
              <button
                className="nav-button"
                onClick={async () => {
                  try {
                    await api("/api/auth/logout", { method: "POST" });
                    await refresh();
                    window.location.assign("/");
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            ) : (
              <Link className="sign-in" href="/login">
                Sign in <ArrowUpRight size={15} />
              </Link>
            )}
          </nav>
        </header>
        {!online && (
          <div className="offline-banner">
            You’re offline. The editor is available; reconnect to create or open
            a drop.
          </div>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <main>{children}</main>
        <footer>
          <span>Drop it. Share it.</span>
          <div>
            <span className="status-dot" />
            All text. No attachments.
            <a
              href={
                process.env.NEXT_PUBLIC_SOURCE_URL ||
                "https://github.com/search?q=wedrop&type=repositories"
              }
              target="_blank"
              rel="noreferrer"
            >
              <Github size={14} />
              Source · AGPLv3
            </a>
          </div>
        </footer>
      </div>
    </Auth.Provider>
  );
}
