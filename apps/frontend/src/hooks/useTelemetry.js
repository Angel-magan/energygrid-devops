import { useState, useEffect, useRef } from "react";
import { fetchTelemetry, fetchTelemetryAll } from "../services/api";

export const useTelemetry = (refreshInterval = 5000, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDataRef = useRef();

  loadDataRef.current = async () => {
    try {
      // Mantiene la lógica de tus compañeros para decidir qué API llamar
      const telemetry = await (options && options.all
        ? fetchTelemetryAll()
        : fetchTelemetry());
      setData(telemetry);
      setError(null);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Error conectando con el servidor";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Tu carga inicial inmediata optimizada
    loadDataRef.current();

    // 2. Tu temporizador seguro que evita peticiones dobles
    const interval = setInterval(() => {
      loadDataRef.current();
    }, refreshInterval);

    // ✨ Tu limpieza para que la consola no explote al cambiar de página
    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval]);

  return { data, loading, error };
};