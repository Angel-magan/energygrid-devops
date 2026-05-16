import { useEffect, useState } from "react";
import { fetchSystemStatus } from "../services/api";

export const useSystemStatus = (refreshInterval = 5000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { data, loading, error };
};
