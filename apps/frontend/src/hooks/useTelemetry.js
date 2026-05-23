import { useState, useEffect, useRef } from "react";
import { fetchTelemetry } from "../services/api";

export const useTelemetry = (refreshInterval = 5000) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDataRef = useRef();

  loadDataRef.current = async () => {
    try {
      const telemetry = await fetchTelemetry();
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
    // 1. Carga inicial inmediata
    loadDataRef.current();

    // 2. Iniciamos el temporizador seguro
    const interval = setInterval(() => {
      loadDataRef.current();
    }, refreshInterval);

    // ✨ LA SOLUCIÓN: Limpiamos el intervalo al desmontar el componente
    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval]);

  return { data, loading, error };
};