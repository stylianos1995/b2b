import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Footer } from "./Footer";

function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName)
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  if (firstName) return firstName.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function Layout() {
  const { user, logout } = useAuth();
  const initials = user
    ? getInitials(user.first_name, user.last_name, user.email)
    : "";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <nav
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
          color: "white",
          padding: "0.625rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        }}
      >
        <Link
          to="/"
          style={{
            color: "white",
            fontWeight: 700,
            fontSize: "1.125rem",
            letterSpacing: "-0.02em",
            textDecoration: "none",
          }}
        >
          B2B Marketplace
        </Link>
        {user ? (
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "linear-gradient(145deg, #0ea5e9 0%, #6366f1 100%)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8125rem",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(14,165,233,0.4)",
                flexShrink: 0,
              }}
              title={user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.email}
            >
              {initials}
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={logout}
              style={{
                padding: "0.4rem 0.9rem",
                fontSize: "0.8125rem",
                fontWeight: 500,
                borderRadius: 8,
                background: "rgba(255,255,255,0.15)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link
              to="/"
              style={{
                color: "rgba(255,255,255,0.92)",
                fontSize: "0.9375rem",
                textDecoration: "none",
              }}
            >
              Home
            </Link>
            <Link
              to="/about"
              style={{
                color: "rgba(255,255,255,0.92)",
                fontSize: "0.9375rem",
                textDecoration: "none",
              }}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              style={{
                color: "rgba(255,255,255,0.92)",
                fontSize: "0.9375rem",
                textDecoration: "none",
              }}
            >
              Contact
            </Link>
            <span
              style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}
            >
              <Link
                to="/register"
                className="btn btn-secondary"
                style={{
                  padding: "0.4rem 0.9rem",
                  fontSize: "0.875rem",
                  color: "#1e293b",
                  textDecoration: "none",
                  borderRadius: 8,
                }}
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="btn btn-primary"
                style={{
                  padding: "0.4rem 0.9rem",
                  fontSize: "0.875rem",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: 8,
                }}
              >
                Log In
              </Link>
            </span>
          </>
        )}
      </nav>
      <main
        style={{
          paddingTop: 0,
          paddingBottom: "2rem",
          flex: 1,
        }}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
