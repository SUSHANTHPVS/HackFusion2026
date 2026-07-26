import { useEffect, useMemo, useState } from "react";
import { BadgeIndianRupee, CheckCircle2, Clock3, Download, Loader2, XCircle } from "lucide-react";
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function downloadReceipt({ payment, profile, team }) {
  if (!payment || payment.status !== "success") {
    return false;
  }

  const amountInr = Number(payment.amount).toFixed(2);
  const paymentDate = payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "N/A";
  const generatedAt = new Date().toLocaleString();
  const safeOrderId = String(payment.orderId || "payment").replace(/[^a-zA-Z0-9_-]/g, "");

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!printWindow) {
    return false;
  }

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt ${escapeHtml(safeOrderId)}</title>
    <style>
      body {
        margin: 0;
        padding: 32px;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        color: #0f172a;
        background: #f8fafc;
      }
      .card {
        max-width: 760px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        overflow: hidden;
      }
      .header {
        padding: 24px;
        background: linear-gradient(120deg, #0f172a, #1e293b);
        color: #ffffff;
      }
      .header h1 {
        margin: 0;
        font-size: 24px;
      }
      .header p {
        margin: 8px 0 0;
        font-size: 14px;
        color: #cbd5e1;
      }
      .content {
        padding: 24px;
      }
      .section {
        margin-bottom: 20px;
      }
      .section h2 {
        margin: 0 0 10px;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #334155;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px 16px;
      }
      .row {
        padding: 10px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #f8fafc;
      }
      .label {
        display: block;
        font-size: 11px;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .value {
        display: block;
        margin-top: 4px;
        font-size: 14px;
        font-weight: 600;
        word-break: break-word;
      }
      .amount {
        font-size: 28px;
        font-weight: 700;
        color: #0f766e;
      }
      .footer {
        padding: 14px 24px 24px;
        font-size: 12px;
        color: #64748b;
      }
      @media print {
        body {
          background: #ffffff;
          padding: 0;
        }
        .card {
          border-radius: 0;
          border: none;
          max-width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <article class="card">
      <header class="header">
        <h1>IEEE Hackathon Payment Receipt</h1>
        <p>Generated on ${escapeHtml(generatedAt)}</p>
      </header>

      <section class="content">
        <div class="section">
          <h2>Amount Paid</h2>
          <div class="amount">INR ${escapeHtml(amountInr)}</div>
        </div>

        <div class="section">
          <h2>Payment Details</h2>
          <div class="grid">
            <div class="row"><span class="label">Status</span><span class="value">${escapeHtml(payment.status)}</span></div>
            <div class="row"><span class="label">Payment Date</span><span class="value">${escapeHtml(paymentDate)}</span></div>
            <div class="row"><span class="label">Currency</span><span class="value">${escapeHtml(payment.currency || "INR")}</span></div>
            <div class="row"><span class="label">Participation</span><span class="value">${escapeHtml(payment.participationType || "N/A")}</span></div>
            <div class="row"><span class="label">Order ID</span><span class="value">${escapeHtml(payment.orderId || "N/A")}</span></div>
            <div class="row"><span class="label">Payment ID</span><span class="value">${escapeHtml(payment.paymentId || "N/A")}</span></div>
          </div>
        </div>

        <div class="section">
          <h2>Participant Details</h2>
          <div class="grid">
            <div class="row"><span class="label">Name</span><span class="value">${escapeHtml(profile?.name || "N/A")}</span></div>
            <div class="row"><span class="label">Email</span><span class="value">${escapeHtml(profile?.email || "N/A")}</span></div>
            <div class="row"><span class="label">Mobile</span><span class="value">${escapeHtml(profile?.mobile || "N/A")}</span></div>
            <div class="row"><span class="label">Team</span><span class="value">${escapeHtml(team?.name || "N/A")}</span></div>
          </div>
        </div>
      </section>

      <footer class="footer">
        Keep this receipt for your records. Use your browser print option and choose Save as PDF.
      </footer>
    </article>
  </body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();

  return true;
}

export function PaymentStatusPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [team, setTeam] = useState(null);

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

        setProfile(response.data?.profile || null);
        setTeam(response.data?.team || null);
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

    return `₹${Number(payment.amount).toFixed(2)}`;
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

            {payment.status === "success" ? (
              <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 sm:col-span-2 lg:col-span-3">
                <button
                  type="button"
                  onClick={() => downloadReceipt({ payment, profile, team })}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Download size={16} /> Download or Print Receipt
                </button>
              </div>
            ) : null}
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
