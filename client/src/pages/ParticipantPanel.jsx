import { useEffect, useState } from "react";
import { Loader2, CheckCircle, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { PageIntro } from "../components/PageIntro";
import { WhatsAppAccessCard } from "../components/WhatsAppAccessCard";
import { api } from "../services/api";

const actions = [
  {
    title: "My Team",
    description: "View your registered team and members.",
    to: "/participant/my-team"
  },
  {
    title: "Explore Teams",
    description: "See other teams with member names and details.",
    to: "/participant/explore-teams"
  },
  {
    title: "Payment Status",
    description: "Track registration payment status and diagnostics.",
    to: "/participant/payment-status"
  },
  {
    title: "Profile",
    description: "Update participant profile details.",
    to: "/participant/profile"
  }
];

export function ParticipantPanel() {
  const [payment, setPayment] = useState(null);
  const [team, setTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApprovalBanner, setShowApprovalBanner] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);

      try {
        const response = await api.get("/participant/dashboard");
        if (!isMounted) {
          return;
        }

        const newPayment = response.data?.payment || null;
        setPayment(newPayment);
        setTeam(response.data?.team || null);

        // Show approval banner if payment just became successful
        if (newPayment?.status === "success" && newPayment?.paymentApprovedAt) {
          const approvedTime = new Date(newPayment.paymentApprovedAt).getTime();
          const now = Date.now();
          // Show banner if approved within last 2 minutes
          if (now - approvedTime < 120000) {
            setShowApprovalBanner(true);
          }
        }
      } catch {
        if (isMounted) {
          setPayment(null);
          setTeam(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <PageIntro title="Participant Dashboard" description="Track team details, payment status, and profile updates." />
      
      {isLoading ? (
        <section className="glass-card rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-slate-700">
            <Loader2 className="animate-spin" size={18} />
            <div>
              <p className="text-sm font-semibold text-slate-900">Checking WhatsApp access</p>
              <p className="text-sm text-slate-600">Please wait while we verify your payment and unlock the group link.</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Payment Approval Acknowledgement Banner */}
      {showApprovalBanner && payment?.status === "success" && (
        <section className="rounded-2xl border-2 border-emerald-300 bg-linear-to-r from-emerald-50 to-teal-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <CheckCircle size={24} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-900">🎉 Payment Approved!</h3>
              <p className="mt-2 text-sm text-emerald-800">
                Your payment has been verified and approved by our admin team. Your team registration is now confirmed!
              </p>
              <p className="mt-3 text-sm font-semibold text-emerald-700">
                ✅ You can now join the exclusive hackathon WhatsApp group below and connect with other participants.
              </p>
              <p className="mt-2 text-xs text-emerald-600">
                💌 A confirmation email has been sent to your registered email address.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp Access Card - Shown when payment is successful */}
      {payment?.status === "success" ? (
        <WhatsAppAccessCard payment={payment} team={team} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {actions.map((action) => (
          <Link key={action.to} to={action.to} className="glass-card rounded-xl p-5 transition hover:shadow-md">
            <h2 className="text-lg font-bold text-slate-900">{action.title}</h2>
            <p className="mt-2 text-sm text-slate-700">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
