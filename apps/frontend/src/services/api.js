import axios from "axios";

// Leemos de Railway en producción, o usamos localhost en desarrollo
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL || "http://localhost:3001/api";

export const login = async ({ email, password }) => {
  const response = await axios.post(`${AUTH_API_URL}/auth/login`, {
    email,
    password,
  });
  return response.data;
};

export const fetchCurrentUser = async (token) => {
  const response = await axios.get(`${AUTH_API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const fetchTelemetry = async () => {
  const response = await axios.get(`${API_URL}/telemetry`);
  return response.data;
};

export const fetchTelemetryAll = async () => {
  const response = await axios.get(`${API_URL}/telemetry/all`);
  return response.data;
};

export const fetchSystemStatus = async () => {
  const response = await axios.get(`${API_URL}/system/status`);
  return response.data;
};

export const fetchDistricts = async () => {
  const response = await axios.get(`${API_URL}/districts`);
  return response.data;
};

export const updateDistrictCapacity = async (districtId, capacityMaxKw) => {
  const response = await axios.put(`${API_URL}/districts/${districtId}`, {
    capacity_max_kw: capacityMaxKw,
  });
  return response.data;
};

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const fetchAdminUsers = async (token) => {
  const response = await axios.get(`${AUTH_API_URL}/auth/admin/users`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
};

export const createAdminUser = async (token, payload) => {
  const response = await axios.post(
    `${AUTH_API_URL}/auth/admin/users`,
    payload,
    {
      headers: getAuthHeaders(token),
    },
  );
  return response.data;
};

export const updateAdminUser = async (token, userId, payload) => {
  const response = await axios.put(
    `${AUTH_API_URL}/auth/admin/users/${userId}`,
    payload,
    {
      headers: getAuthHeaders(token),
    },
  );
  return response.data;
};

export const updateAdminUserStatus = async (token, userId, is_active) => {
  const response = await axios.patch(
    `${AUTH_API_URL}/auth/admin/users/${userId}/status`,
    { is_active },
    {
      headers: getAuthHeaders(token),
    },
  );
  return response.data;
};
