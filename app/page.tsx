'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FarmWeatherData, FarmingAnalysis, UsageData, Language } from './types';
import { useLocation } from './context/LocationContext';
import LocationSearch from './components/LocationSearch';
import {
  MapPin,
  Search,
  RefreshCw,
  Thermometer,
  Droplet,
  Wind,
  CloudRain,
  Sun,
  Sprout,
  Droplets,
  Scissors,
  Bug,
  FlaskConical,
  Activity,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  LocateFixed,
  Cloud,
  CloudSun,
  Umbrella,
  Eye,
  Gauge,
  Trees
} from 'lucide-react';
import AgroforestryAnalysis from './components/AgroforestryAnalysis';

const NAVROBO_LATLON: [number, number] = [-1.2921, 36.8219];

export default function Home() {
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'weather' | 'agroforestry'>('weather');
  const { location, error: locationError } = useLocation();
  const queryClient = useQueryClient();

  const { data: weatherData, isLoading: weatherLoading, error: weatherError, refetch: refetchWeather } = useQuery<FarmWeatherData>({
    queryKey: ['weather', location[0], location[1], language],
    queryFn: async () => {
      const res = await fetch(`/api/weather?lat=${location[0]}&lon=${location[1]}&lang=${language}`);
      if (!res.ok) throw new Error('Failed to fetch weather');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    retry: 1,
  });

  const { data: usageData } = useQuery<UsageData>({
    queryKey: ['usage'],
    queryFn: async () => {
      const res = await fetch('/api/usage');
      if (!res.ok) throw new Error('Failed to fetch usage');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: analysis } = useQuery<FarmingAnalysis>({
    queryKey: ['analysis', weatherData, language],
    queryFn: async () => {
      if (!weatherData) return null;
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weatherData, lang: language }),
      });
      if (!res.ok) throw new Error('Failed to analyze');
      return res.json();
    },
    enabled: !!weatherData,
  });

  const t = {
    en: {
      title: 'Weather AI Farming Assistant',
      subtitle: 'AI-powered farming recommendations for Kenyan farmers',
      getLocation: 'Use My Location',
      searchPlaceholder: 'Enter city name...',
      searchButton: 'Search',
      refresh: 'Refresh',
      currentWeather: 'Current Weather',
      forecast: '7-Day Forecast',
      aiAdvice: 'AI Recommendations',
      aiSummaryLabel: 'AI Summary',
      apiUsage: 'API Usage',
      resets: 'Resets',
      weatherApiCalls: 'Weather API Calls',
      aiSummaries: 'AI Summaries',
      weatherStatus: 'Weather Status',
      temp: 'Temperature',
      humidity: 'Humidity',
      wind: 'Wind Speed',
      rain: 'Rainfall',
      uv: 'UV Index',
      county: 'County',
      feelsLike: 'Feels like',
      planting: 'Planting',
      irrigation: 'Irrigation',
      harvest: 'Harvest',
      pestRisk: 'Pest Risk',
      fertilizer: 'Fertilizer',
      cropRecommendations: 'Crop Recommendations',
      riskAlerts: 'Risk Alerts',
      errorLoading: 'Error loading weather data. Please check your API key configuration.',
      retry: 'Retry',
      weatherTab: 'Weather & Crops',
      agroforestryTab: 'Agroforestry (Trees)',
    },
    sw: {
      title: 'Weather AI Msaidizi wa Kilimo',
      subtitle: 'Mapendekezo ya kilimo yenye akili kwa wakulima wa Kenya',
      getLocation: 'Tumia Eneo Langu',
      searchPlaceholder: 'Weka jina la jiji...',
      searchButton: 'Tafuta',
      refresh: 'Onyesha Upya',
      currentWeather: 'Hali ya Hewa ya Sasa',
      forecast: 'Utabiri wa Siku 7',
      aiAdvice: 'Mapendekezo ya Kilimo',
      aiSummaryLabel: 'Muhtasari wa AI',
      apiUsage: 'Matumizi ya API',
      resets: 'Inarejeshwa',
      weatherApiCalls: 'Maombi ya Hali ya Hewa',
      aiSummaries: 'Mihtasari ya AI',
      weatherStatus: 'Hali ya Hewa',
      temp: 'Joto',
      humidity: 'Unyevunyevu',
      wind: 'Mwendo wa Upepo',
      rain: 'Mvua',
      uv: 'Kiwango cha UV',
      county: 'Kaunti',
      feelsLike: 'Inahisi kama',
      planting: 'Upandaji',
      irrigation: 'Umwagiliaji',
      harvest: 'Mavuno',
      pestRisk: 'Hatari ya Wadudu',
      fertilizer: 'Mbolea',
      cropRecommendations: 'Mapendekezo ya Mazao',
      riskAlerts: 'Onyo za Hatari',
      errorLoading: 'Hitilafu kupakia data ya hewa. Tafadhali angalia usanidi wa API key yako.',
      retry: 'Jaribu Tena',
      weatherTab: 'Hewa na Mazao',
      agroforestryTab: 'Misitu ya Kilimo (Miti)',
    },
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['weather'] });
    refetchWeather();
  };

  const usagePercentage = usageData ? (usageData.requestsUsed / usageData.requestsLimit) * 100 : 0;
  const aiPercentage = usageData ? (usageData.aiUsed / usageData.aiLimit) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-600 p-2.5 rounded-lg">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {t[language].title}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                  {t[language].subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${language === 'en'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-250 dark:hover:bg-gray-700'
                  }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('sw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${language === 'sw'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-250 dark:hover:bg-gray-700'
                  }`}
              >
                Kiswahili
              </button>
            </div>
          </div>
        </header>

        {/* API Usage Cards */}
        {usageData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  {t[language].apiUsage}
                </span>
                <span className="text-[10px] text-gray-400">{t[language].resets}: {new Date(usageData.resetDate).toLocaleDateString()}</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{t[language].weatherApiCalls}</span>
                    <span className="font-semibold">{usageData.requestsUsed}/{usageData.requestsLimit}</span>
                  </div>
                  <div className="w-full bg-gray-150 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${usagePercentage > 90 ? 'bg-red-500' :
                          usagePercentage > 70 ? 'bg-yellow-500' :
                            'bg-emerald-500'
                        }`}
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{t[language].aiSummaries}</span>
                    <span className="font-semibold">{usageData.aiUsed}/{usageData.aiLimit}</span>
                  </div>
                  <div className="w-full bg-gray-150 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${aiPercentage > 90 ? 'bg-red-500' :
                          aiPercentage > 70 ? 'bg-yellow-500' :
                            'bg-emerald-500'
                        }`}
                      style={{ width: `${Math.min(aiPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{t[language].weatherStatus}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {weatherData?.current.temp ? `${Math.round(weatherData.current.temp)}°C` : '--'}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                <CloudSun className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl max-w-md border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('weather')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'weather'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <CloudSun className="w-4 h-4" />
            {t[language].weatherTab}
          </button>
          <button
            onClick={() => setActiveTab('agroforestry')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'agroforestry'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Trees className="w-4 h-4" />
            {t[language].agroforestryTab}
          </button>
        </div>

        {activeTab === 'weather' ? (
          <>
            {/* Controls */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <LocationSearch />
              </div>
              <button
                onClick={handleRefresh}
                disabled={weatherLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all disabled:opacity-50 text-sm font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
                {t[language].refresh}
              </button>
            </div>

            {locationError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl mb-6 text-sm">
                {locationError}
              </div>
            )}

            {weatherLoading && !weatherData ? (
              <LoadingSkeleton />
            ) : weatherError ? (
              <div className="bg-red-50 border border-red-200 text-red-800 px-5 py-4 rounded-xl mb-6">
                {t[language].errorLoading}
                <button onClick={handleRefresh} className="ml-3 underline font-semibold">{t[language].retry}</button>
              </div>
            ) : weatherData ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <CurrentWeatherCard data={weatherData} language={language} t={t[language]} />
                  <AIAdviceCard summary={weatherData.aiSummary} analysis={analysis} language={language} t={t[language]} />
                </div>
                <ForecastCard forecast={weatherData.forecast} language={language} t={t[language]} />
                {analysis && <FarmingInsightsCard analysis={analysis} language={language} t={t[language]} />}
              </>
            ) : null}
          </>
        ) : (
          <AgroforestryAnalysis language={language} />
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type Translations = ReturnType<typeof buildTranslations>['en'];
function buildTranslations() {
  return {
    en: {
      title: '', subtitle: '', getLocation: '', searchPlaceholder: '', searchButton: '',
      refresh: '', currentWeather: '', forecast: '', aiAdvice: '', aiSummaryLabel: '',
      apiUsage: '', resets: '', weatherApiCalls: '', aiSummaries: '', weatherStatus: '',
      temp: '', humidity: '', wind: '', rain: '', uv: '', county: '', feelsLike: '',
      planting: '', irrigation: '', harvest: '', pestRisk: '', fertilizer: '',
      cropRecommendations: '', riskAlerts: '', errorLoading: '', retry: '',
    },
    sw: {} as Record<string, string>,
  };
}
function CurrentWeatherCard({ data, t }: { data: FarmWeatherData; language: Language; t: Translations }) {
  const getWeatherIcon = (temp: number) => {
    if (temp > 30) return <Sun className="w-12 h-12 text-yellow-500" />;
    if (temp > 20) return <CloudSun className="w-12 h-12 text-emerald-500" />;
    return <Cloud className="w-12 h-12 text-blue-500" />;
  };

  const metrics = [
    { icon: Thermometer, label: t.temp, value: `${Math.round(data.current.temp)}°C`, color: 'text-red-500' },
    { icon: Droplet, label: t.humidity, value: `${data.current.humidity}%`, color: 'text-blue-500' },
    { icon: Wind, label: t.wind, value: `${data.current.windSpeed} km/h`, color: 'text-teal-500' },
    { icon: CloudRain, label: t.rain, value: `${data.current.rainfall} mm`, color: 'text-indigo-500' },
    { icon: Sun, label: t.uv, value: data.current.uvIndex, color: 'text-yellow-500' },
    { icon: MapPin, label: t.county, value: data.location.county || 'Kenya', color: 'text-green-500' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {getWeatherIcon(data.current.temp)}
            {t.currentWeather}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
            {data.location.county || 'Kenya'}, Kenya
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-emerald-600">
            {Math.round(data.current.temp)}°C
          </p>
          <p className="text-xs text-gray-400">{t.feelsLike} {Math.round(data.current.temp)}°</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metrics.map((metric, idx) => (
          <div key={idx} className="bg-gray-50 dark:bg-gray-950/40 rounded-xl p-3 border border-gray-100 dark:border-gray-900/30">
            <div className="flex items-center gap-2 mb-1">
              <metric.icon className={`w-3.5 h-3.5 ${metric.color}`} />
              <span className="text-[11px] text-gray-500">{metric.label}</span>
            </div>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{metric.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIAdviceCard({ summary, analysis, t }: { summary: string; analysis: FarmingAnalysis | undefined; language: Language; t: Translations }) {
  const adviceItems = [
    { icon: Sprout, label: t.planting, key: 'plantingAdvice', color: 'bg-emerald-500' },
    { icon: Droplets, label: t.irrigation, key: 'irrigationAdvice', color: 'bg-blue-500' },
    { icon: Scissors, label: t.harvest, key: 'harvestAdvice', color: 'bg-yellow-500' },
    { icon: Bug, label: t.pestRisk, key: 'pestRisk', color: 'bg-red-500' },
    { icon: FlaskConical, label: t.fertilizer, key: 'fertilizerAdvice', color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.aiAdvice}</h2>
      </div>

      {summary && (
        <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl p-4 mb-4 border border-emerald-100 dark:border-emerald-900/20">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">{t.aiSummaryLabel}</p>
          <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">{summary}</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-3">
          {adviceItems.map((item, idx) => {
            let value = analysis[item.key as keyof FarmingAnalysis];
            if (item.key === 'pestRisk' && analysis.pestRecommendation) {
              value = `${value} - ${analysis.pestRecommendation}`;
            }
            return (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white/40 dark:bg-gray-800/40 rounded-xl hover:bg-white/60 transition-all">
                <div className={`${item.color} p-2 rounded-lg`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm text-gray-800 dark:text-gray-100 mt-0.5">{value as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ForecastCard({ forecast, language, t }: { forecast: FarmWeatherData['forecast']; language: Language; t: Translations }) {
  const getDayName = (dateStr: string) => {
    const days = language === 'sw'
      ? ['Jumapili', 'Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date(dateStr).getDay()];
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.forecast}</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
        {forecast.map((day, idx) => (
          <div key={idx} className="bg-gray-50 dark:bg-gray-950/40 border border-gray-100 dark:border-gray-900/30 rounded-xl p-3 text-center transition-all">
            <p className="font-semibold text-xs text-gray-800 dark:text-gray-150">{getDayName(day.date)}</p>
            <p className="text-[10px] text-gray-400 mb-2">{day.date.slice(5)}</p>
            <div className="my-2 flex justify-center">
              {day.rainChance > 50 ? (
                <Umbrella className="w-6 h-6 text-blue-500" />
              ) : (
                <CloudSun className="w-6 h-6 text-yellow-500" />
              )}
            </div>
            <p className="text-base font-bold text-gray-950 dark:text-white">{Math.round(day.tempMax)}°</p>
            <p className="text-xs text-gray-400">{Math.round(day.tempMin)}°</p>
            <div className="mt-2 flex items-center justify-center gap-1">
              <CloudRain className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-semibold text-gray-500">{day.rainChance}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FarmingInsightsCard({ analysis, t }: { analysis: FarmingAnalysis; language: Language; t: Translations }) {
  const crops = Object.entries(analysis.cropRecommendations);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Sprout className="w-5 h-5 text-emerald-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.cropRecommendations}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {crops.map(([crop, advice]) => (
          <div key={crop} className="bg-gray-50 dark:bg-gray-950/40 border border-gray-100 dark:border-gray-900/30 rounded-xl p-4 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <Sprout className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white capitalize">{crop}</h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{advice}</p>
          </div>
        ))}
      </div>

      {analysis.riskAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-200/30">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-semibold text-xs text-red-800 dark:text-red-300 uppercase tracking-wider">{t.riskAlerts}</h3>
          </div>
          <ul className="space-y-1.5">
            {analysis.riskAlerts.map((alert, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                <ChevronRight className="w-3.5 h-3.5 mt-0.5" />
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}