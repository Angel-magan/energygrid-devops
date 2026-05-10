import { useTelemetry } from "./hooks/useTelemetry";
import Dashboard from "./components/Dashboard"; // Importamos el nuevo Dashboard
import "./App.css";

function App() {
  // Mantenemos tu hook que ya funciona perfectamente
  const { data, loading, error } = useTelemetry(5000);

  return (
    <>
      {/* 
         Si el error existe, lo mostramos arriba. 
         Si está cargando por primera vez, mostramos el loader.
         Si hay datos, renderizamos el Dashboard completo.
      */}
      
      {error && <div className="error-msg" style={{color: 'red', textAlign: 'center'}}>{error}</div>}

      {loading && data.length === 0 ? (
        <div className="loader">Cargando telemetría...</div>
      ) : (
        <Dashboard data={data} />
      )}
    </>
  );
}

export default App;