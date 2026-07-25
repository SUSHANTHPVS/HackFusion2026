import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CircleHelp, IndianRupee, Search } from "lucide-react";

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

const faqs = [
  {
    question: "What is HackFusion?",
    answer:
      "HackFusion is a 24-hour hackathon where participants collaborate to build innovative technology solutions for real-world challenges within a limited time."
  },
  {
    question: "Who can participate?",
    answer:
      "Eligible students from the invited institutions or as specified by the organizers can participate."
  },
  {
    question: "What is the team size?",
    answer: "A team can have 1 to 4 members."
  },
  {
    question: "Is there a registration fee?",
    answer: "Yes. Individual Registration: ₹50. Team Registration: ₹200.",
    highlight: true
  },
  {
    question: "Can I participate individually?",
    answer: "Yes. You may register individually or as part of a team."
  },
  {
    question: "Do I need to stay on campus overnight?",
    answer:
      "No. Development on campus concludes at 5:00 PM on Day 1. Teams may continue working remotely and must return by 9:00 AM on Day 2 for evaluation."
  },
  {
    question: "What should I bring?",
    answer:
      "Please bring a valid college ID, laptop and charger, extension board (recommended), internet hotspot (optional), and any accessories required for software development."
  },
  {
    question: "Can we use open-source libraries or APIs?",
    answer:
      "Yes. Open-source tools, frameworks, APIs, and publicly available datasets are allowed, provided they are legally licensed and properly acknowledged."
  },
  {
    question: "Can we use AI tools?",
    answer:
      "Yes. AI tools may be used to assist development, but every team must fully understand and be able to explain their implementation during evaluation."
  },
  {
    question: "What needs to be submitted?",
    answer:
      "Teams should submit source code, GitHub repository, project presentation, project description, and deployment link (if available)."
  },
  {
    question: "How are projects judged?",
    answer:
      "Projects are evaluated on innovation, technical implementation, usability, scalability, impact, and presentation."
  },
  {
    question: "Will internet and power be available?",
    answer:
      "Yes. The venue will provide internet access, power supply, and seating during the on-campus session."
  },
  {
    question: "What happens if two teams build similar ideas?",
    answer:
      "Judging focuses on execution, originality, technical quality, user experience, and presentation. Similar ideas can still receive different scores based on implementation."
  },
  {
    question: "Who owns the project after the hackathon?",
    answer:
      "The project remains the intellectual property of the participating team. The organizers may showcase projects for event promotion with appropriate credit."
  },
  {
    question: "How can I contact the organizers?",
    answer:
      "You can reach the organizing team through the contact details provided on the official HackFusion website or event communication channels."
  }
];

export function FaqPage() {
  const [query, setQuery] = useState("");

  const filteredFaqs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return faqs;
    }

    return faqs.filter(
      (item) =>
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <motion.header
        className="glass-card rounded-3xl p-6 shadow-lg md:p-10"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">HackFusion 2026</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">Frequently Asked Questions</h1>
        <p className="mt-4 text-slate-700">
          Quick answers for participants on eligibility, teams, submission, judging, and logistics.
        </p>

        <label className="mt-5 flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm md:max-w-xl">
          <Search size={18} className="text-cyan-700" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search FAQ by keyword..."
            className="w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500"
            aria-label="Search frequently asked questions"
          />
        </label>
      </motion.header>

      <motion.section
        className="glass-card rounded-3xl p-5 md:p-7"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
        custom={0.08}
      >
        <div className="mb-4 flex items-center gap-3 text-slate-900">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-md">
            <CircleHelp size={18} />
          </span>
          <h2 className="text-xl font-bold">Participant FAQ</h2>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((item, index) => (
            <details
              key={item.question}
              className={`rounded-2xl border p-4 ${
                item.highlight
                  ? "border-cyan-300 bg-cyan-50/70"
                  : "border-slate-200/80 bg-white/70"
              }`}
              open={query.trim().length > 0 || index === 0}
            >
              <summary className="cursor-pointer list-none pr-6 text-base font-semibold text-slate-900">
                <span className="inline-flex items-start gap-2">
                  <span className="text-cyan-700">{index + 1}.</span>
                  <span>{item.question}</span>
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-slate-700">{item.answer}</p>

              {item.highlight ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
                    <span className="inline-flex items-center gap-1 text-cyan-700">
                      <IndianRupee size={14} /> Individual
                    </span>
                    <div className="mt-1 text-base font-bold">₹50</div>
                  </div>
                  <div className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
                    <span className="inline-flex items-center gap-1 text-cyan-700">
                      <IndianRupee size={14} /> Team
                    </span>
                    <div className="mt-1 text-base font-bold">₹200</div>
                  </div>
                </div>
              ) : null}
            </details>
          ))}

          {filteredFaqs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
              No FAQ matched your search. Try keywords like registration, team, fee, submission, or judging.
            </div>
          ) : null}
        </div>
      </motion.section>
    </section>
  );
}
