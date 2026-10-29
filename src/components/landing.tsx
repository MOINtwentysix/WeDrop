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
  CheckCircle2,
  KeyRound,
  FileCode2,
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
      {/* Hero Section */}
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

      {/* Product Preview Card (Showcase) */}
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

      {/* How WeDrop Works Section */}
      <section className="landing-section" style={{ marginTop: "64px" }}>
        <span className="eyebrow">SIMPLE 3-STEP PROCESS</span>
        <h2 style={{ fontSize: "28px", fontWeight: 500, letterSpacing: "-1px", margin: "12px 0 32px" }}>
          How WeDrop Works
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
          <div className="form-card" style={{ padding: "24px" }}>
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#80944f" }}>01</span>
            <h3 style={{ fontSize: "16px", margin: "8px 0" }}>Write or Paste</h3>
            <p className="subtle" style={{ margin: 0, fontSize: "12px" }}>
              Paste code snippets, plain text, credentials, or quick thoughts into the editor.
            </p>
          </div>
          <div className="form-card" style={{ padding: "24px" }}>
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#80944f" }}>02</span>
            <h3 style={{ fontSize: "16px", margin: "8px 0" }}>Set Expiration</h3>
            <p className="subtle" style={{ margin: 0, fontSize: "12px" }}>
              Choose a time window (30m to 7d) or set a view limit ("Burn after reading").
            </p>
          </div>
          <div className="form-card" style={{ padding: "24px" }}>
            <span style={{ fontSize: "24px", fontWeight: "bold", color: "#80944f" }}>03</span>
            <h3 style={{ fontSize: "16px", margin: "8px 0" }}>Share &amp; Disappear</h3>
            <p className="subtle" style={{ margin: 0, fontSize: "12px" }}>
              Send your generated link or QR code. Once read or expired, it’s deleted permanently.
            </p>
          </div>
        </div>
      </section>

      {/* Security & Use Cases Grid */}
      <section className="landing-section" style={{ marginTop: "56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px" }}>
          {/* Security Box */}
          <div className="form-card" style={{ padding: "28px" }}>
            <span className="eyebrow" style={{ color: "#6c814d" }}>SECURITY FIRST</span>
            <h3 style={{ fontSize: "20px", margin: "8px 0 16px" }}>Built for Privacy &amp; Peace of Mind</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#475245" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckCircle2 size={16} color="#6c814d" /> Atomic SQL deletion on final view or expiry
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckCircle2 size={16} color="#6c814d" /> Scrypt password hashing for protected drops
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <CheckCircle2 size={16} color="#6c814d" /> Zero analytics, tracking, or file upload risks
              </li>
            </ul>
          </div>

          {/* Use Cases Box */}
          <div className="form-card" style={{ padding: "28px" }}>
            <span className="eyebrow" style={{ color: "#6c814d" }}>VERSATILE SHARING</span>
            <h3 style={{ fontSize: "20px", margin: "8px 0 16px" }}>Made for Everyday Workflows</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#475245" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <KeyRound size={16} color="#6c814d" /> Pass API keys, tokens &amp; credentials safely
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FileCode2 size={16} color="#6c814d" /> Share quick code snippets &amp; debug logs
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Zap size={16} color="#6c814d" /> Send temporary notes across devices instantly
              </li>
            </ul>
          </div>
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
