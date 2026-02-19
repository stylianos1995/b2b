export function Contact() {
  return (
    <div className="container" style={{ paddingTop: "1.5rem" }}>
      <h1 style={{ marginTop: 0 }}>Contact</h1>
      <p>Have a question or want to work with us? Get in touch.</p>
      <div className="card" style={{ maxWidth: "32rem", marginTop: "1.5rem" }}>
        <form className="form-group" style={{ marginBottom: 0 }}>
          <div className="form-group">
            <label htmlFor="contact-name">Name</label>
            <input id="contact-name" type="text" placeholder="Your name" />
          </div>
          <div className="form-group">
            <label htmlFor="contact-email">Email</label>
            <input
              id="contact-email"
              type="email"
              placeholder="you@company.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              rows={4}
              placeholder="Your message"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Send message
          </button>
        </form>
      </div>
    </div>
  );
}
