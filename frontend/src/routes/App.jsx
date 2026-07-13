import { Link, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { logout } from "../store/authSlice";

export default function App() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen font-sans bg-stone-50 selection:bg-emerald-200">
      <header className="sticky top-0 z-50 glass">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-bold tracking-tight text-gradient transition-transform hover:scale-105">
            TMA V2
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            {user && (
              <Link to="/dashboard" className="text-stone-600 transition-colors hover:text-emerald-700">
                Treks
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link to="/admin" className="text-stone-600 transition-colors hover:text-emerald-700">
                Admin
              </Link>
            )}
            {user?.role === "STAFF" && (
              <Link to="/staff" className="text-stone-600 transition-colors hover:text-emerald-700">
                Staff
              </Link>
            )}
            {user ? (
              <button
                className="rounded-full bg-stone-900 px-5 py-2 text-white shadow-md transition-all hover:bg-stone-800 hover:shadow-lg active:scale-95"
                onClick={() => dispatch(logout())}
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2 text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 active:scale-95"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
