"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Flame,
  LockKeyhole,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "./app-shell";
import { ShareCard } from "./share-card";
import { api } from "@/lib/client";
const options = [
  { value: "30m", label: "30 Minutes", detail: "Just passing through" },
  {
    value: "1h",
    label: "1 Hour",
    detail: "A little time to connect",
    account: true,
  },
  { value: "24h", label: "24 Hours", detail: "Here today, gone tomorrow" },
  {
    value: "burn",
    label: "Burn after reading",
    detail: "One view. Then it’s gone.",
  },
  {
    value: "48h",
    label: "48 Hours",
    detail: "A little more time",
    account: true,
  },
  {
    value: "7d",
    label: "7 Days",
    detail: "Keep it for the week",
    account: true,
  },
];
export function Editor() {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const { user, loading } = useAuth();
  const [content, setContent] = useState("");
  const [expiration, setExpiration] = useState("24h");
  const [deletionMode, setDeletionMode] = useState("time");
  const [maxViews, setMaxViews] = useState("1");
  const [password, setPassword] = useState("");
  const [protect, setProtect] = useState(false);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{
    id: string;
    burn_after_reading: boolean;
    remaining_views: number | null;
  } | null>(null);
  useEffect(() => {
    if (!textarea.current) return;
    textarea.current.style.height = "auto";
    textarea.current.style.height = `${Math.min(520, textarea.current.scrollHeight)}px`;
  }, [content, created]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const text = [params.get("title"), params.get("text"), params.get("url")]
      .filter(Boolean)
      .join("\n\n");
    if (text) {
      setContent(text);
      history.replaceState(null, "", "/");
    }
  }, []);
  const max = user ? 200000 : 50000;
  const count = Array.from(content).length;
  if (created)
    return (
      <section className="result-section">
        <div className="success-icon">
          <Check />
        </div>
        <span className="eyebrow">YOUR DROP IS LIVE</span>
        <h1>
          Good things are
          <br />
          <span>meant to be shared.</span>
        </h1>
        <ShareCard id={created.id} />
        {created.remaining_views !== null && created.remaining_views > 1 && (
          <p className="subtle">
            This drop will be deleted after {created.remaining_views} successful
            opens.
          </p>
        )}
        {created.burn_after_reading && (
          <p className="subtle">
            <Flame size={15} />
            This drop will be destroyed after its first reveal.
          </p>
        )}
        <button
          className="text-button"
          onClick={() => {
            setCreated(null);
            setContent("");
            setPassword("");
          }}
        >
          Create another drop <ArrowUpRight size={16} />
        </button>
      </section>
    );
  return (
    <>
      <section className="hero">
        <div className="pill">
          <span />
          LESS FRICTION. MORE CONNECTION.
        </div>
        <h1>
          Drop it.
          <br />
          <span>Share it.</span>
          <span className="hero-asterisk" aria-hidden="true">
            ✳
          </span>
        </h1>
        <p>
          A thought, a snippet, a little something.
          <br />
          Give it a link. Send it on. Let it disappear.
        </p>
      </section>
      <section className="composer" aria-label="Create a drop">
        <div className="editor-top">
          <span>
            <Code2 size={16} />
            Your next little drop
          </span>
          <span className="plain-badge">PLAIN TEXT / CODE</span>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              const data = await api("/api/drops", {
                method: "POST",
                body: JSON.stringify({
                  content,
                  expiration: deletionMode === "views" ? "burn" : expiration,
                  ...(deletionMode === "views"
                    ? { maxViews: Number(maxViews) }
                    : {}),
                  password: protect ? password : "",
                }),
              });
              setCreated(data);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="editor-area">
            <span className="line-number" aria-hidden="true">
              01
            </span>
            <label className="sr-only" htmlFor="content">
              Your text or code
            </label>
            <textarea
              ref={textarea}
              id="content"
              spellCheck={false}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                "Paste your code. Write a note.\nLeave something worth sharing."
              }
            />
          </div>
          <div className="editor-bottom">
            <span className={count > max ? "over-limit" : ""}>
              {count.toLocaleString("en-US")} / {max.toLocaleString("en-US")}{" "}
              characters
            </span>
            <button
              className="text-button small"
              type="button"
              onClick={() => setContent("")}
              disabled={!content}
            >
              Clear <X size={12} />
            </button>
          </div>
          <div className="composer-settings">
            <div className="expiry-control">
              <span className="field-label">WHEN SHOULD IT DISAPPEAR?</span>
              <select
                className="deletion-mode"
                aria-label="Deletion mode"
                value={deletionMode}
                onChange={(e) => {
                  setDeletionMode(e.target.value);
                  setMenu(false);
                }}
              >
                <option value="time">After a time</option>
                <option value="views">After a number of opens</option>
              </select>
              {deletionMode === "views" ? (
                <label className="view-limit">
                  Delete after{" "}
                  <input
                    aria-label="Maximum opens"
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    required
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                  />{" "}
                  opens
                </label>
              ) : (
                <>
                  <button
                    className="expiry-button"
                    type="button"
                    aria-expanded={menu}
                    aria-controls="expiry-options"
                    onClick={() => setMenu(!menu)}
                  >
                    <Clock3 size={17} />
                    {options.find((o) => o.value === expiration)?.label}
                    <ChevronDown size={15} />
                  </button>
                  {menu && (
                    <div id="expiry-options" className="expiry-menu">
                      {options
                        .filter((option) => option.value !== "burn")
                        .map((option) => (
                          <button
                            type="button"
                            key={option.value}
                            onClick={() => {
                              if (option.account && !user) {
                                setError(
                                  "Sign in to unlock longer expirations.",
                                );
                                return;
                              }
                              setExpiration(option.value);
                              setMenu(false);
                            }}
                            aria-disabled={option.account && !user}
                          >
                            <span>
                              {option.label}
                              <small>{option.detail}</small>
                            </span>
                            {option.account && !user ? (
                              <LockKeyhole size={14} />
                            ) : (
                              expiration === option.value && <Check size={15} />
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </>
              )}
              {deletionMode === "views" && (
                <small className="view-retention">
                  Also expires after {user ? "7 days" : "24 hours"}.
                </small>
              )}
            </div>
            <div className="password-control">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={protect}
                  onChange={(e) => setProtect(e.target.checked)}
                />
                <LockKeyhole size={14} />
                Protect with password (optional)
              </label>
              {protect && (
                <input
                  aria-label="Drop password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Add a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={1}
                  maxLength={128}
                  required
                />
              )}
            </div>
            <button
              className="primary create-button"
              type="submit"
              disabled={busy || loading || !content.trim() || count > max}
            >
              {busy ? "Creating…" : "Create drop"}
              <ArrowUpRight size={18} />
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>
      <div className="under-editor">
        <span>
          <ShieldCheck size={14} />
          Ephemeral by design.
        </span>
        {!user && (
          <span>
            Need more room?{" "}
            <Link href="/register">
              Create a free account <ArrowUpRight size={12} />
            </Link>
          </span>
        )}
      </div>
      <section className="feature-grid" aria-label="Why WeDrop">
        <div>
          <span className="feature-icon">
            <Zap size={19} />
          </span>
          <h3>From here to anywhere.</h3>
          <p>
            No attachments, no extra steps.
            <br />
            Just your words and a link.
          </p>
        </div>
        <div>
          <span className="feature-icon">
            <Clock3 size={19} />
          </span>
          <h3>A moment, not forever.</h3>
          <p>
            Choose when it disappears.
            <br />
            We’ll take care of the goodbye.
          </p>
        </div>
        <div>
          <span className="feature-icon">
            <Code2 size={19} />
          </span>
          <h3>Made for the little things.</h3>
          <p>
            Code snippets, quick notes,
            <br />
            and everything in between.
          </p>
        </div>
      </section>
    </>
  );
}
