import { Link } from "react-router-dom";

export function Footer() {
  const legalLinks = [
    { to: "/terms-and-conditions", label: "Terms & Conditions" },
    { to: "/refund-policy", label: "Refund Policy" },
    { to: "/copyright-rights", label: "Copyright Rights" }
  ];

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white/75 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <p>IEEE RAS x IEEE CS Hackathon Management Platform</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {legalLinks.map((link) => (
            <Link key={link.to} to={link.to} className="font-semibold text-slate-700 transition hover:text-cyan-700">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
