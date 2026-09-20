import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { api } from "../services/api";
import { PageIntro } from "../components/PageIntro";
import { PaymentVerificationCard } from "../components/PaymentVerificationCard";

function getErrorMessage(error, fallback = "Unable to load pending payments") {
  return error?.response?.data?.message || fallback;
}

function PaymentCard({ payment, teamName, userName, onVerified, onRejected, onDeleted }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusBadge = {
    pending_verification: { color: "bg-amber-100 text-amber-800", icon: Clock, label: "⏳ Pending" },
    success: { color: "bg-emerald-100 text-emerald-800", icon: CheckCircle, label: "✓ Approved" },
    failed: { color: "bg-rose-100 text-rose-800", icon: XCircle, label: "✗ Rejected" }
  }[payment.status] || { color: "bg-slate-100 text-slate-800", label: "Unknown" };

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">{teamName}</h3>
            <p className="mt-1 text-xs text-slate-600">
              Leader: <span className="font-semibold">{userName}</span>
            </p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${statusBadge.color}`}>
            {statusBadge.label}
          </div>
        </div>

        {/* Details Row */}
        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-600">Submitted</dt>
            <dd className="mt-1 text-slate-800">{new Date(payment.createdAt).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-600">Amount</dt>
            <dd className="mt-1 text-slate-800">₹{payment.amount || "N/A"}</dd>
          </div>
          {payment.paymentApprovedAt && (
            <div>
              <dt className="font-semibold text-slate-600">Verified</dt>
              <dd className="mt-1 text-slate-800">{new Date(payment.paymentApprovedAt).toLocaleString()}</dd>
            </div>
          )}
        </dl>

        {/* Expand Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          {isExpanded ? "Hide Details" : "View Details & Verify"}
        </button>
      </div>

      {/* Expanded Verification Section */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-4">
          <PaymentVerificationCard
            payment={payment}
            teamName={teamName}
            onVerified={onVerified}
            onRejected={onRejected}
            onDeleted={onDeleted}
          />
        </div>
      )}
    </article>
  );
}

export function AdminPaymentVerificationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_verification");

  // Load pending payments
  const loadPayments = async ({ showRefreshing = false } = {}) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError("");

    try {
      // Call API to get payments with their team and user details
      const response = await api.get("/admin/payments/verification-status", {
        params: {
          status: statusFilter || undefined,
          search: searchQuery || undefined
        }
      });

      setPayments(response.data?.payments || []);
    } catch (err) {
      setError(getErrorMessage(err));
      setPayments([]);
    } finally {
      if (showRefreshing) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadPayments();

    // Refresh when page becomes visible (user switches back to this tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadPayments();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (!isLoading) {
      loadPayments();
    }
  }, [statusFilter]);

  // Search handler with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        loadPayments();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: payments.length,
      pending: payments.filter((p) => p.status === "pending_verification").length,
      approved: payments.filter((p) => p.status === "success").length,
      rejected: payments.filter((p) => p.status === "failed").length
    };
  }, [payments]);

  // Handle verification success
  const handleVerificationComplete = () => {
    // Refresh the list after approval/rejection
    loadPayments({ showRefreshing: true });
  };

  return (
    <div className="space-y-5">
      <PageIntro
        title="Payment Verification"
        description="Review and approve/reject manual payment proofs submitted by participants."
      />

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Total Payments</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pending</p>
          <p className="mt-2 text-2xl font-bold text-amber-900">{stats.pending}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Approved</p>
          <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.approved}</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Rejected</p>
          <p className="mt-2 text-2xl font-bold text-rose-900">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {/* Search */}
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
              Search by Team/Leader Name
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search team name or leader name..."
                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="pending_verification">Pending Only</option>
              <option value="">All Payments</option>
              <option value="success">Approved Only</option>
              <option value="failed">Rejected Only</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadPayments({ showRefreshing: true })}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {isRefreshing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12">
          <div className="text-center">
            <Loader2 size={32} className="mx-auto mb-2 animate-spin text-slate-600" />
            <p className="text-sm text-slate-600">Loading pending payments...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && payments.length === 0 && (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-12">
          <div className="text-center">
            <CheckCircle size={48} className="mx-auto mb-3 text-emerald-600" />
            <p className="text-lg font-semibold text-slate-900">All caught up!</p>
            <p className="mt-1 text-sm text-slate-600">
              {statusFilter === "pending_verification"
                ? "No pending payment verifications at this time."
                : "No payments found matching your filters."}
            </p>
          </div>
        </div>
      )}

      {/* Payments List */}
      {!isLoading && payments.length > 0 && (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <PaymentCard
              key={payment._id}
              payment={payment}
              teamName={payment.teamId?.name || "N/A"}
              userName={payment.userId?.name || "N/A"}
              onVerified={handleVerificationComplete}
              onRejected={handleVerificationComplete}
              onDeleted={handleVerificationComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
