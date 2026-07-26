import { Link, NavLink } from "react-router-dom";
import { BrandLogoGroup } from "./BrandLogoGroup";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/schedule", label: "Schedule" },
  { to: "/rules", label: "Rules" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" }
];

export function Navbar() {
  const { user, logout } = useAuth();
  const dashboardPath = user?.role ? `/${user.role}` : "/";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <BrandLogoGroup compact className="hidden sm:flex" />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">IEEE Hackathon</span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-semibold transition ${isActive ? "text-cyan-600" : "text-slate-600 hover:text-slate-900"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-700">Login</Link>
              <Link to="/register" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Register</Link>
            </>
          )}
          {user && (
            <>
              <Link to={dashboardPath} className="rounded-lg border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800">
                Dashboard
              </Link>
              <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
