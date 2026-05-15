import { Menu } from "lucide-react";

const Topbar = ({ onToggleSidebar, isSidebarOpen }) => {
  return (
    <header className="h-[70px] bg-grid-panel border-b border-grid-border flex items-center justify-between px-6 select-none">
      {/* SECCIÓN IZQUIERDA */}
      <div className="flex items-center gap-4">
        {/* BOTÓN TOGGLE SIDEBAR */}
        <button
          type="button"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-grid-border bg-grid-deep text-grid-text hover:text-grid-cyan hover:border-grid-cyan/40 transition-all cursor-pointer active:scale-95"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <Menu size={18} />
        </button>

        {/* STATUS EN VIVO */}
        <div className="flex items-center gap-2.5 text-xs font-bold tracking-wider text-emerald-400 bg-emerald-500/5 px-3 py-1.5 rounded-md border border-emerald-500/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
          SISTEMA EN VIVO
        </div>
      </div>

      {/* SECCIÓN DERECHA */}
      <div className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-grid-dim border-l border-grid-border/60 pl-4 hidden sm:block">
        Centro de Control Eléctrico
      </div>
    </header>
  );
};

export default Topbar;
