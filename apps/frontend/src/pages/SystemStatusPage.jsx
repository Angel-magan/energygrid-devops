import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Cpu,
  Database,
  Gauge,
  Globe,
  Layers,
  Network,
  RefreshCw,
  Server,
  Terminal,
  Zap,
} from "lucide-react";

import MainLayout from "../components/layout/MainLayout";
import { useSystemStatus } from "../hooks/useSystemStatus";

const formatMs = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${Math.round(num)} ms`;
};

const formatPct = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return `${Math.round(num)}%`;
};

const statusMeta = {
  ONLINE: {
    label: "ONLINE",
    badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    icon: "text-emerald-300",
    bar: "bg-emerald-400",
    Icon: CheckCircle2,
  },
  DEGRADED: {
    label: "DEGRADED",
    badge: "text-yellow-300 bg-yellow-500/10 border-yellow-500/30",
    icon: "text-yellow-300",
    bar: "bg-yellow-400",
    Icon: AlertTriangle,
  },
  OFFLINE: {
    label: "OFFLINE",
    badge: "text-grid-danger bg-grid-danger/10 border-grid-danger/30",
    icon: "text-grid-danger",
    bar: "bg-grid-danger",
    Icon: AlertTriangle,
  },
};

const relativeFrom = (ms, nowMs) => {
  if (!Number.isFinite(ms) || !Number.isFinite(nowMs)) return "—";
  const diffSec = Math.max(0, Math.round((nowMs - ms) / 1000));
  if (diffSec < 60) return `hace ${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  return `hace ${diffMin}m`;
};

const SystemStatusPage = ({
  services: servicesProp,
  metrics: metricsProp,
  healthChecks: healthChecksProp,
  logs: logsProp,
  scaling: scalingProp,
} = {}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chaosTime, setChaosTime] = useState(""); // Guarda la hora seleccionada
  const [chaosMode, setChaosMode] = useState("NORMAL"); // "NORMAL", "SCHEDULED", "RUNNING"
  const { data: statusData, error } = useSystemStatus(5000);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 2000);
    return () => clearInterval(interval);
  }, []);

  const iconByKey = useMemo(
    () => ({
      backend: Server,
      postgres: Database,
      simulator: RefreshCw,
      frontend: Globe,
    }),
    [],
  );

  const services = useMemo(() => {
    const raw =
      (Array.isArray(servicesProp) && servicesProp) ||
      (Array.isArray(statusData?.services) && statusData.services) ||
      [];
    return raw.map((svc) => ({
      ...svc,
      icon: svc.icon || iconByKey[svc.key] || Cloud,
      detail: svc.detail || svc.endpoint || "—",
    }));
  }, [servicesProp, statusData, iconByKey]);

  const metrics = metricsProp ||
    statusData?.metrics || {
    cpu: null,
    ram: null,
    apiLatencyMs: null,
    eventsPerSec: null,
    activeConnections: null,
  };
  // Sincronización robusta: la UI lee directamente la realidad de la memoria del backend
  useEffect(() => {
    if (statusData?.scaling?.loadBalancing?.includes("SATURATED")) {
      setChaosMode("RUNNING");
    } else if (statusData?.scheduledTime) {
      // Si el backend reporta una hora agendada en memoria, preservamos el estado visual
      setChaosMode("SCHEDULED");
      setChaosTime(statusData.scheduledTime);
    } else {
      setChaosMode("NORMAL");
    }
  }, [statusData]);

  const healthChecks =
    (Array.isArray(healthChecksProp) && healthChecksProp) ||
    (Array.isArray(statusData?.healthChecks) && statusData.healthChecks) ||
    [];

  const logs =
    (Array.isArray(logsProp) && logsProp) ||
    (Array.isArray(statusData?.logs) && statusData.logs) ||
    [];

  const scaling = scalingProp ||
    statusData?.scaling || {
    instancesActive: null,
    loadBalancing: null,
    autoscaling: null,
  };

  const overallStatus = useMemo(() => {
    const statuses = services.map((s) => s.status);
    if (statuses.includes("OFFLINE")) return "OFFLINE";
    if (statuses.includes("DEGRADED")) return "DEGRADED";
    return "ONLINE";
  }, [services]);

  const overallMeta = statusMeta[overallStatus] ?? statusMeta.DEGRADED;
  const OverallIcon = overallMeta.Icon;

  const executeChaosAction = async (actionType) => {
    try {
      // Si estamos en desarrollo apunta al puerto 3000 (Express). Si estamos en producción (Railway), usa la ruta relativa /api
      const isDev = window.location.hostname === "localhost";
      const backendUrl = isDev
        ? "http://localhost:3000/api/system/chaos"
        : "/api/system/chaos";

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          scheduledTime: actionType === "SCHEDULE" ? chaosTime : null
        })
      });

      if (!response.ok) {
        console.error("El backend devolvió un código de error de red:", response.status);
        return;
      }

      // Sincronización visual local inmediata
      if (actionType === "START_NOW") {
        setChaosMode("RUNNING");
      } else if (actionType === "SCHEDULE") {
        setChaosMode("SCHEDULED");
      } else if (actionType === "MITIGATE" || actionType === "CANCEL") {
        setChaosMode("NORMAL");
        setChaosTime("");
        setIsModalOpen(false);
      }

      // Forzar al hook a actualizar las métricas y traer los logs al instante
      if (statusData && typeof statusData.refetch === "function") {
        statusData.refetch();
      }

    } catch (err) {
      console.error("Error de comunicación con el microservicio de estado:", err);
    }
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-350 mx-auto">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-grid-text">
                Estado del Sistema
              </h1>
              <p className="text-sm sm:text-base text-grid-dim mt-1">
                Monitoreo de infraestructura y microservicios
              </p>
            </div>

            <div className="bg-grid-blue/10 px-4 py-2 rounded-lg border border-grid-blue flex items-center gap-2.5 text-xs font-bold text-grid-cyan tracking-wider select-none">
              <OverallIcon size={16} className={overallMeta.icon} />
              <span
                className={`px-2 py-1 rounded-full border ${overallMeta.badge}`}
              >
                {overallMeta.label}
              </span>
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 bg-grid-panel border border-grid-danger/30 rounded-2xl p-5 shadow-2xl shadow-grid-danger/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-grid-danger mt-0.5" size={18} />
              <div>
                <p className="font-bold text-grid-text">Error de conexión</p>
                <p className="text-sm text-grid-dim mt-1 font-mono-tech">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {services.map((svc, idx) => {
            const meta = statusMeta[svc.status] ?? statusMeta.DEGRADED;
            const Icon = svc.icon ?? Cloud;
            const StatusIcon = meta.Icon;
            return (
              <motion.div
                key={svc.key ?? svc.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: idx * 0.04 }}
                className="bg-grid-panel p-6 rounded-2xl border border-grid-border shadow-2xl hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-grid-cyan/10 border border-grid-border/30">
                      <Icon size={20} className="text-grid-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-grid-text">
                        {svc.name}
                      </p>
                      <p className="text-xs text-grid-dim mt-0.5">
                        {svc.detail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusIcon size={16} className={meta.icon} />
                    <span
                      className={`text-[11px] font-extrabold tracking-widest px-2.5 py-1 rounded-full border ${meta.badge}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-2 rounded-full bg-grid-deep/60 border border-grid-border/40 overflow-hidden">
                    <div
                      className={`h-full ${meta.bar}`}
                      style={{
                        width:
                          meta.label === "ONLINE"
                            ? "100%"
                            : meta.label === "DEGRADED"
                              ? "65%"
                              : "20%",
                      }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        <section className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl mb-8">
          <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
            <Gauge size={20} className="text-grid-cyan" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
              Métricas DevOps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Cpu size={18} className="text-grid-cyan" />
                <p className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                  CPU usage
                </p>
              </div>
              <p className="text-2xl font-bold mt-2 font-mono-tech">
                {formatPct(metrics.cpu)}
              </p>
            </div>

            <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Layers size={18} className="text-grid-cyan" />
                <p className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                  RAM usage
                </p>
              </div>
              <p className="text-2xl font-bold mt-2 font-mono-tech">
                {formatPct(metrics.ram)}
              </p>
            </div>

            <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Network size={18} className="text-grid-cyan" />
                <p className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                  API latency
                </p>
              </div>
              <p className="text-2xl font-bold mt-2 font-mono-tech">
                {formatMs(metrics.apiLatencyMs)}
              </p>
            </div>

            <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Zap size={18} className="text-grid-cyan" />
                <p className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                  Events/sec
                </p>
              </div>
              <p className="text-2xl font-bold mt-2 font-mono-tech">
                {Number.isFinite(Number(metrics.eventsPerSec))
                  ? Number(metrics.eventsPerSec).toFixed(1)
                  : "—"}
              </p>
            </div>

            <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <Activity size={18} className="text-grid-cyan" />
                <p className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                  Active connections
                </p>
              </div>
              <p className="text-2xl font-bold mt-2 font-mono-tech">
                {Number.isFinite(Number(metrics.activeConnections))
                  ? Math.round(Number(metrics.activeConnections))
                  : "—"}
              </p>
            </div>
          </div>
        </section>
        <section className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl mb-8">
          <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
            <Server size={20} className="text-grid-cyan" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
              Health checks
            </h2>
          </div>

          <div className="w-full overflow-x-auto rounded-xl">
            <table className="w-full border-separate border-spacing-y-2.5 text-left min-w-195">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-widest text-grid-dim select-none">
                  <th className="px-5 pb-1">servicio</th>
                  <th className="px-5 pb-1">endpoint</th>
                  <th className="px-5 pb-1">status</th>
                  <th className="px-5 pb-1">response time</th>
                </tr>
              </thead>
              <tbody>
                {healthChecks.map((row) => {
                  const meta = statusMeta[row.status] ?? statusMeta.DEGRADED;
                  return (
                    <tr
                      key={row.key ?? `${row.service}-${row.endpoint}`}
                      className="group bg-grid-deep/40 hover:bg-grid-blue/10 border border-grid-border transition-colors duration-200"
                    >
                      <td className="p-4 text-sm font-semibold text-grid-text rounded-l-xl border-y border-l border-grid-border/40 group-hover:border-grid-blue/30">
                        {row.service}
                      </td>
                      <td className="p-4 text-sm text-grid-dim font-medium border-y border-grid-border/40 group-hover:border-grid-blue/30">
                        <span className="font-mono-tech">{row.endpoint}</span>
                      </td>
                      <td className="p-4 text-sm border-y border-grid-border/40 group-hover:border-grid-blue/30">
                        <span
                          className={`inline-flex items-center text-xs font-extrabold tracking-widest px-3 py-1 rounded-full border ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-mono-tech rounded-r-xl border-y border-r border-grid-border/40 group-hover:border-grid-blue/30">
                        {formatMs(row.responseTimeMs)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4 select-none">
              <Terminal size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Logs del sistema
              </h2>
            </div>
            <div
              className="space-y-2 max-h-[350px] overflow-y-auto pr-2
    scrollbar-thin scrollbar-thumb-grid-border scrollbar-track-transparent rounded-xl"
            >
              {logs.map((l) => {
                const levelMeta =
                  l.level === "WARN"
                    ? statusMeta.DEGRADED
                    : l.level === "ERROR"
                      ? statusMeta.OFFLINE
                      : statusMeta.ONLINE;

                return (
                  <div
                    key={l.id}
                    className="bg-grid-deep/40 border border-grid-border/40 rounded-xl p-3 hover:bg-grid-blue/5 transition-colors duration-150"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-grid-dim font-mono-tech">
                          {relativeFrom(l.ts, nowMs)} · {l.service}
                        </p>
                        <p className="text-sm text-grid-text mt-1 font-mono-tech break-words">
                          {l.message}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-extrabold tracking-widest px-2.5 py-1 rounded-full border shrink-0 ${levelMeta.badge}`}
                      >
                        {l.level}
                      </span>
                    </div>
                  </div>
                );
              })}
              {logs.length === 0 && (
                <div className="text-sm text-grid-dim py-6 text-center font-mono-tech">
                  No hay eventos recientes en el buffer de la consola.
                </div>
              )}
            </div>
          </section>

          <section className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6 border-b border-grid-border/50 pb-4">
              <div className="flex items-center gap-3">
                <Cloud size={20} className="text-grid-cyan" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                  Escalabilidad & DevOps
                </h2>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className={`cursor-pointer text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-150 ${chaosMode === "RUNNING"
                    ? "bg-grid-danger/20 border-grid-danger text-grid-danger animate-pulse"
                    : chaosMode === "SCHEDULED"
                      ? "bg-yellow-500/20 border-yellow-500 text-yellow-300"
                      : "bg-blue-500/10 border-blue-500/30 text-grid-blue hover:bg-blue-500/20"
                  }`}
              >
                {chaosMode === "RUNNING" && "⚠️ Caos Activo"}
                {chaosMode === "SCHEDULED" && `⏰ Caos a las ${chaosTime}`}
                {chaosMode === "NORMAL" && "⚙️ Configurar Caos"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                  Instancias activas
                </p>
                <p className="text-2xl font-bold mt-2 font-mono-tech text-grid-cyan">
                  {chaosMode === "RUNNING" ? "1" : (chaosMode === "NORMAL" && chaosTime ? "2" : Math.round(Number(scaling.instancesActive || 1)))}
                </p>
              </div>

              <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                  Balanceo de carga
                </p>
                <p className="text-sm font-bold mt-3 text-grid-text font-mono-tech">
                  {chaosMode === "RUNNING" ? "OVERLOADED" : (scaling.loadBalancing || "ROUND_ROBIN")}
                </p>
              </div>

              <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                  Autoscaling status
                </p>
                <p className="text-sm font-bold mt-3 text-grid-text font-mono-tech">
                  {chaosMode === "RUNNING" ? "ALERT_TRIGGERED" : (scaling.autoscaling || "STABLE")}
                </p>
              </div>
            </div>

            {/* MODAL AVANZADO PROGRAMABLE */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-grid-deep/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-grid-panel border border-grid-border rounded-2xl max-w-md w-full p-6 shadow-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-base font-bold text-grid-text flex items-center gap-2">
                      <Terminal className="text-grid-cyan" size={18} />
                      <span>Laboratorio DevOps: Simulación de Carga</span>
                    </h3>
                  </div>
                  <p className="text-xs text-grid-dim leading-relaxed">
                    Configura escenarios de estrés para evaluar el comportamiento del balanceador y la escalabilidad del contenedor <code className="text-grid-blue">eg-backend</code>.
                  </p>

                  {chaosMode !== "RUNNING" ? (
                    <div className="mt-4 space-y-4">
                      {/* Formulario de programación */}
                      <div className="bg-grid-deep/60 p-4 rounded-xl border border-grid-border/50">
                        <label className="block text-xs font-bold text-grid-dim mb-2 uppercase tracking-wide">
                          Opción 1: Programar Hora de Mayor Demanda
                        </label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="time"
                            value={chaosTime}
                            onChange={(e) => setChaosTime(e.target.value)}
                            className="bg-grid-panel border border-grid-border rounded-lg px-3 py-1.5 text-sm text-grid-text focus:outline-none focus:border-grid-cyan font-mono-tech"
                          />
                          <button
                            onClick={() => executeChaosAction("SCHEDULE")}
                            className="cursor-pointer text-xs font-bold bg-grid-blue text-grid-deep px-3 py-2 rounded-lg hover:opacity-90"
                          >
                            Programar Alerta
                          </button>
                          {chaosMode === "SCHEDULED" && (
                            <button
                              onClick={() => executeChaosAction("CANCEL")}
                              className="cursor-pointer text-xs font-bold bg-grid-danger/20 text-grid-danger px-3 py-2 rounded-lg border border-grid-danger/30"
                            >
                              Cancelar Alerta
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="text-center text-xs text-grid-dim font-semibold">— O —</div>

                      <div className="flex justify-between items-center bg-grid-danger/5 border border-grid-danger/20 p-3 rounded-xl">
                        <span className="text-xs text-grid-text font-medium">Opción 2: Forzar inyección inmediata</span>
                        <button
                          onClick={() => executeChaosAction("START_NOW")}
                          className="cursor-pointer text-xs font-bold bg-grid-danger text-grid-text px-3 py-2 rounded-lg"
                        >
                          Saturar CPU Ya
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Pantalla cuando el caos está activo y requiere la mitigación por comando */
                    <div className="mt-5 border-t border-grid-border/40 pt-4">
                      <div className="bg-red-950/30 font-mono-tech text-[11px] p-3 rounded-lg text-grid-danger border border-grid-danger/20 mb-4 leading-normal">
                        💥 <span className="font-bold">SISTEMA SATURADO (CPU al 99%)</span>
                        <br />Para solucionar esta alerta, abre tu terminal local y ejecuta:
                        <div className="bg-grid-deep p-2 rounded border border-grid-border mt-2 text-grid-text font-bold select-all">
                          docker-compose up -d --scale eg-backend=2
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-6">
                        <span className="text-[10px] text-grid-danger uppercase tracking-widest animate-pulse font-bold">🔴 Monitoreando Docker...</span>
                        <button
                          onClick={() => executeChaosAction("MITIGATE")}
                          className="text-xs font-bold bg-grid-cyan text-grid-deep px-4 py-2 rounded-xl shadow-lg shadow-grid-cyan/20"
                        >
                          Simular Aplicación de Comando
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex justify-end border-t border-grid-border/30 pt-4">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="cursor-pointer text-xs font-semibold px-4 py-2 text-grid-dim hover:text-grid-text"
                    >
                      Cerrar Panel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 text-xs text-grid-dim">
              Entorno local preparado para validar políticas de infraestructura replicable.
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default SystemStatusPage;
