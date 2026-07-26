import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Unable to load leaderboard") {
  return error?.response?.data?.message || fallback;
}

export function JudgeLeaderboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [standings, setStandings] = useState([]);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [leaderboardRes, teamsRes] = await Promise.all([api.get("/judge/leaderboard"), api.get("/judge/teams")]);
      setStandings(leaderboardRes.data?.standings || []);
      setTeams(teamsRes.data?.teams || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const teamNameById = useMemo(() => {
    return teams.reduce((accumulator, team) => {
      accumulator[team._id] = team.name;
      return accumulator;
    }, {});
  }, [teams]);

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Judge Workspace</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Leaderboard</h1>
        <p className="mt-3 text-slate-700">Average ranking across submitted judge scores.</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        {error ? <p className="mb-3 text-sm font-medium text-rose-600">{error}</p> : null}

        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center text-slate-700">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading leaderboard...
          </div>
        ) : standings.length === 0 ? (
          <p className="text-sm text-slate-600">No scores submitted yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Rank</th>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Avg Score</th>
                  <th className="px-3 py-2">Judge Entries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {standings.map((item, index) => (
                  <tr key={item._id}>
                    <td className="px-3 py-2 font-semibold text-slate-900">#{index + 1}</td>
                    <td className="px-3 py-2 text-slate-700">{teamNameById[item._id] || item._id}</td>
                    <td className="px-3 py-2 text-slate-700">{Number(item.averageScore || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-slate-700">{item.judges || 0}</td>
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
