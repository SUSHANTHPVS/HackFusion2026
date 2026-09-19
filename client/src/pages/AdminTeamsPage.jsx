import { useEffect, useState } from "react";
import { Loader2, Search, Trash2 } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Unable to load teams") {
  return error?.response?.data?.message || fallback;
}

function TeamCard({ item }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{item.teamName}</p>
          <h3 className="mt-1 text-base font-bold text-slate-900">{item.teamLeaderName}</h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
          {item.paymentStatus}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</dt>
          <dd className="mt-1 capitalize text-slate-800">{item.participationType}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Members</dt>
          <dd className="mt-1 text-slate-800">{1 + (item.teammates?.length || 0)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Track</dt>
          <dd className="mt-1 text-slate-800">{item.themeTrack || "N/A"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Presence</dt>
          <dd className="mt-1 text-slate-800">{item.checkedIn ? "Present" : "Pending"}</dd>
        </div>
      </dl>
    </article>
  );
}

export function AdminTeamsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadTeams = async ({ refreshing = false } = {}) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      const response = await api.get("/admin/registrations/search", {
        params: {
          q: query,
          limit: 300
        }
      });

      setRows(response.data?.rows || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleDeleteTeam = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await api.delete(`/admin/teams/${deleteConfirm.teamId}`);
      // Refresh the list after deletion
      setDeleteConfirm(null);
      await loadTeams({ refreshing: true });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete team"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Admin Management</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Teams</h1>
        <p className="mt-3 text-slate-700">Review team registrations, participation type, theme track, and payment status.</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-lg items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
            <Search size={16} className="text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by team, leader, roll no, branch..."
              className="w-full border-none bg-transparent text-sm outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadTeams({ refreshing: true })}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => loadTeams({ refreshing: true })}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}

        {isLoading ? (
          <div className="mt-4 flex min-h-40 items-center justify-center text-slate-700">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading teams...
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No teams found.</p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 md:hidden">
              {rows.map((item) => (
                <TeamCard key={item.teamId} item={item} />
              ))}
            </div>

            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Leader</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Members</th>
                  <th className="px-3 py-2">Track</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2">Presence</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((item) => (
                  <tr key={item.teamId}>
                    <td className="px-3 py-2 font-semibold text-slate-900">{item.teamName}</td>
                    <td className="px-3 py-2 text-slate-700">{item.teamLeaderName}</td>
                    <td className="px-3 py-2 capitalize text-slate-700">{item.participationType}</td>
                    <td className="px-3 py-2 text-slate-700">{1 + (item.teammates?.length || 0)}</td>
                    <td className="px-3 py-2 text-slate-700">{item.themeTrack || "N/A"}</td>
                    <td className="px-3 py-2 capitalize text-slate-700">{item.paymentStatus}</td>
                    <td className="px-3 py-2 text-slate-700">{item.checkedIn ? "Present" : "Pending"}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-lg max-w-sm mx-4">
            <h2 className="text-lg font-bold text-slate-900">Confirm Team Deletion</h2>
            <p className="mt-2 text-sm text-slate-700">
              Are you sure you want to delete the team <strong>"{deleteConfirm.teamName}"</strong>? This will also remove all associated payments, scores, and records. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={isDeleting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Team
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
