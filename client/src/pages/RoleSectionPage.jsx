import { useMemo } from "react";
import { useLocation } from "react-router-dom";

export function RoleSectionPage() {
  const { pathname } = useLocation();

  const title = useMemo(() => {
    const segment = pathname.split("/").filter(Boolean).at(-1) || "Dashboard";
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [pathname]);

  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-slate-600">This module is scaffolded and ready for API integration.</p>
    </div>
  );
}
