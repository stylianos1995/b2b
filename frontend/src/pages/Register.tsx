import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as apiRegister } from "../api/auth";

export type SignUpAs = "supplier" | "business";

// Common countries for dropdown (ISO 3166-1 alpha-2 code + name)
const COUNTRIES: { code: string; name: string }[] = [
  { code: "", name: "Select country" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "PT", name: "Portugal" },
  { code: "PL", name: "Poland" },
  { code: "GR", name: "Greece" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "ZA", name: "South Africa" },
  { code: "NZ", name: "New Zealand" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
  { code: "RO", name: "Romania" },
  { code: "HU", name: "Hungary" },
  { code: "CZ", name: "Czech Republic" },
  { code: "BG", name: "Bulgaria" },
  { code: "HR", name: "Croatia" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "EE", name: "Estonia" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "MT", name: "Malta" },
  { code: "CY", name: "Cyprus" },
  { code: "LU", name: "Luxembourg" },
];

export function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
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
        ...(phone.trim() && { phone: phone.trim() }),
        ...(country && { country }),
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
          <label>Phone (mobile)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +44 7700 900000"
            autoComplete="tel"
          />
        </div>
        <div className="form-group">
          <label>Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #cbd5e1" }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code || "empty"} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
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
