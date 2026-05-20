import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ShieldAlert,
  Zap,
  MapPin,
  ArrowRightLeft,
  Activity,
} from "lucide-react";

import MainLayout from "../components/layout/MainLayout";
import { useTelemetry } from "../hooks/useTelemetry";
import { sanitizeForDisplay, isSuspiciousString } from "../utils/sanitizers";

const CAPACITY_MAX_KW = 5000;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatKw = (value) =>
  toNumber(value).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

const getUsagePct = (consumptionKw, capacityKw) => {
  if (!capacityKw) return 0;
  return (toNumber(consumptionKw) / toNumber(capacityKw)) * 100;
};

const getSeverity = (usagePct) => {
  if (usagePct >= 95) return "CRITICAL";
  if (usagePct >= 80) return "WARNING";
  return "NORMAL";
};

const severityMeta = {
  CRITICAL: {
    label: "CRITICAL",
    badge:
      "text-grid-danger bg-grid-danger/10 border-grid-danger/30 animate-pulse",
    icon: "text-grid-danger",
    bar: "bg-grid-danger",
  },
  WARNING: {
    label: "WARNING",
    badge: "text-yellow-300 bg-yellow-500/10 border-yellow-500/30",
    icon: "text-yellow-300",
    bar: "bg-yellow-400",
  },
  NORMAL: {
    label: "NORMAL",
    badge: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    icon: "text-emerald-300",
    bar: "bg-emerald-400",
  },
};

const AlertsPage = () => {
  const { data, loading, error } = useTelemetry(5000);

  const districtAlerts = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const latestByDistrict = new Map();
    for (const row of data) {
      // Ignorar filas con district/substation sospechosas — no deben generar
      // alertas ni recomendaciones automáticas.
      if (
        isSuspiciousString(row?.district_id) ||
        isSuspiciousString(row?.substation_id)
      ) {
        continue;
      }
      const district = row?.district_id || "(Sin distrito)";
      const ts = row?.timestamp ? Date.parse(row.timestamp) : 0;
      const prev = latestByDistrict.get(district);
      const prevTs = prev?.timestamp ? Date.parse(prev.timestamp) : -1;
      if (!prev || ts >= prevTs) latestByDistrict.set(district, row);
    }

    const alerts = Array.from(latestByDistrict.values()).map((row) => {
      const capacityMaxKw = CAPACITY_MAX_KW;
      const consumptionKw = toNumber(row?.consumption_kw);
      const usagePct = getUsagePct(consumptionKw, capacityMaxKw);
      const severity = getSeverity(usagePct);

      return {
        key: `${sanitizeForDisplay(row?.district_id ?? "district")}-${sanitizeForDisplay(row?.substation_id ?? "sub")}`,
        district: sanitizeForDisplay(row?.district_id ?? "(Sin distrito)"),
        substation: sanitizeForDisplay(row?.substation_id ?? "—"),
        consumptionKw,
        capacityMaxKw,
        usagePct,
        severity,
        timestamp: row?.timestamp,
      };
    });

    alerts.sort((a, b) => b.usagePct - a.usagePct);
    return alerts;
  }, [data]);

  const kpis = useMemo(() => {
    const totalDistricts = districtAlerts.length;
    const criticalDistricts = districtAlerts.filter(
      (a) => a.severity === "CRITICAL",
    ).length;
    const activeAlerts = districtAlerts.filter(
      (a) => a.severity !== "NORMAL",
    ).length;

    const overloadEvents = Array.isArray(data)
      ? data.filter((row) => {
          const usage = getUsagePct(
            toNumber(row?.consumption_kw),
            CAPACITY_MAX_KW,
          );
          return usage >= 95;
        }).length
      : 0;

    const weights = { NORMAL: 0, WARNING: 0.6, CRITICAL: 1 };
    const riskAvg =
      totalDistricts === 0
        ? 0
        : districtAlerts.reduce(
            (acc, a) => acc + (weights[a.severity] ?? 0),
            0,
          ) / totalDistricts;
    const blackoutRiskPct = Math.round(riskAvg * 100);
    const blackoutRiskLabel =
      blackoutRiskPct >= 70 ? "ALTO" : blackoutRiskPct >= 40 ? "MEDIO" : "BAJO";

    return {
      totalDistricts,
      criticalDistricts,
      activeAlerts,
      overloadEvents,
      blackoutRiskPct,
      blackoutRiskLabel,
    };
  }, [districtAlerts, data]);

  const recommendations = useMemo(() => {
    if (districtAlerts.length === 0) return [];

    const stressed = districtAlerts.filter((a) => a.usagePct >= 80);
    const relief = districtAlerts
      .filter((a) => a.usagePct < 80)
      .slice()
      .sort((a, b) => a.usagePct - b.usagePct);

    const topRelief = relief.slice(0, 3);
    if (stressed.length === 0 || topRelief.length === 0) return [];

    return stressed.slice(0, 6).map((a) => {
      const target = topRelief[0];
      const transferKw = Math.round(clamp(a.consumptionKw * 0.08, 120, 450));
      const reason =
        a.severity === "CRITICAL"
          ? "Reducción inmediata para evitar disparos por sobrecarga"
          : "Redistribución preventiva para estabilizar la red";

      return {
        key: `${a.district}-${target.district}`,
        title: `Redistribuir ~${transferKw} kW`,
        detail: `${sanitizeForDisplay(a.district)} → ${sanitizeForDisplay(target.district)}`,
        reason,
      };
    });
  }, [districtAlerts]);

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-350 mx-auto">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-grid-text">
                Centro de Alertas
              </h1>
              <p className="text-sm sm:text-base text-grid-dim mt-1">
                Monitoreo de eventos críticos de la red eléctrica
              </p>
            </div>

            <div className="bg-grid-blue/10 px-4 py-2 rounded-lg border border-grid-blue flex items-center gap-2.5 text-xs font-bold text-grid-cyan tracking-wider select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
              TIEMPO REAL
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
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-grid-panel p-6 rounded-xl border border-grid-border shadow-lg hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-grid-danger/10">
                <ShieldAlert size={22} className="text-grid-danger" />
              </div>
              <div>
                <p className="text-xs text-grid-dim font-semibold uppercase tracking-wider">
                  Alertas activas
                </p>
                <h3 className="text-2xl font-bold mt-1 font-mono-tech">
                  {loading ? "—" : kpis.activeAlerts}
                </h3>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className="bg-grid-panel p-6 rounded-xl border border-grid-border shadow-lg hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-yellow-500/10">
                <MapPin size={22} className="text-yellow-300" />
              </div>
              <div>
                <p className="text-xs text-grid-dim font-semibold uppercase tracking-wider">
                  Distritos críticos
                </p>
                <h3 className="text-2xl font-bold mt-1 font-mono-tech">
                  {loading ? "—" : kpis.criticalDistricts}
                </h3>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
            className="bg-grid-panel p-6 rounded-xl border border-grid-border shadow-lg hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-grid-blue/10">
                <Zap size={22} className="text-grid-cyan" />
              </div>
              <div>
                <p className="text-xs text-grid-dim font-semibold uppercase tracking-wider">
                  Riesgo de apagón
                </p>
                <div className="flex items-end gap-2 mt-1">
                  <h3 className="text-2xl font-bold font-mono-tech">
                    {loading ? "—" : `${kpis.blackoutRiskPct}%`}
                  </h3>
                  {!loading && (
                    <span className="text-xs font-bold tracking-widest text-grid-dim mb-1">
                      {kpis.blackoutRiskLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.15 }}
            className="bg-grid-panel p-6 rounded-xl border border-grid-border shadow-lg hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-grid-cyan/10">
                <Activity size={22} className="text-grid-cyan" />
              </div>
              <div>
                <p className="text-xs text-grid-dim font-semibold uppercase tracking-wider">
                  Sobrecargas detectadas
                </p>
                <h3 className="text-2xl font-bold mt-1 font-mono-tech">
                  {loading ? "—" : kpis.overloadEvents}
                </h3>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Listado de alertas */}
        <section className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl mb-8">
          <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4 select-none">
            <AlertTriangle size={20} className="text-grid-cyan" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
              Alertas por distrito (última lectura)
            </h2>
          </div>
          <div
            className="grid grid-cols-1 gap-4 sm:hidden max-h-100 overflow-y-auto pr-1
    scrollbar-thin scrollbar-thumb-grid-border scrollbar-track-transparent"
          >
            {districtAlerts.map((a) => {
              const meta = severityMeta[a.severity];
              const usage = clamp(a.usagePct, 0, 100);
              return (
                <motion.div
                  key={a.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-grid-text">
                        {a.district}
                      </p>
                      <p className="text-xs text-grid-dim mt-0.5">
                        Subestación: {a.substation}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-extrabold tracking-widest px-2.5 py-1 rounded-full border ${meta.badge}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-grid-dim font-semibold uppercase tracking-wider">
                          Consumo actual
                        </p>
                        <p className="text-lg font-bold font-mono-tech">
                          {formatKw(a.consumptionKw)} kW
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-grid-dim font-semibold uppercase tracking-wider">
                          Capacidad máx.
                        </p>
                        <p className="text-sm font-bold font-mono-tech">
                          {formatKw(a.capacityMaxKw)} kW
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-grid-dim">
                        <span>% de uso</span>
                        <span
                          className={`font-mono-tech font-bold ${meta.icon}`}
                        >
                          {a.usagePct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-grid-deep/60 border border-grid-border/40 overflow-hidden">
                        <div
                          className={`h-full ${meta.bar}`}
                          style={{ width: `${usage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {!loading && districtAlerts.length === 0 && (
              <div className="text-sm text-grid-dim py-4 text-center">
                Sin datos de telemetría.
              </div>
            )}
          </div>
          <div
            className="hidden sm:block w-full max-h-112.5 overflow-y-auto overflow-x-auto pr-2
    scrollbar-thin scrollbar-thumb-grid-border scrollbar-track-transparent rounded-xl"
          >
            <table className="w-full border-separate border-spacing-y-2.5 text-left min-w-225">
              <thead className="sticky top-0 bg-grid-panel z-10 shadow-[0_2px_0_0_rgba(48,54,61,0.5)]">
                <tr className="text-xs font-bold uppercase tracking-widest text-grid-dim select-none">
                  <th className="px-5 pb-3 pt-1">Distrito</th>
                  <th className="px-5 pb-3 pt-1">Consumo actual</th>
                  <th className="px-5 pb-3 pt-1">Capacidad máxima</th>
                  <th className="px-5 pb-3 pt-1">% de uso</th>
                  <th className="px-5 pb-3 pt-1">Severidad</th>
                </tr>
              </thead>
              <tbody>
                {districtAlerts.map((a) => {
                  const meta = severityMeta[a.severity];
                  const usage = clamp(a.usagePct, 0, 100);
                  return (
                    <tr
                      key={a.key}
                      className="group bg-grid-deep/40 hover:bg-grid-blue/10 border border-grid-border transition-colors duration-200"
                    >
                      <td className="p-4 text-sm font-semibold text-grid-text rounded-l-xl border-y border-l border-grid-border/40 group-hover:border-grid-blue/30">
                        {a.district}
                        <div className="text-[11px] text-grid-dim mt-0.5">
                          {a.substation}
                        </div>
                      </td>
                      <td className="p-4 text-sm border-y border-grid-border/40 group-hover:border-grid-blue/30">
                        <span className="font-mono-tech font-bold text-grid-text">
                          {formatKw(a.consumptionKw)} kW
                        </span>
                      </td>
                      <td className="p-4 text-sm border-y border-grid-border/40 group-hover:border-grid-blue/30">
                        <span className="font-mono-tech font-semibold text-grid-dim">
                          {formatKw(a.capacityMaxKw)} kW
                        </span>
                      </td>
                      <td className="p-4 text-sm border-y border-grid-border/40 group-hover:border-grid-blue/30">
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 rounded-full bg-grid-deep/60 border border-grid-border/40 overflow-hidden">
                            <div
                              className={`h-full ${meta.bar}`}
                              style={{ width: `${usage}%` }}
                            ></div>
                          </div>
                          <span
                            className={`font-mono-tech font-bold ${meta.icon}`}
                          >
                            {a.usagePct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm rounded-r-xl border-y border-r border-grid-border/40 group-hover:border-grid-blue/30">
                        <span
                          className={`inline-flex items-center text-xs font-extrabold tracking-widest px-3 py-1 rounded-full border ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && districtAlerts.length === 0 && (
              <div className="text-sm text-grid-dim mt-4 py-6 text-center">
                Sin datos de telemetría.
              </div>
            )}
          </div>
        </section>
        <section className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
            <ArrowRightLeft size={20} className="text-grid-cyan" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
              Recomendaciones automáticas
            </h2>
          </div>

          {recommendations.length === 0 ? (
            <p className="text-sm text-grid-dim">
              No hay sobrecargas activas; la red está estable.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {recommendations.map((r) => (
                <motion.div
                  key={r.key}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-grid-cyan/10">
                      <Zap size={18} className="text-grid-cyan" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-grid-text">
                        {r.title}
                      </p>
                      <p className="text-xs text-grid-dim mt-1">{r.detail}</p>
                      <p className="text-xs text-grid-dim mt-2">{r.reason}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default AlertsPage;
