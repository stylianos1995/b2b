import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const shortcutCards = [
  { to: "/buyer/discover", label: "Discover suppliers", desc: "Browse and order from providers", icon: "🔍", color: "#0ea5e9" },
  { to: "/buyer/orders", label: "My Orders", desc: "Track and manage your orders", icon: "📦", color: "#6366f1" },
  { to: "/buyer/invoices", label: "My Invoices", desc: "View and pay invoices", icon: "📄", color: "#8b5cf6" },
  { to: "/buyer/business", label: "My Business", desc: "Company details & delivery addresses", icon: "🏢", color: "#059669" },
];

export function BuyerDashboard() {
  const { user, businessId } = useAuth();
  const displayName = user?.first_name ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ""}`.trim() : user?.email ?? "there";

  return (
    <div style={{ marginTop: 0 }} className="dashboard-page">
      <div
        className="dashboard-welcome-banner"
        style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)",
          borderRadius: 16,
          padding: "1.75rem 2rem",
          marginBottom: "1.75rem",
          color: "white",
          boxShadow: "0 10px 40px rgba(14,165,233,0.25)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
            Welcome back, {displayName}
          </h1>
          <p style={{ margin: "0.5rem 0 0", opacity: 0.92, fontSize: "1rem" }}>
            Manage your business, discover suppliers, and track orders from one place.
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

      {!businessId && (
        <div
          className="dashboard-card dashboard-card--accent"
          style={{ marginBottom: "1.75rem" }}
        >
          <p style={{ margin: "0 0 0.75rem", fontWeight: 500 }}>
            Add your business and delivery address to start ordering.
          </p>
          <Link
            to="/buyer/business"
            className="btn btn-primary"
            style={{ borderRadius: 8, padding: "0.5rem 1.25rem" }}
          >
            Add business
          </Link>
        </div>
      )}

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
