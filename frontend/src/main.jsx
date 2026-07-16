import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import App from "./routes/App";
import AdminDashboard from "./features/admin/AdminDashboard";
import Auth from "./features/auth/Auth";
import ResetPassword from "./features/auth/ResetPassword";
import StaffPortal from "./features/staff/StaffPortal";
import UserDashboard from "./features/treks/UserDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import RootGuard from "./routes/RootGuard";
import { store } from "./store";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <RootGuard /> },
      { path: "auth", element: <Auth /> },
      { path: "reset-password", element: <ResetPassword /> },
      {
        path: "admin",
        element: (
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        )
      },
      {
        path: "staff",
        element: (
          <ProtectedRoute roles={["STAFF"]}>
            <StaffPortal />
          </ProtectedRoute>
        )
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute roles={["USER", "ADMIN"]}>
            <UserDashboard />
          </ProtectedRoute>
        )
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
