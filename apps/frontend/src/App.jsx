import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import AlertsPage from "./pages/AlertsPage";
import TelemetryPage from "./pages/TelemetryPage";
import DevOpsLogsPage from "./pages/DevOpsLogsPage";
import SystemStatusPage from "./pages/SystemStatusPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { fetchCurrentUser } from "./services/api";

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
  const userRoles = auth?.user?.roles || [];

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

        {/* ⚡ CONFLICTO SOLUCIONADO: Usamos tu DashboardPage directo y protegido */}
        <Route
          path="/"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} userRoles={userRoles} allowedRoles={["admin", "user"]}>
              <AlertsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/telemetry"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} userRoles={userRoles} allowedRoles={["admin", "user"]}>
              <TelemetryPage />
            </ProtectedRoute>
          }
        />

        {/* Aquí protegemos el estado del hardware solo para admin, tal como subió main */}
        <Route
          path="/system"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} userRoles={userRoles} allowedRoles={["admin"]}>
              <SystemStatusPage />
            </ProtectedRoute>
          }
        />

        {/* Tu nueva consola DevOps de logs unificados */}
        <Route
          path="/devops-logs"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} userRoles={userRoles} allowedRoles={["admin"]}>
              <DevOpsLogsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;