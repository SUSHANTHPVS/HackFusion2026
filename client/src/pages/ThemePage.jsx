import { useState } from "react";
import { motion } from "framer-motion";
import { CountdownTimer } from "../components/CountdownTimer";
import { useCountdown } from "../hooks/useCountdown";
import { EVENT_DATE } from "../utils/constants";

const themes = [
  {
    emoji: "🌌",
    title: "Space Intelligence & Digital Exploration",
    description: "Build an intelligent platform that aggregates space data, tracks space objects, visualizes movement, detects anomalies, and generates risk-based alerts.",
    challengeStatement:
      "Develop an intelligent web/mobile platform that aggregates space-related information from multiple data sources and transforms it into actionable intelligence for researchers, students, organizations, and space enthusiasts.",
    coreChallenge: [
      "Integrate multiple external APIs and data sources",
      "Track satellites and space objects",
      "Visualize object movement",
      "Maintain historical records",
      "Detect anomalies or unusual patterns",
      "Provide intelligent search and filtering",
      "Generate risk-based alerts",
      "Deliver personalized dashboards",
      "Compare historical and current information",
      "Support multiple user roles"
    ],
    advancedRequirements: [
      "Object → Location → Movement → Historical Pattern → Risk → User Preference → Alert Priority"
    ],
    systemFlow: [
      "External Space Data Sources → API/Data Ingestion Layer",
      "Data Validation & Normalization → Space Data Repository",
      "Processing & Analytics Engine → Anomaly/Risk Detection, Historical Analysis, Prediction Engine",
      "Alert Priority Engine → Notification Service",
      "Space Visualization Engine → Interactive Web/Mobile Dashboard"
    ],
    suggestedModules: [
      "User Management",
      "Space Dashboard",
      "Satellite Tracking",
      "Data Analytics",
      "Risk Engine",
      "Alert System",
      "Historical Analysis",
      "Admin Panel",
      "API Management"
    ],
    technologies: ["Web/Mobile", "REST APIs", "AI/ML", "Data Visualization", "Maps/GIS", "Cloud", "SQL/NoSQL", "Notifications"]
  },
  {
    emoji: "🪖",
    title: "Defence, Security & Crisis Intelligence",
    description: "Create a secure crisis-response system that classifies incidents, prioritizes threats, and coordinates resources in real time.",
    challengeStatement:
      "Develop a secure crisis-intelligence platform capable of collecting incident information from multiple sources, identifying and prioritizing critical situations, coordinating response teams, managing limited resources, and providing real-time situational awareness.",
    coreChallenge: [
      "Handle multiple simultaneous incidents",
      "Differentiate severity levels",
      "Work with geographic locations",
      "Manage limited response resources",
      "Adapt to changing incident conditions",
      "Resolve conflicting reports",
      "Deliver emergency notifications",
      "Support role-based access",
      "Maintain incident history",
      "Preserve audit trails"
    ],
    advancedRequirements: [
      "Severity + Urgency + Location + Population Impact + Available Resources + Escalation Risk"
    ],
    systemFlow: [
      "Incident Reports / Sensor/API/External Data / Field User Reports → Data Collection Layer",
      "Validation & Verification → Incident Database",
      "AI/Rule-Based Classification → Severity Assessment → Priority Engine",
      "Critical Incident? → Emergency Escalation or Normal Response Queue",
      "Resource Allocation Engine → Response Team Dashboard → Task Assignment → Real-Time Status Updates"
    ],
    suggestedModules: [
      "Incident Management",
      "Crisis Dashboard",
      "Resource Management",
      "Team Coordination",
      "Location Intelligence",
      "Alert System",
      "Analytics",
      "Audit Logs",
      "Admin Panel"
    ],
    technologies: ["Web/Mobile", "AI/ML", "GIS", "Real-Time APIs", "Cybersecurity", "Cloud", "Data Analytics", "Notifications"]
  },
  {
    emoji: "🏥",
    title: "Healthcare Intelligence & Digital Health",
    description: "Design a decision-support ecosystem for patients, doctors, appointments, emergencies, beds, departments, and hospital resources.",
    challengeStatement:
      "Develop an intelligent healthcare management ecosystem capable of coordinating patients, doctors, appointments, hospital resources, emergency cases, and healthcare information.",
    coreChallenge: [
      "Coordinate patients, doctors, appointments, beds, departments, emergency cases, and resources",
      "Support patient prioritization",
      "Optimize appointments",
      "Allocate resources intelligently",
      "Monitor doctor availability",
      "Escalate emergencies",
      "Classify patient risk",
      "Analyze waiting times",
      "Track hospital capacity",
      "Deliver personalized notifications"
    ],
    advancedRequirements: [
      "Patient Priority Score → Resource Allocation → Emergency or Standard Care Workflow"
    ],
    systemFlow: [
      "Patient Registration → Patient Profile → Medical/Service Information → Secure Healthcare Database",
      "Risk & Priority Engine → Patient Priority Score",
      "Doctor Availability / Hospital Capacity / Appointment Requests → Resource Engine",
      "Appointment/Resource Allocation → Emergency Escalation or Standard Care Workflow",
      "Doctor Dashboard → Patient Status Updates → Analytics Engine → Hospital Intelligence Dashboard"
    ],
    suggestedModules: [
      "Patient Portal",
      "Doctor Portal",
      "Appointment Engine",
      "Resource Management",
      "Emergency Module",
      "Risk Analytics",
      "Notifications",
      "Hospital Dashboard",
      "Admin Panel"
    ],
    technologies: ["Web/Mobile", "AI/ML", "Secure APIs", "SQL/NoSQL", "Analytics", "Cloud", "Notifications"]
  },
  {
    emoji: "🏙️",
    title: "Rural–Urban Transformation & Smart Communities",
    description: "Connect rural communities with urban opportunities, services, employment, healthcare, education, markets, transportation, and resources.",
    challengeStatement:
      "Develop a digital ecosystem that intelligently connects rural communities with urban opportunities, services, employment, healthcare, education, markets, transportation, and resources.",
    coreChallenge: [
      "Match people, skills, jobs, services, resources, and locations",
      "Support rural employment marketplace",
      "Enable education and healthcare access",
      "Facilitate farmer-to-market systems",
      "Coordinate transportation",
      "Support local service discovery",
      "Enable community problem reporting",
      "Deliver skill matching",
      "Provide government and service information",
      "Offer multilingual and location-based recommendations"
    ],
    advancedRequirements: [
      "Distance Analysis + Skill Matching + Need/Urgency Analysis → Recommendation Engine"
    ],
    systemFlow: [
      "Community User → Registration & Profile → Skills/Needs/Location → Community Data Repository",
      "Jobs/Services/Resources → Resource Database → Availability & Location Analysis",
      "Intelligent Matching Engine → Distance Analysis / Skill Matching / Need/Urgency Analysis",
      "Recommendation Engine → Personalized Opportunities → User Acceptance/Request",
      "Service Provider → Transaction/Service Completion → Feedback & Impact Data → Community Analytics Dashboard"
    ],
    suggestedModules: [
      "Community Portal",
      "Employment",
      "Education",
      "Healthcare",
      "Marketplace",
      "Transportation",
      "Resource Matching",
      "Location Services",
      "Analytics",
      "Admin"
    ],
    technologies: ["Web/Mobile", "AI/ML", "GIS", "Recommendation Systems", "APIs", "NLP", "Cloud", "Analytics"]
  },
  {
    emoji: "🎬",
    title: "Cinema, Media & Entertainment Intelligence",
    description: "Develop a platform that understands user behavior, analyzes content, predicts preferences, and creates personalized experiences.",
    challengeStatement:
      "Develop an intelligent entertainment platform that understands users, analyzes content, predicts preferences, and creates personalized experiences across movies, series, short-form content, and digital media.",
    coreChallenge: [
      "Connect user behavior, content understanding, preference modeling, recommendation, feedback, and continuous learning",
      "Analyze watch history and ratings",
      "Track search behavior and genre preferences",
      "Use content similarity and popularity signals",
      "Incorporate reviews, sentiment, and context",
      "Personalize recommendations",
      "Continuously learn from user interactions"
    ],
    advancedRequirements: [
      "Watch History + Ratings + Search Behavior + Genre Preferences + Content Similarity + Popularity + Context"
    ],
    systemFlow: [
      "User Registration → User Profile → Preference Initialization",
      "Movie/Media Data → Content Processing → Content Feature Extraction",
      "User Interactions → Behavior Analysis → User Preference Model",
      "Recommendation Engine + Popularity/Trends + Contextual Signals → Personalized Recommendations",
      "Sentiment/Review Analysis → Content Intelligence Dashboard → Content Performance Insights"
    ],
    suggestedModules: [
      "User Portal",
      "Content Discovery",
      "Recommendation Engine",
      "Reviews",
      "Sentiment Analysis",
      "Creator Dashboard",
      "Analytics",
      "Search",
      "Personalized Notifications"
    ],
    technologies: ["Web/Mobile", "AI/ML", "NLP", "Recommendation Systems", "Sentiment Analysis", "APIs", "Data Analytics"]
  },
  {
    emoji: "🧠",
    title: "AI for Smarter Living",
    description: "Create an intelligent assistant that understands objectives, plans tasks, recommends actions, and automates workflows.",
    challengeStatement:
      "Develop an intelligent digital assistant platform capable of understanding high-level user objectives, breaking them into actionable tasks, analyzing contextual information, making personalized recommendations, and assisting users in completing those tasks.",
    coreChallenge: [
      "Understand user objectives",
      "Analyze context",
      "Plan and decompose tasks",
      "Recommend actions",
      "Execute and verify results",
      "Learn from feedback",
      "Support natural-language interaction",
      "Use personalized recommendations",
      "Integrate external APIs",
      "Deliver notifications and decision support"
    ],
    advancedRequirements: [
      "Understand → Analyze → Plan → Recommend → Execute → Verify → Learn"
    ],
    systemFlow: [
      "User Objective → Natural Language Interface → Intent & Context Analysis",
      "Task Decomposition → Priority & Constraint Analysis → Planning Engine → Recommendation Engine",
      "User Approval Required? → User Review or Automated Execution",
      "External APIs/Services → Task Execution → Result Verification",
      "Feedback & Learning → Personalized Dashboard"
    ],
    suggestedModules: [
      "AI Assistant",
      "Task Manager",
      "Planner",
      "Recommendation Engine",
      "Automation",
      "API Integrations",
      "Notifications",
      "User Profile",
      "Analytics"
    ],
    technologies: ["AI/ML", "NLP", "LLM APIs", "Web/Mobile", "Automation", "REST APIs", "Cloud", "Databases"]
  },
  {
    emoji: "🌍",
    title: "Technology for Social Good",
    description: "Build a scalable platform that connects communities, volunteers, organizations, resources, and beneficiaries to solve social problems.",
    challengeStatement:
      "Develop a scalable digital platform capable of solving a major social or environmental problem by intelligently connecting communities, volunteers, organizations, resources, and beneficiaries.",
    coreChallenge: [
      "Convert problem reports into verified, prioritized action",
      "Support community reporting",
      "Manage beneficiary profiles",
      "Coordinate volunteers and organizations",
      "Track resource inventory",
      "Use location intelligence",
      "Prioritize emergencies",
      "Support matching algorithms",
      "Improve accessibility",
      "Deliver multilingual and impact-based analytics"
    ],
    advancedRequirements: [
      "Problem → Verification → Priority → Resource Matching → Action → Impact Measurement"
    ],
    systemFlow: [
      "Community Problem Report → Verification Layer → Social Impact Database",
      "Problem Classification → Urgency Assessment → Impact Scoring",
      "Volunteer Availability / Organization Resources / Available Services → Resource Repository",
      "Intelligent Matching Engine → Location Matching / Skill Matching / Resource Matching",
      "Recommended Response → Volunteer/Organization Assignment → Action Execution → Beneficiary Confirmation → Impact Measurement"
    ],
    suggestedModules: [
      "Community Portal",
      "Problem Reporting",
      "Volunteer Management",
      "Organization Portal",
      "Resource Management",
      "Matching Engine",
      "Notifications",
      "Impact Dashboard"
    ],
    technologies: ["Web/Mobile", "AI/ML", "GIS", "Recommendation Systems", "Cloud", "APIs", "Analytics", "Accessibility"]
  },
  {
    emoji: "🤖",
    title: "Smart Automation & Digital Robotics",
    description: "Design an automation ecosystem with workflows, event triggers, conditions, actions, verification, recovery, and analytics.",
    challengeStatement:
      "Develop a web/mobile-based intelligent automation platform capable of connecting users, devices, APIs, data sources, workflows, and AI services into a unified automation ecosystem.",
    coreChallenge: [
      "Create workflow-based automation",
      "Handle event triggers and conditions",
      "Support scheduled tasks",
      "Integrate APIs and device events",
      "Perform automated actions",
      "Detect failures",
      "Implement retry mechanisms",
      "Escalate issues",
      "Track workflow history",
      "Provide analytics and role-based access"
    ],
    advancedRequirements: [
      "Event → Detection → Condition → Decision → Action → Verification → Recovery"
    ],
    systemFlow: [
      "Event Source → Event Ingestion → Event Validation",
      "Workflow Engine → Condition Evaluation → Decision Engine → Action Selection",
      "API/Device/Service → Action Execution → Execution Verification",
      "Successful? → Update Workflow Status or Retry/Recovery",
      "Retry limit reached? → Escalation/Human Intervention → Analytics & Logs"
    ],
    suggestedModules: [
      "Workflow Builder",
      "Automation Engine",
      "Event Manager",
      "API Integration",
      "Device Integration",
      "Monitoring",
      "Failure Recovery",
      "Analytics",
      "Admin Panel"
    ],
    technologies: ["Web/Mobile", "AI/ML", "IoT", "APIs", "Automation", "Cloud", "Real-Time Systems", "Databases"]
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
    "Space Intelligence & Digital Exploration": "🛰️",
    "Defence, Security & Crisis Intelligence": "🛡️",
    "Healthcare Intelligence & Digital Health": "🩺",
    "Rural–Urban Transformation & Smart Communities": "🏘️",
    "Cinema, Media & Entertainment Intelligence": "🎥",
    "AI for Smarter Living": "🤖",
    "Technology for Social Good": "🌍",
    "Smart Automation & Digital Robotics": "⚙️"
  };

  const categoryGroups = [
    { label: "AI & Intelligence", color: "from-cyan-500 to-blue-600", themes: ["Space Intelligence & Digital Exploration", "Defence, Security & Crisis Intelligence", "Healthcare Intelligence & Digital Health", "AI for Smarter Living"] },
    { label: "Community & Impact", color: "from-emerald-500 to-green-600", themes: ["Rural–Urban Transformation & Smart Communities", "Technology for Social Good"] },
    { label: "Media & Automation", color: "from-fuchsia-500 to-purple-600", themes: ["Cinema, Media & Entertainment Intelligence", "Smart Automation & Digital Robotics"] }
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
              All themes, full challenge statements, system flows, and judging sections will become visible automatically on 21 September 2026 at 6:00 AM.
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