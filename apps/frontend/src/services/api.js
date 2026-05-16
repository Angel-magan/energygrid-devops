import axios from "axios";

const API_URL = "http://localhost:3000/api";
const AUTH_API_URL = "http://localhost:3001/api";

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

export const fetchSystemStatus = async () => {
  const response = await axios.get(`${API_URL}/system/status`);
  return response.data;
};
