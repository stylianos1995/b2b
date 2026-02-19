import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function SelectRolePage() {
  const navigate = useNavigate();
  const { setRole } = useAuth();

  const handleSelect = (role: "business" | "provider") => {
    setRole(role);
    navigate("/auth/register");
  };

  return (
    <div className="w-full max-w-lg">
      <div className="card-glass rounded-3xl p-8 shadow-soft sm:p-10">
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
          Who are you?
        </h1>
        <p className="mt-2 text-slate-600">
          Choose how you want to use the platform.
        </p>
        <div className="mt-8 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => handleSelect("business")}
            className="flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition-all hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <span className="font-bold text-slate-800">
                Entrepreneur / Business
              </span>
              <p className="text-sm text-slate-500">
                I want to order from suppliers and manage my business.
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleSelect("provider")}
            className="flex items-center gap-4 rounded-xl border-2 border-slate-200 bg-white p-6 text-left transition-all hover:border-primary-400 hover:bg-primary-50/50 hover:shadow-md"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div>
              <span className="font-bold text-slate-800">
                Provider / Supplier
              </span>
              <p className="text-sm text-slate-500">
                I supply products or services and want to reach more businesses.
              </p>
            </div>
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="font-medium text-primary-600 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
