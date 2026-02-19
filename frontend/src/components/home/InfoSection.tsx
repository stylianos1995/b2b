const benefits = [
  {
    title: "One platform, many partners",
    description:
      "Access a network of verified businesses and suppliers from a single dashboard.",
  },
  {
    title: "Transparent pricing",
    description: "See quotes and terms upfront. No hidden fees, no surprises.",
  },
  {
    title: "Secure transactions",
    description:
      "Payments and documents are protected with modern security standards.",
  },
  {
    title: "Scale at your pace",
    description:
      "Start small or go big. The platform grows with your business.",
  },
];

export function InfoSection() {
  return (
    <section className="section section-info">
      <div className="container">
        <h2 className="section-title">Why choose us</h2>
        <p className="section-subtitle">
          Built for modern B2B. Here’s what you get.
        </p>
        <div className="benefits-grid">
          {benefits.map((item, i) => (
            <div key={i} className="benefit-card">
              <h3 className="benefit-title">{item.title}</h3>
              <p className="benefit-desc">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
