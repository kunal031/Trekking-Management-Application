import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ roles, children }) {
  const { token, user } = useSelector((state) => state.auth);

  if (!token || !user) {
    return <Navigate to="/auth" replace />;
  }
  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
