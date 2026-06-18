import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, LayoutDashboard, Library, LogOut, Menu, X, UserCircle2, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "sonner";
import { cn } from "../utils/cn";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/acervo", label: "Acervo", icon: Library },
  { to: "/emprestimos", label: "Empréstimos", icon: BookOpen },
];

const adminNavItems = [
  { to: "/solicitacoes", label: "Solicitações", icon: Clock },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="h-11 w-11 inline-flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <BookOpen className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline text-slate-900">Biblioteca<span className="text-indigo-600">.</span></span>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-6 hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end as boolean}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition-colors min-w-[44px]",
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
            {user?.role === "bibliotecario" && adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition-colors min-w-[44px]",
                    isActive ? "bg-yellow-50 text-yellow-700" : "text-slate-600 hover:bg-slate-100",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-xl bg-slate-100 px-3 h-10">
              <UserCircle2 className="h-5 w-5 text-slate-500" />
              <span className="text-sm text-slate-700 max-w-[180px] truncate">{user?.email}</span>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sair">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end as boolean}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium",
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100",
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
            {user?.role === "bibliotecario" && adminNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium",
                    isActive ? "bg-yellow-50 text-yellow-700" : "text-slate-700 hover:bg-slate-100",
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">{children}</main>

      <footer className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-center text-xs text-slate-400">
        Biblioteca Online · MVP v1.0 · Construído com React, TypeScript e Supabase-ready architecture
      </footer>
    </div>
  );
}