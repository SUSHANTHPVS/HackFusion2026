import { motion } from "framer-motion";

export function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-2 w-2 rounded-full bg-sky-400/40"
          initial={{
            x: `${Math.random() * 100}%`,
            y: "105%",
            opacity: 0
          }}
          animate={{
            y: "-10%",
            opacity: [0, 1, 0],
            x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`]
          }}
          transition={{
            duration: 10 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 6,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}
