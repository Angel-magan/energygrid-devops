import { LogOut, Menu, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

const Topbar = ({ onToggleSidebar, isSidebarOpen, onLogout, isAuthenticated }) => {
  return (
    <header className="h-[70px] bg-grid-panel border-b border-grid-border flex items-center justify-between px-6 select-none">
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
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-grid-border bg-grid-deep text-grid-dim hover:text-grid-danger hover:border-grid-danger/40 transition-all cursor-pointer active:scale-95"
            aria-label="Cerrar sesion"
            title="Cerrar sesion"
          >
            <LogOut size={18} />
          </button>
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
