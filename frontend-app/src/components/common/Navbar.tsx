import { useState } from "react";
import { Link } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-8">
          <Link
            to="/"
            className="shrink-0 text-xl font-bold tracking-tight text-slate-800"
          >
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              B2B Platform
            </span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-slate-600 hover:text-primary-600 transition-colors font-medium"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <Link
            to="/auth/select-role"
            className="btn-secondary text-sm py-2 px-4"
          >
            Sign In
          </Link>
          <Link to="/auth/login" className="btn-primary text-sm py-2 px-4">
            Log In
          </Link>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl p-2 text-slate-600 hover:bg-white/60 md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>
      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200/80 bg-white/90 backdrop-blur-xl px-4 py-4 shadow-soft md:hidden">
          <div className="flex flex-col gap-2">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg px-4 py-3 text-slate-700 hover:bg-slate-100 font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-3">
              <Link
                to="/auth/select-role"
                className="btn-secondary text-center"
                onClick={() => setMobileOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/auth/login"
                className="btn-primary text-center"
                onClick={() => setMobileOpen(false)}
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
