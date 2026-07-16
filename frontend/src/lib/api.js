import { store } from "../store";
import { logout } from "../store/authSlice";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://tma-backend-production-f263.up.railway.app/api/v1";

export async function apiRequest(path, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token is invalid, expired, or missing
      store.dispatch(logout());
      // window.location.href = "/auth";
    }

    const body = await response.json().catch(() => ({}));
    let errMsg = "Request failed";
    if (body.detail) {
      if (Array.isArray(body.detail)) {
        errMsg = body.detail.map(e => e.msg).join(", ");
      } else {
        errMsg = body.detail;
      }
    }
    throw new Error(errMsg);
  }
  if (response.status === 202 || response.status === 204) {
    return null;
  }
  return response.json();
}
