import { useEffect, useState, useRef } from "react";
import { fetchSystemStatus } from "../services/api";

export const useSystemStatus = (refreshInterval = 5000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guardamos la función en una referencia para evitar ejecuciones fantasmas
  const loadRef = useRef();

  loadRef.current = async () => {
    try {
      const result = await fetchSystemStatus();
      setData(result);
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
    // 1. Ejecutamos la carga inicial inmediatamente
    loadRef.current();

    // 2. Creamos el intervalo controlado
    const interval = setInterval(() => {
      loadRef.current();
    }, refreshInterval);

    // ✨ LA SOLUCIÓN: Función de limpieza (Cleanup function)
    // Cuando el usuario cambie de página, React ejecutará esto y matará el setInterval
    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval]);

  return { data, loading, error };
};