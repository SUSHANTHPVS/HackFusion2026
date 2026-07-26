import { PageIntro } from "../components/PageIntro";
import { Link } from "react-router-dom";

const actions = [
  {
    title: "My Team",
    description: "View your registered team and members.",
    to: "/participant/my-team"
  },
  {
    title: "Explore Teams",
    description: "See other teams with member names and details.",
    to: "/participant/explore-teams"
  },
  {
    title: "Payment Status",
    description: "Track registration payment status and diagnostics.",
    to: "/participant/payment-status"
  },
  {
    title: "Profile",
    description: "Update participant profile details.",
    to: "/participant/profile"
  }
];

export function ParticipantPanel() {
  return (
    <div className="space-y-5">
      <PageIntro title="Participant Dashboard" description="Track team details, payment status, and profile updates." />
      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <Link key={action.to} to={action.to} className="glass-card rounded-xl p-5 transition hover:shadow-md">
            <h2 className="text-lg font-bold text-slate-900">{action.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
