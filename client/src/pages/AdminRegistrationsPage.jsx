import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Unable to load registrations") {
  return error?.response?.data?.message || fallback;
}

export function AdminRegistrationsPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [checkinLoadingId, setCheckinLoadingId] = useState("");

  const loadRegistrations = async ({ refreshing = false } = {}) => {
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

  const markPresent = async (participantId) => {
    if (!participantId) {
      return;
    }

    setActionMessage("");
    setError("");
    setCheckinLoadingId(participantId);

    try {
      await api.post("/checkin/scan", { participantId });
      setActionMessage("Presence marked successfully.");
      await loadRegistrations({ refreshing: true });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to mark presence"));
    } finally {
      setCheckinLoadingId("");
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Admin Control</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Registrations and Presence</h1>
        <p className="mt-3 text-slate-700">View all registrations and confirm participant presence on hackathon day.</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full max-w-lg items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
            <Search size={16} className="text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search team, leader, roll no, branch..."
              className="w-full border-none bg-transparent text-sm outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => loadRegistrations({ refreshing: true })}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => loadRegistrations({ refreshing: true })}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Apply Search
          </button>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-rose-600">{error}</p> : null}
        {actionMessage ? <p className="mt-4 text-sm font-medium text-emerald-700">{actionMessage}</p> : null}

        {isLoading ? (
          <div className="mt-4 flex min-h-40 items-center justify-center text-slate-700">
            <Loader2 className="mr-2 animate-spin" size={18} /> Loading registrations...
          </div>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No registrations found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Team</th>
                  <th className="px-3 py-2">Leader</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Payment</th>
                  <th className="px-3 py-2">Presence</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {rows.map((item) => {
                  const isMarking = checkinLoadingId === item.leaderId;

                  return (
                    <tr key={item.teamId}>
                      <td className="px-3 py-2 font-semibold text-slate-900">{item.teamName}</td>
                      <td className="px-3 py-2 text-slate-700">{item.teamLeaderName}</td>
                      <td className="px-3 py-2 text-slate-700">{item.accountEmail || "N/A"}</td>
                      <td className="px-3 py-2 capitalize text-slate-700">{item.paymentStatus}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.checkedIn ? "Present" : "Pending"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => markPresent(item.leaderId)}
                          disabled={item.checkedIn || !item.leaderId || isMarking}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {item.checkedIn ? "Confirmed" : isMarking ? "Marking..." : "Mark Present"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
