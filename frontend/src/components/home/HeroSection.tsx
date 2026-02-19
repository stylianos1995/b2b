import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-pattern" aria-hidden />
      <div className="hero-inner container">
        <div className="hero-grid">
          <div className="hero-content">
            <h1 className="hero-title">
              B2B made simple.
              <span className="hero-title-accent"> Connect. Order. Grow.</span>
            </h1>
            <p className="hero-subtitle">
              The platform where businesses and suppliers meet. Order in bulk,
              manage invoices, and scale with confidence.
            </p>
            <div className="hero-ctas">
              <Link to="/register" className="btn btn-hero-primary">
                Order Now
              </Link>
              <Link to="/register" className="btn btn-hero-secondary">
                Join as Business
              </Link>
              <Link to="/register" className="btn btn-hero-secondary">
                Join as Provider
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual-card">
              <div className="hero-visual-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <p className="hero-visual-label">Platform visual</p>
              <p className="hero-visual-sublabel">Illustration placeholder</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
