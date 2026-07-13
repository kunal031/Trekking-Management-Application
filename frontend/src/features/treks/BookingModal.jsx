import { useState } from "react";
import { useSelector } from "react-redux";

import { apiRequest } from "../../lib/api";

export default function BookingModal({ trek, onClose }) {
  const { token } = useSelector((state) => state.auth);
  const [slots, setSlots] = useState(1);
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);
  const total = Number(trek.price_usd) * slots;

  async function submitBooking() {
    setProcessing(true);
    setStatus("Processing payment...");
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      await apiRequest("/bookings/", {
        method: "POST",
        token,
        body: JSON.stringify({ trek_id: trek.id, slots_booked: slots })
      });
      setStatus("success");
      setTimeout(onClose, 1200);
    } catch (err) {
      setStatus(err.message);
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl animate-scale-in relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <span className="mb-1 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-emerald-800">
                Checkout
              </span>
              <h2 className="text-2xl font-bold text-stone-900">{trek.name}</h2>
              <p className="text-sm font-medium text-stone-500">{trek.location}</p>
            </div>
            <button 
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-700" 
              onClick={onClose} 
              aria-label="Close"
              disabled={processing}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {status === "success" ? (
            <div className="py-8 text-center animate-scale-in">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900">Payment Successful</h3>
              <p className="mt-2 text-stone-500">Your adventure awaits! Redirecting...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="mb-2 block text-sm font-bold text-stone-700">Number of Slots</label>
                <div className="flex items-center gap-3">
                  <input 
                    className="w-full max-w-[120px] rounded-xl border-2 border-stone-200 px-4 py-3 text-lg font-bold text-stone-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20" 
                    type="number" 
                    min="1" 
                    max={trek.available_slots} 
                    value={slots} 
                    onChange={(e) => setSlots(Math.min(Math.max(1, Number(e.target.value)), trek.available_slots))} 
                    disabled={processing}
                  />
                  <span className="text-sm font-medium text-stone-500">
                    of {trek.available_slots} available
                  </span>
                </div>
              </div>

              <div className="mb-6 overflow-hidden rounded-2xl bg-stone-50 border border-stone-100 p-5">
                <div className="mb-3 flex justify-between text-sm font-medium text-stone-500">
                  <span>Unit price</span>
                  <span>${trek.price_usd}</span>
                </div>
                <div className="mb-3 flex justify-between text-sm font-medium text-stone-500">
                  <span>Service fee</span>
                  <span>$0.00</span>
                </div>
                <div className="my-4 border-t border-stone-200/60" />
                <div className="flex justify-between items-end">
                  <span className="text-base font-bold text-stone-900">Total amount</span>
                  <span className="text-3xl font-extrabold tracking-tight text-emerald-600">${total.toFixed(2)}</span>
                </div>
              </div>

              {status && status !== "Processing payment..." && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 flex items-start gap-2">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {status}
                </div>
              )}

              <button 
                className="w-full rounded-xl bg-stone-900 py-4 text-base font-bold text-white shadow-lg shadow-stone-900/20 transition-all hover:bg-emerald-600 hover:shadow-emerald-600/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 flex items-center justify-center gap-2" 
                onClick={submitBooking}
                disabled={processing || slots < 1}
              >
                {processing ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    Pay ${total.toFixed(2)}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
