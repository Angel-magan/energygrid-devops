import { useState, useEffect } from "react";
import {
  fetchTelemetry,
  fetchTelemetryAll,
  normalizeTelemetryAllResponse,
} from "../services/api";

export const useTelemetry = (refreshInterval = 5000, options = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMode = options?.all ? "all" : "latest";
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const telemetry = await (options && options.all
          ? fetchTelemetryAll({ page, limit })
          : fetchTelemetry());

        if (!isMounted) return;

        if (options && options.all) {
          const normalized = normalizeTelemetryAllResponse(telemetry);
          setData(normalized.data);
          setPagination(normalized.pagination);
        } else {
          setData(
            Array.isArray(telemetry) ? telemetry : (telemetry?.data ?? []),
          );
          setPagination(null);
        }
        setError(null);
      } catch (err) {
        if (!isMounted) return;

        const message =
          err?.response?.data?.error ||
          err?.message ||
          "Error conectando con el servidor";
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    const interval = setInterval(loadData, refreshInterval);

    // ✨ Tu limpieza para que la consola no explote al cambiar de página
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshInterval, fetchMode, page, limit]);

  return { data, pagination, loading, error };
};
