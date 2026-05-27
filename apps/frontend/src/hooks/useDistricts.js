import { useEffect, useRef, useState } from "react";

import { fetchDistricts, updateDistrictCapacity } from "../services/api";

export const useDistricts = (refreshInterval = 0) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDataRef = useRef();

  loadDataRef.current = async () => {
    try {
      const districts = await fetchDistricts();
      setData(Array.isArray(districts) ? districts : []);
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
    loadDataRef.current();

    if (!refreshInterval) return undefined;

    const interval = setInterval(() => {
      loadDataRef.current();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const saveDistrictCapacity = async (districtId, capacityMaxKw) => {
    const updated = await updateDistrictCapacity(districtId, capacityMaxKw);
    setData((current) =>
      current.map((district) =>
        district.id === updated.id ? updated : district,
      ),
    );
    return updated;
  };

  return {
    data,
    loading,
    error,
    reload: loadDataRef.current,
    saveDistrictCapacity,
  };
};
