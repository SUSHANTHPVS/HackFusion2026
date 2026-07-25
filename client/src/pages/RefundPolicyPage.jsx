const refundPolicyItems = [
  "Registration fees are generally non-refundable once payment is completed.",
  "A refund may be considered only in verified duplicate payment cases.",
  "If the event is cancelled by organizers, participants will receive communication on refund eligibility and process.",
  "Participants requesting a duplicate-payment refund must contact organizers within 7 days with payment proof.",
  "Approved refunds are processed to the original payment method and may take 5-10 business days depending on the payment provider."
];

export function RefundPolicyPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header className="glass-card rounded-3xl p-6 shadow-lg md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">IEEE Hackathon Policy</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">Refund Policy</h1>
        <p className="mt-4 text-slate-700">
          Please review this refund policy before making registration payments on this platform.
        </p>
      </header>

      <article className="glass-card rounded-2xl p-5 md:p-6">
        <ul className="space-y-3">
          {refundPolicyItems.map((item) => (
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
