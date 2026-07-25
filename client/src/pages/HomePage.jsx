import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
          <div className="mt-8 flex gap-3">
            <Link to="/hackathon-register" className="rounded-xl bg-slate-900 px-6 py-3 font-bold text-white">Register Now</Link>
            <Link to="/theme" className="rounded-xl border border-slate-900 px-6 py-3 font-bold text-slate-900">Explore Theme</Link>
          </div>
        </div>
      </section>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <CountdownTimer />
      </motion.div>

      <StatGrid />

      <PrizePoolSection />

      <ManagementTeamSection />
    </div>
  );
}
