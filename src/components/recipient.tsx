"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, LockKeyhole, Copy, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/client";

type Meta = {
  protected: boolean;
  burn_after_reading: boolean;
  expires_at: string;
  remaining_views: number | null;
};

export function Recipient({ id }: { id: string }) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;
    api(`/api/drops/${id}`)
      .then((data) => {
        if (active) setMeta(data);
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setMissing(e.message.includes("expired"));
        }
      });
    const clear = () => {
      setContent(null);
      setPassword("");
    };
    window.addEventListener("pagehide", clear);
    return () => {
      active = false;
      window.removeEventListener("pagehide", clear);
    };
  }, [id]);

  if (missing)
    return (
      <section className="narrow center">
        <span className="empty-symbol">↗</span>
        <h1>Here for a moment.</h1>
        <p className="intro">This drop has expired or was burned.</p>
        <Link className="primary" href="/create">
          Create a new drop <ArrowUpRight size={16} />
        </Link>
      </section>
    );

  if (!meta)
    return (
      <section className="narrow center">
        <p role="status">{error || "Finding your drop…"}</p>
        {error && (
          <button className="secondary" onClick={() => location.reload()}>
            Try again
          </button>
        )}
      </section>
    );

  return (
    <section className={content === null ? "narrow" : "recipient-section"}>
      <span className="eyebrow">SOMETHING SHARED WITH YOU</span>
      <h1>
        {content === null
          ? "A little something awaits."
          : "A drop, just for you."}
      </h1>
      {content === null ? (
        <form
          className="form-card"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const data = await api(`/api/drops/${id}`, {
                method: "POST",
                body: JSON.stringify({ password }),
              });
              setContent(data.content);
              setMeta((current) =>
                current
                  ? { ...current, remaining_views: data.remaining_views }
                  : current,
              );
              setPassword("");
            } catch (e) {
              setError((e as Error).message);
              if ((e as Error).message.includes("expired")) setMissing(true);
            } finally {
              setBusy(false);
            }
          }}
        >
          {!meta.burn_after_reading && meta.remaining_views !== null && (
            <div className="burn-notice">
              <Flame size={20} />
              <p>
                This drop has {meta.remaining_views} opens remaining. It will be
                deleted after the final reveal.
              </p>
            </div>
          )}
          {meta.burn_after_reading && (
            <div className="burn-notice">
              <Flame size={20} />
              <div>
                <strong>One view. Make it count.</strong>
                <p>
                  This drop will be destroyed after viewing. It cannot be
                  reopened, even if the connection is interrupted.
                </p>
              </div>
            </div>
          )}
          {meta.protected && (
            <label>
              <span>
                <LockKeyhole size={14} />
                This drop is password protected.
              </span>
              <input
                type="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
                required
                placeholder="Enter the drop password"
              />
            </label>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Opening…" : "Reveal drop"}
            <ArrowUpRight size={16} />
          </button>
        </form>
      ) : (
        <>
          <div className="content-toolbar">
            <span>
              {meta.remaining_views === 0
                ? "Deleted after its final reveal. This is your only copy."
                : meta.remaining_views !== null
                  ? `${meta.remaining_views} opens remaining`
                  : "Shared text"}
            </span>
            <button
              className="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(content);
                  setFeedback("Copied to clipboard.");
                } catch {
                  setFeedback("Select the text and copy it manually.");
                }
              }}
            >
              <Copy size={15} />
              Copy All
            </button>
          </div>
          <pre className="drop-content">
            <code>{content}</code>
          </pre>
          <p role="status" className="feedback">
            {feedback}
          </p>
        </>
      )}
    </section>
  );
}
