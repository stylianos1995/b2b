import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";

type DashboardLayoutProps = {
  type: "buyer" | "provider";
};

const buyerNav = [
  { to: "/buyer/business", end: false, label: "My Business", icon: "🏢" },
  { to: "/buyer/discover", end: false, label: "Discover", icon: "🔍" },
  { to: "/buyer/orders", end: false, label: "My Orders", icon: "📦" },
  { to: "/buyer/invoices", end: false, label: "My Invoices", icon: "📄" },
  { to: "/buyer/settings", end: false, label: "Settings", icon: "⚙️" },
];

const providerNav = [
  { to: "/provider/profile", end: false, label: "Profile", icon: "👤" },
  { to: "/provider/products", end: false, label: "Products", icon: "📦" },
  { to: "/provider/orders", end: false, label: "Orders", icon: "📋" },
  { to: "/provider/invoices", end: false, label: "Invoices", icon: "📄" },
  { to: "/provider/settings", end: false, label: "Settings", icon: "⚙️" },
];

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.5rem 0.75rem",
  borderRadius: 8,
  color: isActive ? "#0f172a" : "#475569",
  background: isActive
    ? "linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(99,102,241,0.08) 100%)"
    : "transparent",
  fontWeight: isActive ? 600 : 500,
  textDecoration: "none",
  fontSize: "0.875rem",
  transition: "background 0.15s ease, color 0.15s ease",
  borderLeft: isActive ? "3px solid #0ea5e9" : "3px solid transparent",
});

export function DashboardLayout({ type }: DashboardLayoutProps) {
  const links = type === "buyer" ? buyerNav : providerNav;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add("dashboard-sidebar-open");
    } else {
      document.body.classList.remove("dashboard-sidebar-open");
    }
    return () => document.body.classList.remove("dashboard-sidebar-open");
  }, [sidebarOpen]);

  return (
    <div className="dashboard-layout">
      {/* Mobile: menu button */}
      <header className="dashboard-mobile-header" aria-label="Dashboard menu">
        <button
          type="button"
          className="dashboard-mobile-menu-btn"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          aria-expanded={sidebarOpen}
        >
          <span className="dashboard-mobile-menu-icon" />
          <span className="dashboard-mobile-menu-label">Menu</span>
        </button>
      </header>

      {/* Sidebar: off-canvas on mobile, fixed overlay when open */}
      <aside
        className={`dashboard-sidebar ${sidebarOpen ? "dashboard-sidebar--open" : ""}`}
        aria-hidden={!sidebarOpen}
      >
        <div className="dashboard-sidebar-accent" />
        <nav className="dashboard-sidebar-nav">
          {links.map(({ to, end, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="dashboard-nav-link"
              style={navLinkStyle}
              onClick={closeSidebar}
            >
              <span className="dashboard-nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay: tap to close sidebar on mobile */}
      <div
        className={`dashboard-sidebar-overlay ${sidebarOpen ? "dashboard-sidebar-overlay--visible" : ""}`}
        onClick={closeSidebar}
        onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
        role="button"
        tabIndex={-1}
        aria-label="Close menu"
      />

      <main className="dashboard-main">
        <div className="dashboard-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
