import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PageIntro } from "../components/PageIntro";
import { api } from "../services/api";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

export function AdminPanel() {
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/admin/registrations/search", {
          params: {
            q: "",
            limit: 500,
            paymentStatus: "success"
          }
        });

        if (!isMounted) {
          return;
        }

        setRows(response.data?.rows || []);
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || "Unable to load admin summary.");
          setRows([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalTeams = rows.length;
    const totalParticipants = rows.reduce((sum, item) => sum + 1 + (item.teammates?.length || 0), 0);
    const checkedInTeams = rows.filter((item) => item.checkedIn).length;
    const pendingTeams = totalTeams - checkedInTeams;
    const totalRevenue = rows.reduce((sum, item) => sum + Number(item.paymentAmountInr || 0), 0);

    const branchSet = new Set();
    rows.forEach((item) => {
      if (item.branch) {
        branchSet.add(String(item.branch).trim().toUpperCase());
      }

      (item.teammates || []).forEach((member) => {
        if (member?.branch) {
          branchSet.add(String(member.branch).trim().toUpperCase());
        }
      });
    });

    return {
      totalTeams,
      totalParticipants,
      checkedInTeams,
      pendingTeams,
      totalRevenue,
      uniqueBranches: branchSet.size
    };
  }, [rows]);

  const metricCards = [
    { label: "Paid Teams", value: stats.totalTeams },
    { label: "Total Participants", value: stats.totalParticipants },
    { label: "Checked-in Teams", value: stats.checkedInTeams },
    { label: "Pending Check-in", value: stats.pendingTeams },
    { label: "Branch Coverage", value: stats.uniqueBranches },
    { label: "Revenue", value: formatCurrency(stats.totalRevenue) }
  ];

  return (
    <div className="space-y-5">
      <PageIntro title="Admin Dashboard" description="Live overview of paid registrations, attendance status, and organizer insights." />

      {isLoading ? (
        <div className="glass-card flex min-h-32 items-center justify-center rounded-xl p-5 text-slate-700">
          <Loader2 className="mr-2 animate-spin" size={18} /> Loading dashboard summary...
        </div>
      ) : null}

      {error ? <div className="glass-card rounded-xl p-5 text-sm font-medium text-rose-600">{error}</div> : null}

      {!isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metricCards.map((item) => (
            <div key={item.label} className="glass-card rounded-xl p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">{item.label}</h3>
              <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
        <p className="mt-2 text-sm text-slate-600">Manage registrations, presence, payments, and downloadable organizer reports.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/admin/registrations" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Registrations and Presence
          </Link>
          <Link to="/admin/payments" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Payments
          </Link>
          <Link to="/admin/teams" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Teams
          </Link>
        </div>
      </div>
    </div>
  );
}
