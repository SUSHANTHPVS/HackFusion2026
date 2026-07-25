import { useEffect, useMemo, useState } from "react";
import { BadgeIndianRupee, CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import { api } from "../services/api";

function getErrorMessage(error, fallback = "Something went wrong") {
  return error?.response?.data?.message || fallback;
}

function statusStyle(status) {
  if (status === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function StatusIcon({ status }) {
  if (status === "success") {
    return <CheckCircle2 size={16} />;
  }
  if (status === "failed") {
    return <XCircle size={16} />;
  }
  return <Clock3 size={16} />;
}

export function PaymentStatusPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadPayments() {
      setIsLoading(true);
      setError("");

      try {
        const response = await api.get("/participant/dashboard");

        if (!isMounted) {
          return;
        }

        setPayment(response.data?.payment || null);
        setPaymentHistory(response.data?.payments || []);
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, "Unable to load payment status."));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPayments();

    return () => {
      isMounted = false;
    };
  }, []);

  const paymentAmount = useMemo(() => {
    if (!payment?.amount) {
      return "N/A";
    }

    return `₹${(payment.amount / 100).toFixed(2)}`;
  }, [payment?.amount]);

  if (isLoading) {
    return (
      <div className="glass-card flex min-h-56 items-center justify-center rounded-2xl p-6 text-slate-700">
        <Loader2 className="mr-2 animate-spin" size={18} />
        {"Loading payment status..."}
      </div>
    );
  }

  if (error) {
    return <div className="glass-card rounded-2xl p-6 text-sm font-medium text-rose-600">{error}</div>;
  }

  return (
    <section className="space-y-5">
      <div className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Participant Dashboard</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900 md:text-4xl">Payment Status</h1>
        <p className="mt-3 text-slate-700">Live payment details synced from your real registration orders.</p>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-900">Latest Payment</h2>

        {!payment ? (
          <p className="mt-3 text-slate-600">No payment record found yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
              <span className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold capitalize ${statusStyle(payment.status)}`}>
                <StatusIcon status={payment.status} /> {payment.status}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</p>
              <p className="mt-2 inline-flex items-center gap-1 text-lg font-bold text-slate-900">
                <BadgeIndianRupee size={18} /> {paymentAmount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Participation</p>
              <p className="mt-2 text-lg font-bold capitalize text-slate-900">{payment.participationType}</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order ID</p>
              <p className="mt-2 break-all text-sm font-medium text-slate-900">{payment.orderId || "N/A"}</p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 sm:col-span-2 lg:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment ID</p>
              <p className="mt-2 break-all text-sm font-medium text-slate-900">{payment.paymentId || "Pending"}</p>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-900">Payment History</h2>

        {paymentHistory.length === 0 ? (
          <p className="mt-3 text-slate-600">No payment attempts yet.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/80">
            <div className="grid grid-cols-[1.1fr_0.9fr_1fr] bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <span>Order ID</span>
              <span>Status</span>
              <span>Created</span>
            </div>
            {paymentHistory.map((item) => (
              <div key={item._id} className="grid grid-cols-[1.1fr_0.9fr_1fr] border-t border-slate-200/80 px-4 py-3 text-sm">
                <span className="truncate pr-3 text-slate-700" title={item.orderId}>{item.orderId}</span>
                <span className="capitalize font-semibold text-slate-900">{item.status}</span>
                <span className="text-slate-700">{new Date(item.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
