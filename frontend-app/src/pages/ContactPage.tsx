export function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl">Contact</h1>
      <p className="mt-6 text-slate-600">
        Have a question or want to work with us? Get in touch.
      </p>
      <div className="mt-12 card-glass max-w-xl rounded-2xl p-8">
        <form className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Your name"
            />
          </div>
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
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-slate-700"
            >
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="Your message"
            />
          </div>
          <button type="submit" className="btn-primary w-full sm:w-auto">
            Send message
          </button>
        </form>
      </div>
    </div>
  );
}
