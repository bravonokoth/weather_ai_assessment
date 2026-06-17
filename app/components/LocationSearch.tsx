"use client";
import { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { MapPin, LocateFixed, Search } from 'lucide-react';

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationSearch() {
  const { setLocation, error, setError } = useLocation();
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const handleGeolocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude]);
        setError(null);
        setLoading(false);
      },
      () => {
        setError('Permission denied to access your location.');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const fetchSuggestions = async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=5`
      );
      if (!res.ok) throw new Error('Suggestion fetch failed');
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
    } catch (e) {
      console.error(e);
      setSuggestions([]);
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    setLocation([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
    setCity(suggestion.display_name);
    setSuggestions([]);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGeolocation}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 dark:bg-emerald-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all duration-300 disabled:opacity-50"
        >
          <LocateFixed className="w-5 h-5" />
          {loading ? 'Locating...' : 'Use My Location'}
        </button>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search city, town or region..."
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            className="block w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 transition"
          />
        </div>
      </div>
      {suggestions.length > 0 && (
        <ul className="z-30 w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-h-60 overflow-y-auto border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700/50">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(s)}
              className="flex items-start gap-2.5 px-4 py-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer text-sm text-gray-700 dark:text-gray-300 transition-colors"
            >
              <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>{s.display_name}</span>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/30">
          {error}
        </div>
      )}
    </div>
  );
}
