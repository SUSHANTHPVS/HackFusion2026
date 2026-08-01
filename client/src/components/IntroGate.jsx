import { useEffect, useMemo, useRef, useState } from "react";

export function IntroGate({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const rafIdRef = useRef(0);
  const doneRef = useRef(false);

  const duration = useMemo(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduced ? 900 : 2200;
  }, []);

  const finish = () => {
    if (doneRef.current) {
      return;
    }

    doneRef.current = true;
    setIsClosing(true);
    window.setTimeout(() => {
      onComplete();
    }, 240);
  };

  useEffect(() => {
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const value = Math.min((elapsed / duration) * 100, 100);
      setProgress(value);

      if (value >= 100) {
        finish();
        return;
      }

      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    rafIdRef.current = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafIdRef.current);
    };
  }, [duration]);

  return (
    <div className={`intro-gate ${isClosing ? "intro-gate--closing" : ""}`} role="status" aria-live="polite" aria-label="Loading website">
      <div className="intro-gate__backdrop" />
      <div className="intro-gate__glow intro-gate__glow--left" />
      <div className="intro-gate__glow intro-gate__glow--right" />

      <div className="intro-gate__card">
        <p className="intro-gate__eyebrow">IEEE RAS x IEEE CS</p>
        <h1 className="intro-gate__title">2-Day Hackathon</h1>
        <p className="intro-gate__subtitle">Build. Innovate. Impact.</p>

        <div className="intro-gate__barShell" aria-hidden>
          <div className="intro-gate__barFill" style={{ width: `${progress}%` }} />
        </div>

        <div className="intro-gate__metaRow">
          <span className="intro-gate__percent">{Math.round(progress)}%</span>
          <button type="button" className="intro-gate__skip" onClick={finish}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
