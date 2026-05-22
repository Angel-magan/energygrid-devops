import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ isAuthenticated, userRoles = [], allowedRoles = [], children }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const hasRole = userRoles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
