import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import MainLayout from "../components/layout/MainLayout";
import { useTelemetry } from "../hooks/useTelemetry";
import { useDistricts } from "../hooks/useDistricts";
import {
  fetchTelemetryAll,
  fetchTelemetryPeaks,
  normalizeTelemetryAllResponse,
} from "../services/api";
import {
  buildDistrictCapacityMap,
  getDistrictCapacityMaxKw,
  getUsagePct,
} from "../utils/districtCapacity";

const formatDateTime = (value) => {
  const ms = typeof value === "number" ? value : Date.parse(String(value));
  if (!Number.isFinite(ms)) return "Timestamp inválido";
  return new Date(ms).toLocaleString();
};

const formatKw = (value) =>
  Number.isFinite(value)
    ? Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "—";

const buildFallbackReasons = ({ row, averageKw, direction }) => {
  const valueKw = Number(row.consumptionKw);
  const capacityKw = Number(row.capacityKw);
  const usagePct =
    Number.isFinite(capacityKw) && capacityKw > 0
      ? (valueKw / capacityKw) * 100
      : NaN;
  const deltaKw =
    direction === "highest" ? valueKw - averageKw : averageKw - valueKw;
  const deltaPct =
    Number.isFinite(averageKw) && averageKw > 0
      ? (Math.abs(deltaKw) / averageKw) * 100
      : NaN;
  const districtName = row.districtName || row.districtId || "distrito";

  const reasons = [
    direction === "highest"
      ? `Es el mayor consumo del histórico analizado: ${formatKw(valueKw)} kW.`
      : `Es el menor consumo del histórico analizado: ${formatKw(valueKw)} kW.`,
  ];
  const causes = [];

  if (Number.isFinite(averageKw) && averageKw > 0) {
    reasons.push(
      direction === "highest"
        ? `Supera el promedio general (${formatKw(averageKw)} kW) por ${formatKw(deltaKw)} kW (${formatKw(deltaPct)}%).`
        : `Está por debajo del promedio general (${formatKw(averageKw)} kW) en ${formatKw(deltaKw)} kW (${formatKw(deltaPct)}%).`,
    );
  }

  if (Number.isFinite(usagePct)) {
    reasons.push(
      `En ${districtName} representa el ${formatKw(usagePct)}% de su capacidad máxima (${formatKw(capacityKw)} kW).`,
    );
  }

  if (direction === "highest") {
    causes.push("Posible sobrecarga por uso intensivo de la red en esta zona.");
    if (Number.isFinite(usagePct) && usagePct >= 95) {
      causes.push(
        "Posibles nuevas conexiones, urbanización reciente o ampliación de carga.",
      );
    }
    if (Number.isFinite(deltaPct) && deltaPct >= 25) {
      causes.push(
        "Revisar fugas de electricidad, equipos dañados o consumos anómalos.",
      );
    }
    if (Number.isFinite(deltaPct) && deltaPct >= 15) {
      causes.push(
        "El clima extremo o el uso simultáneo de equipos de alto consumo podría estar elevando la carga.",
      );
    }
  } else {
    causes.push(
      "Caída inusual de consumo que puede indicar desconexión, baja demanda o falla operativa.",
    );
    if (Number.isFinite(usagePct) && usagePct <= 20) {
      causes.push(
        "Verificar posible robo de energía, medidor detenido o cortes parciales en el sector.",
      );
    }
    if (Number.isFinite(deltaPct) && deltaPct >= 25) {
      causes.push(
        "Puede existir un equipo principal apagado, una interrupción local o una reducción fuerte de actividad.",
      );
    }
    causes.push(
      "También conviene revisar si la zona quedó sin carga por obras, mantenimiento o cambios en el horario de uso.",
    );
  }

  const recommendation =
    direction === "highest"
      ? "Recomendar inspección en campo, revisar medición, transformador y cableado, y vigilar la zona por posibles nuevas cargas."
      : "Recomendar visita técnica y verificar medidores, alimentación y continuidad del servicio en la zona.";

  return { reasons, causes, recommendation };
};

const buildPeakInsights = (rows = []) => {
  if (!rows.length) {
    return {
      generatedAt: new Date().toISOString(),
      count: 0,
      averageKw: null,
      highest: null,
      lowest: null,
    };
  }

  const averageKw =
    rows.reduce((sum, row) => sum + Number(row.consumptionKw), 0) / rows.length;

  const highest = rows.reduce((current, row) => {
    if (!current || row.consumptionKw > current.consumptionKw) return row;
    return current;
  }, null);

  const lowest = rows.reduce((current, row) => {
    if (!current || row.consumptionKw < current.consumptionKw) return row;
    return current;
  }, null);

  return {
    generatedAt: new Date().toISOString(),
    count: rows.length,
    averageKw,
    highest: {
      ...highest,
      ...buildFallbackReasons({
        row: highest,
        averageKw,
        direction: "highest",
      }),
    },
    lowest: {
      ...lowest,
      ...buildFallbackReasons({
        row: lowest,
        averageKw,
        direction: "lowest",
      }),
    },
  };
};

const TelemetryPeaksPage = () => {
  const { data: telemetryData, loading } = useTelemetry(5000, { all: true });
  const { data: districts } = useDistricts();
  const [peakInsights, setPeakInsights] = useState(null);
  const [peakInsightsLoading, setPeakInsightsLoading] = useState(true);
  const [showHighestDetails, setShowHighestDetails] = useState(false);
  const [showLowestDetails, setShowLowestDetails] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPeakInsights = async () => {
      try {
        const data = await fetchTelemetryPeaks();
        if (!isMounted) return;
        setPeakInsights(data);
      } catch {
        try {
          const telemetry = await fetchTelemetryAll();
          if (!isMounted) return;

          const fallbackRows = normalizeTelemetryAllResponse(telemetry)
            .data.map((row, index) => ({
              id:
                row?.id ??
                `${row?.district_id ?? ""}-${row?.substation_id ?? ""}-${row?.timestamp ?? index}`,
              districtId: row?.district_id ?? "",
              districtName:
                row?.district_name ?? row?.districtId ?? row?.district_id ?? "",
              substationId: row?.substation_id ?? "",
              consumptionKw: Number(row?.consumption_kw),
              timestamp: row?.timestamp,
              capacityKw: Number(row?.district_capacity_kw),
            }))
            .filter((row) => Number.isFinite(row.consumptionKw));

          setPeakInsights(buildPeakInsights(fallbackRows));
        } catch {
          if (!isMounted) return;
          setPeakInsights(buildPeakInsights([]));
        }
      } finally {
        if (isMounted) setPeakInsightsLoading(false);
      }
    };

    loadPeakInsights();
    const interval = setInterval(loadPeakInsights, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const districtCapacities = useMemo(
    () => buildDistrictCapacityMap(districts),
    [districts],
  );

  const districtNameMap = useMemo(
    () =>
      new Map(
        (districts || []).map((district) => [
          String(district?.id ?? district?.district_id ?? ""),
          district?.name || district?.district_name || district?.id || "",
        ]),
      ),
    [districts],
  );

  const chartRowsAll = useMemo(() => {
    if (!Array.isArray(telemetryData)) return [];

    return telemetryData
      .map((row, index) => {
        const districtId = row?.district_id ?? "";
        const substationId = row?.substation_id ?? "";
        const consumptionKw = Number(row?.consumption_kw);
        const timestampMs = row?.timestamp
          ? Date.parse(String(row.timestamp))
          : NaN;
        const capacityKw = getDistrictCapacityMaxKw(
          districtId,
          districtCapacities,
        );
        const usagePct = getUsagePct(consumptionKw, capacityKw);

        return {
          id:
            row?.id ??
            `${districtId}-${substationId}-${row?.timestamp ?? index}`,
          districtId,
          substationId,
          consumptionKw,
          timestampMs,
          capacityKw,
          usagePct,
          chartTimeLabel: formatDateTime(timestampMs),
        };
      })
      .filter(
        (row) =>
          Number.isFinite(row.consumptionKw) &&
          Number.isFinite(row.timestampMs),
      )
      .sort((a, b) => a.timestampMs - b.timestampMs)
      .map((row, index) => ({
        ...row,
        chartIndex: index + 1,
      }));
  }, [telemetryData, districtCapacities]);

  const recentRows = useMemo(() => {
    if (!chartRowsAll.length) return [];
    return chartRowsAll.slice(-30);
  }, [chartRowsAll]);

  const peakSummary = useMemo(() => {
    if (!recentRows.length) return { highest: null, lowest: null };

    const highest = recentRows.reduce((current, row) => {
      if (!current || row.consumptionKw > current.consumptionKw) return row;
      return current;
    }, null);

    const lowest = recentRows.reduce((current, row) => {
      if (!current || row.consumptionKw < current.consumptionKw) return row;
      return current;
    }, null);

    return { highest, lowest };
  }, [recentRows]);

  const chartRows = useMemo(() => {
    return recentRows.map((row, index) => ({
      ...row,
      chartIndex: index + 1,
    }));
  }, [recentRows]);

  const riskDistricts = useMemo(() => {
    if (!chartRowsAll.length) return [];

    const latestByDistrict = new Map();

    for (const row of chartRowsAll) {
      if (!row.districtId) continue;
      latestByDistrict.set(row.districtId, row);
    }

    return [...latestByDistrict.values()]
      .map((row) => {
        const districtName =
          districtNameMap.get(row.districtId) || row.districtId || "—";
        const usagePct = Number.isFinite(row.usagePct)
          ? row.usagePct
          : getUsagePct(row.consumptionKw, row.capacityKw);
        const riskLevel =
          usagePct >= 95 ? "critical" : usagePct >= 80 ? "warning" : null;

        return {
          ...row,
          districtName,
          usagePct,
          riskLevel,
        };
      })
      .filter((row) => row.riskLevel)
      .sort((a, b) => b.usagePct - a.usagePct);
  }, [chartRowsAll, districtNameMap]);

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-400 mx-auto">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-grid-text">
              Picos de Telemetría
            </h1>
            <p className="text-sm sm:text-base text-grid-dim mt-1 max-w-2xl">
              Vista enfocada en los extremos de consumo. El gráfico muestra los
              últimos 30 puntos visibles y mantiene marcado el valor más alto y
              el más bajo del historial cargado.
            </p>
          </div>
          <div className="bg-grid-blue/10 px-4 py-2 rounded-lg border border-grid-blue flex items-center gap-2.5 text-xs font-bold text-grid-cyan tracking-wider select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            {loading || peakInsightsLoading ? "CARGANDO" : "EN VIVO"}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2 bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl min-h-120">
            <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
              <Activity size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Consumo reciente
              </h2>
            </div>

            <div className="w-full h-104">
              {chartRows.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartRows}
                    margin={{ top: 20, right: 20, left: 0, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient
                        id="telemetryConsumptionFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2fb1ff"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#2fb1ff"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#161b22"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="chartIndex"
                      stroke="#8b949e"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `#${value}`}
                    />
                    <YAxis
                      stroke="#8b949e"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#161b22",
                        border: "1px solid #30363d",
                        borderRadius: "8px",
                      }}
                      labelFormatter={(label) => `Punto #${label}`}
                      formatter={(value) => [
                        `${Number(value).toLocaleString()} kW`,
                        "Consumo",
                      ]}
                      labelStyle={{ color: "#c9d1d9" }}
                      itemStyle={{ color: "#2fb1ff" }}
                      cursor={{ stroke: "#2fb1ff", strokeDasharray: "4 4" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="consumptionKw"
                      stroke="#2fb1ff"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#telemetryConsumptionFill)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full min-h-72 flex items-center justify-center text-center text-grid-dim border border-dashed border-grid-border/40 rounded-xl bg-grid-deep/20 px-6">
                  No hay datos suficientes para mostrar picos.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-grid-cyan/30 bg-grid-cyan/10 p-4 shadow-lg shadow-grid-cyan/5">
              <div className="flex items-center justify-between gap-3 text-grid-cyan text-xs uppercase tracking-[0.25em] font-bold">
                <div className="flex items-center gap-2">
                  <ArrowUpWideNarrow size={14} />
                  Pico más alto
                </div>
                <button
                  type="button"
                  onClick={() => setShowHighestDetails((value) => !value)}
                  className="inline-flex items-center gap-1 rounded-full border border-grid-cyan/30 bg-grid-deep/30 px-3 py-1 text-[11px] tracking-[0.2em] text-grid-text hover:bg-grid-deep/50 transition-colors"
                >
                  <span>Detalle</span>
                  {showHighestDetails ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
              </div>
              {peakSummary.highest ? (
                <div className="mt-3 space-y-2">
                  <h3 className="text-3xl font-extrabold text-grid-text font-mono-tech">
                    {peakSummary.highest.consumptionKw.toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 2,
                      },
                    )}{" "}
                    kW
                  </h3>
                  <p className="text-sm text-grid-dim">
                    {peakSummary.highest.districtId || "—"} ·{" "}
                    {peakSummary.highest.substationId || "—"}
                  </p>
                  <p className="text-xs text-grid-dim font-mono-tech">
                    {peakSummary.highest.chartTimeLabel}
                  </p>
                  {showHighestDetails && (
                    <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-300 font-bold">
                        Motivos y revisión
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-grid-text list-disc list-inside">
                        {(peakInsights?.highest?.causes?.length
                          ? peakInsights.highest.causes
                          : [
                              "Posible sobrecarga por uso intensivo de la red en esta zona.",
                              "Revisar fugas de electricidad, equipos dañados o cargas nuevas conectadas.",
                            ]
                        ).map((reason) => (
                          <li key={`highest-${reason}`}>{reason}</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-amber-200/80">
                        {peakInsights?.highest?.recommendation ||
                          "Recomendar inspección en campo y revisar medición, transformador y cableado."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-grid-dim">Sin datos.</p>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between gap-3 text-emerald-300 text-xs uppercase tracking-[0.25em] font-bold">
                <div className="flex items-center gap-2">
                  <ArrowDownWideNarrow size={14} />
                  Pico más bajo
                </div>
                <button
                  type="button"
                  onClick={() => setShowLowestDetails((value) => !value)}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-grid-deep/30 px-3 py-1 text-[11px] tracking-[0.2em] text-grid-text hover:bg-grid-deep/50 transition-colors"
                >
                  <span>Detalle</span>
                  {showLowestDetails ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
              </div>
              {peakSummary.lowest ? (
                <div className="mt-3 space-y-2">
                  <h3 className="text-3xl font-extrabold text-grid-text font-mono-tech">
                    {peakSummary.lowest.consumptionKw.toLocaleString(
                      undefined,
                      {
                        maximumFractionDigits: 2,
                      },
                    )}{" "}
                    kW
                  </h3>
                  <p className="text-sm text-grid-dim">
                    {peakSummary.lowest.districtId || "—"} ·{" "}
                    {peakSummary.lowest.substationId || "—"}
                  </p>
                  <p className="text-xs text-grid-dim font-mono-tech">
                    {peakSummary.lowest.chartTimeLabel}
                  </p>
                  {showLowestDetails && (
                    <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300 font-bold">
                        Motivos y revisión
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-grid-text list-disc list-inside">
                        {(peakInsights?.lowest?.causes?.length
                          ? peakInsights.lowest.causes
                          : [
                              "Caída inusual de consumo que puede indicar desconexión, baja demanda o falla operativa.",
                              "Verificar posible robo de energía, medidor detenido o cortes parciales en el sector.",
                            ]
                        ).map((reason) => (
                          <li key={`lowest-${reason}`}>{reason}</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-emerald-200/80">
                        {peakInsights?.lowest?.recommendation ||
                          "Recomendar visita técnica y verificar medidores, alimentación y continuidad del servicio."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-grid-dim">Sin datos.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-grid-border bg-grid-panel p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold uppercase tracking-[0.25em] text-grid-text">
                Distritos en riesgo⚠️
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-grid-dim max-w-2xl">
                Se muestran los distritos que están actualmente sobre 80%.
              </p>
            </div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-grid-dim bg-grid-deep/40 border border-grid-border/40 rounded-full px-2 py-1.5">
              <span className="text-yellow-300">Alto</span> &gt; 80% ·{" "}
              <span className="text-red-700">Crítico</span> &gt; 95%
            </div>
          </div>

          {riskDistricts.length > 0 ? (
            <div className="max-h-80 overflow-y-auto overflow-x-hidden rounded-xl border border-grid-border/40 scrollbar-thin scrollbar-thumb-grid-border scrollbar-track-transparent">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-grid-deep/70 backdrop-blur-sm">
                  <tr className="text-xs uppercase tracking-widest text-grid-dim">
                    <th className="px-4 py-3">Distrito</th>
                    <th className="px-4 py-3">Uso</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {riskDistricts.map((district) => {
                    const badgeClass =
                      district.riskLevel === "critical"
                        ? "border-red-400/30 bg-red-500/10 text-red-300"
                        : "border-amber-400/30 bg-amber-500/10 text-amber-200";

                    return (
                      <tr
                        key={district.districtId}
                        className="border-t border-grid-border/40 bg-grid-deep/20"
                      >
                        <td className="px-4 py-3 text-sm text-grid-text font-semibold">
                          {district.districtName}
                        </td>
                        <td className="px-4 py-3 text-sm text-grid-text font-mono-tech">
                          {district.usagePct.toFixed(0)}%
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] ${badgeClass}`}
                          >
                            {district.riskLevel === "critical"
                              ? "Critico"
                              : "Alerta"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-grid-border/40 bg-grid-deep/20 p-4 text-sm text-grid-dim">
              No hay distritos por encima del 80% en este momento.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TelemetryPeaksPage;
