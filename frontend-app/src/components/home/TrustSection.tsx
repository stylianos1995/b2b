const providers = [
  "Acme Supply Co",
  "Global Parts Ltd",
  "Prime Logistics",
  "TechSource Inc",
  "Metro Wholesale",
];

export function TrustSection() {
  return (
    <section className="border-y border-slate-200/80 bg-white/60 py-12 backdrop-blur-sm sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold uppercase tracking-wider text-slate-500">
          Trusted by leading suppliers
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
          {providers.map((name) => (
            <div
              key={name}
              className="card-glass flex h-20 w-36 items-center justify-center rounded-xl px-4 transition-transform hover:scale-105"
            >
              <span className="text-center text-sm font-semibold text-slate-600">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
