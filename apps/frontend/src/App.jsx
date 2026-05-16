import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import { useTelemetry } from "./hooks/useTelemetry";

import DashboardPage from "./pages/DashboardPage";
import AlertsPage from "./pages/AlertsPage";
import TelemetryPage from "./pages/TelemetryPage";
import SystemStatusPage from "./pages/SystemStatusPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { fetchCurrentUser } from "./services/api";

const DashboardRoute = () => {
  const { data } = useTelemetry(5000);
  return <DashboardPage data={data} />;
};

function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("eg_auth_token");
    const storedUser = localStorage.getItem("eg_auth_user");

    if (!token || !storedUser) return null;

    try {
      return { token, user: JSON.parse(storedUser) };
    } catch (err) {
      localStorage.removeItem("eg_auth_token");
      localStorage.removeItem("eg_auth_user");
      return null;
    }
  });

  useEffect(() => {
    if (!auth?.token) return;

    fetchCurrentUser(auth.token).catch(() => {
      localStorage.removeItem("eg_auth_token");
      localStorage.removeItem("eg_auth_user");
      setAuth(null);
    });
  }, [auth?.token]);

  const isAuthenticated = Boolean(auth?.token);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLogin={setAuth} />
            )
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AlertsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/telemetry"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <TelemetryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/system"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <SystemStatusPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
