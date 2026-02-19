import { Link } from "react-router-dom";

const footerLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "#", label: "Terms" },
  { to: "#", label: "Privacy" },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-links">
          {footerLinks.map(({ to, label }) => (
            <Link key={label} to={to} className="footer-link">
              {label}
            </Link>
          ))}
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} B2B Marketplace. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
