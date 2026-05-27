import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Terminal, RefreshCw, AlertTriangle, ShieldAlert, CheckCircle, Database } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import { useSystemStatus } from "../hooks/useSystemStatus";

const levelMeta = {
  ALL: { badge: "text-grid-text bg-grid-blue/20 border-grid-border" },
  INFO: { label: "INFO", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
  WARN: { label: "WARN", badge: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: AlertTriangle },
  ERROR: { label: "ERROR", badge: "text-grid-danger bg-grid-danger/10 border-grid-danger/20", icon: ShieldAlert },
};

const relativeFrom = (ms, nowMs) => {
  if (!Number.isFinite(ms) || !Number.isFinite(nowMs)) return "—";
  const diffSec = Math.max(0, Math.round((nowMs - ms) / 1000));
  if (diffSec < 60) return `Hace ${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  return `Hace ${diffMin}m`;
};

const DevOpsLogsPage = () => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [filterLevel, setFilterLevel] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Usamos el hook existente que consulta el status técnico cada 5 segundos
  const { data: statusData, loading, error } = useSystemStatus(5000);

  // Actualizador para mantener relativos los tiempos ("Hace 2s")
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 3000);
    return () => clearInterval(interval);
  }, []);

  // Extraemos los logs de forma segura del estado del sistema
  const rawLogs = statusData?.logs || [];

  // Filtramos los logs dinámicamente en el cliente
  const filteredLogs = useMemo(() => {
    return rawLogs.filter((log) => {
      const matchesLevel = filterLevel === "ALL" || log.level === filterLevel;
      const cleanMessage = (log.message || "").toLowerCase();
      const cleanService = (log.service || "").toLowerCase();
      const cleanQuery = searchQuery.toLowerCase();
      
      const matchesSearch = 
        cleanMessage.includes(cleanQuery) || 
        cleanService.includes(cleanQuery);

      return matchesLevel && matchesSearch;
    });
  }, [rawLogs, filterLevel, searchQuery]);

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto select-none">
        {/* Encabezado */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-grid-text flex items-center gap-3">
              <Terminal className="text-grid-cyan" size={28} />
              Consola DevOps
            </h1>
            <p className="text-sm text-grid-dim mt-1">
              Registro unificado de telemetría, seguridad y auditoría de base de datos en tiempo real.
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-grid-cyan bg-grid-blue/10 px-3 py-1.5 rounded-lg border border-grid-blue/40 font-semibold animate-pulse">
              <RefreshCw size={14} className="animate-spin" />
              Sincronizando...
            </div>
          )}
        </header>

        {error && (
          <div className="mb-6 bg-grid-panel border border-grid-danger/30 rounded-2xl p-4 text-sm font-mono-tech text-grid-danger">
            ⚠️ {error}
          </div>
        )}

        {/* Panel de Filtros */}
        <div className="bg-grid-panel border border-grid-border rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
          {/* Selector de Niveles */}
          <div className="flex bg-grid-deep/60 p-1 rounded-xl border border-grid-border/60 w-full md:w-auto">
            {["ALL", "INFO", "WARN", "ERROR"].map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`flex-1 md:flex-none px-4 py-2 text-xs font-bold rounded-lg tracking-wider transition-all duration-150 cursor-pointer
                  ${
                    filterLevel === level
                      ? "bg-grid-blue/30 text-grid-cyan border border-grid-blue/50 shadow"
                      : "text-grid-dim hover:text-grid-text"
                  }`}
              >
                {level === "ALL" ? "TODOS" : level}
              </button>
            ))}
          </div>

          {/* Buscador de Texto */}
          <div className="w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar por mensaje o servicio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-grid-deep/50 border border-grid-border rounded-xl px-4 py-2 text-sm text-grid-text placeholder:text-grid-dim outline-none focus:border-grid-cyan/60 focus:ring-1 focus:ring-grid-cyan/30 transition-all font-mono-tech"
            />
          </div>
        </div>

        {/* Consola de Logs Estilo Terminal */}
        <div className="bg-grid-panel border border-grid-border rounded-2xl overflow-hidden shadow-2xl min-h-[450px] flex flex-col">
          {/* Barra Superior Estilo Código */}
          <div className="bg-grid-deep/80 border-b border-grid-border/40 px-5 py-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-grid-danger/40 border border-grid-danger/20" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/40 border border-yellow-500/20" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-500/20" />
              <span className="text-xs text-grid-dim font-mono-tech ml-2">live_buffer_stream.sh</span>
            </div>
            <span className="text-xs font-mono-tech text-grid-dim">Total: {filteredLogs.length} eventos</span>
          </div>

          {/* Cuerpo del Stream de Logs */}
          <div className="p-4 sm:p-6 space-y-3 overflow-y-auto max-h-[600px] flex-1">
            {filteredLogs.map((log) => {
              const meta = levelMeta[log.level] || levelMeta.INFO;
              const LogIcon = meta.icon || Terminal;
              const isDatabase = log.service.includes("Database");

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-grid-deep/30 border border-grid-border/30 rounded-xl p-4 hover:bg-grid-blue/5 transition-all duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Icono de Servicio o Base de Datos */}
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 border ${
                      isDatabase ? "bg-amber-500/5 border-amber-500/10 text-amber-400" : "bg-grid-blue/10 border-grid-border/40 text-grid-cyan"
                    }`}>
                      {isDatabase ? <Database size={16} /> : <LogIcon size={16} />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-bold text-grid-text font-mono-tech group-hover:text-grid-cyan transition-colors">
                          {log.service}
                        </span>
                        <span className="text-[10px] text-grid-dim font-mono-tech">
                          • {relativeFrom(log.ts, nowMs)}
                        </span>
                      </div>
                      <p className="text-sm text-grid-dim mt-1.5 font-mono-tech break-words whitespace-pre-wrap leading-relaxed">
                        {log.message}
                      </p>
                    </div>
                  </div>

                  {/* Badge de Nivel */}
                  <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full border shrink-0 select-none ${meta.badge}`}>
                    {log.level}
                  </span>
                </motion.div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="h-[350px] flex flex-col items-center justify-center text-center gap-3 select-none">
                <Terminal size={32} className="text-grid-border" />
                <div>
                  <p className="text-sm font-bold text-grid-text">No se encontraron logs</p>
                  <p className="text-xs text-grid-dim mt-1 max-w-xs font-mono-tech">
                    No hay eventos que coincidan con el nivel de gravedad o el texto ingresado.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DevOpsLogsPage;