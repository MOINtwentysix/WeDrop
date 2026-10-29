"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Clock3,
  Code2,
  Flame,
  Github,
  LockKeyhole,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "./app-shell";

export function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("title") || params.has("text") || params.has("url")) {
      router.replace(`/create?${params.toString()}`);
    }
  }, [router]);

  const sourceUrl =
    process.env.NEXT_PUBLIC_SOURCE_URL ||
    "https://github.com/search?q=wedrop&type=repositories";

  const codePreviewText =
    "// Paste code, share notes, send ideas instantly\nconst drop = {\n  ephemeral: true,\n  expiration: \"24h\", // or burn after reading\n  passwordProtected: true,\n};";

  return (
    <div className="landing-page">
      <section className="hero">
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
        <div className="button-row hero-buttons">
          <Link className="primary" href="/create">
            Create a drop <ArrowUpRight size={18} />
          </Link>
          {user ? (
            <Link className="secondary" href="/my-drops">
              My Drops
            </Link>
          ) : (
            <Link className="secondary" href="/login">
              Sign in
            </Link>
          )}
        </div>
      </section>

      {/* Product Preview Card (Read-only showcase, no drop creation form) */}
      <section className="composer landing-preview" aria-label="Drop Preview Showcase">
        <div className="editor-top">
          <span>
            <Code2 size={16} />
            Your next little drop
          </span>
        </div>
        <div className="editor-area">
          <span className="line-number" aria-hidden="true">
            01
          </span>
          <pre className="preview-code">
            {codePreviewText}
          </pre>
        </div>
        <div className="composer-settings preview-settings">
          <div className="preview-badges">
            <span className="preview-badge-item">
              <Clock3 size={15} /> 24 Hours or Burn
            </span>
            <span className="preview-badge-item">
              <LockKeyhole size={14} /> Password Protection
            </span>
          </div>
          <Link className="primary create-button" href="/create">
            Open Editor <ArrowUpRight size={18} />
          </Link>
        </div>
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

      {/* Modern Features Grid */}
      <section className="feature-grid feature-grid-landing" aria-label="Why WeDrop">
        <div>
          <span className="feature-icon">
            <Zap size={19} />
          </span>
          <h3>Instant &amp; Simple</h3>
          <p>
            No attachments, no setup required.
            <br />
            Just paste your text and share a clean link.
          </p>
        </div>
        <div>
          <span className="feature-icon">
            <Flame size={19} />
          </span>
          <h3>Ephemeral &amp; Private</h3>
          <p>
            Set links to expire after time or single opens.
            <br />
            Once expired, it’s deleted forever.
          </p>
        </div>
        <div>
          <span className="feature-icon">
            <LockKeyhole size={19} />
          </span>
          <h3>Optional Password</h3>
          <p>
            Add password protection to sensitive drops
            <br />
            for extra peace of mind.
          </p>
        </div>
      </section>

      {/* Self-Hosting Card */}
      <section className="form-card self-host-card">
        <div className="self-host-info">
          <span className="self-host-eyebrow">
            <Server size={14} /> SELF-HOSTABLE &amp; OPEN SOURCE
          </span>
          <h2 className="self-host-title">
            Run WeDrop on your own server.
          </h2>
          <p className="subtle self-host-desc">
            Take 100% control of your data. WeDrop is licensed under AGPLv3 and can be easily deployed with Next.js and Neon Postgres or any PostgreSQL database.
          </p>
        </div>
        <a
          className="secondary self-host-btn"
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          <Github size={16} /> View on GitHub <ArrowUpRight size={14} />
        </a>
      </section>
    </div>
  );
}
