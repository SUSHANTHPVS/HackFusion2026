import { PageIntro } from "../components/PageIntro";

const criteria = ["Innovation", "Technical", "UI", "Presentation", "Theme"];

export function JudgePanel() {
  return (
    <div className="space-y-5">
      <PageIntro title="Judge Portal" description="Score assigned teams and submit evaluations with automatic totals." />
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-bold">Scoring Criteria</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {criteria.map((item) => (
            <li key={item} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">{item}</li>
          ))}
        </ul>
      </div>
      <div className="glass-card rounded-xl p-5">Leaderboard updates after all judges submit scores.</div>
    </div>
  );
}
