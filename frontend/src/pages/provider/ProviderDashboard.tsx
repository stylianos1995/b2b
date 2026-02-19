import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const shortcutCards = [
  { to: "/provider/products", label: "Products", desc: "Manage your catalog", icon: "📦", color: "#6366f1" },
  { to: "/provider/orders", label: "Orders", desc: "View and fulfill orders", icon: "📋", color: "#0ea5e9" },
  { to: "/provider/invoices", label: "Invoices", desc: "Create and track invoices", icon: "📄", color: "#8b5cf6" },
  { to: "/provider/profile", label: "Profile", desc: "Provider details & settings", icon: "👤", color: "#059669" },
];

export function ProviderDashboard() {
  const { user } = useAuth();
  const displayName = user?.first_name ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`.trim() : user?.email ?? "there";

  return (
    <div style={{ marginTop: 0 }} className="dashboard-page">
      <div
        className="dashboard-welcome-banner"
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
          borderRadius: 16,
          padding: "1.75rem 2rem",
          marginBottom: "1.75rem",
          color: "white",
          boxShadow: "0 10px 40px rgba(99,102,241,0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
            Welcome back, {displayName}
          </h1>
          <p style={{ margin: "0.5rem 0 0", opacity: 0.92, fontSize: "1rem" }}>
            Manage your products, orders, and invoices from one place.
          </p>
        </div>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 40,
            top: "50%",
            transform: "translateY(-50%)",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }}
        />
      </div>

      <h2 className="dashboard-section-title">Quick actions</h2>
      <div className="dashboard-quick-actions">
        {shortcutCards.map(({ to, label, desc, icon, color }) => (
          <Link
            key={to}
            to={to}
            style={{
              textDecoration: "none",
              color: "inherit",
              background: "white",
              borderRadius: 12,
              padding: "1.25rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
            }}
          >
            <div
              className="dashboard-quick-actions-icon"
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: color,
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                marginBottom: "0.75rem",
              }}
            >
              {icon}
            </div>
            <div className="dashboard-quick-actions-label">{label}</div>
            <div className="dashboard-quick-actions-desc">{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
