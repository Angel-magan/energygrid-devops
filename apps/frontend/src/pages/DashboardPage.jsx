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
import "../styles/Dashboard.css";

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
      <div className="dashboard-container">
        {/* HEADER */}
        <header className="dashboard-header">
          <h1>
            EnergyGrid <span className="text-purple">Santa Ana</span>
          </h1>
          <div className="status-badge">
            <div className="pulse-dot"></div>
            SISTEMA EN VIVO
          </div>
        </header>

        {/* KPI CARDS */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <Zap size={24} color="#2fb1ff" />
            <div>
              <p>Carga Total Sistema</p>
              <h3>{totalConsumption} kW</h3>
            </div>
          </div>
          <div className="kpi-card">
            <AlertTriangle
              size={24}
              color={alertCount > 0 ? "#f85149" : "#305575"}
            />
            <div>
              <p>Alertas Críticas</p>
              <h3>{alertCount}</h3>
            </div>
          </div>
          <div className="kpi-card">
            <Activity size={24} color="#2fb1ff" />
            <div>
              <p>Distritos Monitoreados</p>
              <h3>13</h3>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="main-grid">
          {/* MAPA VISUAL */}
          {/* MAPA VISUAL DINÁMICO */}
          <div className="glass-panel map-panel">
            <div className="panel-header">
              <MapIcon size={20} /> <h2>Mapa de Carga - Sector Occidente</h2>
            </div>
            <div
              className="map-placeholder"
              style={{ padding: 0, height: "100%", minHeight: "300px" }}
            >
              <SantaAnaMap data={data} />
            </div>
          </div>

          {/* GRÁFICA DE TENDENCIA */}
          <div className="glass-panel chart-panel">
            <div className="panel-header">
              <Activity size={24} color="#2fb1ff" />{" "}
              <h2>Flujo de Energía (Real-Time)</h2>
            </div>
            <div style={{ width: "100%", height: "300px", minHeight: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                      {/* El color de arriba es tu cian con opacidad */}
                      <stop offset="5%" stopColor="#2fb1ff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2fb1ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#222"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="substation_id"
                    stroke="#555"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#555"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161b22",
                      border: "1px solid #30363d",
                      borderRadius: "8px",
                      color: "#f0f6fc",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="consumption_kw"
                    stroke="#2fb1ff" /* Línea cian */
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCons)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TABLA DE TELEMETRÍA */}
        <div className="glass-panel table-panel">
          <div className="panel-header">
            <Activity size={24} color="#2fb1ff" />{" "}
            <h2>Registro de Telemetría Reciente</h2>
          </div>
          <TelemetryTable data={data} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
