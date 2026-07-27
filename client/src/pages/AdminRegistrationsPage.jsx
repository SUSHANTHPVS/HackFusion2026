import { useEffect, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Unable to load registrations") {
  return error?.response?.data?.message || fallback;
}

// Detailed participant information modal
function ParticipantDetailModal({ item, isMarking, onTogglePresence, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Team Details</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{item.teamName}</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-200">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          {/* Payment & Participation Info */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Payment Status</p>
              <p className="mt-1 text-sm font-bold capitalize text-slate-900">{item.paymentStatus}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Payment Amount</p>
              <p className="mt-1 text-sm font-bold text-slate-900">₹{item.paymentAmountInr || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Participation Type</p>
              <p className="mt-1 text-sm font-bold capitalize text-slate-900">{item.participationType || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Theme Track</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{item.themeTrack || "N/A"}</p>
            </div>
          </div>

          {/* Team Leader Info */}
          <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-900">Team Leader</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-blue-700">Name</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.teamLeaderName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Email</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">{item.accountEmail || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Mobile</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.accountMobile || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Roll No</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.rollNo || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Year</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.year || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Branch</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.branch || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Section</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{item.section || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700">Presence Status</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  item.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {item.checkedIn ? "Present" : "Pending"}
                </span>
              </div>
            </div>
          </div>

          {/* Team Members Info */}
          {item.teammates && item.teammates.length > 0 && (
            <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-purple-900">Team Members ({item.teammates.length})</p>
              <div className="space-y-3">
                {item.teammates.map((member, idx) => (
                  <div key={idx} className="rounded bg-white p-3">
                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <div>
                        <p className="font-semibold text-purple-700">Name</p>
                        <p className="mt-0.5 text-slate-900">{member.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700">Roll No</p>
                        <p className="mt-0.5 text-slate-900">{member.rollNo || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700">Year</p>
                        <p className="mt-0.5 text-slate-900">{member.year || "N/A"}</p>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-700">Branch</p>
                        <p className="mt-0.5 text-slate-900">{member.branch || "N/A"}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="font-semibold text-purple-700">Section</p>
                        <p className="mt-0.5 text-slate-900">{member.section || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Details */}
          {item.orderId && (
            <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-900">Payment Information</p>
              <div className="grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-emerald-700">Order ID</p>
                  <p className="mt-0.5 break-all font-mono text-slate-900">{item.orderId}</p>
                </div>
                <div>
                  <p className="font-semibold text-emerald-700">Payment ID</p>
                  <p className="mt-0.5 break-all font-mono text-slate-900">{item.paymentId || "N/A"}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onTogglePresence(item.leaderId, !item.checkedIn)}
            disabled={!item.leaderId || isMarking || item.paymentStatus !== "success"}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMarking ? "Updating..." : item.checkedIn ? "Remove Present" : "Mark Present"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistrationCard({ item, isMarking, onTogglePresence, onViewDetails }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{item.teamName}</p>
          <h3 className="mt-1 text-base font-bold text-slate-900">{item.teamLeaderName}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            item.checkedIn ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {item.checkedIn ? "Present" : "Pending"}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
          <dd className="mt-1 break-all text-slate-800">{item.accountEmail || "N/A"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment</dt>
          <dd className="mt-1 capitalize text-slate-800">{item.paymentStatus}</dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(item)}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => onTogglePresence(item.leaderId, !item.checkedIn)}
          disabled={!item.leaderId || isMarking || item.paymentStatus !== "success"}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isMarking
            ? "Updating..."
            : item.checkedIn
              ? "Remove"
              : "Mark"}
        </button>
      </div>
    </article>
  );
}

export function AdminRegistrationsPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [checkinLoadingId, setCheckinLoadingId] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

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
          limit: 300,
          paymentStatus: "success"
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

  const togglePresence = async (participantId, checkedIn) => {
    if (!participantId) {
      return;
    }

    setActionMessage("");
    setError("");
    setCheckinLoadingId(participantId);

    try {
      await api.post("/checkin/scan", { participantId, checkedIn });
      setActionMessage(checkedIn ? "Presence marked successfully." : "Presence removed successfully.");
      setSelectedItem(null);
      await loadRegistrations({ refreshing: true });
    } catch (err) {
      setError(getErrorMessage(err, checkedIn ? "Failed to mark presence" : "Failed to remove presence"));
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
        <p className="mt-3 text-slate-700">View paid registrations and confirm participant presence on hackathon day. Only teams with successful payment are shown.</p>
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
          <>
            {/* Mobile View */}
            <div className="mt-4 grid gap-3 md:hidden">
              {rows.map((item) => {
                const isMarking = checkinLoadingId === item.leaderId;

                return (
                  <RegistrationCard
                    key={item.teamId}
                    item={item}
                    isMarking={isMarking}
                    onTogglePresence={togglePresence}
                    onViewDetails={setSelectedItem}
                  />
                );
              })}
            </div>

            {/* Desktop View - Table */}
            <div className="mt-4 hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
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
                      <tr key={item.teamId} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedItem(item)}>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePresence(item.leaderId, !item.checkedIn);
                            }}
                            disabled={!item.leaderId || isMarking || item.paymentStatus !== "success"}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isMarking ? "Updating..." : item.checkedIn ? "Remove Present" : "Mark Present"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Participant Detail Modal */}
      {selectedItem && (
        <ParticipantDetailModal
          item={selectedItem}
          isMarking={checkinLoadingId === selectedItem.leaderId}
          onTogglePresence={togglePresence}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </section>
  );
}
