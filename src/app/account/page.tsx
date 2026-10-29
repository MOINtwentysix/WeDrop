"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole, Trash2, User as UserIcon, ShieldAlert, Check } from "lucide-react";
import { useAuth } from "@/components/app-shell";
import { api } from "@/lib/client";

export default function AccountPage() {
  const { user, loading, refresh } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [busyProfile, setBusyProfile] = useState(false);
  const [busyPassword, setBusyPassword] = useState(false);
  const [busyDelete, setBusyDelete] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [errorProfile, setErrorProfile] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorDelete, setErrorDelete] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  if (loading) {
    return (
      <section className="narrow">
        <p>Loading your account details…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="narrow center">
        <span className="eyebrow">ACCOUNT MANAGEMENT</span>
        <h1>Sign in required</h1>
        <p className="intro">Please sign in to access and manage your account settings.</p>
        <Link className="primary" href="/login">
          Sign in <ArrowUpRight size={16} />
        </Link>
      </section>
    );
  }

  return (
    <section className="narrow" style={{ marginTop: "40px", marginBottom: "80px" }}>
      <span className="eyebrow">ACCOUNT MANAGER</span>
      <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>Account Settings</h1>
      <p className="intro">Update your profile, change your password, or manage your account.</p>

      {/* Profile Details Form */}
      <form
        className="form-card"
        style={{ marginBottom: "24px" }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusyProfile(true);
          setErrorProfile("");
          setProfileMessage("");
          try {
            const res = await api("/api/account", {
              method: "PATCH",
              body: JSON.stringify({
                username: username.trim(),
                email: email.trim(),
              }),
            });
            setProfileMessage(res.message || "Profile updated successfully.");
            await refresh();
          } catch (err) {
            setErrorProfile((err as Error).message);
          } finally {
            setBusyProfile(false);
          }
        }}
      >
        <h2 style={{ fontSize: "18px", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <UserIcon size={18} />
          Profile Details
        </h2>

        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={30}
            placeholder="e.g. wedrop_user"
            pattern="^[a-zA-Z0-9_-]+$"
            title="Letters, numbers, underscores, and hyphens only."
          />
        </label>

        <label>
          Email Address
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            required
            placeholder="you@example.com"
          />
        </label>

        {errorProfile && <p role="alert" className="error">{errorProfile}</p>}
        {profileMessage && (
          <p className="feedback" style={{ color: "#4f752a", fontWeight: "bold" }}>
            <Check size={14} /> {profileMessage}
          </p>
        )}

        <button className="primary" disabled={busyProfile}>
          {busyProfile ? "Saving…" : "Save Profile"}
        </button>
      </form>

      {/* Password Change Form */}
      <form
        className="form-card"
        style={{ marginBottom: "32px" }}
        onSubmit={async (e) => {
          e.preventDefault();
          setBusyPassword(true);
          setErrorPassword("");
          setPasswordMessage("");
          try {
            const res = await api("/api/account", {
              method: "PATCH",
              body: JSON.stringify({
                currentPassword,
                newPassword,
              }),
            });
            setPasswordMessage(res.message || "Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
          } catch (err) {
            setErrorPassword((err as Error).message);
          } finally {
            setBusyPassword(false);
          }
        }}
      >
        <h2 style={{ fontSize: "18px", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <LockKeyhole size={18} />
          Change Password
        </h2>

        <label>
          Current Password
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="Enter current password"
          />
        </label>

        <label>
          New Password
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={12}
            maxLength={128}
            required
            placeholder="At least 12 characters"
          />
        </label>

        {errorPassword && <p role="alert" className="error">{errorPassword}</p>}
        {passwordMessage && (
          <p className="feedback" style={{ color: "#4f752a", fontWeight: "bold" }}>
            <Check size={14} /> {passwordMessage}
          </p>
        )}

        <button className="secondary" disabled={busyPassword}>
          {busyPassword ? "Updating…" : "Update Password"}
        </button>
      </form>

      {/* Delete Account Section */}
      <div className="form-card" style={{ borderColor: "#ebc5be", background: "#fffaf9" }}>
        <h2 style={{ fontSize: "18px", margin: "0 0 8px", color: "#a43c32", display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldAlert size={18} />
          Danger Zone
        </h2>
        <p className="subtle" style={{ margin: 0 }}>
          Permanently delete your account and all associated drops. This action cannot be undone.
        </p>

        {errorDelete && <p role="alert" className="error">{errorDelete}</p>}

        {!confirmDelete ? (
          <button
            className="danger"
            type="button"
            style={{ width: "fit-content", marginTop: "12px" }}
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 size={15} />
            Delete Account
          </button>
        ) : (
          <div style={{ marginTop: "12px", display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              className="danger"
              disabled={busyDelete}
              onClick={async () => {
                setBusyDelete(true);
                setErrorDelete("");
                try {
                  await api("/api/account", { method: "DELETE" });
                  await refresh();
                  window.location.assign("/");
                } catch (err) {
                  setErrorDelete((err as Error).message);
                  setBusyDelete(false);
                }
              }}
            >
              {busyDelete ? "Deleting…" : "Confirm Permanent Deletion"}
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
