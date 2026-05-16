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

        {/* Status cards */}
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

        {/* Métricas DevOps */}
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

        {/* Health checks */}
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

        {/* Logs + Scalabilidad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
              <Terminal size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Logs del sistema
              </h2>
            </div>

            <div className="space-y-2">
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
                    className="bg-grid-deep/40 border border-grid-border/40 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-grid-dim font-mono-tech">
                          {relativeFrom(l.ts, nowMs)} · {l.service}
                        </p>
                        <p className="text-sm text-grid-text mt-1 truncate">
                          {l.message}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-extrabold tracking-widest px-2.5 py-1 rounded-full border ${levelMeta.badge}`}
                      >
                        {l.level}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
              <Cloud size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Escalabilidad
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                  Instancias activas
                </p>
                <p className="text-2xl font-bold mt-2 font-mono-tech">
                  {Number.isFinite(Number(scaling.instancesActive))
                    ? Math.round(Number(scaling.instancesActive))
                    : "—"}
                </p>
              </div>

              <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                  Balanceo de carga
                </p>
                <p className="text-sm font-bold mt-3 text-grid-text font-mono-tech">
                  {scaling.loadBalancing ?? "—"}
                </p>
              </div>

              <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                  Autoscaling status
                </p>
                <p className="text-sm font-bold mt-3 text-grid-text font-mono-tech">
                  {scaling.autoscaling ?? "—"}
                </p>
              </div>
            </div>

            <div className="mt-5 text-xs text-grid-dim">
              Preparado para consumir métricas reales desde el backend
              (inyectando props o conectando un hook de observabilidad).
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default SystemStatusPage;
