import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock3, Rocket } from "lucide-react";

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

const dayOneSchedule = [
  { time: "08:00 AM - 08:30 AM", activity: "Participant Registration & Check-in" },
  { time: "08:30 AM - 10:00 AM", activity: "Inaugural Ceremony & Welcome Address" },
  { time: "10:00 AM - 10:10 AM", activity: "Hackathon Route Plan Explanation" },
  { time: "10:10 AM - 10:20 AM", activity: "Venue Shift,ID Card Distribution & Team Formation" },
  { time: "10:30 AM", activity: "Hackathon Officially Begins", highlight: true },
  { time: "10:30 AM - 01:00 PM", activity: "Development Session I" },
  { time: "01:00 PM - 02:00 PM", activity: "Lunch Break" },
  { time: "02:00 PM - 04:00 PM", activity: "Development Session II" },
  {
    time: "04:00 PM - 4:45 PM",
    activity: "Minor Evaluation For Shortlisting Candidates."
  },
  {
    time: "05:00 PM",
    activity:
      "Participants leave campus and continue development remotely until the submission deadline. Online mentor support will remain available throughout the hackathon."
  }
];

const dayTwoSchedule = [
  { time: "09:00 AM - 09:15 AM", activity: "Team Check-in & Final Project Submission Verification" },
  { time: "09:15 AM - 12:15 PM", activity: "Project Demonstrations & Evaluation by Judges" },
  { time: "12:15 PM - 12:40 PM", activity: "Judges' Deliberation" },
  { time: "12:40 PM - 01:00 PM", activity: "Winner Announcement, Prize Distribution & Closing Ceremony" }
];

const importantNotes = [
  "Teams must begin development only after the official hackathon starts at 10:00 AM.",
  "Participants may continue development remotely after 5:00 PM on Day 1.",
  "All teams must report back to the venue by 9:00 AM on Day 2 for evaluation.",
  "Final submissions must be completed before the judging session begins.",
  "Projects will be evaluated on Innovation, Technical Excellence, Impact, Feasibility, User Experience, and Presentation."
];

function ScheduleTable({ rows }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70">
      <div className="grid grid-cols-1 divide-y divide-slate-200/70">
        {rows.map((row) => (
          <div
            key={`${row.time}-${row.activity}`}
            className={`grid gap-2 p-4 sm:grid-cols-[200px_1fr] sm:gap-4 ${
              row.highlight ? "bg-cyan-50/80" : "bg-white/70"
            }`}
          >
            <div className="flex items-start gap-2 text-sm font-semibold text-slate-800">
              <Clock3 className="mt-0.5 shrink-0 text-cyan-700" size={16} />
              <span>{row.time}</span>
            </div>
            <div className={`text-sm ${row.highlight ? "font-semibold text-slate-900" : "text-slate-700"}`}>
              {row.highlight ? (
                <span className="inline-flex items-center gap-2">
                  <Rocket className="text-blue-700" size={16} />
                  {row.activity}
                </span>
              ) : (
                row.activity
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SchedulePage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <motion.header
        className="glass-card rounded-3xl p-6 shadow-lg md:p-10"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">HackFusion 2026</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">24 Hour Hackathon Schedule</h1>
        <p className="mt-4 text-slate-700">
          Two-day event timeline covering kickoff, development, mentor checkpoints, judging, and closing ceremony.
        </p>
      </motion.header>

      <section className="glass-card rounded-3xl p-5 shadow-lg md:p-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Featured Moments</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="overflow-hidden">
              <img
                src="/logos/dasari.jpg"
                alt="Dasari"
                className="h-52 w-full object-cover object-center transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="bg-white/80 p-3">
              <p className="text-sm font-semibold text-slate-800">Dasari</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className="overflow-hidden">
              <img
                src="/logos/4016.jpeg"
                alt="4016"
                className="h-52 w-full object-cover object-center transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="bg-white/80 p-3">
              <p className="text-sm font-semibold text-slate-800">4016</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.article
          className="glass-card rounded-3xl p-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          custom={0.08}
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white">
              <CalendarDays size={18} />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Day 1 - Kickoff & Development (On Campus)</h2>
          </div>
          <ScheduleTable rows={dayOneSchedule} />
        </motion.article>

        <motion.article
          className="glass-card rounded-3xl p-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={sectionVariants}
          custom={0.16}
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-slate-800 text-white">
              <CalendarDays size={18} />
            </span>
            <h2 className="text-xl font-bold text-slate-900">Day 2 - Evaluation & Closing Ceremony</h2>
          </div>
          <ScheduleTable rows={dayTwoSchedule} />
        </motion.article>
      </div>

      <motion.section
        className="glass-card rounded-3xl p-6 md:p-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
        custom={0.24}
      >
        <h2 className="text-2xl font-bold text-slate-900">Important Notes</h2>
        <ul className="mt-4 space-y-3">
          {importantNotes.map((note) => (
            <li key={note} className="flex items-start gap-3 text-slate-700">
              <CheckCircle2 className="mt-0.5 shrink-0 text-cyan-700" size={18} />
              <span>{note}</span>
            </li>
          ))}
        </ul>
      </motion.section>
    </section>
  );
}
