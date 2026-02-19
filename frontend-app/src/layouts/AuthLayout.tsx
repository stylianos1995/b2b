import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-accent-50/40">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex justify-between items-center">
          <Link
            to="/"
            className="text-lg font-bold text-slate-800 hover:text-primary-600 transition-colors"
          >
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              B2B Platform
            </span>
          </Link>
          <Link
            to="/auth/login"
            className="text-sm font-medium text-slate-600 hover:text-primary-600"
          >
            Already have an account? Log in
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center py-12">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
