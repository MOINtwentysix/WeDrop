"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { api } from "@/lib/client";

export function AuthForm({ register = false }: { register?: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <section className="narrow">
      <span className="eyebrow">A LITTLE MORE WEDROP</span>
      <h1>{register ? "Make room for more." : "Welcome back."}</h1>
      <p className="intro">
        {register
          ? "Longer expirations. Bigger ideas. All your drops in one place."
          : "Your little corner of the internet is waiting."}
      </p>
      <form
        className="form-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const form = new FormData(e.currentTarget);
          const email = form.get("email");
          const password = form.get("password");
          const username = form.get("username");
          const terms = form.get("terms");

          if (register && !terms) {
            setError("Please agree to the Privacy Policy and Terms of Service.");
            setBusy(false);
            return;
          }

          try {
            await api(`/api/auth/${register ? "register" : "login"}`, {
              method: "POST",
              body: JSON.stringify({
                email,
                password,
                ...(register && username ? { username } : {}),
              }),
            });
            window.location.assign("/my-drops");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {register && (
          <label>
            Username (optional)
            <input
              type="text"
              name="username"
              autoComplete="username"
              minLength={3}
              maxLength={30}
              placeholder="e.g. wedrop_user"
              pattern="^[a-zA-Z0-9_-]+$"
              title="Letters, numbers, underscores, and hyphens only."
            />
          </label>
        )}
        <label>
          Email address
          <input
            type="email"
            name="email"
            autoComplete="email"
            maxLength={254}
            required
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={12}
            maxLength={128}
            required
            placeholder="At least 12 characters"
          />
        </label>
        {register && (
          <label className="terms-label">
            <input type="checkbox" name="terms" required />
            <span>
              I agree to the{" "}
              <a
                href="https://moin26.dev/rechtliches/datenschutz/wedrop/"
                target="_blank"
                rel="noreferrer"
                title="Datenschutzerklärung"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="https://moin26.dev/rechtliches/nutzungsbedingungen/wedrop/"
                target="_blank"
                rel="noreferrer"
                title="Nutzungsbedingungen"
              >
                Terms of Service
              </a>
              .
            </span>
          </label>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
          <ArrowUpRight size={17} />
        </button>
        <p className="small subtle">
          <LockKeyhole size={13} />
          Your password is securely hashed.
        </p>
      </form>
      <p className="center subtle">
        {register ? "Already have an account?" : "New around here?"}{" "}
        <Link href={register ? "/login" : "/register"}>
          {register ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
