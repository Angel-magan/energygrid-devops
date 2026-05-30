import { useMemo, useState } from "react";
import {} from "recharts";
import {
  Activity,
  AlertTriangle,
  Clock,
  Filter,
  MapPin,
  Search,
  ShieldAlert,
  SortDesc,
  Zap,
  Bug,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import MainLayout from "../components/layout/MainLayout";
import { useTelemetry } from "../hooks/useTelemetry";
import { useDistricts } from "../hooks/useDistricts";
import {
  buildDistrictCapacityMap,
  getDistrictCapacityMaxKw,
  getUsagePct as getUsagePctByCapacity,
  DEFAULT_DISTRICT_CAPACITY_KW,
} from "../utils/districtCapacity";
import jsPDF from "jspdf";
import "jspdf-autotable";
import AutomatedInsights from "../components/telemetry/AutomatedInsights";
import { FileDown } from "lucide-react";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
};

const safeText = (value) => (typeof value === "string" ? value : "");

const getSeverity = (usagePct) => {
  if (!Number.isFinite(usagePct)) return "CRITICAL";
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

const hashString = (text) => {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const deriveVoltage = ({ districtId, substationId, usagePct }) => {
  const base = 230;
  const seed = hashString(`${districtId}-${substationId}`) % 100;
  const noise = (seed - 50) / 10; // -5..+5
  const sag = !Number.isFinite(usagePct)
    ? 12
    : usagePct >= 95
      ? 8
      : usagePct >= 80
        ? 4
        : 0;
  return base - sag + noise;
};

const deriveFrequency = ({ districtId, substationId, usagePct }) => {
  const base = 60;
  const seed = hashString(`${substationId}-${districtId}`) % 60;
  const noise = (seed - 30) / 100; // -0.30..+0.30
  const droop = !Number.isFinite(usagePct)
    ? 0.6
    : usagePct >= 95
      ? 0.25
      : usagePct >= 80
        ? 0.12
        : 0;
  return base - droop + noise;
};

const isSuspiciousSql = (text) => {
  if (!text) return false;
  const s = text.toLowerCase();
  return (
    s.includes("'") ||
    s.includes('"') ||
    s.includes(";") ||
    s.includes("--") ||
    s.includes("/*") ||
    s.includes("*/") ||
    /\b(or|and)\b\s+\d+\s*=\s*\d+/.test(s) ||
    /\b(drop|truncate|insert|update|delete)\b\s+\b(table|from|into)\b/.test(s)
  );
};

const isSqlInjectionRow = (row) =>
  isSuspiciousSql(row?.districtId) || isSuspiciousSql(row?.substationId);

const formatDateTime = (value) => {
  const ms = typeof value === "number" ? value : Date.parse(String(value));
  if (!Number.isFinite(ms)) return "Timestamp inválido";
  return new Date(ms).toLocaleString();
};

const formatRelativeFromNow = (ms) => {
  if (!Number.isFinite(ms)) return "—";
  const diffSec = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (diffSec < 60) return `hace ${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  return `hace ${diffMin}m`;
};

const TelemetryPage = ({ data: dataProp } = {}) => {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const {
    data: hookData,
    pagination,
    loading,
    error,
  } = useTelemetry(5000, { all: true, page, limit: pageSize });
  const { data: districts } = useDistricts();
  const data = Array.isArray(dataProp) ? dataProp : hookData;

  const [districtQuery, setDistrictQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [sortConsumption, setSortConsumption] = useState("desc");
  const [fromTs, setFromTs] = useState("");
  const [toTs, setToTs] = useState("");

  const handleClearFilters = () => {
    setDistrictQuery("");
    setSeverityFilter("ALL");
    setSortConsumption("desc");
    setFromTs("");
    setToTs("");
  };

  const currentPage = pagination?.currentPage ?? page;
  const totalPages = pagination?.totalPages ?? 1;
  const totalItems = pagination?.totalItems ?? data.length;

  const districtCapacities = useMemo(
    () => buildDistrictCapacityMap(districts),
    [districts],
  );

  const enrichedRows = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((row) => {
      const districtId = row?.district_id ?? "";
      const substationId = row?.substation_id ?? "";
      const consumptionKw = toNumber(row?.consumption_kw);
      const timestampMs = row?.timestamp
        ? Date.parse(String(row.timestamp))
        : NaN;
      const capacityKw = getDistrictCapacityMaxKw(
        districtId,
        districtCapacities,
      );
      const usagePct = getUsagePctByCapacity(consumptionKw, capacityKw);

      const providedVoltage = toNumber(row?.voltage);
      const providedFreq = toNumber(row?.frequency_hz);
      const voltage = Number.isFinite(providedVoltage)
        ? providedVoltage
        : deriveVoltage({ districtId, substationId, usagePct });
      const frequencyHz = Number.isFinite(providedFreq)
        ? providedFreq
        : deriveFrequency({ districtId, substationId, usagePct });

      const statusRaw = safeText(row?.status).toUpperCase();
      const derivedSeverity = getSeverity(usagePct);
      const status =
        statusRaw === "NORMAL" ||
        statusRaw === "WARNING" ||
        statusRaw === "CRITICAL"
          ? statusRaw
          : derivedSeverity;

      return {
        id: row?.id ?? `${districtId}-${substationId}-${row?.timestamp ?? ""}`,
        raw: row,
        timestampMs,
        districtId,
        substationId,
        consumptionKw,
        capacityKw,
        usagePct,
        voltage,
        frequencyHz,
        status,
        sqlInjection: isSqlInjectionRow({ districtId, substationId }),
      };
    });
  }, [data, districtCapacities]);

  const anomalies = useMemo(() => {
    const invalidTimestamps = [];
    const outOfRange = [];
    const sqlInjections = [];
    const corrupt = [];

    for (const r of enrichedRows) {
      const district = safeText(r.districtId);
      const sub = safeText(r.substationId);

      const hasDistrict = Boolean(district.trim());
      const hasSubstation = Boolean(sub.trim());
      const hasConsumption = Number.isFinite(r.consumptionKw);

      if (!Number.isFinite(r.timestampMs)) {
        invalidTimestamps.push(r);
      }

      const usage = getUsagePctByCapacity(
        r.consumptionKw,
        r.capacityKw || DEFAULT_DISTRICT_CAPACITY_KW,
      );
      const badConsumption =
        !Number.isFinite(r.consumptionKw) ||
        r.consumptionKw < 0 ||
        r.consumptionKw > 6000;
      const badVoltage =
        !Number.isFinite(r.voltage) || r.voltage < 200 || r.voltage > 260;
      const badFrequency =
        !Number.isFinite(r.frequencyHz) ||
        r.frequencyHz < 58 ||
        r.frequencyHz > 62;
      const badUsage = !Number.isFinite(usage) || usage < 0 || usage > 200;

      if (badConsumption || badVoltage || badFrequency || badUsage) {
        outOfRange.push(r);
      }

      if (isSuspiciousSql(district) || isSuspiciousSql(sub)) {
        sqlInjections.push(r);
      }

      if (!hasDistrict || !hasSubstation || !hasConsumption) {
        corrupt.push(r);
      }
    }

    return {
      invalidTimestamps,
      outOfRange,
      sqlInjections,
      corrupt,
    };
  }, [enrichedRows]);

  const filteredRows = useMemo(() => {
    const q = districtQuery.trim().toLowerCase();
    const fromMs = fromTs ? Date.parse(fromTs) : NaN;
    const toMs = toTs ? Date.parse(toTs) : NaN;

    let rows = enrichedRows;

    if (q) {
      rows = rows.filter((r) =>
        safeText(r.districtId).toLowerCase().includes(q),
      );
    }

    if (severityFilter !== "ALL") {
      rows = rows.filter((r) => r.status === severityFilter);
    }

    if (Number.isFinite(fromMs) || Number.isFinite(toMs)) {
      rows = rows.filter((r) => {
        if (!Number.isFinite(r.timestampMs)) return false;
        if (Number.isFinite(fromMs) && r.timestampMs < fromMs) return false;
        if (Number.isFinite(toMs) && r.timestampMs > toMs) return false;
        return true;
      });
    }

    const sorted = [...rows];
    sorted.sort((a, b) => {
      const sqlPriorityA = a.sqlInjection ? 1 : 0;
      const sqlPriorityB = b.sqlInjection ? 1 : 0;

      if (sqlPriorityA !== sqlPriorityB) {
        return sqlPriorityB - sqlPriorityA;
      }

      if (sortConsumption === "asc") {
        return (a.consumptionKw ?? 0) - (b.consumptionKw ?? 0);
      }

      if (sortConsumption === "desc") {
        return (b.consumptionKw ?? 0) - (a.consumptionKw ?? 0);
      }

      return 0;
    });

    return sorted;
  }, [
    enrichedRows,
    districtQuery,
    severityFilter,
    sortConsumption,
    fromTs,
    toTs,
  ]);

  const kpis = useMemo(() => {
    const received = enrichedRows.length;
    const districtsActive = new Set(
      enrichedRows.map((r) => safeText(r.districtId).trim()).filter(Boolean),
    ).size;

    const validTs = enrichedRows
      .map((r) => r.timestampMs)
      .filter((ms) => Number.isFinite(ms));
    const lastMs = validTs.length ? Math.max(...validTs) : NaN;

    const windowStart = Number.isFinite(lastMs) ? lastMs - 60_000 : NaN;
    const eventsPerMin = Number.isFinite(windowStart)
      ? enrichedRows.filter(
          (r) => Number.isFinite(r.timestampMs) && r.timestampMs >= windowStart,
        ).length
      : 0;

    return {
      received,
      districtsActive,
      lastUpdateText: formatRelativeFromNow(lastMs),
      eventsPerMin,
    };
  }, [enrichedRows]);

  // Función Automatizada para Generación de Reporte PDF Corporativo
  const downloadPDFReport = () => {
    const doc = new jsPDF();

    // Configurar encabezado del PDF estilo Cyberpunk/Grid corporativo
    doc.setFillColor(20, 24, 33);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ENERGYGRID - REPORTE DE CONTINGENCIA", 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Generado: ${new Date().toLocaleString()} | Estado de Red: Virtual Real-Time`,
      14,
      25,
    );
    doc.text(
      `Filtros Activos: Distrito: [${districtQuery || "Todos"}] | Severidad: [${severityFilter}]`,
      14,
      32,
    );

    // Resumen Ejecutivo de Anomalías de Infraestructura
    doc.setTextColor(20, 24, 33);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      "1. RESUMEN DE ANOMALÍAS DE TELEMETRÍA (AUDITORÍA DOCKER)",
      14,
      52,
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `- Timestamps Fuera de Época o Inválidos: ${anomalies.invalidTimestamps.length}`,
      19,
      60,
    );
    doc.text(
      `- Registros con Valores Fuera de Rango Operativo: ${anomalies.outOfRange.length}`,
      19,
      66,
    );
    doc.text(
      `- Intentos de Inyección de Código (SQL/Sanitarizados): ${anomalies.sqlInjections.length}`,
      19,
      72,
    );
    doc.text(
      `- Registros de Red Corruptos/Incompletos: ${anomalies.corrupt.length}`,
      19,
      78,
    );

    // Tabla de Registros Filtrados Actuales
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("2. FLUJO EN VIVO ANALIZADO", 14, 90);

    const tableColumns = [
      "Timestamp",
      "Distrito",
      "Subestación",
      "Consumo (kW)",
      "Voltaje (V)",
      "Frecuencia (Hz)",
      "Estado",
    ];
    const tableRows = filteredRows.map((r) => [
      formatDateTime(r.timestampMs),
      r.districtId || "—",
      r.substationId || "—",
      Number.isFinite(r.consumptionKw)
        ? `${r.consumptionKw.toLocaleString()} kW`
        : "NaN",
      `${r.voltage.toFixed(1)} V`,
      `${r.frequencyHz.toFixed(2)} Hz`,
      r.status,
    ]);

    doc.autoTable({
      startY: 95,
      head: [tableColumns],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [14, 165, 233], fontSize: 9 }, // Color Cyan de tu interfaz
      styles: { fontSize: 8 },
      margin: { top: 10 },
    });

    // Guardar archivo binario descargable
    doc.save(`EnergyGrid-Report-${Date.now()}.pdf`);
  };

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-350 mx-auto">
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-grid-text">
                Centro de Telemetría
              </h1>
              <p className="text-sm sm:text-base text-grid-dim mt-1">
                Monitoreo de medidores inteligentes y tráfico energético
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
                <p className="text-sm font-semibold text-grid-danger">
                  Error al cargar telemetría
                </p>
                <p className="text-xs text-grid-dim mt-1">
                  {error?.message || String(error)}
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-grid-panel border border-grid-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-grid-deep/40 flex items-center justify-center">
              <Activity size={20} className="text-grid-cyan" />
            </div>
            <div>
              <div className="text-xs text-grid-dim uppercase tracking-wider">
                Registros recibidos
              </div>
              <div className="text-3xl font-extrabold text-grid-text">
                {kpis.received}
              </div>
            </div>
          </div>

          <div className="bg-grid-panel border border-grid-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-grid-deep/40 flex items-center justify-center">
              <MapPin size={20} className="text-yellow-300" />
            </div>
            <div>
              <div className="text-xs text-grid-dim uppercase tracking-wider">
                Distritos activos
              </div>
              <div className="text-3xl font-extrabold text-grid-text">
                {kpis.districtsActive}
              </div>
            </div>
          </div>

          <div className="bg-grid-panel border border-grid-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-grid-deep/40 flex items-center justify-center">
              <Clock size={20} className="text-grid-cyan" />
            </div>
            <div>
              <div className="text-xs text-grid-dim uppercase tracking-wider">
                Última actualización
              </div>
              <div className="text-3xl font-extrabold text-grid-text">
                {kpis.lastUpdateText}
              </div>
            </div>
          </div>

          <div className="bg-grid-panel border border-grid-border rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-grid-deep/40 flex items-center justify-center">
              <Zap size={20} className="text-red-400" />
            </div>
            <div>
              <div className="text-xs text-grid-dim uppercase tracking-wider">
                Eventos por minuto
              </div>
              <div className="text-3xl font-extrabold text-grid-text">
                {kpis.eventsPerMin}
              </div>
            </div>
          </div>
        </section>

        <AutomatedInsights
          filteredRows={filteredRows}
          anomalies={anomalies}
          activeFilters={{
            isTimeFilter: Boolean(fromTs || toTs),
            summary: `Distrito: ${districtQuery || "Todos"} | Severidad: ${severityFilter}`,
          }}
        />
        <section className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl mb-8">
          <div className="flex items-center justify-between mb-6 border-b border-grid-border/50 pb-4 select-none">
            <div className="flex items-center gap-3">
              <Filter size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Filtros
              </h2>
            </div>

            {/* Botón dinámico: solo resalta si hay algún filtro modificado */}
            {(districtQuery ||
              severityFilter !== "ALL" ||
              sortConsumption !== "desc" ||
              fromTs ||
              toTs) && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-grid-cyan hover:text-grid-text bg-grid-cyan/10 hover:bg-grid-cyan/20 border border-grid-cyan/20 px-3 py-1.5 rounded-lg transition-all duration-200"
                title="Restablecer todos los parámetros de búsqueda"
              >
                <RotateCcw size={13} />
                <span>Limpiar Filtros</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4">
              <label className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                Búsqueda por distrito
              </label>
              <div className="mt-2 flex items-center gap-2 bg-grid-deep/40 border border-grid-border/40 rounded-xl px-3 py-2">
                <Search size={16} className="text-grid-dim" />
                <input
                  value={districtQuery}
                  onChange={(e) => setDistrictQuery(e.target.value)}
                  placeholder="Ej: Santa Ana"
                  className="w-full bg-transparent outline-none text-sm text-grid-text placeholder:text-grid-dim"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                Severidad
              </label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="mt-2 w-full bg-grid-deep/40 border border-grid-border/40 rounded-xl px-3 py-2 text-sm text-grid-text outline-none"
              >
                <option value="ALL">Todas</option>
                <option value="NORMAL">NORMAL</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                Orden consumo
              </label>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-2 bg-grid-deep/40 border border-grid-border/40 rounded-xl px-3 py-2 w-full">
                  <SortDesc size={16} className="text-grid-dim" />
                  <select
                    value={sortConsumption}
                    onChange={(e) => setSortConsumption(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm text-grid-text"
                  >
                    <option value="desc">Mayor → menor</option>
                    <option value="asc">Menor → mayor</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="text-xs font-bold uppercase tracking-widest text-grid-dim">
                Filtro de timestamps
              </label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="datetime-local"
                  value={fromTs}
                  onChange={(e) => setFromTs(e.target.value)}
                  className="bg-grid-deep/40 border border-grid-border/40 rounded-xl px-3 py-2 text-sm text-grid-text outline-none"
                />
                <input
                  type="datetime-local"
                  value={toTs}
                  onChange={(e) => setToTs(e.target.value)}
                  className="bg-grid-deep/40 border border-grid-border/40 rounded-xl px-3 py-2 text-sm text-grid-text outline-none"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl mb-8">
          <div className="flex items-center justify-between gap-4 mb-6 border-b border-grid-border/50 pb-4 select-none">
            <div className="flex items-center gap-3">
              <ShieldAlert size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Telemetría en vivo
              </h2>
            </div>

            {/* Contenedor Flex para la Insignia de conteo y el nuevo Botón PDF */}
            <div className="flex items-center gap-3">
              <button
                onClick={downloadPDFReport}
                disabled={filteredRows.length === 0}
                className="flex items-center gap-1.5 bg-grid-cyan/10 hover:bg-grid-cyan/20 border border-grid-cyan/30 disabled:opacity-40 disabled:cursor-not-allowed text-grid-cyan font-bold text-xs px-3 py-1.5 rounded-lg transition-all duration-200"
                title="Exportar contingencia operativa de filtros actuales"
              >
                <FileDown size={14} />
                <span>Exportar Reporte</span>
              </button>

              <div className="text-xs text-grid-dim font-mono-tech bg-grid-deep/40 px-2.5 py-1.5 rounded-lg border border-grid-border/30">
                Página {currentPage} de {totalPages} | {filteredRows.length} /{" "}
                {totalItems}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="text-xs text-grid-dim">
              Mostrando {filteredRows.length} registros en esta página.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage <= 1 || loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-grid-border/40 bg-grid-deep/40 px-3 py-2 text-xs font-bold text-grid-text transition-colors hover:bg-grid-blue/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Anterior
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                disabled={currentPage >= totalPages || loading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-grid-cyan/30 bg-grid-cyan/10 px-3 py-2 text-xs font-bold text-grid-cyan transition-colors hover:bg-grid-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div
            className="w-full max-h-125 overflow-y-auto overflow-x-auto pr-2
              scrollbar-thin scrollbar-thumb-grid-border scrollbar-track-transparent rounded-xl"
          >
            <table className="w-full border-separate border-spacing-y-2.5 text-left min-w-225">
              <thead className="sticky top-0 bg-grid-panel z-10 shadow-[0_2px_0_0_rgba(48,54,61,0.5)]">
                <tr className="text-xs font-bold uppercase tracking-widest text-grid-dim select-none">
                  <th className="px-5 pb-3 pt-1">timestamp</th>
                  <th className="px-5 pb-3 pt-1">district_id</th>
                  <th className="px-5 pb-3 pt-1">substation_id</th>
                  <th className="px-5 pb-3 pt-1">consumption_kw</th>
                  <th className="px-5 pb-3 pt-1">voltage</th>
                  <th className="px-5 pb-3 pt-1">frequency_hz</th>
                  <th className="px-5 pb-3 pt-1">status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => {
                  const meta = severityMeta[r.status] ?? severityMeta.CRITICAL;
                  const usage = clamp(
                    Number.isFinite(r.usagePct) ? r.usagePct : 100,
                    0,
                    100,
                  );

                  return (
                    <tr
                      key={r.id}
                      className="group bg-grid-deep/40 hover:bg-grid-blue/10 border border-grid-border transition-colors duration-200"
                    >
                      <td className="p-4 text-xs text-grid-dim font-mono-tech rounded-l-xl border-y border-l border-grid-border/40 group-hover:border-grid-blue/30">
                        {formatDateTime(r.timestampMs)}
                      </td>

                      <td className="p-4 text-sm text-grid-text font-semibold border-y border-grid-border/40 group-hover:border-grid-blue/30">
                        {r.districtId || "—"}
                      </td>

                      <td className="p-4 text-sm text-grid-dim font-medium border-y border-grid-border/40 group-hover:border-grid-blue/30">
                        {r.substationId || "—"}
                      </td>

                      <td className="p-4 text-sm border-y border-grid-border/40 group-hover:border-grid-blue/30">
                        <div className="flex items-center gap-3">
                          <span className="font-mono-tech font-bold text-grid-text">
                            {Number.isFinite(r.consumptionKw)
                              ? r.consumptionKw.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })
                              : "NaN"}
                          </span>
                          <div className="hidden lg:flex items-center gap-2">
                            <div className="w-20 h-2 rounded-full bg-grid-deep/60 border border-grid-border/40 overflow-hidden">
                              <div
                                className={`h-full ${meta.bar}`}
                                style={{ width: `${usage}%` }}
                              ></div>
                            </div>
                            <span
                              className={`text-xs font-mono-tech ${meta.icon}`}
                            >
                              {Number.isFinite(r.usagePct)
                                ? r.usagePct.toFixed(1)
                                : "—"}
                              %
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-sm border-y border-grid-border/40 group-hover:border-grid-blue/30">
                        <span className="font-mono-tech font-semibold text-grid-text">
                          {Number.isFinite(r.voltage)
                            ? r.voltage.toFixed(1)
                            : "—"}{" "}
                          V
                        </span>
                      </td>

                      <td className="p-4 text-sm border-y border-grid-border/40 group-hover:border-grid-blue/30">
                        <span className="font-mono-tech font-semibold text-grid-dim">
                          {Number.isFinite(r.frequencyHz)
                            ? r.frequencyHz.toFixed(2)
                            : "—"}{" "}
                          Hz
                        </span>
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
            {!loading && filteredRows.length === 0 && (
              <div className="text-sm text-grid-dim py-8 text-center select-none">
                Sin resultados de telemetría disponibles en este sector.
              </div>
            )}
          </div>
        </section>

        {/* Detección de anomalías */}
        <section className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
            <Bug size={20} className="text-grid-cyan" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
              Detección de anomalías
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-grid-text">
                  Timestamps inválidos
                </p>
                <span className="text-xs font-mono-tech text-grid-dim">
                  {anomalies.invalidTimestamps.length}
                </span>
              </div>
              <p className="text-xs text-grid-dim mt-1">
                Registros con formato de fecha no parseable.
              </p>
              <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-grid-border">
                {anomalies.invalidTimestamps.map((r) => (
                  <div
                    key={`ts-${r.id}`}
                    className="text-xs text-grid-dim font-mono-tech"
                  >
                    {safeText(r.districtId) || "—"} ·{" "}
                    {safeText(r.substationId) || "—"}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-grid-text">
                  Valores fuera de rango
                </p>
                <span className="text-xs font-mono-tech text-grid-dim">
                  {anomalies.outOfRange.length}
                </span>
              </div>
              <p className="text-xs text-grid-dim mt-1">
                Consumo/voltaje/frecuencia con valores inesperados.
              </p>
              <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-grid-border">
                {anomalies.outOfRange.map((r) => (
                  <div
                    key={`rng-${r.id}`}
                    className="text-xs text-grid-dim font-mono-tech"
                  >
                    {safeText(r.districtId) || "—"} ·{" "}
                    {Number.isFinite(r.consumptionKw)
                      ? r.consumptionKw.toFixed(2)
                      : "NaN"}
                    kW
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-grid-text">
                  Posibles SQL injections
                </p>
                <span className="text-xs font-mono-tech text-grid-dim">
                  {anomalies.sqlInjections.length}
                </span>
              </div>
              <p className="text-xs text-grid-dim mt-1">
                Cadenas sospechosas en distrito/subestación.
              </p>
              <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-grid-border">
                {anomalies.sqlInjections.map((r) => (
                  <div
                    key={`sql-${r.id}`}
                    className="text-xs text-grid-dim font-mono-tech"
                  >
                    {safeText(r.districtId) || "—"} ·{" "}
                    {safeText(r.substationId) || "—"}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-grid-deep/40 border border-grid-border/40 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-grid-text">
                  Datos corruptos
                </p>
                <span className="text-xs font-mono-tech text-grid-dim">
                  {anomalies.corrupt.length}
                </span>
              </div>
              <p className="text-xs text-grid-dim mt-1">
                Campos requeridos ausentes o tipos inválidos.
              </p>
              <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-grid-border">
                {anomalies.corrupt.map((r) => (
                  <div
                    key={`cor-${r.id}`}
                    className="text-xs text-grid-dim font-mono-tech"
                  >
                    {safeText(r.districtId) || "—"} ·{" "}
                    {safeText(r.substationId) || "—"}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 text-xs text-grid-dim">
            Estados visuales: <span className="text-emerald-300">NORMAL</span>,{" "}
            <span className="text-yellow-300">WARNING</span>,{" "}
            <span className="text-grid-danger">CRITICAL</span>.
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default TelemetryPage;
