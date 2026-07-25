import { PRIMARY_STATS } from "../utils/constants";

export function StatGrid() {
  return (
    <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {PRIMARY_STATS.map((stat) => (
        <article key={stat.label} className="glass-card rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">{stat.value}</p>
        </article>
      ))}
    </section>
  );
}
