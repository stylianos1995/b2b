import { Link } from "react-router-dom";

export function LoginPage() {
  return (
    <div className="w-full max-w-lg">
      <div className="card-glass rounded-3xl p-8 shadow-soft sm:p-10">
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
          Log in
        </h1>
        <p className="mt-2 text-slate-600">
          Sign in to your account. Role-aware redirect will go here.
        </p>
        <form className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Log in
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/auth/select-role"
            className="font-medium text-primary-600 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
