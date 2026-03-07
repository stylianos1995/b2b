import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="card" style={{ maxWidth: 400, margin: "2rem auto" }}>
        <h1 style={{ marginTop: 0 }}>Check your email</h1>
        <p className="success">
          If an account exists for that email, we’ve sent a link to reset your password.
          The link expires in 1 hour.
        </p>
        <p style={{ marginTop: "1rem" }}>
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h1 style={{ marginTop: 0 }}>Forgot password</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>
        Enter your email and we’ll send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        <Link to="/login">Back to log in</Link>
      </p>
    </div>
  );
}
