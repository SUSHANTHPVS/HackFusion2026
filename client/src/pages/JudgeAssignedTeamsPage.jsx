import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Unable to load assigned teams") {
  return error?.response?.data?.message || fallback;
}

export function JudgeAssignedTeamsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");

  const loadAssignedTeams = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get("/judge/teams");
      setTeams(response.data?.teams || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignedTeams();
  }, []);

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Judge Workspace</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Assigned Teams</h1>
        <p className="mt-3 text-slate-700">Review teams and submissions you are expected to evaluate.</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        {error ? <p className="mb-3 text-sm font-medium text-rose-600">{error}</p> : null}

        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center text-slate-700">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading teams...
          </div>
        ) : teams.length === 0 ? (
          <p className="text-sm text-slate-600">No teams available yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Leader</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Members</th>
                  <th className="px-3 py-2">Track</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {teams.map((team) => (
                  <tr key={team._id}>
                    <td className="px-3 py-2 font-semibold text-slate-900">{team.name}</td>
                    <td className="px-3 py-2 text-slate-700">{team.leaderName}</td>
                    <td className="px-3 py-2 capitalize text-slate-700">{team.participationType}</td>
                    <td className="px-3 py-2 text-slate-700">{1 + (team.teammates?.length || 0)}</td>
                    <td className="px-3 py-2 text-slate-700">{team.themeTrack}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
