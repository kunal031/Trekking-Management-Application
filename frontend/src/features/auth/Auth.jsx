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
          </div>
        </div>
      </div>
    </section>
  );
}
