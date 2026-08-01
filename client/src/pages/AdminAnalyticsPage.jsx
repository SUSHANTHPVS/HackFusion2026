import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Unable to load analytics") {
  return error?.response?.data?.message || fallback;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [statsRes, timelineRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/timeline")
      ]);

      setStats(statsRes.data || null);
      setTimeline(timelineRes.data?.timeline || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const topDepartments = useMemo(() => (stats?.departments || []).slice(0, 5), [stats?.departments]);
  const topDepartmentsMax = useMemo(() => Math.max(...topDepartments.map((item) => Number(item.count || 0)), 1), [topDepartments]);

  const timelineWithVisuals = useMemo(() => {
    const timelineMax = Math.max(...timeline.map((item) => Number(item.count || 0)), 1);

    return timeline.map((item) => ({
      ...item,
      value: Number(item.count || 0),
      barHeight: Math.max(8, Math.round((Number(item.count || 0) / timelineMax) * 72))
    }));
  }, [timeline]);

  const checkInPercent = useMemo(() => {
    const teams = Number(stats?.teams || 0);
    const checkedIn = Number(stats?.checkedInTeams || 0);
    if (!teams) {
      return 0;
    }

    return Math.min(100, Math.round((checkedIn / teams) * 100));
  }, [stats?.teams, stats?.checkedInTeams]);

  const paidPercent = useMemo(() => {
    const participants = Number(stats?.participants || 0);
    const payments = Number(stats?.payments || 0);
    if (!participants) {
      return 0;
    }

    return Math.min(100, Math.round((payments / participants) * 100));
  }, [stats?.participants, stats?.payments]);

  if (isLoading) {
    return (
      <div className="glass-card flex min-h-56 items-center justify-center rounded-2xl p-6 text-slate-700">
        <Loader2 className="mr-2 animate-spin" size={18} /> Loading analytics...
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Admin Insights</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Analytics</h1>
        <p className="mt-3 text-slate-700">Track registrations, payments, check-ins, and participation trends.</p>
      </div>

      {error ? <div className="glass-card rounded-2xl p-6 text-sm font-medium text-rose-600">{error}</div> : null}

      {stats ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass-card rounded-xl p-5"><p className="text-sm text-slate-500">Participants</p><p className="mt-1 text-2xl font-bold text-slate-900">{stats.participants}</p></div>
          <div className="glass-card rounded-xl p-5"><p className="text-sm text-slate-500">Teams</p><p className="mt-1 text-2xl font-bold text-slate-900">{stats.teams}</p></div>
          <div className="glass-card rounded-xl p-5"><p className="text-sm text-slate-500">Paid</p><p className="mt-1 text-2xl font-bold text-slate-900">{stats.payments}</p></div>
          <div className="glass-card rounded-xl p-5"><p className="text-sm text-slate-500">Checked-In</p><p className="mt-1 text-2xl font-bold text-slate-900">{stats.checkedInTeams}</p></div>
          <div className="glass-card rounded-xl p-5"><p className="text-sm text-slate-500">IEEE Members</p><p className="mt-1 text-2xl font-bold text-slate-900">{stats.ieeeMembers}</p></div>
          <div className="glass-card rounded-xl p-5"><p className="text-sm text-slate-500">Revenue</p><p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(stats.revenue)}</p></div>
        </div>
      ) : null}

      {stats ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900">Check-in Progress</h2>
            <p className="mt-2 text-sm text-slate-600">Team presence completion based on paid registrations.</p>
            <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-500" style={{ width: `${checkInPercent}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-900">{checkInPercent}% Completed</span>
              <span className="text-slate-600">{stats.checkedInTeams} / {stats.teams} teams</span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900">Payment Conversion</h2>
            <p className="mt-2 text-sm text-slate-600">How many participants have completed successful payments.</p>
            <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-linear-to-r from-blue-600 to-cyan-500" style={{ width: `${paidPercent}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-900">{paidPercent}% Converted</span>
              <span className="text-slate-600">{stats.payments} / {stats.participants} participants</span>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Top Departments</h2>
          {topDepartments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No department data available.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {topDepartments.map((item) => (
                <li key={item._id} className="rounded-lg border border-slate-200 bg-white/70 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{item._id || "Unknown"}</span>
                    <span className="font-bold text-slate-900">{item.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-fuchsia-500 to-cyan-500"
                      style={{ width: `${Math.round((Number(item.count || 0) / topDepartmentsMax) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Registration Timeline</h2>
          {timelineWithVisuals.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No timeline data available.</p>
          ) : (
            <>
              <div className="mt-4 flex h-28 items-end gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white/70 px-3 py-3">
                {timelineWithVisuals.map((item) => (
                  <div key={`bar-${item._id}`} className="flex min-w-8 flex-col items-center justify-end">
                    <div
                      className="w-6 rounded-t-md bg-linear-to-t from-cyan-600 to-blue-400"
                      style={{ height: `${item.barHeight}px` }}
                      title={`${item._id}: ${item.value}`}
                    />
                  </div>
                ))}
              </div>

              <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm text-slate-700">
                {timelineWithVisuals.map((item) => (
                  <li key={item._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                    <span>{item._id}</span>
                    <span className="font-semibold">{item.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
