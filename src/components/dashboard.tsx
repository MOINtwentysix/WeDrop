"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Flame,
  LockKeyhole,
  Plus,
  QrCode,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "./app-shell";
import { ShareCard } from "./share-card";
import { api, remaining } from "@/lib/client";

type Drop = {
  id: string;
  created_at: string;
  expires_at: string;
  burn_after_reading: boolean;
  protected: boolean;
  remaining_views: number | null;
};

export function Dashboard() {
  const { user, loading } = useAuth();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  const dialog = useRef<HTMLDivElement>(null);

  async function load(before?: string) {
    setBusy(true);
    setError("");
    try {
      const data = await api(
        `/api/drops${before ? `?before=${encodeURIComponent(before)}` : ""}`,
      );
      setDrops((current) =>
        before ? [...current, ...data.drops] : data.drops,
      );
      setNext(data.next);
      setLoaded(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
      if (e.key === "Tab") {
        const elements = dialog.current?.querySelectorAll<HTMLElement>(
          "button, a[href], input",
        );
        if (!elements?.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [selected]);

  if (loading)
    return (
      <section className="narrow">
        <p>Loading your account…</p>
      </section>
    );

  if (!user)
    return (
      <section className="narrow center">
        <span className="eyebrow">YOUR OWN LITTLE SPACE</span>
        <h1>Keep your drops close.</h1>
        <p className="intro">
          Sign in to manage your drops, share them again, and make more room for
          your ideas.
        </p>
        <Link className="primary" href="/login">
          Sign in <ArrowUpRight size={16} />
        </Link>
      </section>
    );

  const active = drops.filter((d) => Date.parse(d.expires_at) > Date.now());

  return (
    <section className="dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">YOUR OWN LITTLE SPACE</span>
          <h1>
            My Drops<span className="count-badge">{active.length}</span>
          </h1>
          <p className="intro">Here for now. Yours to manage.</p>
        </div>
        <Link className="primary" href="/create">
          <Plus size={17} />
          New drop
        </Link>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}{" "}
          <button className="text-button" onClick={() => load()}>
            Retry
          </button>
        </p>
      )}
      {!loaded && !error && <p>Finding your drops…</p>}
      {loaded && !active.length && (
        <div className="empty-state">
          <span className="empty-symbol">↓</span>
          <h2>A clean slate.</h2>
          <p>Your active drops will appear here.</p>
          <Link className="text-button" href="/create">
            Create your first drop <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
      <div className="drop-list">
        {active.map((drop) => (
          <article className="drop-row" key={drop.id}>
            <div className="drop-row-icon">
              {drop.burn_after_reading ? <Flame size={20} /> : <span>↗</span>}
            </div>
            <div className="drop-row-info">
              <h2>
                Drop <span>{drop.id.slice(0, 8)}</span>
                {drop.protected && <LockKeyhole size={13} />}
              </h2>
              <p>
                Created{" "}
                {new Date(drop.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                · {remaining(drop.expires_at)}
                {drop.burn_after_reading && " · Burns after reading"}
                {!drop.burn_after_reading &&
                  drop.remaining_views !== null &&
                  ` · ${drop.remaining_views} opens left`}
              </p>
            </div>
            {deleting === drop.id ? (
              <div className="button-row">
                <span className="small">Delete permanently?</span>
                <button
                  className="danger"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api(`/api/drops/${drop.id}`, { method: "DELETE" });
                      setDrops((d) => d.filter((item) => item.id !== drop.id));
                      setDeleting(null);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Delete
                </button>
                <button
                  className="icon-button"
                  aria-label="Cancel deletion"
                  onClick={() => setDeleting(null)}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="button-row">
                <button
                  className="secondary"
                  onClick={() => setSelected(drop.id)}
                >
                  <QrCode size={15} />
                  Share
                </button>
                <button
                  className="icon-button"
                  aria-label={`Revoke drop ${drop.id}`}
                  onClick={() => setDeleting(drop.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {next && (
        <button
          className="secondary"
          disabled={busy}
          onClick={() => load(next)}
        >
          Load more
        </button>
      )}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div
            ref={dialog}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Share your drop"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              autoFocus
              className="modal-close icon-button"
              aria-label="Close sharing dialog"
              onClick={() => setSelected(null)}
            >
              <X size={20} />
            </button>
            <ShareCard id={selected} />
          </div>
        </div>
      )}
    </section>
  );
}
