import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import { apiRequest } from "../../lib/api";

export default function BookingModal({ trek, onClose, onSuccess }) {
  const { token, user } = useSelector((state) => state.auth);
  const [slots, setSlots] = useState(1);
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);
  const [previousSlots, setPreviousSlots] = useState(0);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [participants, setParticipants] = useState([]);
  
  const total = Number(trek.price_usd) * slots;
  const requiredParticipants = (previousSlots > 0 || user?.role === 'STAFF') ? slots : Math.max(0, slots - 1);

  useEffect(() => {
    apiRequest("/bookings/my-bookings", { token })
      .then(data => {
        const booked = data.filter(b => b.trek_id === trek.id).reduce((sum, b) => sum + b.slots_booked, 0);
        setPreviousSlots(booked);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [trek.id, token]);

  useEffect(() => {
    setParticipants(prev => {
      const diff = requiredParticipants - prev.length;
      if (diff > 0) return [...prev, ...Array.from({length: diff}, () => ({ name: '', email: '', age: '' }))];
      if (diff < 0) return prev.slice(0, requiredParticipants);
      return prev;
    });
  }, [requiredParticipants]);

  const updateParticipant = (index, field, value) => {
    const newP = [...participants];
    newP[index][field] = value;
    setParticipants(newP);
  };

  async function submitBooking(e) {
    e.preventDefault();
    setProcessing(true);
    setStatus("Processing payment...");
    await new Promise((resolve) => setTimeout(resolve, 800));
    try {
      await apiRequest("/bookings/", {
        method: "POST",
        token,
        body: JSON.stringify({ 
          trek_id: trek.id, 
          slots_booked: slots,
          participants: participants.map(p => ({ ...p, age: parseInt(p.age) || 0 }))
        })
      });
      setStatus("success");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        else onClose();
      }, 1200);
    } catch (err) {
      setStatus(err.message);
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl animate-scale-in relative overflow-hidden my-8">
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
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-700" 
              onClick={onClose} 
              disabled={processing}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-8 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : status === "success" ? (
            <div className="py-8 text-center animate-scale-in">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900">Payment Successful</h3>
              <p className="mt-2 text-stone-500">Your adventure awaits! Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={submitBooking}>
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
              
              {participants.length > 0 && (
                <div className="mb-6 space-y-4">
                  <h3 className="text-sm font-bold text-stone-700 border-b pb-2">Participant Details</h3>
                  <p className="text-xs text-stone-500">You must provide information for the {participants.length} additional participant(s).</p>
                  {participants.map((p, index) => (
                    <div key={index} className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                      <h4 className="font-semibold text-sm text-stone-800">Person {index + 1}</h4>
                      <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500 text-sm" placeholder="Full Name" required value={p.name} onChange={e => updateParticipant(index, 'name', e.target.value)} disabled={processing} />
                      <div className="flex gap-3">
                        <input className="w-full rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500 text-sm" type="email" placeholder="Email" required value={p.email} onChange={e => updateParticipant(index, 'email', e.target.value)} disabled={processing} />
                        <input className="w-24 rounded-lg border border-stone-200 px-3 py-2 outline-none focus:border-emerald-500 text-sm" type="number" min="1" placeholder="Age" required value={p.age} onChange={e => updateParticipant(index, 'age', e.target.value)} disabled={processing} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-6 overflow-hidden rounded-2xl bg-stone-50 border border-stone-100 p-5">
                <div className="mb-3 flex justify-between text-sm font-medium text-stone-500">
                  <span>Unit price</span>
                  <span>${trek.price_usd}</span>
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
                type="submit"
                className="w-full rounded-xl bg-stone-900 py-4 text-base font-bold text-white shadow-lg shadow-stone-900/20 transition-all hover:bg-emerald-600 hover:shadow-emerald-600/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 flex items-center justify-center gap-2" 
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
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
