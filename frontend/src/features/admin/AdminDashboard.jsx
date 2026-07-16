import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { useSelector } from "react-redux";

import { apiRequest } from "../../lib/api";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { font: { family: 'Outfit' }, color: '#4b5563' } } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'Outfit' }, color: '#6b7280' } },
    y: { grid: { color: '#f3f4f6' }, border: { display: false }, ticks: { font: { family: 'Outfit' }, color: '#6b7280' } },
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: { legend: { position: 'bottom', labels: { font: { family: 'Outfit' }, color: '#4b5563', padding: 20 } } }
};

export default function AdminDashboard() {
  const { token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "staff", label: "Staff" },
    { id: "treks", label: "Treks" },
    { id: "bookings", label: "Bookings" },
    { id: "passwordResets", label: "Password Resets" },
  ];

  return (
    <section className="animate-fade-in max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Admin Control Center</h1>
          <p className="text-stone-500 mt-1">Manage system data, users, and oversee operations.</p>
        </div>
        <nav className="flex space-x-2 bg-stone-100 p-1 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      
      {activeTab === "overview" && <OverviewTab token={token} />}
      {activeTab === "users" && <UsersTab token={token} />}
      {activeTab === "staff" && <StaffTab token={token} />}
      {activeTab === "treks" && <TreksTab token={token} />}
      {activeTab === "bookings" && <BookingsTab token={token} />}
      {activeTab === "passwordResets" && <PasswordResetsTab token={token} />}
    </section>
  );
}

function OverviewTab({ token }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiRequest("/admin/dashboard/stats", { token })
      .then(setStats)
      .catch(err => setError(err.message));
  }, [token]);

  if (error) return <ErrorMessage message={error} />;
  if (!stats) return <LoadingSpinner />;

  const statusLabels = Object.keys(stats.bookings_by_status);
  const statusCounts = Object.values(stats.bookings_by_status);

  return (
    <div className="animate-fade-in">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Metric label="Total Users" value={stats.users} />
        <Metric label="Active Staff" value={stats.active_staff} />
        <Metric label="Open Treks" value={stats.open_treks} />
        <Metric label="Booked Slots" value={stats.booked_slots} />
        <Metric label="Monthly Revenue" value={`$${stats.revenue_usd.toFixed(2)}`} highlight />
      </div>
      
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6 lg:col-span-1 shadow-sm h-[400px] flex flex-col">
          <h2 className="mb-6 text-lg font-semibold text-stone-800">Booking Status</h2>
          <div className="flex-1 relative">
            <Doughnut data={{ labels: statusLabels, datasets: [{ data: statusCounts, backgroundColor: ["#10b981", "#f59e0b", "#64748b"], borderWidth: 0, hoverOffset: 4 }] }} options={doughnutOptions} />
          </div>
        </div>
        
        <div className="glass rounded-2xl p-6 lg:col-span-2 shadow-sm h-[400px] flex flex-col">
          <h2 className="mb-6 text-lg font-semibold text-stone-800">Operational Snapshot</h2>
          <div className="flex-1 relative">
            <Bar data={{ labels: ["Users", "Staff", "Open treks", "Booked slots"], datasets: [{ label: "Count", data: [stats.users, stats.active_staff, stats.open_treks, stats.booked_slots], backgroundColor: "#059669", borderRadius: 6, barThickness: 40 }] }} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersTab({ token }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiRequest("/admin/users", { token })
      .then(setUsers)
      .catch(err => setError(err.message));
  }, [token]);

  async function toggleBlacklist(user) {
    const updated = await apiRequest(`/admin/users/${user.id}/blacklist`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ is_blacklisted: !user.is_blacklisted })
    });
    setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)));
  }

  if (error) return <ErrorMessage message={error} />;
  if (!users) return <LoadingSpinner />;

  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-in shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Name</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-stone-900">{user.first_name} {user.last_name}</td>
                <td className="px-6 py-4 text-stone-600">{user.email}</td>
                <td className="px-6 py-4"><Badge color={user.role === "ADMIN" ? "purple" : user.role === "STAFF" ? "blue" : "stone"}>{user.role}</Badge></td>
                <td className="px-6 py-4"><Badge color={user.is_blacklisted ? "red" : user.is_active ? "emerald" : "amber"}>{user.is_blacklisted ? "Blacklisted" : user.is_active ? "Active" : "Inactive"}</Badge></td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => toggleBlacklist(user)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${user.is_blacklisted ? "text-stone-700 border-stone-200 hover:bg-stone-100" : "text-red-700 border-red-200 hover:bg-red-50"}`}>
                    {user.is_blacklisted ? "Restore" : "Blacklist"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StaffTab({ token }) {
  const [staffList, setStaffList] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [editingStaff, setEditingStaff] = useState(null);

  const fetchStaff = () => apiRequest("/admin/staff", { token })
    .then(setStaffList)
    .catch(err => setError(err.message));
  
  useEffect(() => {
    fetchStaff();
  }, [token]);

  if (error) return <ErrorMessage message={error} />;
  if (!staffList) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex justify-end">
        <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-500 shadow-sm transition-all">
          + Register Staff
        </button>
      </div>
      
      <div className="glass rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Staff Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Skills</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-900">{staff.user.first_name} {staff.user.last_name}</td>
                  <td className="px-6 py-4 text-stone-600">{staff.user.email}</td>
                  <td className="px-6 py-4 text-stone-600">{staff.skills.join(", ") || "None"}</td>
                  <td className="px-6 py-4"><Badge color={staff.status === "AVAILABLE" ? "emerald" : "amber"}>{staff.status}</Badge></td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setEditingStaff(staff)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border text-stone-700 border-stone-200 hover:bg-stone-100 transition-colors">
                      Edit Skills
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <RegisterStaffModal token={token} onClose={() => setShowModal(false)} onSuccess={fetchStaff} />}
      {editingStaff && <EditSkillsModal token={token} staff={editingStaff} onClose={() => setEditingStaff(null)} onSuccess={fetchStaff} />}
    </div>
  );
}

function EditSkillsModal({ token, staff, onClose, onSuccess }) {
  const [skillsStr, setSkillsStr] = useState(staff.skills.join(", "));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const parsedSkills = skillsStr.split(",").map(s => s.trim()).filter(s => s.length > 0);

    try {
      await apiRequest(`/admin/staff/${staff.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ skills: parsedSkills })
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
        <h2 className="text-xl font-bold mb-4">Edit Skills for {staff.user.first_name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Skills</label>
            <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" type="text" placeholder="e.g., First Aid, Navigation" value={skillsStr} onChange={e => setSkillsStr(e.target.value)} />
            <p className="text-xs text-stone-500 mt-1">Comma separated list of skills.</p>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-2 rounded">{error}</p>}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-sm">
              {loading ? "Saving..." : "Save Skills"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function RegisterStaffModal({ token, onClose, onSuccess }) {
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", phone: "", skills: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    // Parse skills from comma separated string
    const parsedSkills = form.skills
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const { skills, ...userData } = form;

    try {
      await apiRequest("/admin/staff", {
        method: "POST",
        token,
        body: JSON.stringify({ user: userData, skills: parsedSkills, status: "Available" })
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
        <h2 className="text-xl font-bold mb-4">Register New Staff</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" placeholder="First Name" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
            <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" placeholder="Last Name" required value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
          </div>
          <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" type="text" placeholder="Skills (comma separated, e.g., First Aid, Navigation)" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} />
          <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" type="password" placeholder="Password" required minLength="8" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-2 rounded">{error}</p>}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-sm">
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TreksTab({ token }) {
  const [treks, setTreks] = useState(null);
  const [error, setError] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTrek, setEditingTrek] = useState(null);

  const fetchTreks = () => apiRequest("/admin/treks", { token })
    .then(setTreks)
    .catch(err => setError(err.message));
  const fetchStaff = () => apiRequest("/admin/staff", { token })
    .then(setStaffList)
    .catch(() => {}); // Ignore staff fetch error if treks succeed

  useEffect(() => {
    fetchTreks();
    fetchStaff();
  }, [token]);

  async function handleDelete(id) {
    if (confirm("Are you sure you want to delete this trek?")) {
      await apiRequest(`/treks/${id}`, { method: "DELETE", token });
      fetchTreks();
    }
  }

  async function handleAssignStaff(trekId, staffProfileId) {
    if (!staffProfileId) return;
    try {
      await apiRequest(`/treks/${trekId}/assign-staff`, {
        method: "POST",
        token,
        body: JSON.stringify({ staff_profile_id: staffProfileId })
      });
      fetchTreks();
    } catch (err) {
      alert("Failed to assign staff: " + err.message);
    }
  }

  if (error) return <ErrorMessage message={error} />;
  if (!treks) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex justify-end">
        <button onClick={() => { setEditingTrek(null); setShowModal(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-500 shadow-sm transition-all">
          + Create Trek
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
              <tr>
                <th className="px-6 py-4 font-semibold">Trek Name</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Dates</th>
                <th className="px-6 py-4 font-semibold">Slots</th>
                <th className="px-6 py-4 font-semibold">Assigned Staff</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {treks.map((trek) => (
                <tr key={trek.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-900">{trek.name}</td>
                  <td className="px-6 py-4 text-stone-600">{trek.location}</td>
                  <td className="px-6 py-4 text-stone-600">{trek.start_date} to {trek.end_date}</td>
                  <td className="px-6 py-4 text-stone-600">{trek.available_slots} / {trek.total_slots}</td>
                  <td className="px-6 py-4">
                    <select
                      className="rounded-lg border border-stone-200 px-2 py-1 text-sm outline-none focus:border-emerald-500 bg-white"
                      value={trek.assigned_staff_id || ""}
                      onChange={(e) => handleAssignStaff(trek.id, e.target.value)}
                    >
                      <option value="" disabled>Unassigned</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.user.first_name} {s.user.last_name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4"><Badge color={trek.status === "OPEN" ? "emerald" : "stone"}>{trek.status}</Badge></td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => { setEditingTrek(trek); setShowModal(true); }} className="text-xs font-semibold px-3 py-1.5 rounded-lg border text-stone-700 border-stone-200 hover:bg-stone-100 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(trek.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border text-red-700 border-red-200 hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <TrekModal token={token} trek={editingTrek} onClose={() => setShowModal(false)} onSuccess={fetchTreks} />}
    </div>
  );
}

function TrekModal({ token, trek, onClose, onSuccess }) {
  const isEditing = !!trek;
  const [form, setForm] = useState(trek ? {
    name: trek.name, location: trek.location, difficulty: trek.difficulty,
    duration_days: trek.duration_days, total_slots: trek.total_slots,
    available_slots: trek.available_slots, status: trek.status,
    start_date: trek.start_date, end_date: trek.end_date, price_usd: trek.price_usd
  } : {
    name: "", location: "", difficulty: "MODERATE", duration_days: 1,
    total_slots: 10, available_slots: 10, status: "PENDING",
    start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], price_usd: 100.00
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isEditing ? `/treks/${trek.id}` : "/treks/";
      const method = isEditing ? "PUT" : "POST";
      await apiRequest(endpoint, {
        method,
        token,
        body: JSON.stringify(form)
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl animate-scale-in my-8">
        <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit Trek" : "Create New Trek"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Trek Name</label>
              <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" placeholder="e.g., Everest Base Camp" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Location</label>
              <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" placeholder="e.g., Himalayas, Nepal" required value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Difficulty Level</label>
              <select className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500 bg-white" required value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value})}>
                <option value="EASY">Easy</option>
                <option value="MODERATE">Moderate</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Operational Status</label>
              <select className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500 bg-white" required value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                <option value="PENDING">Pending (Draft)</option>
                <option value="OPEN">Open (Accepting Bookings)</option>
                <option value="CLOSED">Closed (Unavailable)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Start Date</label>
              <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" type="date" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">End Date</label>
              <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" type="date" required value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Duration (Days)</label>
              <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" type="number" min="1" placeholder="e.g., 14" required value={form.duration_days} onChange={e => setForm({...form, duration_days: e.target.value === "" ? "" : parseInt(e.target.value)})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Price (USD)</label>
              <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" type="number" step="0.01" min="0" placeholder="e.g., 1200.00" required value={form.price_usd} onChange={e => setForm({...form, price_usd: e.target.value === "" ? "" : parseFloat(e.target.value)})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Total Capacity (Slots)</label>
              <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" type="number" min="1" placeholder="e.g., 20" required value={form.total_slots} onChange={e => setForm({...form, total_slots: e.target.value === "" ? "" : parseInt(e.target.value)})} />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Available Slots</label>
              <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500" type="number" min="0" placeholder="e.g., 15" required value={form.available_slots} onChange={e => setForm({...form, available_slots: e.target.value === "" ? "" : parseInt(e.target.value)})} />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mt-2">{error}</p>}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-stone-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-sm hover:shadow">
              {loading ? "Saving..." : "Save Trek Route"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BookingsTab({ token }) {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiRequest("/admin/bookings", { token })
      .then(setBookings)
      .catch(err => setError(err.message));
  }, [token]);

  if (error) return <ErrorMessage message={error} />;
  if (!bookings) return <LoadingSpinner />;

  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-in shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Trek</th>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Slots (Participants)</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4 text-stone-600">{new Date(booking.booking_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 font-medium text-stone-900">{booking.trek.name}</td>
                <td className="px-6 py-4 text-stone-600">
                  {booking.user ? `${booking.user.first_name} ${booking.user.last_name}` : "Unknown"}
                </td>
                <td className="px-6 py-4 text-stone-600">
                  {booking.slots_booked} 
                  {booking.participants?.length > 0 && (
                    <span className="ml-2 text-xs text-stone-400">
                      (+{booking.participants.length} others)
                    </span>
                  )}
                </td>
                <td className="px-6 py-4"><Badge color={booking.status === "BOOKED" ? "emerald" : "red"}>{booking.status}</Badge></td>
                <td className="px-6 py-4"><Badge color={booking.payment_status === "COMPLETED" ? "blue" : "amber"}>{booking.payment_status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div className={`rounded-2xl p-6 transition-transform hover:-translate-y-1 ${highlight ? 'bg-gradient-premium shadow-lg text-white' : 'glass shadow-sm text-stone-900'}`}>
      <p className={`text-sm font-medium mb-2 ${highlight ? 'text-emerald-100' : 'text-stone-500'}`}>{label}</p>
      <p className="text-4xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function Badge({ children, color }) {
  const colors = {
    emerald: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
    stone: "bg-stone-100 text-stone-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${colors[color] || colors.stone}`}>
      {children}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex h-64 items-center justify-center animate-fade-in">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  );
}

function ErrorMessage({ message }) {
  return (
    <div className="flex h-64 items-center justify-center animate-fade-in">
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-2xl border border-red-100 max-w-md shadow-sm">
        <h3 className="font-bold text-lg mb-2">Failed to load data</h3>
        <p className="text-sm">{message}</p>
        <p className="text-xs text-red-400 mt-3 font-medium tracking-wide uppercase">CORS or Network Error</p>
      </div>
    </div>
  );
}

function PasswordResetsTab({ token }) {
  const [requests, setRequests] = useState(null);
  const [error, setError] = useState(null);

  const fetchRequests = () => apiRequest("/admin/password-resets", { token })
    .then(setRequests)
    .catch(err => setError(err.message));

  useEffect(() => {
    fetchRequests();
  }, [token]);

  async function handleApprove(id) {
    if (!confirm("Approve this password reset request?")) return;
    try {
      await apiRequest(`/admin/password-resets/${id}/approve`, { method: "POST", token });
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleReject(id) {
    if (!confirm("Reject this password reset request?")) return;
    try {
      await apiRequest(`/admin/password-resets/${id}/reject`, { method: "POST", token });
      fetchRequests();
    } catch (err) {
      alert(err.message);
    }
  }

  if (error) return <ErrorMessage message={error} />;
  if (!requests) return <LoadingSpinner />;

  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-in shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-200 text-stone-600">
            <tr>
              <th className="px-6 py-4 font-semibold">Requested At</th>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4 text-stone-600">{new Date(req.requested_at).toLocaleString()}</td>
                <td className="px-6 py-4 font-medium text-stone-900">{req.user ? `${req.user.first_name} ${req.user.last_name}` : "Unknown"}</td>
                <td className="px-6 py-4 text-stone-600">{req.user?.email}</td>
                <td className="px-6 py-4"><Badge color={req.status === "PENDING" ? "amber" : req.status === "APPROVED" ? "emerald" : "red"}>{req.status}</Badge></td>
                <td className="px-6 py-4 text-right space-x-2">
                  {req.status === "PENDING" && (
                    <>
                      <button onClick={() => handleApprove(req.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border text-emerald-700 border-emerald-200 hover:bg-emerald-50 transition-colors">
                        Approve
                      </button>
                      <button onClick={() => handleReject(req.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border text-red-700 border-red-200 hover:bg-red-50 transition-colors">
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && (
          <div className="p-8 text-center text-stone-500">No password reset requests found.</div>
        )}
      </div>
    </div>
  );
}
