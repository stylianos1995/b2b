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
    <section className="border-t border-slate-200/80 bg-slate-50/80 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
          Why choose us
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-slate-600">
          Built for modern B2B. Here’s what you get.
        </p>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((item, i) => (
            <div
              key={i}
              className="card-glass rounded-2xl p-6 transition-all duration-300 hover:shadow-lg"
            >
              <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
              <p className="mt-2 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
