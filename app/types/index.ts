export interface FarmWeatherData {
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    uvIndex: number;
    condition: string;
  };
  forecast: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    rainChance: number;
    rainfall: number;
    humidity?: number;
    condition: string;
  }>;
  aiSummary: string;
  location: {
    lat: number;
    lon: number;
    county?: string;
  };
}

export interface FarmingAnalysis {
  plantingAdvice: string;
  irrigationAdvice: string;
  harvestAdvice: string;
  pestRisk: 'LOW' | 'MODERATE' | 'HIGH';
  pestRecommendation: string;
  fertilizerAdvice: string;
  riskAlerts: string[];
  cropRecommendations: Record<string, string>;
  analysis: {
    temperatureTrend: 'warming' | 'cooling' | 'stable';
    rainfallTotal: number;
    droughtRisk: boolean;
    floodRisk: boolean;
    pestConditions: boolean;
    plantingWindows: string[];
    harvestingWindows: string[];
    cropHealth: Record<string, 'optimal' | 'good' | 'fair' | 'poor'>;
  };
}

export interface UsageData {
  requestsUsed: number;
  requestsLimit: number;
  aiUsed: number;
  aiLimit: number;
  resetDate: string;
}

export interface LocationData {
  lat: number;
  lon: number;
  county?: string;
  city?: string;
}

export type Language = 'en' | 'sw';

export interface FarmingJournalEntry {
  date: string;
  crop: string;
  activity: string;
  weather: string;
  notes: string;
}

export interface TreeAnalysisResult {
  analysis_id: string;
  timestamp: string;
  farmer_id: string;
  county: string;
  location: string;
  land_acres: number;
  total_tree_count: number;
  tree_density_per_acre: number;
  confidence_score: number;
  canopy_coverage_pct: number;
  tree_health: {
    healthy: number;
    needs_care: number;
    needs_replacement: number;
  };
  low_confidence: boolean;
  tree_species_guess: string;
  observations: string[];
  recommendations: string[];
  original_image_url: string;
  overlay_image_url: string;
  cv_debug?: {
    orig_resolution: string;
    work_resolution: string;
    canopy_px: number;
    peaks_detected: number;
    after_area_filter: number;
  };
}