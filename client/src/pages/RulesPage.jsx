import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  Gavel,
  ShieldCheck,
  Users
} from "lucide-react";

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

const ruleSections = [
  {
    title: "Eligibility",
    icon: BadgeCheck,
    points: [
      "The hackathon is open to all eligible students as specified by the organizers.",
      "Every participant must complete the official registration process and payment before the registration deadline.",
      "Participants must carry a valid college ID during the event."
    ]
  },
  {
    title: "Team Formation",
    icon: Users,
    points: [
      "Teams may consist of 3-4 members.",
      "Once registrations close, team composition cannot be changed without organizer approval.",
      "Every team must nominate one member as the Team Leader for official communication."
    ]
  },
  {
    title: "Hackathon Duration",
    icon: BookOpenCheck,
    points: [
      "The hackathon officially begins at 10:30 AM on Day 1.",
      "Development on campus is permitted until 5:00 PM on Day 1.",
      "Teams may continue development remotely after leaving the venue.",
      "All development must be completed within the official 24-hour hackathon window."
    ]
  },
  {
    title: "Problem Statements",
    icon: BookOpenCheck,
    points: [
      "Teams must select and work on one of the official problem statements provided by the organizers.",
      "Solutions must align with the selected challenge and theme."
    ]
  },
  {
    title: "Project Requirements",
    icon: ShieldCheck,
    points: [
      "Projects must be developed during the hackathon.",
      "Teams may use open-source libraries, frameworks, APIs, and publicly available datasets with proper attribution.",
      "Existing projects or previously completed solutions are not permitted.",
      "AI tools may be used as development aids, but participants must understand, modify, and be able to explain every part of their solution."
    ]
  }
];

const submissionRequirements = [
  "Source code (GitHub repository preferred)",
  "Project presentation (PPT or PDF)",
  "Project description",
  "Demo video (if requested)",
  "Deployment link",
  "Late submissions may not be accepted."
];

const judgingCriteria = [
  "Innovation & Creativity",
  "Technical Implementation",
  "Problem Solving Approach",
  "User Experience & Design",
  "Scalability & Feasibility",
  "Presentation & Demonstration",
  "The judges' decision will be final and binding."
];

const disqualificationReasons = [
  "Plagiarism or copied projects",
  "False information during registration",
  "Missing the submission deadline",
  "Violation of event rules",
  "Misconduct or unethical behavior"
];

const organizerRights = [
  "Modify the schedule if necessary.",
  "Clarify or amend rules during the event.",
  "Disqualify teams violating the code of conduct.",
  "Resolve any disputes, with their decision being final."
];

const quickLinks = [
  { label: "Eligibility", href: "#eligibility" },
  { label: "Team Formation", href: "#team-formation" },
  { label: "Hackathon Duration", href: "#hackathon-duration" },
  { label: "Problem Statements", href: "#problem-statements" },
  { label: "Project Requirements", href: "#project-requirements" },
  { label: "Submission Requirements", href: "#submission-requirements" },
  { label: "Judging Criteria", href: "#judging-criteria" },
  { label: "Code of Conduct", href: "#code-of-conduct" },
  { label: "Intellectual Property", href: "#intellectual-property" },
  { label: "Disqualification", href: "#disqualification" },
  { label: "Organizer Rights", href: "#organizer-rights" }
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-slate-700">
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-700" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function RulesPage() {
  const sectionIds = useMemo(() => quickLinks.map((link) => link.href.slice(1)), []);
  const [activeSection, setActiveSection] = useState(sectionIds[0]);

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section) => section instanceof HTMLElement);

    if (sections.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0.15, 0.3, 0.5, 0.75]
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
    };
  }, [sectionIds]);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <motion.header
        className="glass-card rounded-3xl p-6 shadow-lg md:p-10"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">HackFusion 2026</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">Rules & Guidelines</h1>
        <p className="mt-4 text-slate-700">
          Please read all rules carefully before participating. Compliance ensures a fair, safe, and high-quality
          hackathon experience for everyone.
        </p>
      </motion.header>

      <motion.nav
        className="glass-card rounded-2xl p-4"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        custom={0.05}
        aria-label="Rules quick navigation"
      >
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-700">Quick Jump</p>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((link) => {
            const isActive = activeSection === link.href.slice(1);

            return (
              <a
                key={link.href}
                href={link.href}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "border-cyan-700 bg-cyan-700 text-white shadow-sm"
                    : "border-cyan-200 bg-cyan-50 text-cyan-800 hover:border-cyan-400 hover:bg-cyan-100"
                }`}
                aria-current={isActive ? "location" : undefined}
              >
                {link.label}
              </a>
            );
          })}
        </div>
      </motion.nav>

      <div className="grid gap-4 md:grid-cols-2">
        {ruleSections.map((section, index) => {
          const Icon = section.icon;

          return (
            <motion.article
              key={section.title}
              id={slugify(section.title)}
              className="glass-card scroll-mt-24 rounded-2xl p-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={sectionVariants}
              custom={0.07 * (index + 1)}
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-md">
                  <Icon size={18} />
                </span>
                <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
              </div>
              <BulletList items={section.points} />
            </motion.article>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.section
          id="submission-requirements"
          className="glass-card scroll-mt-24 rounded-2xl p-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          custom={0.2}
        >
          <h2 className="text-xl font-bold text-slate-900">Submission Requirements</h2>
          <p className="mt-2 text-sm text-slate-600">Each team must submit:</p>
          <div className="mt-3">
            <BulletList items={submissionRequirements} />
          </div>
        </motion.section>

        <motion.section
          id="judging-criteria"
          className="glass-card scroll-mt-24 rounded-2xl p-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          custom={0.28}
        >
          <h2 className="text-xl font-bold text-slate-900">Judging Criteria</h2>
          <p className="mt-2 text-sm text-slate-600">Projects will be evaluated based on:</p>
          <div className="mt-3">
            <BulletList items={judgingCriteria} />
          </div>
        </motion.section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.section
          id="code-of-conduct"
          className="glass-card scroll-mt-24 rounded-2xl p-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          custom={0.3}
        >
          <div className="mb-3 flex items-center gap-3">
            <AlertTriangle className="text-amber-600" size={20} />
            <h2 className="text-xl font-bold text-slate-900">Code of Conduct</h2>
          </div>
          <BulletList
            items={[
              "Maintain professionalism and respect toward fellow participants, mentors, judges, and organizers.",
              "Academic dishonesty, plagiarism, or copying another team's work will result in immediate disqualification.",
              "Any attempt to disrupt another team's work is strictly prohibited.",
              "Participants must follow all venue rules and organizer instructions."
            ]}
          />
        </motion.section>

        <motion.section
          id="intellectual-property"
          className="glass-card scroll-mt-24 rounded-2xl p-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          custom={0.34}
        >
          <div className="mb-3 flex items-center gap-3">
            <ShieldCheck className="text-cyan-700" size={20} />
            <h2 className="text-xl font-bold text-slate-900">Intellectual Property</h2>
          </div>
          <BulletList
            items={[
              "Teams retain ownership of the intellectual property they create during the hackathon.",
              "By participating, teams grant the organizers permission to showcase submitted projects, screenshots, photos, and videos for promotional and educational purposes."
            ]}
          />
        </motion.section>

        <motion.section
          id="disqualification"
          className="glass-card scroll-mt-24 rounded-2xl p-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          custom={0.38}
        >
          <div className="mb-3 flex items-center gap-3">
            <Gavel className="text-blue-700" size={20} />
            <h2 className="text-xl font-bold text-slate-900">Disqualification</h2>
          </div>
          <BulletList items={disqualificationReasons} />
        </motion.section>
      </div>

      <motion.section
        id="organizer-rights"
        className="glass-card scroll-mt-24 rounded-3xl p-6 md:p-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
        custom={0.42}
      >
        <h2 className="text-2xl font-bold text-slate-900">Organizer Rights</h2>
        <div className="mt-4">
          <BulletList items={organizerRights} />
        </div>
      </motion.section>
    </section>
  );
}
