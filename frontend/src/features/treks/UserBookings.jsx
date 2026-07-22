import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

const statusColors = {
  PENDING: "bg-amber-100 text-amber-800",
  BOOKED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
  COMPLETED: "bg-stone-200 text-stone-700"
};

export default function UserBookings({ token }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportStatus, setExportStatus] = useState("");
  const [cancelingId, setCancelingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    apiRequest("/bookings/my-bookings", { token })
      .then(setBookings)
      .catch((err) => console.error("Failed to fetch bookings:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleExport = async () => {
    setExportStatus("Generating CSV...");
    console.log("flow goes to try block");
    try {
      const response = await apiRequest("/bookings/export", { method: "POST", token });
      console.log('inside try and outside if')
      console.log(response)
      if (response && response.csv_data) {
        console.log("both response and csv data is yess")
        const blob = new Blob([response.csv_data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        console.log(url);
        link.href = url;
        console.log(link.href)
        link.setAttribute("download", `booking_history_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      setExportStatus("Your booking history export has downloaded successfully");
      setTimeout(() => setExportStatus(""), 5000);
    } catch (err) {
      setExportStatus(`Export failed: ${err.message}`);
      setTimeout(() => setExportStatus(""), 5000);
    }
  };

  const handleCancel = async (bookingId) => {
    setCancelingId(bookingId);
    // Simulate refund processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      await apiRequest(`/bookings/${bookingId}/cancel`, { method: "POST", token });
      setConfirmCancelId(null);
      fetchBookings();
    } catch (err) {
      console.error("Cancel failed:", err);
      alert(`Failed to cancel: ${err.message}`);
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-stone-100 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Booking History</h2>
          <p className="text-stone-500 text-sm mt-1">Manage and view your past and upcoming adventures.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {exportStatus && (
            <span className={`text-sm font-semibold ${exportStatus.includes("failed") ? "text-rose-600" : "text-emerald-600"} animate-fade-in`}>
              {exportStatus}
            </span>
          )}
          <button
            onClick={handleExport}
            disabled={!!exportStatus}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-bold shadow-sm transition-colors hover:bg-stone-800 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export History
          </button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-stone-500">
          You have no bookings yet. Time to find a trek!
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="border border-stone-200 rounded-xl p-5 hover:border-emerald-500/30 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-6">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-stone-800">{booking.trek.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusColors[booking.status] || "bg-stone-100 text-stone-800"}`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {booking.trek.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {booking.trek.start_date}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-6 bg-stone-50 md:bg-transparent p-4 md:p-0 rounded-lg">
                <div className="flex flex-col md:items-end">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Total Paid</span>
                  <span className="text-xl font-extrabold text-emerald-700">${(Number(booking.trek.price_usd) * booking.slots_booked).toFixed(2)}</span>
                  <span className="text-xs font-semibold text-stone-500">{booking.slots_booked} slot(s)</span>
                </div>
                
                {(booking.status === "BOOKED" || booking.status === "PENDING") && (
                  <div className="relative">
                    {confirmCancelId === booking.id ? (
                      <div className="flex items-center gap-2 animate-fade-in">
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancelingId === booking.id}
                          className="px-3 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-500 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
                        >
                          {cancelingId === booking.id ? "Processing..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmCancelId(null)}
                          disabled={cancelingId === booking.id}
                          className="px-3 py-2 bg-stone-200 text-stone-700 text-xs font-bold rounded-lg hover:bg-stone-300 transition-colors disabled:opacity-50"
                        >
                          Keep
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancelId(booking.id)}
                        className="px-4 py-2 bg-white border border-rose-200 text-rose-600 text-sm font-bold rounded-lg hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-sm"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
