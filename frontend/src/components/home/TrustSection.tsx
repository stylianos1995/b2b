const providers = [
  "Acme Supply Co",
  "Global Parts Ltd",
  "Prime Logistics",
  "TechSource Inc",
  "Metro Wholesale",
];

export function TrustSection() {
  return (
    <section className="trust-section">
      <div className="container">
        <p className="trust-heading">Trusted by leading suppliers</p>
        <div className="trust-logos">
          {providers.map((name) => (
            <div key={name} className="trust-card">
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
