import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Unable to load analytics") {
  return error?.response?.data?.message || fallback;
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
          <div className="glass-card rounded-xl p-5"><p className="text-sm text-slate-500">Revenue</p><p className="mt-1 text-2xl font-bold text-slate-900">INR {stats.revenue || 0}</p></div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Top Departments</h2>
          {topDepartments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No department data available.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {topDepartments.map((item) => (
                <li key={item._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span>{item._id || "Unknown"}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Registration Timeline</h2>
          {timeline.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No timeline data available.</p>
          ) : (
            <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm text-slate-700">
              {timeline.map((item) => (
                <li key={item._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <span>{item._id}</span>
                  <span className="font-semibold">{item.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
