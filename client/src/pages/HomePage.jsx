import { motion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { BrandLogoGroup } from "../components/BrandLogoGroup";
import { CountdownTimer } from "../components/CountdownTimer";
import { ManagementTeamSection } from "../components/ManagementTeamSection";
import { ParticleField } from "../components/ParticleField";
import { PrizePoolSection } from "../components/PrizePoolSection";
import { StatGrid } from "../components/StatGrid";

function ConstellationBackdrop() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return undefined;
    }

    const parent = canvas.parentElement;
    if (!parent) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCompact = window.matchMedia("(max-width: 900px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: -9999, y: -9999, active: false };
    const threshold = isCompact ? 82 : 104;
    const influenceRadius = isCompact ? 84 : 116;
    const pointCount = isCompact ? 20 : 32;

    let width = 0;
    let height = 0;
    let frameId = 0;
    let points = [];

    const createPoints = () => {
      points = Array.from({ length: pointCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isCompact ? 0.08 : 0.14),
        vy: (Math.random() - 0.5) * (isCompact ? 0.08 : 0.14)
      }));
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createPoints();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const point of points) {
        point.x += point.vx;
        point.y += point.vy;

        if (point.x < 0 || point.x > width) {
          point.vx *= -1;
        }

        if (point.y < 0 || point.y > height) {
          point.vy *= -1;
        }
      }

      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const a = points[i];
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.hypot(dx, dy);

          if (distance < threshold) {
            const alpha = (1 - distance / threshold) * (isCompact ? 0.19 : 0.27);
            ctx.strokeStyle = `rgba(0,98,155,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const point of points) {
        let dotRadius = isCompact ? 1.65 : 1.95;
        let dotAlpha = isCompact ? 0.56 : 0.66;

        if (pointer.active) {
          const distanceToPointer = Math.hypot(point.x - pointer.x, point.y - pointer.y);
          if (distanceToPointer < influenceRadius) {
            const boost = 1 - distanceToPointer / influenceRadius;
            dotRadius += boost * 0.7;
            dotAlpha += boost * 0.14;
          }
        }

        ctx.fillStyle = `rgba(0,98,155,${Math.min(dotAlpha, 0.95)})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      frameId = window.requestAnimationFrame(draw);
    };

    const onPointerMove = (event) => {
      const rect = parent.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    resize();
    window.addEventListener("resize", resize);
    parent.addEventListener("pointermove", onPointerMove);
    parent.addEventListener("pointerleave", onPointerLeave);

    if (prefersReducedMotion) {
      draw();
      window.cancelAnimationFrame(frameId);
    } else {
      frameId = window.requestAnimationFrame(draw);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      parent.removeEventListener("pointermove", onPointerMove);
      parent.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="constellation-canvas absolute inset-0" aria-hidden />;
}

function HeroVisualPanel() {
  const statItems = useMemo(
    () => [
      { label: "Teams", value: "200+" },
      { label: "Tracks", value: "4" },
      { label: "Mentors", value: "30+" },
      { label: "Hours", value: "48" }
    ],
    []
  );

  return (
    <div className="aurora-panel relative h-70 w-full overflow-hidden rounded-2xl border border-cyan-200/60 p-4 sm:h-80 sm:p-5">
      <div className="aurora-grid absolute inset-0" />
      <ConstellationBackdrop />
      <div className="absolute inset-0 bg-linear-to-br from-cyan-100/50 via-white/55 to-sky-100/55" />
      <div className="absolute -right-12 -top-10 h-44 w-44 rounded-full bg-cyan-300/25 blur-3xl" />
      <div className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-sky-300/30 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="absolute -left-8 -top-8 h-36 w-36 rounded-full bg-cyan-300/30 blur-2xl" />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-cyan-700/95">Hackathon Snapshot</p>
          <h3 className="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">Build with Speed, Ship with Impact</h3>
          <p className="mt-2 max-w-sm text-[13px] font-medium leading-relaxed text-slate-700/95 sm:text-sm">
            Two days of ideation, development, mentorship, and demo day energy.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {statItems.map((item) => (
            <div key={item.label} className="hero-stat-tile rounded-xl border border-white/80 bg-white/78 p-3 shadow-lg shadow-cyan-900/5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">{item.label}</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-cyan-300/65 bg-white/70 px-2 py-1 backdrop-blur-sm">
        <span className="h-2 w-2 rounded-full bg-cyan-500" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700">Live</span>
      </div>
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
