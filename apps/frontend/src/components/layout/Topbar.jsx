import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  Menu,
  LogIn,
  UserCircle2,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const Topbar = ({
  onToggleSidebar,
  isSidebarOpen,
  onLogout,
  isAuthenticated,
  currentUser,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    if (!isProfileOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  const displayName = useMemo(() => {
    const name = String(currentUser?.name || "").trim();
    const email = String(currentUser?.email || "").trim();
    return name || email || "Usuario";
  }, [currentUser?.email, currentUser?.name]);

  const displayEmail = useMemo(() => {
    return String(currentUser?.email || "").trim();
  }, [currentUser?.email]);

  const primaryRole = useMemo(() => {
    const roles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];
    return roles[0] || "usuario";
  }, [currentUser?.roles]);

  return (
    <header className="h-17.5 bg-grid-panel border-b border-grid-border flex items-center justify-between px-6 select-none">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-grid-border bg-grid-deep text-grid-text hover:text-grid-cyan hover:border-grid-cyan/40 transition-all cursor-pointer active:scale-95"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Cerrar menu" : "Abrir menu"}
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2.5 text-xs font-bold tracking-wider text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-md border border-emerald-500/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
          SISTEMA EN VIVO
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-grid-dim border-l border-grid-border/60 pl-4 hidden sm:block">
          Centro de Control Electrico
        </div>
        {isAuthenticated ? (
          <div className="flex items-center gap-2" ref={profileMenuRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-grid-border bg-grid-deep text-grid-text hover:text-grid-cyan hover:border-grid-cyan/40 transition-all cursor-pointer active:scale-95"
                aria-label="Abrir perfil de usuario"
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                title="Perfil de usuario"
              >
                <UserCircle2 size={18} />
                <span className="hidden md:inline max-w-45 truncate text-xs font-semibold uppercase tracking-wider">
                  {displayName}
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-70 rounded-2xl border border-grid-border bg-grid-panel shadow-2xl shadow-black/40 p-4 z-50">
                  <div className="flex items-start gap-3 pb-4 border-b border-grid-border/60">
                    <div className="w-11 h-11 rounded-xl bg-grid-cyan/10 border border-grid-cyan/20 flex items-center justify-center text-grid-cyan shrink-0">
                      <UserCircle2 size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-grid-cyan mb-1">
                        Sesion activa
                      </p>
                      <h3 className="text-sm font-bold text-grid-text truncate">
                        {displayName}
                      </h3>
                      {displayEmail && (
                        <p className="text-xs text-grid-dim truncate mt-1">
                          {displayEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-grid-border/60 bg-grid-deep/60 px-3 py-2">
                      <span className="text-grid-dim">Rol</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                        <ShieldCheck size={12} />
                        {primaryRole}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-grid-border/60 bg-grid-deep/60 px-3 py-2">
                      <span className="text-grid-dim">Estado</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                        Conectado
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 h-10 rounded-xl border border-grid-danger/30 bg-grid-danger/10 text-grid-danger hover:bg-grid-danger/20 transition-colors font-bold text-sm"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-grid-blue/50 bg-grid-blue/10 text-grid-cyan hover:bg-grid-blue/20 transition-all font-semibold text-xs tracking-wider"
          >
            <LogIn size={16} />
            <span>INICIAR SESIÓN</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Topbar;
