import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

export default function ProfileTab({ token }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    setLoading(true);
    apiRequest("/auth/me", { token })
      .then(data => {
        setProfile(data);
        setForm({ first_name: data.first_name, last_name: data.last_name, phone: data.phone || "" });
      })
      .catch(err => setMessage({ type: "error", text: err.message }))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const data = await apiRequest("/auth/me", {
        method: "PUT",
        token,
        body: JSON.stringify(form)
      });
      setProfile(data);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center py-12 text-stone-500 font-medium">Loading profile...</div>;
  if (!profile) return <div className="text-center py-12 text-red-500 font-medium">{message.text || "Failed to load profile"}</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-stone-100 animate-fade-in">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Personal Information</h2>
      
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
          <input className="w-full rounded-lg border border-stone-200 px-4 py-2 bg-stone-50 text-stone-500 outline-none" value={profile.email} disabled />
          <p className="text-xs text-stone-400 mt-1">Email cannot be changed.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">First Name</label>
            <input className="w-full rounded-lg border border-stone-200 px-4 py-2 outline-none focus:border-emerald-500" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Last Name</label>
            <input className="w-full rounded-lg border border-stone-200 px-4 py-2 outline-none focus:border-emerald-500" required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
          <input className="w-full rounded-lg border border-stone-200 px-4 py-2 outline-none focus:border-emerald-500" type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={saving} className="px-6 py-2 font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-sm">
            {saving ? "Saving..." : "Update Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
