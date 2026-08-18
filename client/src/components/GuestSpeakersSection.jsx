import { GUEST_SPEAKERS } from "../utils/constants";

export function GuestSpeakersSection() {
  return (
    <section className="glass-card rounded-3xl p-6 shadow-lg md:p-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-700">Guest of Honour</p>
        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Our Guests</h2>
        <p className="mt-2 text-slate-600">Esteemed industry leaders joining us for HackFusion 2026.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {GUEST_SPEAKERS.map((guest) => (
          <article key={guest.name} className="rounded-2xl border border-slate-200 bg-white/80 p-5">
            <div className="flex items-start gap-4">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  src={guest.photo}
                  alt={guest.name}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900">{guest.name}</h3>
                <p className="mt-1 text-sm font-medium text-slate-600">{guest.role}</p>

                {guest.companyLogo && (
                  <div className="mt-3 flex h-10 w-24 items-center justify-start overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                    <img
                      src={guest.companyLogo}
                      alt={guest.companyName}
                      className="h-full w-full object-contain"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-700">{guest.bio}</p>

            {guest.expertise?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {guest.expertise.map((item) => (
                  <span key={item} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
                    {item}
                  </span>
                ))}
              </div>
            )}

            {guest.highlights?.length > 0 && (
              <div className="mt-3 space-y-1">
                {guest.highlights.map((item) => (
                  <p key={item} className="text-sm font-semibold text-slate-800">
                    {item}
                  </p>
                ))}
              </div>
            )}

            {guest.linkedin && (
              <a
                href={guest.linkedin}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-semibold text-cyan-700 underline"
              >
                LinkedIn Profile
              </a>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
