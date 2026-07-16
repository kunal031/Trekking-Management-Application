import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../../lib/api";
import { setCredentials } from "../../store/authSlice";

export default function Auth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const body = isLogin 
        ? { email: form.email, password: form.password }
        : form;

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(body)
      });
      dispatch(setCredentials(data));
      // RootGuard will handle correct redirection based on role
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError("");
  };

  return (
    <section className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md animate-scale-in glass-dark rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-teal-500/20 blur-3xl" />
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
              {isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-stone-400 text-sm">
              {isLogin ? "Sign in to access your dashboard" : "Join TMA V2 and start exploring"}
            </p>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="flex gap-4 animate-fade-in">
                <input 
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all" 
                  type="text" 
                  placeholder="First Name" 
                  value={form.first_name} 
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })} 
                  required={!isLogin}
                />
                <input 
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all" 
                  type="text" 
                  placeholder="Last Name" 
                  value={form.last_name} 
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })} 
                  required={!isLogin}
                />
              </div>
            )}
            
            <input 
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all" 
              type="email" 
              placeholder="Email address" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              required
            />
            
            {!isLogin && (
              <input 
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all animate-fade-in" 
                type="tel" 
                placeholder="Phone Number (Optional)" 
                value={form.phone} 
                onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              />
            )}
            
            <input 
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all" 
              type="password" 
              placeholder="Password" 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })} 
              required
            />
            
            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                {error}
              </p>
            )}
            
            <button 
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-gradient-premium py-3 font-semibold text-white shadow-lg transition-all hover:shadow-emerald-500/25 hover:brightness-110 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? "Processing..." : (isLogin ? "Sign in" : "Sign up")}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
              onClick={handleToggle}
              className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
            {isLogin && (
              <div className="mt-4">
                <button 
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="font-medium text-stone-400 hover:text-white transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </section>
  );
}

function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      const res = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
      });
      setStatus(res.message || "If an account exists, a reset link will be sent to your email.");
    } catch (err) {
      setStatus(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
        <h2 className="text-xl font-bold mb-2">Reset Password</h2>
        <p className="text-sm text-stone-500 mb-4">Enter your email to receive a password reset link.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" type="email" placeholder="Email address" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
          
          {status && <p className="text-sm p-2 rounded bg-stone-50 border border-stone-100 text-stone-700">{status}</p>}
          
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-stone-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg">Close</button>
            <button type="submit" disabled={loading || !email} className="px-6 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-all">
              {loading ? "Sending..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
