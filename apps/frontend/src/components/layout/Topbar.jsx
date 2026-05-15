import { Menu } from "lucide-react";

const Topbar = ({ onToggleSidebar, isSidebarOpen }) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <Menu size={18} />
        </button>

        <div className="live-status">
          <span className="live-dot"></span>
          SISTEMA EN VIVO
        </div>
      </div>

      <div>Centro de Control Eléctrico</div>
    </header>
  );
};

export default Topbar;
