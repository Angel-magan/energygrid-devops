import { useNavigate } from "react-router-dom";
import { LogIn, LogOut, Menu } from "lucide-react";

const Topbar = ({ onToggleSidebar, isSidebarOpen, onLogout, isGuestView }) => {
  const navigate = useNavigate();

  return (
    <header className="h-17.5 bg-grid-panel border-b border-grid-border flex items-center justify-between px-6 select-none">
      <div className="flex items-center gap-4">
        {!isGuestView && (
          <button
            type="button"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-grid-border bg-grid-deep text-grid-text hover:text-grid-cyan hover:border-grid-cyan/40 transition-all cursor-pointer active:scale-95"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Cerrar menu" : "Abrir menu"}
          >
            <Menu size={18} />
          </button>
        )}
        <div className="flex items-center gap-2.5 text-xs font-bold tracking-wider text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-md border border-emerald-500/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
          SISTEMA EN VIVO
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-grid-dim border-l border-grid-border/60 pl-4 hidden sm:block">
          Centro de Control Electrico
        </div>
        {isGuestView ? (
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="inline-flex items-center justify-center gap-2 px-4 h-9 rounded-lg border border-grid-border bg-grid-deep text-grid-text hover:text-grid-cyan hover:border-grid-cyan/40 transition-all cursor-pointer active:scale-95 text-sm font-semibold"
            aria-label="Iniciar sesion"
            title="Iniciar sesion"
          >
            <LogIn size={18} />
            <span className="hidden sm:inline">Iniciar sesión</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-grid-border bg-grid-deep text-grid-dim hover:text-grid-danger hover:border-grid-danger/40 transition-all cursor-pointer active:scale-95"
            aria-label="Cerrar sesion"
            title="Cerrar sesion"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;
