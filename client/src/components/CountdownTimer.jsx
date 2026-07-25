import { useCountdown } from "../hooks/useCountdown";
import { EVENT_DATE } from "../utils/constants";

export function CountdownTimer() {
  const { days, hours, minutes, seconds } = useCountdown(EVENT_DATE);
  const cells = [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Minutes", value: minutes },
    { label: "Seconds", value: seconds }
  ];

  return (
    <section className="glass-card rounded-3xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-slate-800">Countdown</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cells.map((item) => (
          <div key={item.label} className="rounded-xl bg-slate-900 px-4 py-5 text-center text-white">
            <p className="text-3xl font-extrabold">{String(item.value).padStart(2, "0")}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-slate-300">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
