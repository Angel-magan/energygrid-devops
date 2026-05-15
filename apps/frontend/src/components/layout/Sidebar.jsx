import { LayoutDashboard, AlertTriangle, Activity, Cpu, X } from "lucide-react";

const Sidebar = ({ isOpen = true, onClose }) => {
  return (
    <aside
      className={`sidebar ${isOpen ? "open" : "closed"}`}
      aria-hidden={!isOpen}
    >
      <div className="sidebar-header">
        <h2 className="logo">⚡ ENERGYGRID</h2>
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X size={18} />
        </button>
      </div>

      <nav>
        <ul>
          <li>
            <LayoutDashboard size={18} /> Dashboard
          </li>
          <li>
            <AlertTriangle size={18} /> Alertas
          </li>
          <li>
            <Activity size={18} /> Telemetría
          </li>
          <li>
            <Cpu size={18} /> Estado Sistema
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
