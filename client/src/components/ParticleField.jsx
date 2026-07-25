import { motion } from "framer-motion";

const tags = ["Robotics", "AI", "Circuits"];

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
      <div className="absolute bottom-6 left-6 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-cyan-300/40 bg-white/40 px-4 py-1 text-xs font-semibold tracking-wider text-slate-700">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
