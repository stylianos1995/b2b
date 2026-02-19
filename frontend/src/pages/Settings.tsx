import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  updateProfile,
  changePassword,
  changeEmail,
  deleteAccount,
  type UpdateProfileBody,
  type ChangePasswordBody,
  type ChangeEmailBody,
} from "../api/auth";

export function Settings() {
  const { user, refreshUser, logout } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UpdateProfileBody>({
    first_name: user?.first_name ?? "",
    last_name: user?.last_name ?? "",
    phone: user?.phone ?? "",
  });
  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        phone: user.phone ?? "",
      });
    }
  }, [user?.user_id, user?.first_name, user?.last_name, user?.phone]);

  const [pwSuccess, setPwSuccess] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwForm, setPwForm] = useState<ChangePasswordBody & { confirm: string }>({
    current_password: "",
    new_password: "",
    confirm: "",
  });

  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailForm, setEmailForm] = useState<ChangeEmailBody>({
    new_email: "",
    password: "",
  });
  const [showEmailForm, setShowEmailForm] = useState(false);

  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePending, setDeletePending] = useState(false);

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    try {
      await updateProfile(profile);
      setProfileSuccess("Profile updated.");
      await refreshUser();
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Update failed");
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError("New password and confirmation do not match.");
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    try {
      await changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setPwSuccess("Password changed.");
      setPwForm({ current_password: "", new_password: "", confirm: "" });
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Failed to change password");
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);
    try {
      const res = await changeEmail(emailForm);
      setEmailSuccess(`Email updated to ${res.email}.`);
      setEmailForm({ new_email: "", password: "" });
      setShowEmailForm(false);
      await refreshUser();
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : "Failed to change email");
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== "delete my account") {
      setDeleteError('Type "delete my account" to confirm.');
      return;
    }
    setDeleteError(null);
    setDeletePending(true);
    try {
      await deleteAccount({ password: deletePassword });
      logout();
      window.location.href = "/";
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Failed to delete account");
      setDeletePending(false);
    }
  }

  if (!user) return null;

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Settings</h1>
      <p className="dashboard-subtitle">Manage your profile, password, and account.</p>

      {/* Profile */}
      <section className="dashboard-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.125rem", fontWeight: 600, color: "#1e293b" }}>Profile</h2>
        {profileSuccess && <p className="success">{profileSuccess}</p>}
        {profileError && <p className="error">{profileError}</p>}
        <form onSubmit={handleProfile}>
          <div className="form-group">
            <label>First name</label>
            <input
              value={profile.first_name ?? ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, first_name: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Last name</label>
            <input
              value={profile.last_name ?? ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, last_name: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={profile.phone ?? ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, phone: e.target.value || undefined }))
              }
              placeholder="Optional"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={user.email}
              readOnly
              disabled
              style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}
            />
            {!showEmailForm ? (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: "0.5rem" }}
                onClick={() => setShowEmailForm(true)}
              >
                Change email
              </button>
            ) : (
              <div style={{ marginTop: "0.75rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "8px" }}>
                <form onSubmit={handleEmail}>
                  <div className="form-group">
                    <label>New email</label>
                    <input
                      type="email"
                      value={emailForm.new_email}
                      onChange={(e) =>
                        setEmailForm((f) => ({ ...f, new_email: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Current password</label>
                    <input
                      type="password"
                      value={emailForm.password}
                      onChange={(e) =>
                        setEmailForm((f) => ({ ...f, password: e.target.value }))
                      }
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  {emailSuccess && <p className="success">{emailSuccess}</p>}
                  {emailError && <p className="error">{emailError}</p>}
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button type="submit" className="btn btn-primary">
                      Save new email
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowEmailForm(false);
                        setEmailForm({ new_email: "", password: "" });
                        setEmailError(null);
                        setEmailSuccess(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            Save profile
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className="dashboard-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.125rem", fontWeight: 600, color: "#1e293b" }}>Change password</h2>
        {pwSuccess && <p className="success">{pwSuccess}</p>}
        {pwError && <p className="error">{pwError}</p>}
        <form onSubmit={handlePassword}>
          <div className="form-group">
            <label>Current password</label>
            <input
              type="password"
              value={pwForm.current_password}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, current_password: e.target.value }))
              }
              required
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <label>New password</label>
            <input
              type="password"
              value={pwForm.new_password}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, new_password: e.target.value }))
              }
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label>Confirm new password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) =>
                setPwForm((f) => ({ ...f, confirm: e.target.value }))
              }
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Change password
          </button>
        </form>
      </section>

      {/* Delete account */}
      <section className="dashboard-card" style={{ marginBottom: "1.5rem", borderLeft: "4px solid #dc2626" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.125rem", fontWeight: 600, color: "#dc2626" }}>Delete account</h2>
        <p style={{ color: "var(--text-muted)" }}>
          This will permanently deactivate your account. You will be logged out and your email will be released. This action cannot be undone.
        </p>
        {deleteError && <p className="error">{deleteError}</p>}
        <div className="form-group">
          <label>Type &quot;delete my account&quot; to confirm</label>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="delete my account"
            style={{ fontFamily: "inherit" }}
          />
        </div>
        <div className="form-group">
          <label>Your password</label>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
          />
        </div>
        <button
          type="button"
          className="btn"
          style={{
            background: "var(--error, #dc2626)",
            color: "white",
            border: "none",
          }}
          disabled={deletePending || deleteConfirm !== "delete my account" || !deletePassword}
          onClick={handleDelete}
        >
          {deletePending ? "Deleting…" : "Delete my account"}
        </button>
      </section>
    </div>
  );
}
