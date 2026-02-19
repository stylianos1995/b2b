import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../api/auth";

export type SignUpAs = "supplier" | "business";

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpAs, setSignUpAs] = useState<SignUpAs>("business");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiRegister({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    }
  }

  if (success) {
    return (
      <div className="card" style={{ maxWidth: 400, margin: "2rem auto" }}>
        <p className="success">Account created. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h1 style={{ marginTop: 0 }}>Sign up</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>I am a</label>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="radio"
                name="signUpAs"
                value="business"
                checked={signUpAs === "business"}
                onChange={() => setSignUpAs("business")}
              />
              Business
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input
                type="radio"
                name="signUpAs"
                value="supplier"
                checked={signUpAs === "supplier"}
                onChange={() => setSignUpAs("supplier")}
              />
              Supplier
            </label>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            {signUpAs === "business"
              ? "I want to order from suppliers and manage my business."
              : "I supply products and need to manage my catalog and availability."}
          </p>
        </div>
        <div className="form-group">
          <label>First name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Last name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
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
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary">
          Create account
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
