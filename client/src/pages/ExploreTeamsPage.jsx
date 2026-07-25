import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || fallback;
}

export function ExploreTeamsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingId, setIsRequestingId] = useState("");
  const [error, setError] = useState("");
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadTeams() {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/participant/explore-teams");
        if (!isMounted) {
          return;
        }
        setTeams(response.data?.teams || []);
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, "Unable to load teams."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTeams();

    return () => {
      isMounted = false;
    };
  }, []);

  const sendJoinRequest = async (teamId) => {
    setIsRequestingId(teamId);
    setError("");

    try {
      const response = await api.post(`/participant/teams/${teamId}/join-request`);
      const status = response.data?.status || "pending";

      setTeams((prev) =>
        prev.map((team) => (team.id === teamId ? { ...team, requestStatus: status } : team))
      );
    } catch (err) {
      setError(getErrorMessage(err, "Could not send join request."));
    } finally {
      setIsRequestingId("");
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card flex min-h-56 items-center justify-center rounded-2xl p-6 text-slate-700">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading teams...
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-700 text-white shadow-md">
            <Users size={18} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Participant Dashboard</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900 md:text-4xl">Explore Other Teams</h1>
          </div>
        </div>
      </div>

      {error && <div className="glass-card rounded-2xl p-4 text-sm text-rose-600">{error}</div>}

      {teams.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-slate-700">No teams are available to explore right now.</div>
      ) : (
        <div className="grid gap-4">
          {teams.map((team) => (
            <article key={team.id} className="glass-card rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{team.teamName}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {team.themeTrack} | {team.participationType}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!team.allowJoinRequests || team.requestStatus === "pending" || isRequestingId === team.id}
                  onClick={() => sendJoinRequest(team.id)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {team.requestStatus === "pending"
                    ? "Request Sent"
                    : isRequestingId === team.id
                      ? "Sending..."
                      : team.allowJoinRequests
                        ? "Request to Join"
                        : "Leader Not Accepting"}
                </button>
              </div>

              <div className="mt-4 overflow-auto rounded-xl border border-slate-200/80">
                <div className="grid min-w-215 grid-cols-[130px_1.2fr_0.8fr_1fr_0.7fr_1fr_0.8fr] bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  <span>Role</span>
                  <span>Name</span>
                  <span>Gender</span>
                  <span>Roll No</span>
                  <span>Year</span>
                  <span>Branch</span>
                  <span>Section</span>
                </div>
                {team.memberRows.map((member) => (
                  <div
                    key={`${team.id}-${member.role}-${member.name}-${member.rollNo}`}
                    className="grid min-w-215 grid-cols-[130px_1.2fr_0.8fr_1fr_0.7fr_1fr_0.8fr] border-t border-slate-200/80 px-4 py-3 text-sm"
                  >
                    <span className="text-slate-700">{member.role}</span>
                    <span className="font-medium text-slate-900">{member.name}</span>
                    <span className="capitalize text-slate-700">{member.gender || "-"}</span>
                    <span className="text-slate-700">{member.rollNo || "-"}</span>
                    <span className="text-slate-700">{member.year || "-"}</span>
                    <span className="text-slate-700">{member.branch || "-"}</span>
                    <span className="text-slate-700">{member.section || "-"}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
