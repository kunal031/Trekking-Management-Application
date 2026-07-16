import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { apiRequest } from "../../lib/api";
import ProfileTab from "../../components/ProfileTab";
import BookingModal from "../treks/BookingModal";

export default function StaffPortal() {
  const { token } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("treks");
  const [treks, setTreks] = useState([]);
  const [bookingTrek, setBookingTrek] = useState(null);

  async function updateSlots(trek, availableSlots) {
    const updated = await apiRequest(`/treks/${trek.id}/slot-status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ available_slots: Number(availableSlots) })
    });
    setTreks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  useEffect(() => {
    if (activeTab === "treks") {
      apiRequest("/treks/assigned/me", { token }).then(setTreks);
    }
  }, [token, activeTab]);

  return (
    <section className="animate-fade-in max-w-4xl mx-auto px-4 py-8">
      {/* Dashboard Header & Tabs */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Operational Portal</h1>
          <p className="text-stone-500 mt-1 text-sm">Manage slots for your assigned treks.</p>
        </div>
        <div className="flex bg-stone-100 p-1 rounded-xl shadow-inner mt-4 sm:mt-0">
          <button
            onClick={() => setActiveTab("treks")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "treks" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
          >
            My Treks
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === "profile" ? "bg-white text-emerald-700 shadow-sm" : "text-stone-600 hover:text-stone-900"}`}
          >
            My Profile
          </button>
        </div>
      </div>

      {activeTab === "treks" && (
        <div className="space-y-4">
          {treks.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-stone-500">
              You currently have no assigned treks.
            </div>
          ) : (
            treks.map((trek) => (
              <article 
                className="glass rounded-2xl p-6 transition-all hover:shadow-md hover:border-emerald-500/30 group" 
                key={trek.id}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-stone-800">{trek.name}</h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        {trek.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {trek.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        {trek.start_date} &rarr; {trek.end_date}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-stone-100/50 p-4 rounded-xl">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium text-stone-500 mb-1">Available Slots</span>
                      <span className="text-xl font-bold text-emerald-700">{trek.available_slots} <span className="text-stone-400 text-sm">/ {trek.total_slots}</span></span>
                    </div>
                    <button
                      onClick={() => setBookingTrek(trek)}
                      className="ml-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-500 transition-colors shadow-sm"
                    >
                      Book Slots
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {activeTab === "profile" && <ProfileTab token={token} />}
      {bookingTrek && (
        <BookingModal 
          trek={bookingTrek} 
          onClose={() => setBookingTrek(null)}
          onSuccess={() => {
            setBookingTrek(null);
            apiRequest("/treks/assigned/me", { token }).then(setTreks);
          }}
        />
      )}

      {activeTab === "profile" && <ProfileTab token={token} />}
    </section>
  );
}
