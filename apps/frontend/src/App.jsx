import { BrowserRouter, Routes, Route } from "react-router-dom";

import { useTelemetry } from "./hooks/useTelemetry";

import DashboardPage from "./pages/DashboardPage";
import AlertsPage from "./pages/AlertsPage";
import TelemetryPage from "./pages/TelemetryPage";
import SystemStatusPage from "./pages/SystemStatusPage";

function App() {
  const { data, loading } = useTelemetry(5000);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<DashboardPage data={data} loading={loading} />}
        />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/telemetry" element={<TelemetryPage />} />
        <Route path="/system" element={<SystemStatusPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
