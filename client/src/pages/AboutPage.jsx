import { motion } from "framer-motion";
import { Bot, Cpu, Network, Trophy } from "lucide-react";

const sectionVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
      delay
    }
  })
};

const aboutCards = [
  {
    title: "Immersive Experience",
    icon: Bot,
    description:
      "More than just a coding competition, HackFusion is an immersive experience where participants collaborate in teams to transform innovative ideas into functional prototypes within 24 hours. Under time constraints, teams solve problem statements inspired by real societal, industrial, and technological needs with support from mentors and experts."
  },
  {
    title: "What You Build With",
    icon: Cpu,
    description:
      "Participants are encouraged to create scalable, user-centric solutions using modern technologies such as AI, Machine Learning, Web Development, Cloud Computing, IoT, Robotics, Data Science, and Automation, depending on the selected challenge track."
  },
  {
    title: "Evaluation Process",
    icon: Trophy,
    description:
      "Teams brainstorm, design, develop, test, and present before an expert judging panel. Projects are evaluated on innovation, technical implementation, feasibility, user experience, scalability, and overall impact."
  },
  {
    title: "Learning & Networking",
    icon: Network,
    description:
      "HackFusion bridges classroom learning and real-world engineering through hands-on teamwork, project execution, communication, and rapid product development. Participants also gain valuable networking with mentors, faculty, industry professionals, and fellow innovators."
  }
];

export function AboutPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <motion.header
        className="glass-card rounded-3xl p-6 shadow-lg md:p-10"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        custom={0}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">About HackFusion</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">HackFusion</h1>
        <p className="mt-4 text-slate-700">
          <strong>HackFusion</strong> is a 24-hour innovation hackathon organized by the IEEE Robotics & Automation
          Society (RAS) and IEEE Computer Society (CS), bringing together passionate student innovators, developers,
          designers, and problem-solvers to build technology that creates real-world impact.
        </p>
      </motion.header>

      <div className="grid gap-4 md:grid-cols-2">
        {aboutCards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.article
              key={card.title}
              className="glass-card rounded-2xl p-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={sectionVariants}
              custom={0.08 * (index + 1)}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-md">
                  <Icon size={20} strokeWidth={2.2} />
                </span>
                <h2 className="text-xl font-bold text-slate-900">{card.title}</h2>
              </div>
              <p className="mt-3 text-slate-700">{card.description}</p>
            </motion.article>
          );
        })}
      </div>

      <motion.section
        className="glass-card rounded-3xl p-6 md:p-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
        custom={0.2}
      >
        <h2 className="text-2xl font-bold text-slate-900">Why HackFusion Matters</h2>
        <p className="mt-3 text-slate-700">
          Whether you are an experienced developer or participating in your first hackathon, HackFusion provides an
          inclusive platform to learn, experiment, collaborate, and push your limits. In just 24 hours, ideas evolve
          into impactful solutions, friendships become future collaborations, and participants gain experience that
          extends far beyond the competition.
        </p>
        <p className="mt-4 text-lg font-semibold text-slate-900">
          HackFusion is where ideas meet innovation, collaboration drives creativity, and technology transforms
          challenges into opportunities. Build. Innovate. Impact.
        </p>
      </motion.section>
    </section>
  );
}
