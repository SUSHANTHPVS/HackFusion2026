const rightsItems = [
  "All website content, branding, graphics, and text are owned by or licensed to the organizers unless otherwise stated.",
  "Participants retain ownership of their submitted projects, source code, and related intellectual property.",
  "By submitting projects, participants grant organizers a non-exclusive right to showcase project names, summaries, and demo media for event promotion.",
  "Unauthorized copying, redistribution, or commercial use of website material without written permission is prohibited.",
  "Third-party assets referenced on this platform belong to their respective owners and are used under applicable licenses."
];

export function CopyrightRightsPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="glass-card rounded-3xl p-6 shadow-lg md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">IEEE Hackathon Policy</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">Copyright Rights</h1>
        <p className="mt-4 text-slate-700">
          This page explains ownership and permitted use of website content and participant submissions.
        </p>
      </header>

      <article className="glass-card rounded-2xl p-5 md:p-6">
        <ul className="space-y-3">
          {rightsItems.map((item) => (
            <li key={item} className="flex items-start gap-3 text-slate-700">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-700" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
