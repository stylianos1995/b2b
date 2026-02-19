export function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-slate-800 sm:text-4xl">
        About Us
      </h1>
      <p className="mt-6 text-slate-600">
        We’re building the B2B platform that connects businesses and suppliers
        so you can order, deliver, and get paid—without the hassle.
      </p>
      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800">Our mission</h2>
          <p className="mt-2 text-slate-600">
            To make B2B commerce simple, transparent, and scalable for every
            business.
          </p>
        </div>
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-lg font-bold text-slate-800">Our values</h2>
          <p className="mt-2 text-slate-600">
            Trust, clarity, and efficiency drive everything we do.
          </p>
        </div>
      </div>
    </div>
  );
}
