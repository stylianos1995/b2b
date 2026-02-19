import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-accent-600 px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              B2B made simple.
              <span className="block mt-2 bg-white/20 bg-clip-text text-transparent sm:inline">
                Connect. Order. Grow.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/90">
              The platform where businesses and suppliers meet. Order in bulk,
              manage invoices, and scale with confidence.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/auth/select-role"
                className="btn-primary bg-white text-primary-700 hover:bg-white/95 shadow-lg"
              >
                Order Now
              </Link>
              <Link
                to="/auth/select-role"
                className="btn-secondary border-white/40 bg-white/20 text-white hover:bg-white/30 backdrop-blur"
              >
                Join as Business
              </Link>
              <Link
                to="/auth/select-role"
                className="btn-secondary border-white/40 bg-white/20 text-white hover:bg-white/30 backdrop-blur"
              >
                Join as Provider
              </Link>
            </div>
          </div>
          <div className="relative flex justify-center lg:justify-end">
            <div className="h-72 w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center lg:h-80">
              <div className="text-center text-white/80">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/20">
                  <svg
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium">Platform visual</p>
                <p className="text-xs text-white/60 mt-1">
                  Illustration placeholder
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
