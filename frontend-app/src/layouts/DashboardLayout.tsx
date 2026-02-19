import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";

interface DashboardLayoutProps {
  type: "business" | "provider";
}

export function DashboardLayout({ type }: DashboardLayoutProps) {
  const title = type === "business" ? "Business" : "Provider";
  const basePath =
    type === "business" ? "/business/dashboard" : "/provider/dashboard";

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 z-40 h-full w-56 border-r border-slate-200 bg-white/90 backdrop-blur-xl shadow-soft">
        <div className="flex h-full flex-col p-4">
          <Link to="/" className="mb-8 text-lg font-bold text-slate-800">
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              B2B Platform
            </span>
          </Link>
          <nav className="flex flex-col gap-1">
            <Link
              to={basePath}
              className="rounded-xl px-4 py-3 font-medium text-primary-600 bg-primary-50"
            >
              Dashboard
            </Link>
            <span className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {title} area
            </span>
          </nav>
        </div>
      </aside>
      <main className="pl-56">
        <div className="min-h-screen p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
