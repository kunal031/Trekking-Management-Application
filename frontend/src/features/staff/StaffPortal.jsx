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
  const [viewParticipantsTrek, setViewParticipantsTrek] = useState(null);

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
                      onClick={() => setViewParticipantsTrek(trek)}
                      className="ml-2 px-4 py-2 bg-stone-900 text-white text-sm font-semibold rounded-lg hover:bg-stone-800 transition-colors shadow-sm"
                    >
                      View Participants
                    </button>
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

      {viewParticipantsTrek && (
        <ViewParticipantsModal
          trek={viewParticipantsTrek}
          token={token}
          onClose={() => setViewParticipantsTrek(null)}
        />
      )}
    </section>
  );
}

function ViewParticipantsModal({ trek, token, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest(`/treks/${trek.id}/bookings`, { token })
      .then(setBookings)
      .catch((err) => console.error("Failed to fetch participants:", err))
      .finally(() => setLoading(false));
  }, [trek.id, token]);

  // Flatten participants
  const allParticipants = bookings.flatMap((b) => {
    // If the booking has nested participants array (from JSON column)
    const extraParticipants = Array.isArray(b.participants) ? b.participants : [];
    // The main user who booked
    const mainUser = {
      name: `${b.user.first_name} ${b.user.last_name}`,
      email: b.user.email,
      phone: b.user.phone || "N/A",
      bookingStatus: b.status,
      slots_booked: b.slots_booked
    };
    return [mainUser, ...extraParticipants.map(ep => ({ ...ep, bookingStatus: b.status, slots_booked: 1 }))];
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 md:p-8 shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        
        <div className="flex items-start justify-between mb-6 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Participants</h2>
            <p className="text-stone-500 text-sm mt-1">{trek.name} • {trek.start_date}</p>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 -mx-2 px-2">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : allParticipants.length === 0 ? (
            <div className="py-12 text-center text-stone-500 bg-stone-50 rounded-xl">
              No participants booked for this trek yet.
            </div>
          ) : (
            <div className="space-y-4">
              {allParticipants.map((p, i) => (
                <div key={i} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 border border-stone-200 rounded-xl bg-white hover:border-emerald-500/30 transition-colors">
                  <div>
                    <h3 className="font-bold text-stone-800">{p.name || "Unknown"}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500 mt-1">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {p.email || "N/A"}
                      </span>
                      {p.age && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          Age: {p.age}
                        </span>
                      )}
                      {p.phone && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          {p.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 sm:mt-0 text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${p.bookingStatus === 'BOOKED' ? 'bg-emerald-100 text-emerald-800' : p.bookingStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'}`}>
                      {p.bookingStatus}
                    </span>
                    {p.slots_booked > 1 && (
                      <p className="text-xs text-stone-500 font-semibold mt-1">Booked {p.slots_booked} slots</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
