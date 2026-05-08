import { useTelemetry } from "./hooks/useTelemetry";
import TelemetryTable from "./components/TelemetryTable";
import "./App.css";

function App() {
  const { data, loading, error } = useTelemetry(5000);

  return (
    <div className="dashboard">
      <header>
        <h1>EnergyGrid Dashboard</h1>
        <div className="status-badge">Live Monitoring</div>
      </header>

      {error && <div className="error-msg">{error}</div>}

      {loading ? (
        <div className="loader">Cargando telemetría...</div>
      ) : (
        <TelemetryTable data={data} />
      )}
    </div>
  );
}

export default App;
