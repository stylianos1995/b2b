const steps = [
  {
    title: "Register as Business or Provider",
    description: "Choose your role and create an account in minutes.",
    icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
  },
  {
    title: "Create your profile",
    description:
      "Add your company details, products or needs, and preferences.",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  {
    title: "Connect, order, deliver",
    description:
      "Browse suppliers or buyers, place orders, and track deliveries.",
    icon: "M13 7h8m0 0v8m0-8v.01M11 17H3v-4h2v2h2v-2h2v2h2v-2h2v4z",
  },
  {
    title: "Payments & invoices",
    description:
      "Secure payments and automated invoicing for smooth operations.",
    icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z",
  },
];

export function HowItWorksSection() {
  return (
    <section className="section section-how">
      <div className="container">
        <h2 className="section-title">How it works</h2>
        <p className="section-subtitle">
          Get started in four simple steps. No complexity—just results.
        </p>
        <div className="steps-grid">
          {steps.map((step, i) => (
            <div key={i} className="step-card">
              <div className="step-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={step.icon}
                  />
                </svg>
              </div>
              <p className="step-label">Step {i + 1}</p>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
