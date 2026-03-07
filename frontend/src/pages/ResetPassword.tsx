import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/auth";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setToken((t) => t || tokenFromUrl);
  }, [tokenFromUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    const resetToken = token.trim();
    if (!resetToken) {
      setError("Invalid reset link. Request a new one from the forgot password page.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid or expired reset link. Request a new one.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="card" style={{ maxWidth: 400, margin: "2rem auto" }}>
        <h1 style={{ marginTop: 0 }}>Password reset</h1>
        <p className="success">Your password has been reset. Redirecting to log in…</p>
        <p style={{ marginTop: "1rem" }}>
          <Link to="/login">Log in now</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h1 style={{ marginTop: 0 }}>Set new password</h1>
      <form onSubmit={handleSubmit}>
        {!tokenFromUrl && (
          <div className="form-group">
            <label>Reset token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste the token from your email"
              required
            />
          </div>
        )}
        <div className="form-group">
          <label>New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="form-group">
          <label>Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        <Link to="/forgot-password">Request a new reset link</Link>
        {" · "}
        <Link to="/login">Back to log in</Link>
      </p>
    </div>
  );
}
