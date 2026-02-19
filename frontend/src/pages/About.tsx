export function About() {
  return (
    <div className="container" style={{ paddingTop: "1.5rem" }}>
      <h1 style={{ marginTop: 0 }}>About Us</h1>
      <p>
        We’re building the B2B platform that connects businesses and suppliers
        so you can order, deliver, and get paid—without the hassle.
      </p>
      <div className="grid-2" style={{ marginTop: "1.5rem" }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.125rem" }}>Our mission</h2>
          <p style={{ marginBottom: 0 }}>
            To make B2B commerce simple, transparent, and scalable for every
            business.
          </p>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: "1.125rem" }}>Our values</h2>
          <p style={{ marginBottom: 0 }}>
            Trust, clarity, and efficiency drive everything we do.
          </p>
        </div>
      </div>
    </div>
  );
}
