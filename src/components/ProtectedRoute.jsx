import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LOGIN } from "@/utils/consts";

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={LOGIN} state={{ from: location }} replace />;
  }

  return children;
}
