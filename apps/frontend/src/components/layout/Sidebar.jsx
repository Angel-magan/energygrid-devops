import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  AlertTriangle,
  Activity,
  Server,
  Terminal,
  X,
} from "lucide-react";

const Sidebar = ({
  isOpen = true,
  onClose,
  isAuthenticated = false,
  isAdmin = false,
}) => {
  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col min-w-0 w-[260px] bg-grid-panel border-r border-grid-border p-5 text-grid-text transition-all duration-300 ease-in-out overflow-x-hidden overflow-y-auto md:static md:translate-x-0
        ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full md:w-0 md:p-0 md:border-r-0 md:overflow-hidden md:opacity-0 md:pointer-events-none"
        }`}
      aria-hidden={!isOpen}
    >
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
      <nav className="flex-1">
        <ul className="space-y-1.5">
          <li className="flex items-center gap-3 py-3 px-4 rounded-xl text-grid-cyan bg-grid-blue/15 border border-grid-blue/30 font-semibold transition-all cursor-pointer">
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
          {isAdmin && (
            <li className="flex items-center gap-3 py-3 px-4 rounded-xl text-grid-dim hover:text-grid-text hover:bg-grid-deep/50 transition-all cursor-pointer group">
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
          )}

          {isAdmin && (
            <li className="flex items-center gap-3 py-3 px-4 rounded-xl text-grid-dim hover:text-grid-text hover:bg-grid-deep/50 transition-all cursor-pointer group">
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
          )}

          {isAdmin && (
            <li className="flex items-center gap-3 py-3 px-4 rounded-xl text-grid-dim hover:text-grid-text hover:bg-grid-deep/50 transition-all cursor-pointer group">
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
          )}
          {isAdmin && (
            <li className="flex items-center gap-3 py-3 px-4 rounded-xl text-grid-dim hover:text-grid-text hover:bg-grid-deep/50 transition-all cursor-pointer group">
              <NavLink
                to="/devops-logs"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                ${
                  isActive
                    ? "bg-purple-500/20 border border-purple-500/40 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`
                }
              >
                <Terminal size={20} />
                <span>Consola Logs</span>
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
