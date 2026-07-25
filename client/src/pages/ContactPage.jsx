import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, PhoneCall } from "lucide-react";

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

const contactNumbers = ["7337017721", "9989585590", "9121373923"];

export function ContactPage() {
  const [copiedNumber, setCopiedNumber] = useState("");

  const handleCopy = async (number) => {
    const fullNumber = `+91${number}`;

    try {
      await navigator.clipboard.writeText(fullNumber);
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(""), 1500);
    } catch {
      setCopiedNumber("");
    }
  };

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <motion.header
        className="glass-card rounded-3xl p-6 shadow-lg md:p-10"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">HackFusion 2026</p>
        <h1 className="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">Contact Organizers</h1>
        <p className="mt-4 text-slate-700">
          Reach out to the HackFusion organizing team for registration, event, and support queries.
        </p>
      </motion.header>

      <motion.section
        className="glass-card rounded-3xl p-6 md:p-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={sectionVariants}
        custom={0.08}
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-md">
            <PhoneCall size={18} />
          </span>
          <h2 className="text-xl font-bold text-slate-900">Mobile Numbers</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {contactNumbers.map((number) => (
            <div
              key={number}
              className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 text-center text-slate-900 transition hover:border-cyan-500 hover:bg-cyan-100"
            >
              <a href={`tel:+91${number}`} className="block text-lg font-semibold tracking-wide">
                +91 {number}
              </a>
              <button
                type="button"
                onClick={() => handleCopy(number)}
                className="mt-3 rounded-full border border-cyan-300 bg-white px-3 py-1 text-xs font-semibold text-cyan-800 transition hover:border-cyan-500 hover:text-cyan-900"
              >
                {copiedNumber === number ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-slate-700">
            <p className="mb-2 inline-flex items-center gap-2 font-semibold text-slate-900">
              <Mail size={16} className="text-cyan-700" /> General Support
            </p>
            <p>Use the official HackFusion communication channels for updates and announcements.</p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 text-slate-700">
            <p className="mb-2 inline-flex items-center gap-2 font-semibold text-slate-900">
              <MapPin size={16} className="text-cyan-700" /> Venue Coordination
            </p>
            <p>For on-campus directions and reporting support, contact the team numbers listed above.</p>
          </div>
        </div>
      </motion.section>
    </section>
  );
}
