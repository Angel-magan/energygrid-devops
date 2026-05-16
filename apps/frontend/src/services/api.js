import axios from "axios";

const API_URL = "http://localhost:3000/api";

export const fetchTelemetry = async () => {
  const response = await axios.get(`${API_URL}/telemetry`);
  return response.data;
};

export const fetchSystemStatus = async () => {
  const response = await axios.get(`${API_URL}/system/status`);
  return response.data;
};
