import { useEffect, useRef } from "react";

export function ConstellationBackground() {
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

    const pointer = { x: -9999, y: -9999, active: false };
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCompact = window.matchMedia("(max-width: 900px)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const threshold = isCompact ? 92 : 122;
    const influenceRadius = isCompact ? 82 : 116;
    const pointCount = isCompact ? 86 : 142;

    let width = 0;
    let height = 0;
    let frameId = 0;
    let points = [];

    const createPoints = () => {
      points = Array.from({ length: pointCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isCompact ? 0.06 : 0.12),
        vy: (Math.random() - 0.5) * (isCompact ? 0.06 : 0.12)
      }));
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
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

        if (point.x < -4 || point.x > width + 4) {
          point.vx *= -1;
        }

        if (point.y < -4 || point.y > height + 4) {
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
            const alpha = (1 - distance / threshold) * (isCompact ? 0.23 : 0.31);
            ctx.strokeStyle = `rgba(0,98,155,${alpha})`;
            ctx.lineWidth = 1.05;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      for (const point of points) {
        let dotRadius = isCompact ? 1.3 : 1.55;
        let dotAlpha = isCompact ? 0.42 : 0.54;

        if (pointer.active) {
          const distanceToPointer = Math.hypot(point.x - pointer.x, point.y - pointer.y);
          if (distanceToPointer < influenceRadius) {
            const boost = 1 - distanceToPointer / influenceRadius;
            dotRadius += boost * 0.6;
            dotAlpha += boost * 0.26;
          }
        }

        ctx.fillStyle = `rgba(0,98,155,${Math.min(dotAlpha, 0.88)})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      frameId = window.requestAnimationFrame(draw);
    };

    const onPointerMove = (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerout", onPointerLeave);

    if (prefersReducedMotion) {
      draw();
      window.cancelAnimationFrame(frameId);
    } else {
      frameId = window.requestAnimationFrame(draw);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="global-constellation" aria-hidden />;
}
