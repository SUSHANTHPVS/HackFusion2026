import { PageIntro } from "../components/PageIntro";

const metrics = ["Participants", "Teams", "Revenue", "Payments", "Departments", "IEEE Members", "Checked-in Teams"];

export function AdminPanel() {
  return (
    <div className="space-y-5">
      <PageIntro title="Admin Dashboard" description="Monitor registrations, payments, check-ins, judging, and event analytics." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((item) => (
          <div key={item} className="glass-card rounded-xl p-5">
            <h3 className="font-semibold text-slate-700">{item}</h3>
            <p className="mt-2 text-2xl font-bold text-slate-900">--</p>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-xl p-5">Charts: Registrations timeline, department split, payments, revenue.</div>
    </div>
  );
}
