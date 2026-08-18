import { useState } from "react";
import { motion } from "framer-motion";
import { CountdownTimer } from "../components/CountdownTimer";
import { useCountdown } from "../hooks/useCountdown";
import { EVENT_DATE } from "../utils/constants";

const themes = [
  {
    emoji: "🧠", title: "Adaptive Robot Workforce", description: "Teach a simulated robotic workforce new jobs when products, tools, layouts, and procedures change.",
    challengeStatement: "Develop an adaptive robot-learning framework that enables robots to learn previously unseen tasks without redesigning the entire system.",
    coreChallenge: ["New products and task sequences", "Changed workspaces, tools, and priorities", "Previously unseen objects", "Continuous on-site learning and optimization"],
    advancedRequirements: ["Never-seen task → Task decomposition → Skill selection → Plan → Execute → Learn"],
    systemFlow: ["Factory change detected → Context and object understanding", "Task decomposition → Skill library / LLM planning", "Simulation or safe execution → Outcome evaluation", "Learning update → Reusable robot capability"],
    suggestedModules: ["Task Planner", "Skill Library", "Simulation", "Learning Engine", "Robot Dashboard", "Knowledge Graph"], technologies: ["Physical AI", "LLM Planning", "Reinforcement Learning", "Imitation Learning", "Computer Vision", "Simulation"]
  },
  {
    emoji: "🔄", title: "Self-Healing Autonomous Systems", description: "Keep a critical robotic mission operating when robots, sensors, batteries, navigation, or communications fail.",
    challengeStatement: "Build a simulated multi-robot system that detects faults, diagnoses their impact, reorganizes resources, and continues the mission autonomously.",
    coreChallenge: ["Sensor failure", "Communication loss", "Battery degradation", "Navigation failure", "Unseen fault scenarios"],
    advancedRequirements: ["Detect failure → Diagnose → Reassign task → Re-plan → Continue mission"],
    systemFlow: ["Telemetry monitoring → Failure detection", "Diagnosis and impact assessment → Trustworthy recovery plan", "Task and resource reassignment → Mission continuation", "Recovery analytics → Resilience improvement"],
    suggestedModules: ["Health Monitor", "Fault Diagnoser", "Task Allocator", "Mission Planner", "Recovery Engine", "Operations Dashboard"], technologies: ["Autonomous Systems", "Anomaly Detection", "Planning", "Multi-Agent Systems", "Simulation", "Analytics"]
  },
  {
    emoji: "📡", title: "Robot Swarms Under Communication Loss", description: "Design decentralized robot intelligence that remains effective when communication, GPS, or central control disappears.",
    challengeStatement: "Coordinate a simulated swarm of 20-50 robots to complete a mission despite delayed messages, isolation, GPS loss, and unreachable central services.",
    coreChallenge: ["Unreliable and delayed communication", "Isolated robot groups", "GPS unavailability", "Central server outage", "Local decisions with incomplete information"],
    advancedRequirements: ["Local state → Distributed decision → Coordination → Consensus → Mission recovery"],
    systemFlow: ["Mission allocation → Local sensing and planning", "Connectivity disruption → Communication prioritization", "Distributed coordination → Consensus and conflict resolution", "Network recovery → Global state reconciliation"],
    suggestedModules: ["Swarm Simulator", "Local Planner", "Consensus Engine", "Communication Manager", "Mission Recovery", "Swarm Dashboard"], technologies: ["Swarm Robotics", "Distributed Systems", "Consensus", "Path Planning", "Simulation", "Networking"]
  },
  {
    emoji: "🏗️", title: "Autonomous Construction Intelligence", description: "Coordinate construction robots as the site, resources, safety conditions, and priorities continuously change.",
    challengeStatement: "Create a simulated construction intelligence system that schedules and assigns robotic work while preserving safety, task dependencies, and resource efficiency.",
    coreChallenge: ["Material shortage", "Equipment failure", "Weather interruption", "Worker movement", "Blocked access", "Changed project priorities"],
    advancedRequirements: ["Site state + Safety zones + Dependencies + Resources → Schedule → Robot assignment → Re-plan"],
    systemFlow: ["Site map and plan ingestion → Dependency and safety analysis", "Robot capability matching → Work scheduling", "Disruption detected → Re-planning and reassignment", "Progress tracking → Construction operations dashboard"],
    suggestedModules: ["Site Digital Twin", "Safety Manager", "Scheduler", "Resource Tracker", "Robot Coordinator", "Progress Dashboard"], technologies: ["Robotics", "Optimization", "Digital Twins", "Computer Vision", "Scheduling", "Simulation"]
  },
  {
    emoji: "⚡", title: "Autonomous Energy Infrastructure Guardian", description: "Prioritize inspection and maintenance for a simulated energy network with limited robotic time and battery capacity.",
    challengeStatement: "Build an autonomous system that detects risks, predicts failures, prioritizes assets, and optimizes inspection missions across energy infrastructure.",
    coreChallenge: ["Solar installations, transformers, power lines, batteries, and substations", "Thermal, visual, sensor, weather, load, and historical data", "Only three inspection robots and limited operation time"],
    advancedRequirements: ["Evidence → Failure prediction → Risk priority → Robot assignment → Battery/time-constrained mission"],
    systemFlow: ["Asset data ingestion → Condition and anomaly analysis", "Failure prediction → Risk scoring and priority queue", "Inspection mission optimization → Robot dispatch", "Inspection result → Asset health dashboard"],
    suggestedModules: ["Asset Registry", "Risk Engine", "Failure Predictor", "Mission Optimizer", "Robot Fleet Manager", "Energy Dashboard"], technologies: ["Predictive Maintenance", "Computer Vision", "Optimization", "IoT", "AI/ML", "Data Visualization"]
  },
  {
    emoji: "🕳️", title: "Autonomous Underground & Confined-Space Intelligence", description: "Navigate, map, inspect, and return safely from underground environments where GPS and sensors are unreliable.",
    challengeStatement: "Develop a simulated autonomous inspection robot for tunnels, mines, sewers, pipelines, or utility corridors with noisy and contradictory sensor evidence.",
    coreChallenge: ["No reliable GPS", "Localization and mapping", "Communication loss", "Noisy or conflicting sensor readings", "Safe route planning and return"],
    advancedRequirements: ["Sensor fusion → Localization / SLAM → Abnormality detection → Risk estimate → Safe route"],
    systemFlow: ["Multi-sensor input → Evidence fusion", "SLAM and local map update → Anomaly detection", "Risk-aware path planning → Inspection execution", "Return planning → Underground mission dashboard"],
    suggestedModules: ["Sensor Fusion", "SLAM Engine", "Anomaly Detector", "Risk Mapper", "Route Planner", "Digital Twin"], technologies: ["SLAM", "Sensor Fusion", "Computer Vision", "Acoustic Analysis", "Robotics", "Digital Twins"]
  },
  {
    emoji: "🛡️", title: "Cyber-Physical Robot Security", description: "Secure an autonomous robotic facility against spoofed sensors, fake commands, compromised identities, and malicious task injection.",
    challengeStatement: "Build a simulated robot security platform that identifies abnormal behavior, isolates compromised robots, and keeps the remaining mission operational.",
    coreChallenge: ["False sensor readings", "Spoofed location", "Fake or replayed commands", "Compromised identities", "Malicious task injection"],
    advancedRequirements: ["Authenticate → Monitor → Trust score → Detect attack → Isolate → Recover mission"],
    systemFlow: ["Robot identity and telemetry → Authentication and integrity checks", "Behavior analysis → Anomaly and attack detection", "Trust scoring → Secure task allocation", "Compromise containment → Mission recovery"],
    suggestedModules: ["Identity Manager", "Trust Engine", "Attack Detector", "Secure Task Allocator", "Incident Response", "Security Dashboard"], technologies: ["Cybersecurity", "Anomaly Detection", "Zero Trust", "Digital Forensics", "Robotics", "Secure Networking"]
  },
  {
    emoji: "🧩", title: "Robot Intelligence Under Resource Constraints", description: "Make a simulated robot allocate limited compute, memory, battery, bandwidth, and time to a complex mission.",
    challengeStatement: "Create an adaptive inference and decision system that decides what to compute, ignore, communicate, or offload under strict resource limits.",
    coreChallenge: ["CPU and memory limits", "Battery and bandwidth limits", "Latency limits", "High-accuracy versus lightweight inference", "Only a few dangerous objects among many"],
    advancedRequirements: ["Mission context → Resource budget → Inference selection → Edge/cloud decision → Action"],
    systemFlow: ["Mission input → Resource monitoring", "Object triage → Model and compute selection", "Edge inference / server offload decision → Action", "Outcome and resource reporting → Adaptive policy update"],
    suggestedModules: ["Resource Monitor", "Object Triage", "Inference Router", "Edge-Cloud Manager", "Policy Engine", "Performance Dashboard"], technologies: ["Edge AI", "Adaptive Inference", "Resource Allocation", "Robotics", "Optimization", "Simulation"]
  }
];

const deploymentRequirement = "Every application should be deployed either on Vercel and Render or AWS.";

const judgingFocus = [
  "💡 Innovation & Creativity",
  "⚙ Technical Implementation",
  "🌍 Real-World Impact",
  "📈 Scalability",
  "🎨 User Experience",
  "🗣 Presentation & Demonstration"
];

const commonExpectations = [
  "User → Web/Mobile Interface → Authentication & Authorization → Backend/API Layer → Business Logic → AI/Intelligence Layer → Database/External APIs → Analytics & Notification Layer",
  "Level 1 — Core Application: functional web/mobile app with a complete primary workflow",
  "Level 2 — Backend Engineering: REST APIs, database, authentication, authorization, validation, and business logic",
  "Level 3 — Intelligence: AI/ML, prediction, recommendation, optimization, NLP, anomaly detection, or intelligent classification",
  "Level 4 — Integration: external APIs, real-time information, maps, notifications, payment/service integrations, or IoT data",
  "Level 5 — Analytics: dashboards, KPIs, reports, historical analysis, trends, and actionable insights",
  "Level 6 — Security & Scalability: secure authentication, role-based access, data protection, error handling, scalable architecture, and performance",
  "Level 7 — Innovation: a unique feature or approach that significantly improves the proposed solution"
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
  const [expandedTheme, setExpandedTheme] = useState(themes[0].title);
  const { days, hours, minutes, seconds } = useCountdown(EVENT_DATE);
  const isCountdownComplete = days === 0 && hours === 0 && minutes === 0 && seconds === 0;

  const summaryIcons = {
    "Adaptive Robot Workforce": "🧠",
    "Self-Healing Autonomous Systems": "🔄",
    "Robot Swarms Under Communication Loss": "📡",
    "Autonomous Construction Intelligence": "🏗️",
    "Autonomous Energy Infrastructure Guardian": "⚡",
    "Autonomous Underground & Confined-Space Intelligence": "🕳️",
    "Cyber-Physical Robot Security": "🛡️",
    "Robot Intelligence Under Resource Constraints": "🧩"
  };

  const categoryGroups = [
    { label: "Adaptive & Resilient Robotics", color: "from-cyan-500 to-blue-600", themes: ["Adaptive Robot Workforce", "Self-Healing Autonomous Systems", "Robot Swarms Under Communication Loss"] },
    { label: "Autonomous Operations", color: "from-emerald-500 to-green-600", themes: ["Autonomous Construction Intelligence", "Autonomous Energy Infrastructure Guardian", "Autonomous Underground & Confined-Space Intelligence"] },
    { label: "Secure & Efficient AI", color: "from-fuchsia-500 to-purple-600", themes: ["Cyber-Physical Robot Security", "Robot Intelligence Under Resource Constraints"] }
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <CountdownTimer />

      {!isCountdownComplete ? (
        <>
          <motion.header
            className="glass-card rounded-3xl p-6 shadow-lg md:p-10"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">HackFusion 2026</p>
            <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">Challenge Domains Preview</h1>
            <p className="mt-4 text-slate-700">
              All theme titles are now visible. Full theme details will unlock after the countdown ends.
            </p>
            <p className="mt-3 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
              Showing all {themes.length} theme titles now
            </p>
          </motion.header>

          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex flex-wrap gap-3">
              {categoryGroups.map((group) => (
                <div key={group.label} className={`rounded-full bg-linear-to-r ${group.color} px-4 py-2 text-sm font-semibold text-white shadow-sm`}>
                  {group.label}
                </div>
              ))}
            </div>
          </div>

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
                <p className="mt-3 text-sm leading-6 text-slate-700">Full details locked until countdown completes.</p>
              </motion.article>
            ))}
          </div>

          <motion.section
            className="glass-card rounded-3xl p-6 text-center md:p-8"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <h2 className="text-2xl font-bold text-slate-900">Full Reveal After Countdown</h2>
            <p className="mt-2 text-slate-700">
              All themes, full challenge statements, system flows, and judging sections will become visible automatically on 25 September 2026 at 6:00 AM.
            </p>
          </motion.section>
        </>
      ) : (
        <>
          <motion.header
            className="glass-card rounded-3xl p-6 shadow-lg md:p-10"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">HackFusion 2026</p>
            <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">Challenge Domains & Expectations</h1>
            <p className="mt-4 text-slate-700">
              Explore the official challenge tracks, their core requirements, system flows, modules, technologies, and the common expectations for every HackFusion 2026 solution.
            </p>
            <p className="mt-3 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800">
              There Are No Restrictions For Modules And Features
            </p>
          </motion.header>

          <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex flex-wrap gap-3">
              {categoryGroups.map((group) => (
                <div key={group.label} className={`rounded-full bg-linear-to-r ${group.color} px-4 py-2 text-sm font-semibold text-white shadow-sm`}>
                  {group.label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {themes.map((theme, index) => {
              const isExpanded = expandedTheme === theme.title;

          return (
            <motion.article
              key={theme.title}
              className="glass-card rounded-2xl p-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={sectionVariants}
              custom={0.06 * (index + 1)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Theme {index + 1}</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">{theme.emoji} {theme.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedTheme(isExpanded ? "" : theme.title)}
                  className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
                >
                  {isExpanded ? "Hide details" : "View details"}
                </button>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-700">{theme.description}</p>

              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-red-700 shadow-sm">
                {deploymentRequirement}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {summaryIcons[theme.title]} Focus
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {theme.suggestedModules.length} Modules
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {theme.technologies.length} Tech Areas
                </span>
              </div>

              <motion.div
                initial={false}
                animate={{ height: isExpanded ? "auto" : 0, opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900">Challenge Statement</p>
                    <p className="mt-1 leading-6">{theme.challengeStatement}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">Core Challenge</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 leading-6">
                      {theme.coreChallenge.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">Advanced Requirements</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 leading-6">
                      {theme.advancedRequirements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">System Flow</p>
                    <div className="mt-2 space-y-2">
                      {theme.systemFlow.map((item, flowIndex) => (
                        <div
                          key={`${theme.title}-${flowIndex}`}
                          className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3"
                        >
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">
                            Step {flowIndex + 1}
                          </div>
                          <p className="mt-1 leading-6 text-slate-700">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">Suggested Modules</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {theme.suggestedModules.map((module) => (
                        <span key={module} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {module}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">Technologies</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {theme.technologies.map((tech) => (
                        <span key={tech} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
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
            <h2 className="text-2xl font-bold text-slate-900">Common Expectations for All Challenges</h2>
            <p className="mt-2 text-slate-700">
              Every team should aim to demonstrate a complete, working software solution rather than a collection of isolated features.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {commonExpectations.map((item) => (
                <li key={item} className="rounded-xl border border-slate-200 bg-white/70 px-4 py-3 leading-6">
                  {item}
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.section
            className="glass-card rounded-3xl p-6 md:p-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
            custom={0.24}
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
        </>
      )}
    </section>
  );
}