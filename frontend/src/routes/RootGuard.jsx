import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function RootGuard() {
  const { token, user } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect based on role
  if (user.role === "ADMIN") {
    return <Navigate to="/admin" replace />;
  }
  if (user.role === "STAFF") {
    return <Navigate to="/staff" replace />;
  }
  
  // Default for USER
  return <Navigate to="/dashboard" replace />;
}
