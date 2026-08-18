import { useState } from "react";
import { motion } from "framer-motion";
import { CountdownTimer } from "../components/CountdownTimer";
import { useCountdown } from "../hooks/useCountdown";
import { THEME_REVEAL_DATE } from "../utils/constants";

const themes = [
  {
    emoji: "�", title: "Multi-Robot Task Negotiation Engine", description: "Coordinate 500+ heterogeneous autonomous mobile robots in a high-density industrial environment without a centralized path planner.",
    challengeStatement: "Build a decentralized coordination engine that lets autonomous robots negotiate task ownership, resolve right-of-way, predict collisions, and recover from deadlocks and failures in real time — without depending on a central controller.",
    coreChallenge: ["Multi-agent task allocation", "Peer-to-peer negotiation", "Dynamic right-of-way resolution", "Collision prediction", "Deadlock detection and recovery", "Battery-aware task reassignment", "Dynamic route replanning", "Priority-aware scheduling", "Partial-information decision making", "Robot failure recovery"],
    advancedRequirements: ["Central controller deliberately unavailable during portions of evaluation → swarm must continue via distributed decision-making", "Evaluation environment has significantly more robots and tasks than development → must demonstrate scalability, not hard-coded behaviour", "Deployment mandatory: expose a live dashboard/API so the swarm coordination can be observed and evaluated in real time"],
    systemFlow: ["Robot state, battery, and local sensing → peer-to-peer negotiation over shared lanes", "Auction/consensus-based task allocation → priority and battery-aware scheduling", "Collision prediction and deadlock detection → distributed conflict resolution", "Controller/robot failure → distributed recovery and continued swarm operation"],
    suggestedModules: ["Negotiation Engine", "Auction Allocator", "Collision Predictor", "Deadlock Resolver", "Battery-Aware Scheduler", "Swarm Dashboard"], technologies: ["Multi-Agent Reinforcement Learning", "Game Theory", "Consensus Algorithms", "Auction-Based Allocation", "Distributed Optimization", "Conflict-Based Search"]
  },
  {
    emoji: "🗺️", title: "Semantic SLAM Recovery & Map Reconstruction", description: "Maintain a consistent semantic map for robots operating where a large portion of the visual scene keeps changing — construction sites, disaster zones, industrial facilities, underground infrastructure.",
    challengeStatement: "Build a visual SLAM system that separates permanent structural landmarks from temporary or moving objects, detects accumulated drift and incorrect associations, repairs corrupted map regions, and reconciles observations across multiple robots — with no GPS, beacons, or predefined landmarks.",
    coreChallenge: ["Visual localization", "Dynamic object detection", "Environmental feature classification", "Pose uncertainty estimation", "Accumulated drift detection", "Incorrect map association identification", "Corrupted map region repair", "Missing section reconstruction", "Multi-robot observation reconciliation", "Map consistency under changing conditions"],
    advancedRequirements: ["No external GPS, beacon, or predefined landmark infrastructure may be assumed", "Previously stable landmarks disappear or change during evaluation — system must decide which parts of its map can still be trusted", "Deployment mandatory: publish the live semantic map and drift/trust status through a deployed dashboard"],
    systemFlow: ["Multi-robot visual input → localization and semantic feature classification", "Loop closure and pose-graph optimization → drift and association-error detection", "Trust scoring per map region → repair and reconstruction of corrupted sections", "Cross-robot observation fusion → consistent, continuously updated semantic map"],
    suggestedModules: ["Visual SLAM Engine", "Semantic Classifier", "Drift Detector", "Map Repair Module", "Multi-Robot Fusion", "Map Trust Dashboard"], technologies: ["Visual SLAM", "Semantic Segmentation", "Feature Matching", "Pose-Graph Optimization", "Loop Closure", "Multi-Agent Mapping"]
  },
  {
    emoji: "🚁", title: "Physics-Informed Drone Digital Twin", description: "Digital twin and control simulation for an autonomous drone under environmental conditions that invalidate ordinary flight assumptions.",
    challengeStatement: "Build a physics-informed digital twin that estimates the drone's real-time physical state — under changing wind, air density, turbulence, battery temperature, payload, and rotor efficiency — and predicts whether the mission should continue, alter trajectory, reduce speed, return to base, or abort.",
    coreChallenge: ["Wind velocity, air density, and turbulence modelling", "Battery temperature effects on performance", "Payload and rotor efficiency changes", "Motor degradation tracking", "Energy consumption prediction", "Flight stability and structural stress estimation", "Remaining mission endurance estimation", "Safe operating envelope calculation"],
    advancedRequirements: ["Combine physics-based constraints with learned models rather than relying entirely on a black-box neural network", "Mid-mission: wind shifts suddenly, one rotor loses efficiency, battery temperature rises, payload changes — controller must decide the safe course of action", "Deployment mandatory: serve the live digital-twin telemetry and control decisions through a deployed application"],
    systemFlow: ["Sensor and environmental telemetry → physics-informed state estimation", "Predicted energy, stability, and stress envelope → risk-of-failure assessment", "Control decision: continue / alter trajectory / reduce speed / return / abort", "Post-decision telemetry → digital twin recalibration and endurance forecast update"],
    suggestedModules: ["State Estimator", "Aerodynamic Model", "Degradation Predictor", "Mission Controller", "Safety Envelope Monitor", "Telemetry Dashboard"], technologies: ["Physics-Informed Neural Networks", "Neural ODEs", "Model Predictive Control", "Kalman Filtering", "Reinforcement Learning", "Digital Twins"]
  },
  {
    emoji: "🛠️", title: "Robot Fleet Recovery Under Cascading Failures", description: "Maintain mission performance for a fleet of hundreds of robots when failures propagate and cascade rather than occurring independently.",
    challengeStatement: "Build a fleet-management system that predicts failure propagation, migrates tasks, rebalances the fleet, and preserves the maximum achievable mission performance — not simply keeping every robot operational — as failures cascade through the system.",
    coreChallenge: ["Failure prediction", "Robot health modelling", "Mission criticality analysis", "Dynamic task migration", "Fleet rebalancing", "Battery optimization", "Capacity forecasting", "Failure propagation analysis", "Mission recovery", "Graceful degradation"],
    advancedRequirements: ["Hidden evaluation introduces a failure sequence not included in the supplied development scenarios", "Evaluated on maximum possible mission performance rather than on keeping every robot operational", "Deployment mandatory: expose fleet health, propagation risk, and recovery actions via a deployed dashboard/API"],
    systemFlow: ["Fleet telemetry: capabilities, battery, sensor health, reliability → health and criticality modelling", "Failure detected → propagation-risk forecasting before overload cascades", "Dynamic task migration and fleet rebalancing → battery- and capacity-aware reassignment", "Mission outcome tracking → graceful degradation and recovery analytics"],
    suggestedModules: ["Health Modeller", "Propagation Forecaster", "Task Migration Engine", "Fleet Rebalancer", "Capacity Planner", "Fleet Operations Dashboard"], technologies: ["Distributed Systems", "Reliability Engineering", "Predictive Analytics", "Optimization", "Graph-Based Failure Analysis", "Fleet Management"]
  },
  {
    emoji: "🔐", title: "Zero-Trust Agent Identity & Privilege Fabric", description: "Continuous, context-aware authorization for AI agents, developers, services, and robots continuously requesting access to critical resources.",
    challengeStatement: "Build an authorization engine that issues short-lived, context-bound credentials and continuously re-evaluates identity, device state, task, behaviour, and risk to decide whether to continue, restrict, re-authenticate, reduce privilege, revoke, or isolate access.",
    coreChallenge: ["Identity and device-state evaluation", "Current task and session context", "Historical behaviour analysis", "Resource sensitivity scoring", "Network location and anomaly detection", "Active incident awareness", "Business authorization rules", "Short-lived, context-bound credential issuance"],
    advancedRequirements: ["Behaviour, API usage, service trust, and task priority can all change minutes after initial authorization — the engine must re-decide access in real time", "Calculate the blast radius of a compromised identity and auto-generate an isolation strategy", "Deployment mandatory: run the policy engine and risk dashboard as a live deployed service"],
    systemFlow: ["Access request → identity, device, and context evaluation", "Continuous risk scoring against behaviour, incidents, and resource sensitivity", "Decision: continue / restrict / re-authenticate / reduce privilege / revoke / isolate", "Blast-radius calculation → automated isolation strategy for compromised identities"],
    suggestedModules: ["Policy Engine", "Risk Scoring Service", "Ephemeral Credential Issuer", "Blast-Radius Calculator", "Isolation Orchestrator", "Access Dashboard"], technologies: ["Zero Trust", "Continuous Authentication", "Graph-Based Authorization", "Behavioural Analytics", "Ephemeral Credentials", "Risk-Adaptive Access Control"]
  },
  {
    emoji: "🕸️", title: "Software Supply-Chain Attack Graph Engine", description: "Continuously updated dependency and execution graph spanning source repositories, packages, build systems, containers, APIs, and CI/CD pipelines.",
    challengeStatement: "Correlate dependency relationships, source-code behaviour, version changes, maintainer activity, build metadata, and runtime behaviour to trace malicious or compromised components that may be several dependency levels away from an organization's direct dependencies.",
    coreChallenge: ["Typosquatting detection", "Dependency confusion detection", "Dormant malicious logic", "Delayed execution triggers", "Obfuscated code analysis", "Compromised transitive dependencies", "Malicious package update detection", "Build-pipeline manipulation detection"],
    advancedRequirements: ["Malicious components may sit several dependency levels away from direct dependencies", "Must produce: attack origin → propagation path → affected assets → confidence → potential impact → recommended containment", "Deployment mandatory: serve the live attack graph and containment reports through a deployed platform"],
    systemFlow: ["Source, package, container, and CI/CD metadata ingestion → dependency and execution graph construction", "Code, version, and behavioural correlation → suspicious modification scoring", "Attack-origin tracing → propagation path across transitive dependencies", "Impact and confidence assessment → recommended containment output"],
    suggestedModules: ["Dependency Graph Builder", "AST/Behaviour Analyzer", "Propagation Tracer", "Confidence Scorer", "Containment Advisor", "Attack Graph Dashboard"], technologies: ["AST Analysis", "Code Embeddings", "Dependency Graphs", "Graph Neural Networks", "Static Analysis", "Behavioural Anomaly Detection"]
  },
  {
    emoji: "🤝", title: "Privacy-Preserving Threat Intelligence Network", description: "Let multiple organizations collaboratively detect emerging attacks without sharing their raw security telemetry.",
    challengeStatement: "Build a federated threat-intelligence system that strengthens a shared model across organizations while guaranteeing no participant can reconstruct another's private data, and that detects and contains malicious participants without destroying legitimate collaboration.",
    coreChallenge: ["Federated learning across organizations", "Secure aggregation", "Differential privacy", "Encrypted computation", "Model poisoning defense", "Malicious participant detection", "Data leakage and membership-inference prevention", "Communication efficiency"],
    advancedRequirements: ["A participating organization attempts to poison the model, inject false indicators, or infer another's data", "Detect and contain the malicious participant without destroying legitimate collaboration", "Deployment mandatory: run the federated coordination service and monitoring dashboard as a deployed platform"],
    systemFlow: ["Local telemetry stays on-premise → locally trained model updates only", "Secure aggregation with differential privacy → shared global threat model", "Participant behaviour monitoring → poisoning and anomaly detection", "Malicious participant containment → continued global model collaboration"],
    suggestedModules: ["Federated Coordinator", "Secure Aggregator", "Differential Privacy Layer", "Poisoning Detector", "Participant Trust Monitor", "Collaboration Dashboard"], technologies: ["Federated Learning", "Secure Multiparty Computation", "Differential Privacy", "Homomorphic Encryption", "Anomaly Detection", "Cryptography"]
  },
  {
    emoji: "🧠", title: "Multi-Agent AI Reasoning & Verification Engine", description: "Multiple specialized AI agents (Planner, Researcher, Analyst, Executor, Critic, Verifier) collaboratively solve complex tasks, with no individual output automatically trusted.",
    challengeStatement: "Build a verification architecture that uses independent evidence and structured validation — not simply another LLM's opinion — to catch hallucination, invalid reasoning, contradictions, unsafe actions, and low-confidence conclusions, then feeds failures back for revision until a verified solution is reached.",
    coreChallenge: ["Hallucinated information detection", "Invalid reasoning detection", "Contradictory output detection", "Incorrect API usage detection", "Unsupported claim detection", "Logical inconsistency detection", "Unsafe action detection", "Low-confidence conclusion detection"],
    advancedRequirements: ["Deliberately ambiguous tasks with conflicting information, incomplete data, invalid APIs, and misleading documents", "The system must know when it doesn't have enough evidence to proceed and must be able to reject impossible tasks", "Deployment mandatory: expose the multi-agent pipeline and verification traces through a deployed application"],
    systemFlow: ["Planner → Researcher → Analyst → Executor produce a candidate solution", "Critic flags potential errors → Verifier checks independent evidence and structured validation", "Execution sandbox tests generated code/output → failures fed back to the originating agent", "Agent revises the solution → Verifier re-evaluates → final, evidence-backed solution"],
    suggestedModules: ["Planner Agent", "Critic Agent", "Evidence Verifier", "Execution Sandbox", "Feedback Loop Controller", "Reasoning Trace Dashboard"], technologies: ["Multi-Agent Orchestration", "Retrieval-Augmented Verification", "Sandboxed Execution", "Structured Validation", "Self-Correction Loops", "Evaluation Metrics"]
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
  const { days, hours, minutes, seconds } = useCountdown(THEME_REVEAL_DATE);
  const isCountdownComplete = days === 0 && hours === 0 && minutes === 0 && seconds === 0;

  const summaryIcons = {
    "Multi-Robot Task Negotiation Engine": "🤖",
    "Semantic SLAM Recovery & Map Reconstruction": "🗺️",
    "Physics-Informed Drone Digital Twin": "🚁",
    "Robot Fleet Recovery Under Cascading Failures": "🛠️",
    "Zero-Trust Agent Identity & Privilege Fabric": "🔐",
    "Software Supply-Chain Attack Graph Engine": "🕸️",
    "Privacy-Preserving Threat Intelligence Network": "🤝",
    "Multi-Agent AI Reasoning & Verification Engine": "🧠"
  };

  const categoryGroups = [
    { label: "Robotics & Simulation", color: "from-cyan-500 to-blue-600", themes: ["Multi-Robot Task Negotiation Engine", "Semantic SLAM Recovery & Map Reconstruction", "Physics-Informed Drone Digital Twin", "Robot Fleet Recovery Under Cascading Failures"] },
    { label: "Cybersecurity", color: "from-fuchsia-500 to-purple-600", themes: ["Zero-Trust Agent Identity & Privilege Fabric", "Software Supply-Chain Attack Graph Engine", "Privacy-Preserving Threat Intelligence Network"] },
    { label: "AI/ML Reasoning", color: "from-emerald-500 to-green-600", themes: ["Multi-Agent AI Reasoning & Verification Engine"] }
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