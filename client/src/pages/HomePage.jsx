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
import { REGISTRATION_CAPACITY } from "../utils/constants";

export function HomePage() {
  const { user } = useAuth();
  const [payment, setPayment] = useState(null);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState({
    capacity: REGISTRATION_CAPACITY,
    registered: 0,
    registeredTeams: 0,
    remaining: REGISTRATION_CAPACITY,
    registrationClosed: false
  });
  const [isCheckingRegistrationStatus, setIsCheckingRegistrationStatus] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    async function loadRegistrationStatus() {
      setIsCheckingRegistrationStatus(true);

      try {
        const response = await api.get("/registration/status");

        if (!isMounted) {
          return;
        }

        setRegistrationStatus({
          capacity: Number(response.data?.capacity || REGISTRATION_CAPACITY),
          registered: Number(response.data?.registered || 0),
          registeredTeams: Number(response.data?.registeredTeams || 0),
          remaining: Number(response.data?.remaining ?? REGISTRATION_CAPACITY),
          registrationClosed: Boolean(response.data?.registrationClosed)
        });
      } catch {
        if (isMounted) {
          setRegistrationStatus((current) => current);
        }
      } finally {
        if (isMounted) {
          setIsCheckingRegistrationStatus(false);
        }
      }
    }

    loadRegistrationStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const isRegistrationClosed = registrationStatus.registrationClosed || registrationStatus.remaining <= 0;

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
              <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-2">
                <h1 className="text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl md:text-6xl">2-Day Hackathon</h1>
                <Link to="/schedule" className="pb-2 text-sm font-bold text-cyan-700 underline decoration-cyan-300 decoration-2 underline-offset-4 transition hover:text-cyan-800">
                  Know more
                </Link>
              </div>
              <p className="mt-4 text-lg font-semibold text-slate-700 sm:text-xl">Build. Innovate. Impact.</p>
              <p className="mt-2 inline-flex w-fit rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-800 shadow-sm sm:text-base">
                Mohan Babu University, New Academic Block, Room No: 4016
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm font-semibold sm:text-base">
                <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 px-4 py-2.5 shadow-sm ring-1 ring-amber-100">
                  <span className="relative flex h-12 w-12 flex-col overflow-hidden rounded-xl border border-amber-300 bg-white shadow-sm">
                    <span className="flex h-3.5 items-center justify-center bg-gradient-to-r from-amber-500 to-orange-500 text-[7px] font-black uppercase tracking-[0.16em] text-white">
                      Sep
                    </span>
                    <span className="flex flex-1 items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 text-xl font-black text-amber-800">
                      21
                    </span>
                    <span className="absolute left-1.5 right-1.5 top-3 h-px bg-white/80" />
                    <span className="absolute left-2 top-1.5 h-1.5 w-1.5 rounded-full bg-white/90" />
                    <span className="absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full bg-white/90" />
                  </span>
                  <span className="text-slate-700">
                    <span className="font-extrabold text-amber-700">Date:</span> 21-22 September 2026
                  </span>
                </div>
                <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 px-4 py-2.5 shadow-sm ring-1 ring-cyan-100">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-base text-white shadow-sm">🎤</span>
                  <span className="text-slate-700">
                    <span className="font-extrabold text-cyan-700">Inauguration Ceremony:</span> 8:00 AM <span className="font-medium text-slate-600">(Dasari Auditorium)</span>
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Powered By</p>
                <BrandLogoGroup className="mt-3 flex-wrap justify-center sm:justify-start" showNames />
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm">
                  <p className="w-full text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 sm:text-xs">
                    Before Registering For The HackFusion Explore Themes
                  </p>
                  {isRegistrationClosed ? (
                    <span className="hero-primary-cta inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 py-3 text-center font-bold text-white opacity-80">
                      Registrations Closed
                    </span>
                  ) : (
                    <Link
                      to="/hackathon-register"
                      className="hero-primary-cta inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 py-3 text-center font-bold text-white transition-all duration-300"
                    >
                      Register Now
                    </Link>
                  )}
                </div>

                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm">
                  <p className="w-full text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 sm:text-xs">
                    Explore challenge themes
                  </p>
                  <Link
                    to="/theme"
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 px-6 py-3 text-center font-bold text-cyan-800 shadow-sm transition-all duration-300 hover:bg-cyan-100"
                  >
                    Explore Theme
                  </Link>
                </div>

                <div className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm">
                  <p className="w-full text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 sm:text-xs">
                    Event schedule details
                  </p>
                  <Link
                    to="/schedule"
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-300 bg-slate-50 px-6 py-3 text-center font-bold text-slate-800 shadow-sm transition-all duration-300 hover:bg-slate-100"
                  >
                    Know More
                  </Link>
                </div>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                {isCheckingRegistrationStatus
                  ? "Checking remaining registrations..."
                  : `Registrations left: ${registrationStatus.remaining}`}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {isCheckingRegistrationStatus
                  ? ""
                  : `Registered teams: ${registrationStatus.registeredTeams}`}
              </p>
            </div>

            <aside className="flex h-full w-full max-w-65 flex-col justify-between justify-self-end self-stretch rounded-2xl border border-cyan-200/80 bg-white/80 p-4 shadow-lg ring-1 ring-cyan-100 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-700">Event Access</p>
              <img
                src="/logos/hackathon-id-card.jpg"
                alt="Hackathon ID card"
                className="mt-3 min-h-44 w-full flex-1 rounded-lg border border-slate-200 bg-white object-contain p-1"
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
