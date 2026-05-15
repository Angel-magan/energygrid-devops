import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Activity,
  Server,
  X,
} from "lucide-react";

const Sidebar = ({ isOpen = true, onClose }) => {
  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-[260px] bg-grid-panel border-r border-grid-border p-5 text-grid-text transition-all duration-300 ease-in-out md:static md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full md:w-0 md:p-0 md:border-r-0"}`}
      aria-hidden={!isOpen}
    >
      {/* HEADER DEL SIDEBAR */}
      <div className="flex items-center justify-between gap-3 mb-8 pb-4 border-b border-grid-border/40">
        <h2 className="text-sm font-black tracking-widest text-grid-text flex items-center gap-2">
          <span className="text-grid-cyan animate-pulse">⚡</span> ENERGYGRID
        </h2>
        <button
          type="button"
          className="inline-flex items-center justify-center p-2 rounded-lg border border-grid-border text-grid-dim hover:text-grid-text hover:border-grid-blue transition-colors cursor-pointer md:hidden"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X size={18} />
        </button>
      </div>

      {/* MENÚ DE NAVEGACIÓN */}
      <nav className="flex-1">
        <ul className="space-y-1.5">
          {/* Item Activo (Dashboard) */}
          <li className="flex items-center gap-3 py-3 px-4 rounded-xl text-grid-cyan bg-grid-blue/15 border border-grid-blue/30 font-semibold transition-all cursor-pointer">
            {/* <LayoutDashboard size={18} className="text-grid-cyan" />
            <span className="text-sm">Dashboard</span> */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${
                  isActive
                    ? "bg-purple-500/20 border border-purple-500/40 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>

          {/* Items Secundarios */}
          <li className="flex items-center gap-3 py-3 px-4 rounded-xl text-grid-dim hover:text-grid-text hover:bg-grid-deep/50 transition-all cursor-pointer group">
            {/* <AlertTriangle
              size={18}
              className="text-grid-dim group-hover:text-grid-cyan transition-colors"
            />
            <span className="text-sm">Alertas</span> */}
            <NavLink
              to="/alerts"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${
                  isActive
                    ? "bg-purple-500/20 border border-purple-500/40 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <AlertTriangle size={20} />
              <span>Alertas</span>
            </NavLink>
          </li>

          <li className="flex items-center gap-3 py-3 px-4 rounded-xl text-grid-dim hover:text-grid-text hover:bg-grid-deep/50 transition-all cursor-pointer group">
            {/* <Activity
              size={18}
              className="text-grid-dim group-hover:text-grid-cyan transition-colors"
            />
            <span className="text-sm">Telemetría</span> */}
            <NavLink
              to="/telemetry"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${
                  isActive
                    ? "bg-purple-500/20 border border-purple-500/40 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Activity size={20} />
              <span>Telemetría</span>
            </NavLink>
          </li>

          <li className="flex items-center gap-3 py-3 px-4 rounded-xl text-grid-dim hover:text-grid-text hover:bg-grid-deep/50 transition-all cursor-pointer group">
            {/* <Cpu
              size={18}
              className="text-grid-dim group-hover:text-grid-cyan transition-colors"
            />
            <span className="text-sm">Estado Sistema</span> */}
            <NavLink
              to="/system"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${
                  isActive
                    ? "bg-purple-500/20 border border-purple-500/40 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Server size={20} />
              <span>Estado Sistema</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
