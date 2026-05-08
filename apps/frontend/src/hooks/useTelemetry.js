import { useState, useEffect } from "react";
import { fetchTelemetry } from "../services/api";

export const useTelemetry = (refreshInterval = 5000) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      const telemetry = await fetchTelemetry();
      setData(telemetry);
      setError(null);
    } catch (err) {
      setError("Error conectando con el servidor", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(); // Carga inicial
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { data, loading, error };
};
