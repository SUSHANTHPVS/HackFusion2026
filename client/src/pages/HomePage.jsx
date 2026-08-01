import { motion } from "framer-motion";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BrandLogoGroup } from "../components/BrandLogoGroup";
import { CountdownTimer } from "../components/CountdownTimer";
import { ManagementTeamSection } from "../components/ManagementTeamSection";
import { ParticleField } from "../components/ParticleField";
import { PrizePoolSection } from "../components/PrizePoolSection";
import { StatGrid } from "../components/StatGrid";

const Hero3DScene = lazy(() => import("../components/Hero3DScene").then((module) => ({ default: module.Hero3DScene })));

function HeroScenePlaceholder() {
  return <div className="h-70 w-full rounded-2xl border border-cyan-200/60 bg-linear-to-br from-cyan-100/55 via-white/70 to-sky-100/65 sm:h-80" />;
}

export function HomePage() {
  const hero3DRef = useRef(null);
  const [shouldLoadHero3D, setShouldLoadHero3D] = useState(false);

  useEffect(() => {
    if (shouldLoadHero3D || !hero3DRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible) {
          setShouldLoadHero3D(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: "120px 0px",
        threshold: 0.15
      }
    );

    observer.observe(hero3DRef.current);

    return () => {
      observer.disconnect();
    };
  }, [shouldLoadHero3D]);

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
              <Link to="/hackathon-register" className="rounded-xl bg-slate-900 px-6 py-3 text-center font-bold text-white">
                Register Now
              </Link>
              <Link to="/theme" className="rounded-xl border border-slate-900 px-6 py-3 text-center font-bold text-slate-900">
                Explore Theme
              </Link>
            </div>
          </div>

          <motion.div
            ref={hero3DRef}
            initial={{ opacity: 0, scale: 0.92, y: 22 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 }}
            className="mx-auto w-full max-w-xl lg:max-w-none"
          >
            {shouldLoadHero3D ? (
              <Suspense fallback={<HeroScenePlaceholder />}>
                <Hero3DScene />
              </Suspense>
            ) : (
              <HeroScenePlaceholder />
            )}
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
