import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogoGroup } from "../components/BrandLogoGroup";
import { CountdownTimer } from "../components/CountdownTimer";
import { ManagementTeamSection } from "../components/ManagementTeamSection";
import { ParticleField } from "../components/ParticleField";
import { PrizePoolSection } from "../components/PrizePoolSection";
import { StatGrid } from "../components/StatGrid";

function HeroVisualPanel() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isCompactInteraction, setIsCompactInteraction] = useState(false);

  const statItems = useMemo(
    () => [
      { label: "Teams", value: "200+" },
      { label: "Tracks", value: "4" },
      { label: "Mentors", value: "30+" },
      { label: "Hours", value: "48" }
    ],
    []
  );

  const handlePointerMove = (event) => {
    if (isCompactInteraction) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    setTilt({
      x: py * -7,
      y: px * 9
    });
  };

  const resetTilt = () => {
    setTilt({ x: 0, y: 0 });
  };

  useEffect(() => {
    const compactQuery = window.matchMedia("(pointer: coarse), (max-width: 900px)");

    const updateCompactMode = () => {
      setIsCompactInteraction(compactQuery.matches);
      if (compactQuery.matches) {
        setTilt({ x: 0, y: 0 });
      }
    };

    updateCompactMode();
    compactQuery.addEventListener("change", updateCompactMode);

    return () => {
      compactQuery.removeEventListener("change", updateCompactMode);
    };
  }, []);

  return (
    <div className="h-70 w-full [perspective:1300px] sm:h-80">
      <motion.div
        onMouseMove={handlePointerMove}
        onMouseLeave={resetTilt}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 110, damping: 20, mass: 0.65 }}
        className={`holo-card relative h-full w-full overflow-hidden rounded-2xl border border-cyan-200/60 p-4 sm:p-5 ${
          isCompactInteraction ? "holo-card-compact" : ""
        }`}
      >
        <div className="holo-glow absolute inset-0" />
        <div className="holo-sheen absolute inset-0" />
        <div className="absolute -left-8 -top-8 h-36 w-36 rounded-full bg-cyan-300/30 blur-2xl" />
        <div className="absolute -bottom-8 -right-8 h-36 w-36 rounded-full bg-sky-300/35 blur-2xl" />
        <div className="holo-orbital-ring absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/50" />

        <div className="relative z-10 flex h-full flex-col justify-between [transform-style:preserve-3d]">
          <div style={{ transform: "translateZ(42px)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-700/95">Hackathon Snapshot</p>
            <h3 className="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">Build with Speed, Ship with Impact</h3>
            <p className="mt-2 max-w-sm text-[13px] font-medium leading-relaxed text-slate-700/95 sm:text-sm">
              Two days of ideation, development, mentorship, and demo day energy.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3" style={{ transform: "translateZ(66px)" }}>
            {statItems.map((item) => (
              <div key={item.label} className="holo-stat-tile rounded-xl border border-white/80 bg-white/70 p-3 shadow-lg shadow-cyan-900/5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">{item.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="glass-card relative overflow-hidden rounded-3xl p-6 shadow-xl sm:p-8 md:p-12">
        <ParticleField />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
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

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 22 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 }}
            className="mx-auto w-full max-w-xl lg:max-w-none"
          >
            <HeroVisualPanel />
          </motion.div>
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
