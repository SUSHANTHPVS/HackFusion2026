import { motion } from "framer-motion";

const themes = [
  {
    emoji: "🤖",
    title: "AI for Smarter Living",
    description: "Harness Artificial Intelligence to solve everyday challenges."
  },
  {
    emoji: "🌍",
    title: "Technology for Social Good",
    description: "Build solutions that create a positive impact on society and improve quality of life."
  },
  {
    emoji: "🌱",
    title: "Smart & Sustainable Future",
    description: "Develop technology that promotes environmental sustainability and efficient resource management."
  },
  {
    emoji: "🏥",
    title: "Future of Healthcare & Well-being",
    description: "Reimagine healthcare through digital innovation and intelligent technologies."
  },
  {
    emoji: "🚀",
    title: "Smart Automation & Robotics Solutions",
    description: "Design software solutions that support robotics, automation, and intelligent systems."
  }
];

const judgingFocus = [
  "💡 Innovation & Creativity",
  "⚙ Technical Implementation",
  "🌍 Real-World Impact",
  "📈 Scalability",
  "🎨 User Experience",
  "🗣 Presentation & Demonstration"
];

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: "easeOut" }
  })
};

export function ThemePage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <motion.header
        className="glass-card rounded-3xl p-6 shadow-lg md:p-10"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">HackFusion 2026</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">Themes</h1>
        <p className="mt-4 text-slate-700">Explore the official challenge tracks and judging focus for HackFusion 2026.</p>
      </motion.header>

      <div className="grid gap-4 md:grid-cols-2">
        {themes.map((theme, index) => (
          <motion.article
            key={theme.title}
            className="glass-card rounded-2xl p-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
            custom={0.06 * (index + 1)}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Theme {index + 1}</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">{theme.emoji} {theme.title}</h2>
            <p className="mt-3 text-slate-700"><span className="font-semibold">Theme:</span> {theme.description}</p>
          </motion.article>
        ))}
      </div>

      <motion.section
        className="glass-card rounded-3xl p-6 md:p-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
        custom={0.2}
      >
        <h2 className="text-2xl font-bold text-slate-900">Judging Focus</h2>
        <p className="mt-2 text-slate-700">Projects will be evaluated based on:</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {judgingFocus.map((item) => (
            <li key={item} className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 font-semibold text-slate-800">
              {item}
            </li>
          ))}
        </ul>
      </motion.section>
    </section>
  );
}