import { useState } from "react";
import { useSelector } from "react-redux";

import BookingModal from "./BookingModal";
import TrekSearch from "./TrekSearch";
import ProfileTab from "../../components/ProfileTab";

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("treks");
  const [selectedTrek, setSelectedTrek] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const token = useSelector((state) => state.auth.token);

  return (
    <section className="animate-fade-in max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Header & Tabs */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
        <h1 className="text-2xl font-bold text-stone-800 mb-4 sm:mb-0">User Dashboard</h1>
        <div className="flex bg-stone-100 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setActiveTab("treks")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "treks" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
          >
            Find Treks
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "profile" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
          >
            My Profile
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "treks" && (
        <>
          <div className="relative mb-12 overflow-hidden rounded-3xl bg-stone-900 px-8 py-20 text-center shadow-2xl">
            <div className="absolute inset-0 bg-gradient-premium opacity-90" />
            <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/30 blur-3xl" />
            
            <div className="relative z-10 flex flex-col items-center">
              <span className="mb-4 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
                Discover your next adventure
              </span>
              <h1 className="mb-4 text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Find an open trek
              </h1>
              <p className="max-w-xl text-lg text-stone-200">
                Filter by difficulty, location, and duration to discover the perfect journey tailored to your experience level.
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-5xl">
            <TrekSearch onSelect={setSelectedTrek} refreshKey={refreshKey} />
          </div>

          {selectedTrek && (
            <BookingModal 
              trek={selectedTrek} 
              onClose={() => setSelectedTrek(null)} 
              onSuccess={() => {
                setRefreshKey(prev => prev + 1);
                setSelectedTrek(null);
              }}
            />
          )}
        </>
      )}

      {activeTab === "profile" && <ProfileTab token={token} />}
    </section>
  );
}
