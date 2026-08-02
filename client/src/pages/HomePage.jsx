import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BrandLogoGroup } from "../components/BrandLogoGroup";
import { CountdownTimer } from "../components/CountdownTimer";
import { ManagementTeamSection } from "../components/ManagementTeamSection";
import { ParticleField } from "../components/ParticleField";
import { PrizePoolSection } from "../components/PrizePoolSection";
import { StatGrid } from "../components/StatGrid";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export function HomePage() {
  const { user } = useAuth();
  const [payment, setPayment] = useState(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPaymentStatus() {
      if (user?.role !== "participant") {
        return;
      }

      setIsCheckingPayment(true);

      try {
        const response = await api.get("/participant/dashboard");
        if (!isMounted) {
          return;
        }

        setPayment(response.data?.payment || null);
      } catch {
        if (isMounted) {
          setPayment(null);
        }
      } finally {
        if (isMounted) {
          setIsCheckingPayment(false);
        }
      }
    }

    loadPaymentStatus();

    return () => {
      isMounted = false;
    };
  }, [user?.role]);

  return (
    <div className="space-y-8">
      {payment?.status === "success" ? (
        <section className="glass-card rounded-3xl border border-emerald-200 bg-linear-to-r from-emerald-50 via-white to-cyan-50 p-6 shadow-lg md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Registration status</p>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 md:text-3xl">You have already registered for the hackathon</h2>
          <p className="mt-3 max-w-3xl text-sm text-slate-700 md:text-base">
            If you have not joined the communication group yet, go to the dashboard. Your WhatsApp join link is available there.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/participant"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
            >
              Go to Dashboard
            </Link>
          </div>
        </section>
      ) : null}

      {isCheckingPayment ? (
        <section className="glass-card rounded-3xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-600 shadow-sm">
          Checking your registration status...
        </section>
      ) : null}

      <section className="glass-card relative overflow-hidden rounded-3xl p-6 shadow-xl sm:p-8 md:p-12">
        <ParticleField />
        <div className="relative z-10">
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-stretch">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">IEEE RAS x IEEE CS</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl md:text-6xl">2-Day Hackathon</h1>
              <p className="mt-4 text-lg font-semibold text-slate-700 sm:text-xl">Build. Innovate. Impact.</p>

              <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Powered By</p>
                <BrandLogoGroup className="mt-3 flex-wrap justify-center sm:justify-start" showNames />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/hackathon-register"
                  className="hero-primary-cta rounded-xl px-6 py-3 text-center font-bold text-white transition-all duration-300"
                >
                  Register Now
                </Link>
                <Link
                  to="/theme"
                  className="hero-secondary-cta rounded-xl border px-6 py-3 text-center font-bold text-slate-900 transition-all duration-300"
                >
                  Explore Theme
                </Link>
              </div>
            </div>

            <aside className="w-full max-w-65 justify-self-end self-stretch rounded-2xl border border-cyan-200/80 bg-white/80 p-4 shadow-lg ring-1 ring-cyan-100 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700">Event Access</p>
              <img
                src="/logos/hackathon-id-card.jpg"
                alt="Hackathon ID card"
                className="mt-3 h-44 w-full rounded-lg border border-slate-200 bg-white object-contain p-1"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/logos/hackathon-id-card.svg";
                }}
              />
              <p className="mt-3 text-xs font-semibold text-slate-700">ID Card Will Be Given At The Venue</p>
            </aside>
          </div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card rounded-3xl border border-slate-200/80 bg-linear-to-r from-white via-cyan-50/60 to-white p-6 shadow-lg md:p-8"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Organized By</p>
            <h2 className="mt-2 text-2xl font-extrabold text-slate-900 md:text-3xl">College and IEEE Society Chapters</h2>
            <p className="mt-2 text-sm text-slate-600 md:text-base">
              Officially hosted by our college with IEEE RAS and IEEE CS student chapter collaboration.
            </p>
          </div>

          <BrandLogoGroup className="flex-wrap" showNames />
        </div>
      </motion.section>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <CountdownTimer />
      </motion.div>

      <StatGrid />

      <PrizePoolSection />

      <ManagementTeamSection />
    </div>
  );
}
