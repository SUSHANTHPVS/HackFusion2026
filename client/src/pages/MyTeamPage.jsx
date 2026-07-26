import { useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || fallback;
}

function MemberCard({ member }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm md:hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{member.role}</p>
          <h3 className="mt-1 text-base font-bold text-slate-900">{member.name}</h3>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</dt>
          <dd className="mt-1 text-slate-800">{member.gender}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Roll No</dt>
          <dd className="mt-1 text-slate-800">{member.rollNo}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Year</dt>
          <dd className="mt-1 text-slate-800">{member.year}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Branch</dt>
          <dd className="mt-1 text-slate-800">{member.branch}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section</dt>
          <dd className="mt-1 text-slate-800">{member.section}</dd>
        </div>
      </dl>
    </article>
  );
}

function DesktopMemberTable({ memberRows }) {
  return (
    <div className="hidden overflow-auto rounded-xl border border-slate-200/80 md:block">
      <div className="grid min-w-215 grid-cols-[130px_1.2fr_0.8fr_1fr_0.7fr_1fr_0.8fr] bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
        <span>Role</span>
        <span>Name</span>
        <span>Gender</span>
        <span>Roll No</span>
        <span>Year</span>
        <span>Branch</span>
        <span>Section</span>
      </div>
      {memberRows.map((member) => (
        <div
          key={`${member.role}-${member.name}-${member.rollNo}`}
          className="grid min-w-215 grid-cols-[130px_1.2fr_0.8fr_1fr_0.7fr_1fr_0.8fr] border-t border-slate-200/80 px-4 py-3 text-sm"
        >
          <span className="text-slate-700">{member.role}</span>
          <span className="font-medium text-slate-900">{member.name}</span>
          <span className="capitalize text-slate-700">{member.gender}</span>
          <span className="text-slate-700">{member.rollNo}</span>
          <span className="text-slate-700">{member.year}</span>
          <span className="text-slate-700">{member.branch}</span>
          <span className="text-slate-700">{member.section}</span>
        </div>
      ))}
    </div>
  );
}

export function MyTeamPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [team, setTeam] = useState(null);
  const [isUpdatingPreference, setIsUpdatingPreference] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isProcessingRequestId, setIsProcessingRequestId] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadTeam() {
      setIsLoading(true);
      setError("");

      try {
        const [dashboardResponse, requestsResponse] = await Promise.all([
          api.get("/participant/dashboard"),
          api.get("/participant/my-team/join-requests")
        ]);
        if (!isMounted) {
          return;
        }
        setTeam(dashboardResponse.data?.team || null);
        setRequests(requestsResponse.data?.requests || []);
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, "Unable to load team details."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTeam();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="glass-card flex min-h-56 items-center justify-center rounded-2xl p-6 text-slate-700">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading team details...
      </div>
    );
  }

  if (error) {
    return <div className="glass-card rounded-2xl p-6 text-sm font-medium text-rose-600">{error}</div>;
  }

  if (!team) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-slate-900">My Team</h2>
        <p className="mt-2 text-slate-600">No team found. Complete registration to create your team profile.</p>
      </div>
    );
  }

  const memberRows = [
    {
      role: "Team Leader",
      name: team?.leaderName || team?.leader?.name || "You",
      gender: team?.leaderGender || "-",
      rollNo: team?.rollNo || "-",
      year: team?.year || "-",
      branch: team?.branch || "-",
      section: team?.section || "-"
    },
    ...(team.teammates || []).map((mate, index) => ({
      role: `Teammate ${index + 1}`,
      name: mate.name,
      gender: mate.gender || "-",
      rollNo: mate.rollNo || "-",
      year: mate.year || "-",
      branch: mate.branch || "-",
      section: mate.section || "-"
    }))
  ];

  const toggleJoinPreference = async () => {
    setIsUpdatingPreference(true);
    setError("");

    try {
      const next = !team.allowJoinRequests;
      await api.put("/participant/my-team/join-request-preference", { allowJoinRequests: next });
      setTeam((current) => (current ? { ...current, allowJoinRequests: next } : current));
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update team join-request preference."));
    } finally {
      setIsUpdatingPreference(false);
    }
  };

  const reviewRequest = async (requestId, decision) => {
    setIsProcessingRequestId(requestId);
    setError("");

    try {
      await api.patch(`/participant/my-team/join-requests/${requestId}`, { decision });
      setRequests((current) =>
        current.map((item) => (item.id === requestId ? { ...item, status: decision } : item))
      );

      if (decision === "approved") {
        const response = await api.get("/participant/dashboard");
        setTeam(response.data?.team || null);
      }
    } catch (err) {
      setError(getErrorMessage(err, `Unable to ${decision} request.`));
    } finally {
      setIsProcessingRequestId("");
    }
  };

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-700 text-white shadow-md">
            <Users size={18} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Participant Dashboard</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900 md:text-4xl">My Team</h1>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-700">Team Name:</span> <span className="text-slate-900">{team.name}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-700">Participation:</span>{" "}
            <span className="capitalize text-slate-900">{team.participationType}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-700">Theme Track:</span> <span className="text-slate-900">{team.themeTrack}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-700">Status:</span> <span className="capitalize text-slate-900">{team.status}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-700">Roll No:</span> <span className="text-slate-900">{team.rollNo || "-"}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-700">Year:</span> <span className="text-slate-900">{team.year || "-"}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-700">Branch:</span> <span className="text-slate-900">{team.branch || "-"}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-700">Section:</span> <span className="text-slate-900">{team.section || "-"}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-700">Join Requests:</span>{" "}
            <span className="text-slate-900">{team.allowJoinRequests ? "Allowed" : "Not Allowed"}</span>
          </p>
        </div>

        <button
          type="button"
          disabled={isUpdatingPreference}
          onClick={toggleJoinPreference}
          className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          {isUpdatingPreference
            ? "Updating..."
            : team.allowJoinRequests
              ? "Disable Join Requests"
              : "Allow Join Requests"}
        </button>

        <h2 className="mt-6 text-xl font-bold text-slate-900">Team Members</h2>
        <div className="mt-3 grid gap-3 md:hidden">
          {memberRows.map((member) => (
            <MemberCard key={`${member.role}-${member.name}-${member.rollNo}`} member={member} />
          ))}
        </div>
        <DesktopMemberTable memberRows={memberRows} />

        <h2 className="mt-8 text-xl font-bold text-slate-900">Incoming Join Requests</h2>
        {requests.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No incoming requests yet.</p>
        ) : (
          <div className="mt-3 grid gap-3">
            {requests.map((request) => {
              const pending = request.status === "pending";
              const isProcessing = isProcessingRequestId === request.id;

              return (
                <article key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{request.requester?.name || "Participant"}</p>
                      <p className="text-xs text-slate-600">{request.requester?.email || "No email"}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Gender: <span className="capitalize">{request.requester?.gender || "-"}</span> | Department: {request.requester?.department || "-"}
                      </p>
                      <p className="text-xs text-slate-600">Mobile: {request.requester?.mobile || "-"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      request.status === "approved"
                        ? "bg-emerald-100 text-emerald-700"
                        : request.status === "rejected"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  {pending && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => reviewRequest(request.id, "approved")}
                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {isProcessing ? "Processing..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => reviewRequest(request.id, "rejected")}
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {isProcessing ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
