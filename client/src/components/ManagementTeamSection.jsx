import { MANAGEMENT_TEAM } from "../utils/constants";

export function ManagementTeamSection() {
  return (
    <section className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Organizing Committee</p>
        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">IEEE Management Team</h2>
        <p className="mt-2 text-slate-600">Core IEEE volunteers managing registrations, operations, and hackathon execution.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MANAGEMENT_TEAM.map((member) => (
          <article key={member.name} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
            <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
            <p className="mt-1 text-sm font-medium text-slate-600">{member.role}</p>
            <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">IEEE Chapter</p>
            <p className="text-sm text-slate-700">{member.chapter}</p>
            <a
              href={member.linkedin}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-cyan-700 underline"
            >
              LinkedIn Profile
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
