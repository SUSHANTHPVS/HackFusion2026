import { useEffect, useMemo, useState } from "react";
import { BadgeIndianRupee, CheckCircle2, Clock3, Download, Loader2, XCircle } from "lucide-react";
import { jsPDF } from "jspdf";
import { WhatsAppAccessCard } from "../components/WhatsAppAccessCard";
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

function downloadReceipt({ payment, profile, team }) {
  if (!payment || payment.status !== "success") {
    return;
  }

  const amountInr = Number(payment.amount).toFixed(2);
  const paymentDate = payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "N/A";
  const safeOrderId = String(payment.orderId || "payment").replace(/[^a-zA-Z0-9_-]/g, "");
  const websiteName = "IEEE Hackathon Website";
  const websiteUrl = window.location.origin;
  const generatedAt = new Date().toLocaleString();

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const colors = {
    navy: [10, 25, 47],
    ieeeBlue: [0, 98, 155],
    accent: [0, 194, 255],
    surface: [244, 249, 255],
    text: [18, 38, 58],
    muted: [100, 116, 139],
    white: [255, 255, 255],
    border: [203, 213, 225]
  };

  const margin = 38;
  const contentWidth = pageWidth - margin * 2;
  const headerHeight = 118;

  doc.setFillColor(...colors.surface);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setFillColor(...colors.navy);
  doc.roundedRect(margin, margin, contentWidth, headerHeight, 14, 14, "F");

  doc.setFillColor(...colors.accent);
  doc.roundedRect(margin, margin + headerHeight - 8, contentWidth, 8, 4, 4, "F");

  doc.setTextColor(...colors.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("IEEE Hackathon Payment Receipt", margin + 20, margin + 36);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(websiteName, margin + 20, margin + 58);
  doc.text(websiteUrl, margin + 20, margin + 75);
  doc.text(`Generated: ${generatedAt}`, margin + 20, margin + 92);

  let y = margin + headerHeight + 20;

  doc.setFillColor(...colors.white);
  doc.setDrawColor(...colors.border);
  doc.roundedRect(margin, y, contentWidth, 74, 10, 10, "FD");

  doc.setTextColor(...colors.muted);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("AMOUNT PAID", margin + 20, y + 24);

  doc.setTextColor(...colors.ieeeBlue);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(`INR ${amountInr}`, margin + 20, y + 52);

  doc.setTextColor(...colors.text);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Status: ${payment.status}`, margin + contentWidth - 130, y + 32);
  doc.text(`Currency: ${payment.currency || "INR"}`, margin + contentWidth - 130, y + 50);

  y += 92;

  function drawSection(title, rows) {
    const rowHeight = 22;
    const sectionHeight = 34 + rows.length * rowHeight + 12;

    doc.setFillColor(...colors.white);
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, y, contentWidth, sectionHeight, 10, 10, "FD");

    doc.setFillColor(...colors.ieeeBlue);
    doc.roundedRect(margin, y, contentWidth, 28, 10, 10, "F");

    doc.setTextColor(...colors.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, margin + 16, y + 18);

    let rowY = y + 44;
    for (const [label, value] of rows) {
      doc.setTextColor(...colors.muted);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(label.toUpperCase(), margin + 16, rowY);

      doc.setTextColor(...colors.text);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const valueText = String(value || "N/A");
      const wrapped = doc.splitTextToSize(valueText, contentWidth - 170);
      doc.text(wrapped, margin + 132, rowY);
      rowY += rowHeight;
    }

    y += sectionHeight + 14;
  }

  drawSection("Payment Details", [
    ["Payment Date", paymentDate],
    ["Participation", payment.participationType || "N/A"],
    ["Order ID", payment.orderId || "N/A"],
    ["Payment ID", payment.paymentId || "N/A"]
  ]);

  drawSection("Participant Details", [
    ["Name", profile?.name || "N/A"],
    ["Email", profile?.email || "N/A"],
    ["Mobile", profile?.mobile || "N/A"],
    ["Team Name", team?.name || "N/A"]
  ]);

  doc.setTextColor(...colors.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "This receipt is generated by IEEE Hackathon Website and can be used for payment confirmation.",
    margin,
    pageHeight - 24
  );

  doc.save(`receipt-${safeOrderId}.pdf`);
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
                  <Download size={16} /> Download Payment Receipt
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {payment?.status === "success" ? <WhatsAppAccessCard payment={payment} team={team} /> : null}

      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-900">Payment History</h2>

        {paymentHistory.length === 0 ? (
          <p className="mt-3 text-slate-600">No payment attempts yet.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/80">
            <div className="grid grid-cols-1 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 sm:grid-cols-[1.1fr_0.9fr_1fr]">
              <span>Order ID</span>
              <span>Status</span>
              <span>Created</span>
            </div>
            {paymentHistory.map((item) => (
              <div key={item._id} className="grid grid-cols-1 border-t border-slate-200/80 px-4 py-3 text-sm sm:grid-cols-[1.1fr_0.9fr_1fr]">
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
