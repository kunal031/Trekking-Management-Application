import { useEffect, useMemo, useState } from "react";

import { apiRequest } from "../../lib/api";

const difficultyColors = {
  EASY: "bg-emerald-100 text-emerald-800 border-emerald-200",
  MODERATE: "bg-amber-100 text-amber-800 border-amber-200",
  HARD: "bg-rose-100 text-rose-800 border-rose-200",
};

export default function TrekSearch({ onSelect }) {
  const [filters, setFilters] = useState({ difficulty: "", location: "", duration_days: "" });
  const [treks, setTreks] = useState([]);
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        setTreks(await apiRequest(`/treks/${query ? `?${query}` : ""}`));
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <section>
      <div className="mb-8 grid gap-4 md:grid-cols-3 glass rounded-2xl p-6">
        <div className="relative">
          <label className="absolute -top-2.5 left-3 bg-white/0 px-1 text-xs font-semibold text-emerald-700">Difficulty</label>
          <select 
            className="w-full rounded-xl border-2 border-stone-200 bg-white/50 px-4 py-3 text-stone-700 outline-none focus:border-emerald-500 focus:bg-white transition-all appearance-none" 
            value={filters.difficulty} 
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          >
            <option value="">Any difficulty</option>
            <option value="EASY">Easy</option>
            <option value="MODERATE">Moderate</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
        <div className="relative">
          <label className="absolute -top-2.5 left-3 bg-white/0 px-1 text-xs font-semibold text-emerald-700">Location</label>
          <input 
            className="w-full rounded-xl border-2 border-stone-200 bg-white/50 px-4 py-3 text-stone-700 outline-none focus:border-emerald-500 focus:bg-white transition-all" 
            placeholder="Search by location..." 
            value={filters.location} 
            onChange={(e) => setFilters({ ...filters, location: e.target.value })} 
          />
        </div>
        <div className="relative">
          <label className="absolute -top-2.5 left-3 bg-white/0 px-1 text-xs font-semibold text-emerald-700">Duration (Days)</label>
          <input 
            className="w-full rounded-xl border-2 border-stone-200 bg-white/50 px-4 py-3 text-stone-700 outline-none focus:border-emerald-500 focus:bg-white transition-all" 
            type="number" 
            min="1" 
            placeholder="Any duration" 
            value={filters.duration_days} 
            onChange={(e) => setFilters({ ...filters, duration_days: e.target.value })} 
          />
        </div>
      </div>
      
      {loading && (
        <div className="flex justify-center py-12 animate-fade-in">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      )}
      
      {!loading && treks.length === 0 && (
        <div className="py-12 text-center text-stone-500 animate-fade-in glass rounded-2xl">
          No treks found matching your criteria. Try adjusting your filters.
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {treks.map((trek, i) => (
          <article 
            key={trek.id} 
            className="group flex flex-col justify-between overflow-hidden rounded-2xl glass p-0 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">{trek.name}</h2>
                <span className="flex-shrink-0 rounded-full bg-stone-900 px-3 py-1 text-sm font-bold text-white shadow-sm">
                  ${trek.price_usd}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${difficultyColors[trek.difficulty] || "bg-stone-100 text-stone-800"}`}>
                  {trek.difficulty}
                </span>
                <span className="rounded-full border border-stone-200 bg-white px-2.5 py-0.5 text-xs font-semibold text-stone-600 shadow-sm">
                  {trek.duration_days} days
                </span>
                {trek.assigned_staff_name && (
                  <span className="rounded-full border border-stone-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 shadow-sm">
                    Guide: {trek.assigned_staff_name}
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-sm text-stone-500">
                <p className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {trek.location}
                </p>
                <p className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {trek.start_date}
                </p>
                <p className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  <strong className="font-semibold text-stone-700">{trek.available_slots}</strong> slots left
                </p>
              </div>
            </div>
            
            <div className="p-6 pt-0 mt-auto">
              <button 
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-500 hover:shadow-lg active:scale-95 disabled:opacity-50"
                onClick={() => onSelect(trek)}
                disabled={trek.available_slots === 0}
              >
                {trek.available_slots > 0 ? "Book Now" : "Sold Out"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
