const termsSections = [
  {
    title: "Eligibility and Registration",
    points: [
      "Participation is open only to eligible students as defined by the organizing committee.",
      "All participants must provide accurate information during registration.",
      "Registrations are confirmed only after successful payment and organizer approval when required."
    ]
  },
  {
    title: "Participant Responsibilities",
    points: [
      "Participants must follow event rules, timelines, and communication shared by organizers.",
      "Teams are responsible for the originality and legality of their submissions.",
      "Any misconduct, plagiarism, or abusive behavior can lead to immediate disqualification."
    ]
  },
  {
    title: "Submissions and Judging",
    points: [
      "All submissions must be completed before the published deadline.",
      "Judging decisions made by the jury are final and binding.",
      "Organizers may request demos, source access, or supporting material for validation."
    ]
  },
  {
    title: "Liability and Changes",
    points: [
      "Organizers reserve the right to update schedules, formats, or rules due to operational needs.",
      "By participating, users agree that organizers are not liable for indirect losses related to participation.",
      "These terms are governed by applicable local laws and institutional policies."
    ]
  }
];

export function TermsAndConditionsPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="glass-card rounded-3xl p-6 shadow-lg md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">IEEE Hackathon Policy</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">Terms and Conditions</h1>
        <p className="mt-4 text-slate-700">
          These terms define the rules and conditions for using this website and participating in the hackathon.
        </p>
      </header>

      <div className="space-y-4">
        {termsSections.map((section) => (
          <article key={section.title} className="glass-card rounded-2xl p-5 md:p-6">
            <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
            <ul className="mt-3 space-y-2">
              {section.points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-700" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
