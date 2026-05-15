import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, Zap, AlertTriangle, Map as MapIcon } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import TelemetryTable from "../components/telemetry/TelemetryTable";
import SantaAnaMap from "../components/map/SantaAnaMap";

const Dashboard = ({ data = [] }) => {
  // --- CÁLCULOS SEGUROS (Evitan el error .toFixed) ---
  const totalConsumption = useMemo(() => {
    if (!data || data.length === 0) return "0.00";
    const total = data.reduce(
      (acc, curr) => acc + (Number(curr.consumption_kw) || 0),
      0,
    );
    return total.toFixed(2);
  }, [data]);

  const alertCount = useMemo(() => {
    if (!data) return 0;
    return data.filter((d) => Number(d.consumption_kw) > 4750).length;
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Tomamos los últimos 15 registros y los ordenamos para la gráfica
    return [...data].slice(0, 15).reverse();
  }, [data]);

  // --- UI ---
  return (
    <MainLayout>
      {/* .dashboard-container -> Contenedor principal con paddings fluidos */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto select-none">
        {/* HEADER DEL DASHBOARD (.dashboard-header) */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-grid-text">
            EnergyGrid{" "}
            <span className="text-grid-cyan drop-shadow-[0_0_15px_rgba(47,177,255,0.4)]">
              Santa Ana
            </span>
          </h1>

          {/* .status-badge + .pulse-dot */}
          <div className="bg-grid-blue/10 px-4 py-2 rounded-lg border border-grid-blue flex items-center gap-2.5 text-xs font-bold text-grid-cyan tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            SISTEMA EN VIVO
          </div>
        </header>

        {/* SECCIÓN DE TARJETAS METRICAS (.kpi-grid + .kpi-card) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Carga Total */}
          <div className="bg-grid-panel p-6 rounded-xl border border-grid-border flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-grid-blue shadow-lg">
            <div className="p-2.5 rounded-lg bg-grid-cyan/10">
              <Zap size={24} className="text-grid-cyan" />
            </div>
            <div>
              <p className="text-xs text-grid-dim font-semibold uppercase tracking-wider">
                Carga Total Sistema
              </p>
              <h3 className="text-2xl font-bold mt-1">{totalConsumption} kW</h3>
            </div>
          </div>

          {/* Alertas Críticas */}
          <div className="bg-grid-panel p-6 rounded-xl border border-grid-border flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-grid-blue shadow-lg">
            <div
              className={`p-2.5 rounded-lg ${alertCount > 0 ? "bg-grid-danger/10" : "bg-grid-blue/10"}`}
            >
              <AlertTriangle
                size={24}
                className={
                  alertCount > 0 ? "text-grid-danger" : "text-grid-blue"
                }
              />
            </div>
            <div>
              <p className="text-xs text-grid-dim font-semibold uppercase tracking-wider">
                Alertas Críticas
              </p>
              <h3 className="text-2xl font-bold mt-1">{alertCount}</h3>
            </div>
          </div>

          {/* Distritos Monitoreados */}
          <div className="bg-grid-panel p-6 rounded-xl border border-grid-border flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-grid-blue shadow-lg">
            <div className="p-2.5 rounded-lg bg-grid-cyan/10">
              <Activity size={24} className="text-grid-cyan" />
            </div>
            <div>
              <p className="text-xs text-grid-dim font-semibold uppercase tracking-wider">
                Distritos Monitoreados
              </p>
              <h3 className="text-2xl font-bold mt-1">13</h3>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL: MAPA + GRÁFICA (.main-grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
          {/* PANELES TIPO GLASS: MAPA VISUAL */}
          <div className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
              <MapIcon size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Mapa de Carga - Sector Occidente
              </h2>
            </div>

            {/* .map-placeholder */}
            <div className="bg-grid-deep/30 rounded-xl border border-grid-border/40 overflow-hidden min-h-[340px] flex-1">
              <SantaAnaMap data={data} />
            </div>
          </div>

          {/* PANELES TIPO GLASS: GRÁFICA DE TENDENCIA */}
          <div className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
              <Activity size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Flujo de Energía (Real-Time)
              </h2>
            </div>

            <div className="w-full h-[320px] mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2fb1ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2fb1ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#161b22"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="substation_id"
                    stroke="#8b949e"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#8b949e"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161b22",
                      border: "1px solid #30363d",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "#2fb1ff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="consumption_kw"
                    stroke="#2fb1ff"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCons)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TABLA DE TELEMETRÍA (.glass-panel + .table-panel) */}
        <div className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
            <Activity size={20} className="text-grid-cyan" />{" "}
            <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
              Registro de Telemetría Reciente
            </h2>
          </div>
          <div className="w-full">
            <TelemetryTable data={data} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
