import { NavLink, Outlet } from "react-router-dom";
import { UserCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function DashboardLayout({ title, navItems }) {
  const { user } = useAuth();

  return (
    <div className="grid gap-6 md:grid-cols-[230px_1fr]">
      <aside className="glass-card h-fit rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-cyan-200 bg-cyan-50">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <UserCircle2 className="text-cyan-700" size={24} />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Dashboard</p>
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/participant" || item.to === "/admin" || item.to === "/judge"}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-cyan-100 text-cyan-900" : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  );
}
