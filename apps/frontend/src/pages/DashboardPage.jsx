import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  Zap,
  AlertTriangle,
  Map as MapIcon,
  LoaderCircle,
} from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import TelemetryTable from "../components/telemetry/TelemetryTable";
import SantaAnaMap from "../components/map/SantaAnaMap";
import { isSuspiciousString } from "../utils/sanitizers";
import { useTelemetry } from "../hooks/useTelemetry"; // 👈 Asegúrate de que la ruta apunte a tus hooks

const Dashboard = () => {
  // ⚡ El Dashboard ahora se conecta al hook optimizado de 5 segundos de forma autónoma
  const { data: telemetryData, loading } = useTelemetry(5000);

  // Re-mapeamos la variable interna de datos de forma segura
  const data = telemetryData || [];

  // Filtrar filas sospechosas para el dashboard (mapa/recomendaciones/tabla)
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(
      (r) =>
        !isSuspiciousString(r?.district_id) &&
        !isSuspiciousString(r?.substation_id),
    );
  }, [data]);

  // --- CÁLCULOS SEGUROS (Evitan el error .toFixed) ---
  const totalConsumption = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return "0.00";
    const total = filteredData.reduce(
      (acc, curr) => acc + (Number(curr.consumption_kw) || 0),
      0,
    );
    return total.toFixed(2);
  }, [filteredData]);

  const alertCount = useMemo(() => {
    if (!filteredData) return 0;
    return filteredData.filter((d) => Number(d.consumption_kw) > 4750).length;
  }, [filteredData]);

  const chartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    // Tomamos los últimos 15 registros y los ordenamos para la gráfica
    return [...filteredData].slice(0, 15).reverse();
  }, [filteredData]);

  const districtsCount = useMemo(() => {
    if (!filteredData) return 0;
    const set = new Set(
      filteredData.map((r) => String(r.district_id || "")).filter(Boolean),
    );
    return set.size;
  }, [filteredData]);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-350 mx-auto select-none min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="w-full max-w-2xl rounded-3xl border border-grid-border bg-grid-panel/80 backdrop-blur-xl shadow-2xl p-8 sm:p-10">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-grid-cyan/20 blur-xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-grid-cyan/40 bg-grid-deep/70">
                  <LoaderCircle
                    size={34}
                    className="text-grid-cyan animate-spin"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-grid-dim">
                  Cargando telemetría
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-grid-text">
                  EnergyGrid SV
                </h1>
                <p className="text-sm text-grid-dim max-w-md mx-auto">
                  Estamos consultando los datos en tiempo real para preparar el
                  tablero.
                </p>
              </div>
              <div className="w-full space-y-3 pt-2">
                <div className="h-4 rounded-full bg-grid-border/60 overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-linear-to-r from-grid-cyan via-sky-400 to-grid-blue animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-24 rounded-2xl border border-grid-border bg-grid-deep/60 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-350 mx-auto select-none">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-grid-text">
            EnergyGrid{" "}
            <span className="text-grid-cyan drop-shadow-[0_0_15px_rgba(47,177,255,0.4)]">
              SV
            </span>
          </h1>
          <div className="bg-grid-blue/10 px-4 py-2 rounded-lg border border-grid-blue flex items-center gap-2.5 text-xs font-bold text-grid-cyan tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
            SISTEMA EN VIVO
          </div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
          <div className="bg-grid-panel p-6 rounded-xl border border-grid-border flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-grid-blue shadow-lg">
            <div className="p-2.5 rounded-lg bg-grid-cyan/10">
              <Activity size={24} className="text-grid-cyan" />
            </div>
            <div>
              <p className="text-xs text-grid-dim font-semibold uppercase tracking-wider">
                Distritos Monitoreados
              </p>
              <h3 className="text-2xl font-bold mt-1">{districtsCount}</h3>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
          <div className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
              <MapIcon size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Mapa de Carga - Sector Occidente
              </h2>
            </div>
            <div className="bg-grid-deep/30 rounded-xl border border-grid-border/40 overflow-hidden min-h-85 flex-1">
              <SantaAnaMap data={filteredData} />
            </div>
          </div>
          <div className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl flex flex-col">
            <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
              <Activity size={20} className="text-grid-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
                Flujo de Energía (Real-Time)
              </h2>
            </div>

            <div className="w-full h-80 mt-auto">
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

        <div className="bg-grid-panel border border-grid-border rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-grid-border/50 pb-4">
            <Activity size={20} className="text-grid-cyan" />{" "}
            <h2 className="text-sm font-semibold uppercase tracking-wider text-grid-dim">
              Registro de Telemetría Reciente
            </h2>
          </div>
          <div
            className="w-full max-h-100 overflow-y-auto overflow-x-auto pr-2
              scrollbar-thin scrollbar-thumb-grid-border scrollbar-track-transparent"
          >
            <TelemetryTable data={filteredData} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
