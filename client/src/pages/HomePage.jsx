import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BrandLogoGroup } from "../components/BrandLogoGroup";
import { CountdownTimer } from "../components/CountdownTimer";
import { ManagementTeamSection } from "../components/ManagementTeamSection";
import { ParticleField } from "../components/ParticleField";
import { PrizePoolSection } from "../components/PrizePoolSection";
import { StatGrid } from "../components/StatGrid";

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="glass-card relative overflow-hidden rounded-3xl p-8 shadow-xl md:p-12">
        <ParticleField />
        <div className="relative z-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">IEEE RAS x IEEE CS</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-tight text-slate-900 md:text-6xl">2-Day Hackathon</h1>
          <p className="mt-4 text-xl font-semibold text-slate-700">Build. Innovate. Impact.</p>

          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/70 p-4 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Powered By</p>
            <BrandLogoGroup className="mt-3 flex-wrap" showNames />
          </div>

          <div className="mt-8 flex gap-3">
            <Link to="/hackathon-register" className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white">Register Now</Link>
            <Link to="/theme" className="rounded-xl border border-slate-900 px-6 py-3 font-bold text-slate-900">Explore Theme</Link>
          </div>
        </div>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-cyan-50/60 to-white p-6 shadow-lg md:p-8"
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
