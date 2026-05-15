// import { useTelemetry } from "./hooks/useTelemetry";
// import DashboardPage from "./pages/DashboardPage";

// function App() {
//   // Mantenemos tu hook que ya funciona perfectamente
//   const { data, loading, error } = useTelemetry(5000);

//   return (
//     <div className="bg-grid-deep min-h-screen text-grid-text font-sans antialiased flex flex-col justify-center">
//       {/* PANTALLA DE ERROR ESTILIZADA */}
//       {error && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-grid-deep/80 backdrop-blur-md p-4">
//           <div className="bg-grid-panel border border-grid-danger/30 rounded-2xl p-6 max-w-md w-full text-center shadow-2xl shadow-grid-danger/5">
//             <div className="w-12 h-12 rounded-full bg-grid-danger/10 text-grid-danger flex items-center justify-center mx-auto mb-4 border border-grid-danger/20 text-xl font-bold animate-bounce">
//               ⚠️
//             </div>
//             <h2 className="text-grid-text font-bold text-lg mb-2 uppercase tracking-wider">
//               Error de Conexión
//             </h2>
//             <p className="text-grid-dim text-sm font-mono-tech bg-grid-deep/50 p-3 rounded-lg border border-grid-border/40">
//               {error}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* PANTALLA DE CARGA (LOADER INDUSTRIAL) */}
//       {loading && data.length === 0 ? (
//         <div className="flex flex-col items-center justify-center gap-4 p-6 flex-1">
//           {/* Spinner tecnológico en cian */}
//           <div className="relative w-12 h-12">
//             <div className="absolute inset-0 rounded-full border-4 border-grid-blue/30"></div>
//             <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-grid-cyan animate-spin shadow-[0_0_15px_rgba(47,177,255,0.4)]"></div>
//           </div>
//           <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-grid-cyan animate-pulse uppercase">
//             Cargando telemetría en tiempo real...
//           </div>
//         </div>
//       ) : (
//         /* PÁGINA PRINCIPAL DEL DASHBOARD */
//         <DashboardPage data={data} />
//       )}
//     </div>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { useTelemetry } from "./hooks/useTelemetry";

import DashboardPage from "./pages/DashboardPage";
import AlertsPage from "./pages/AlertsPage";
import TelemetryPage from "./pages/TelemetryPage";
import SystemStatusPage from "./pages/SystemStatusPage";

function App() {
  const { data } = useTelemetry(5000);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage data={data} />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/telemetry" element={<TelemetryPage />} />
        <Route path="/system" element={<SystemStatusPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
