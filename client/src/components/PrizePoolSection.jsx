import { Trophy } from "lucide-react";
import { PRIZE_BREAKDOWN, SPECIAL_AWARDS } from "../utils/constants";

export function PrizePoolSection() {
  return (
    <section className="glass-card rounded-3xl p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-md">
          <Trophy size={18} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Prize Distribution</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900">HackFusion 2026</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {PRIZE_BREAKDOWN.map((prize) => (
          <article key={prize.title} className="rounded-2xl border border-slate-200/80 bg-white/75 p-4">
            <p className="text-sm font-semibold text-slate-600">{prize.title}</p>
            <p className="mt-2 text-2xl font-extrabold text-slate-900">{prize.amount}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white/75 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Special Awards</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {SPECIAL_AWARDS.map((award) => (
            <p key={award} className="rounded-xl border border-cyan-200 bg-cyan-50/70 px-3 py-2 text-sm font-medium text-slate-900">
              {award}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
