import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    closeMobileMenu();
    logout();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/50 bg-white/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <BrandLogoGroup compact className="hidden sm:flex" />
          <span className="text-lg font-extrabold tracking-tight text-slate-900">IEEE Hackathon</span>
        </Link>
        <div className="hidden items-center gap-6 lg:flex">
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
        <div className="hidden items-center gap-3 lg:flex">
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

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/90 p-2 text-slate-800 shadow-sm lg:hidden"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setIsMobileMenuOpen((current) => !current)}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {isMobileMenuOpen ? (
        <div id="mobile-navigation" className="border-t border-slate-200/60 bg-white/95 px-4 py-4 shadow-lg lg:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:px-2">
            <div className="flex flex-wrap gap-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      isActive ? "border-cyan-700 bg-cyan-700 text-white" : "border-slate-200 bg-slate-50 text-slate-700"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {!user && (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white"
                  >
                    Register
                  </Link>
                </>
              )}
              {user && (
                <>
                  <Link
                    to={dashboardPath}
                    onClick={closeMobileMenu}
                    className="rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2 text-center text-sm font-semibold text-cyan-800"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
