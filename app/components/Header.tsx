"use client";

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 tracking-wide uppercase">
          Weather AI — Farming Assistant
        </span>
      </div>
      <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
        Powered by WeatherAI API
      </span>
    </header>
  );
}
