import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [form, setForm] = useState({ new_password: "", confirm_password: "" });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus({ type: "error", text: "Invalid or missing reset token." });
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      return setStatus({ type: "error", text: "Passwords do not match." });
    }
    
    setLoading(true);
    setStatus({ type: "", text: "" });
    
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: token,
          new_password: form.new_password
        })
      });
      setStatus({ type: "success", text: "Password has been successfully reset. Redirecting to login..." });
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setStatus({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in glass-dark rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-teal-500/20 blur-3xl" />
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              Set New Password
            </h1>
            <p className="text-stone-400 text-sm">
              Enter a new secure password for your account.
            </p>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input 
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all" 
              type="password" 
              placeholder="New Password" 
              value={form.new_password} 
              onChange={(e) => setForm({ ...form, new_password: e.target.value })} 
              required
              minLength="8"
              disabled={loading || !token}
            />
            
            <input 
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all" 
              type="password" 
              placeholder="Confirm New Password" 
              value={form.confirm_password} 
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} 
              required
              minLength="8"
              disabled={loading || !token}
            />
            
            {status.text && (
              <p className={`text-sm p-3 rounded-lg border ${status.type === 'error' ? 'text-red-400 bg-red-400/10 border-red-400/20' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'}`}>
                {status.text}
              </p>
            )}
            
            <button 
              type="submit"
              disabled={loading || !token}
              className="mt-6 w-full rounded-lg bg-gradient-premium py-3 font-semibold text-white shadow-lg transition-all hover:shadow-emerald-500/25 hover:brightness-110 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-400">
            <Link 
              to="/"
              className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
