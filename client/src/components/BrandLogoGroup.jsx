import { useMemo, useState } from "react";
import { ORGANIZER_LOGOS } from "../utils/constants";

function getInitials(label = "") {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LG";
}

export function BrandLogoGroup({ compact = false, showNames = false, className = "" }) {
  const [failedLogos, setFailedLogos] = useState({});

  const logos = useMemo(() => ORGANIZER_LOGOS, []);

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      {logos.map((logo) => {
        const hasFailed = failedLogos[logo.src];
        const sizeClass = compact ? "h-8 w-8" : "h-10 w-10";

        return (
          <div key={logo.src} className="flex items-center gap-2">
            {hasFailed ? (
              <div
                className={`${sizeClass} inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-[10px] font-bold text-slate-700`}
                aria-label={logo.name}
                title={logo.name}
              >
                {logo.shortName || getInitials(logo.name)}
              </div>
            ) : (
              <img
                src={logo.src}
                alt={logo.name}
                title={logo.name}
                className={`${sizeClass} rounded-full border border-slate-200 bg-white object-contain p-1`}
                loading="lazy"
                onError={() => {
                  setFailedLogos((prev) => ({ ...prev, [logo.src]: true }));
                }}
              />
            )}

            {showNames ? <span className="text-xs font-semibold text-slate-700">{logo.name}</span> : null}
          </div>
        );
      })}
    </div>
  );
}