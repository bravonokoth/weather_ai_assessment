"use client";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2026 Weather AI Farming Assistant. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span>Weather data via WeatherAI API</span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 inline-block" />
          <span>AI powered by Gemini</span>
        </div>
      </div>
    </footer>
  );
}
