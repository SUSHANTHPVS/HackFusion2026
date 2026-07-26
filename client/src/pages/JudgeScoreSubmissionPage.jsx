import { useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { api } from "../services/api";

const defaultScores = {
  innovation: 0,
  technical: 0,
  ui: 0,
  presentation: 0,
  theme: 0
};

function getErrorMessage(error, fallback = "Unable to submit score") {
  return error?.response?.data?.message || fallback;
}

export function JudgeScoreSubmissionPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState("");
  const [scores, setScores] = useState(defaultScores);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAssignedTeams = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get("/judge/teams");
      const rows = response.data?.teams || [];
      setTeams(rows);
      if (rows.length > 0) {
        setTeamId((previous) => previous || rows[0]._id);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load teams"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignedTeams();
  }, []);

  const total = useMemo(
    () => scores.innovation + scores.technical + scores.ui + scores.presentation + scores.theme,
    [scores]
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/judge/scores", {
        teamId,
        innovation: Number(scores.innovation),
        technical: Number(scores.technical),
        ui: Number(scores.ui),
        presentation: Number(scores.presentation),
        theme: Number(scores.theme)
      });
      setMessage(response.data?.message || "Score submitted.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Judge Workspace</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Score Submission</h1>
        <p className="mt-3 text-slate-700">Submit your evaluation once per team. Re-submitting updates your existing score.</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center text-slate-700">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading teams...
          </div>
        ) : teams.length === 0 ? (
          <p className="text-sm text-slate-600">No teams available for scoring yet.</p>
        ) : (
          <form className="grid gap-4" onSubmit={onSubmit}>
            <label className="text-sm font-semibold text-slate-700">
              Team
              <select
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name} ({team.leaderName})
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              {Object.keys(defaultScores).map((metric) => (
                <label key={metric} className="text-sm font-semibold capitalize text-slate-700">
                  {metric}
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={1}
                    value={scores[metric]}
                    onChange={(event) => {
                      const value = Math.min(10, Math.max(0, Number(event.target.value || 0)));
                      setScores((previous) => ({ ...previous, [metric]: value }));
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </label>
              ))}
            </div>

            <p className="text-sm font-semibold text-slate-700">Total: {total} / 50</p>

            <button
              disabled={isSubmitting || !teamId}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
            >
              <Send size={16} /> {isSubmitting ? "Submitting..." : "Submit Score"}
            </button>

            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
            {message ? <p className="text-sm font-medium text-emerald-700">{message}</p> : null}
          </form>
        )}
      </div>
    </section>
  );
}
