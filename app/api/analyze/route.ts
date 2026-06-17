import { NextResponse } from 'next/server';

interface WeatherDay {
  date: string;
  tempMax: number;
  tempMin: number;
  rainChance: number;
  rainfall: number;
  humidity?: number;
  condition: string;
}

interface CurrentWeather {
  temp: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  uvIndex: number;
  condition: string;
}

interface WeatherData {
  current: CurrentWeather;
  forecast: WeatherDay[];
  aiSummary: string;
  location: { lat: number; lon: number; county?: string };
}

export async function POST(request: Request) {
  try {
    const { weatherData, lang = 'en' } = await request.json();

    if (!weatherData) {
      return NextResponse.json(
        { error: 'Weather data is required' },
        { status: 400 }
      );
    }

    const analysis = generateFarmingAnalysis(weatherData, lang);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateFarmingAnalysis(weatherData: WeatherData, lang: string) {
  const { current, forecast } = weatherData;

  const temps = forecast.map((day) => day.tempMax);
  const temperatureTrend = calculateTrend(temps);

  const rainfallTotal = forecast.reduce((sum, day) => sum + (day.rainfall || 0), 0);

  const droughtRisk = forecast.every((day) => (day.rainfall || 0) < 5);
  const floodRisk = forecast.some((day) => (day.rainfall || 0) > 50);
  const pestConditions = checkPestRisk(current.humidity, forecast);

  const plantingWindows = findOptimalPlantingDays(forecast);
  const harvestingWindows = findHarvestingDays(forecast);

  const cropHealth = {
    maize: evaluateCropCondition('maize', current, forecast),
    tea: evaluateCropCondition('tea', current, forecast),
    coffee: evaluateCropCondition('coffee', current, forecast),
    tomatoes: evaluateCropCondition('tomatoes', current, forecast),
    potatoes: evaluateCropCondition('potatoes', current, forecast)
  };

  const plantingAdvice = generatePlantingAdvice(weatherData, lang);
  const irrigationAdvice = generateIrrigationAdvice(weatherData, lang);
  const harvestAdvice = generateHarvestAdvice(weatherData, lang);
  const pestRisk = getPestRiskLevel(pestConditions);
  const pestRecommendation = generatePestRecommendation(pestConditions, lang);
  const fertilizerAdvice = generateFertilizerAdvice(weatherData, lang);
  const riskAlerts = generateRiskAlerts(weatherData, lang);
  const cropRecommendations = generateCropRecommendations(weatherData, lang);

  return {
    plantingAdvice,
    irrigationAdvice,
    harvestAdvice,
    pestRisk,
    pestRecommendation,
    fertilizerAdvice,
    riskAlerts,
    cropRecommendations,
    analysis: {
      temperatureTrend,
      rainfallTotal,
      droughtRisk,
      floodRisk,
      pestConditions,
      plantingWindows,
      harvestingWindows,
      cropHealth
    }
  };
}

function calculateTrend(values: number[]): 'warming' | 'cooling' | 'stable' {
  if (values.length < 2) return 'stable';

  const firstHalf = values.slice(0, Math.ceil(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 1) return 'warming';
  if (diff < -1) return 'cooling';
  return 'stable';
}

function checkPestRisk(humidity: number, forecast: WeatherDay[]): boolean {
  const avgTemp = forecast.reduce((sum, day) => sum + ((day.tempMax + day.tempMin) / 2), 0) / forecast.length;

  return humidity > 70 && avgTemp > 20;
}

function findOptimalPlantingDays(forecast: WeatherDay[]): string[] {
  return forecast
    .filter((day) => {
      const avgTemp = (day.tempMax + day.tempMin) / 2;
      return avgTemp >= 15 && avgTemp <= 28 && (day.rainChance || 0) >= 20;
    })
    .map((day) => day.date);
}

function findHarvestingDays(forecast: WeatherDay[]): string[] {
  return forecast
    .filter((day) => (day.rainChance || 0) < 30)
    .map((day) => day.date);
}

type CropCondition = 'optimal' | 'good' | 'fair' | 'poor';

interface CropConfig {
  optimalTemp: [number, number];
  maxHumidity?: number;
  minRain?: number;
}

function evaluateCropCondition(crop: string, _current: CurrentWeather, forecast: WeatherDay[]): CropCondition {
  const cropConfigs: Record<string, CropConfig> = {
    maize: { optimalTemp: [20, 28], maxHumidity: 80 },
    tea: { optimalTemp: [18, 25], minRain: 1500 },
    coffee: { optimalTemp: [17, 23], maxHumidity: 70 },
    tomatoes: { optimalTemp: [20, 25], maxHumidity: 80 },
    potatoes: { optimalTemp: [15, 20], maxHumidity: 70 }
  };

  const config = cropConfigs[crop];
  if (!config) return 'fair';

  const avgTemp = forecast.reduce((sum, day) => sum + ((day.tempMax + day.tempMin) / 2), 0) / forecast.length;
  const avgHumidity = forecast.reduce((sum, day) => sum + (day.humidity || _current.humidity), 0) / forecast.length;

  let score = 0;

  if (avgTemp >= config.optimalTemp[0] && avgTemp <= config.optimalTemp[1]) {
    score += 40;
  } else if (avgTemp >= config.optimalTemp[0] - 5 && avgTemp <= config.optimalTemp[1] + 5) {
    score += 20;
  }

  if (config.maxHumidity && avgHumidity <= config.maxHumidity) {
    score += 30;
  } else if (config.maxHumidity && avgHumidity <= config.maxHumidity + 10) {
    score += 15;
  }

  const totalRainfall = forecast.reduce((sum, day) => sum + (day.rainfall || 0), 0);
  if (config.minRain) {
    const weeklyRain = totalRainfall;
    const neededWeekly = config.minRain / 52;
    if (weeklyRain >= neededWeekly * 0.8) {
      score += 30;
    } else if (weeklyRain >= neededWeekly * 0.5) {
      score += 15;
    }
  } else {
    if (totalRainfall < 100) {
      score += 30;
    } else if (totalRainfall < 150) {
      score += 15;
    }
  }

  if (score >= 80) return 'optimal';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function generatePlantingAdvice(weatherData: WeatherData, lang: string): string {
  const { forecast } = weatherData;
  const avgTemp = forecast.reduce((sum, day) => sum + ((day.tempMax + day.tempMin) / 2), 0) / forecast.length;
  const totalRainfall = forecast.reduce((sum, day) => sum + (day.rainfall || 0), 0);

  if (lang === 'sw') {
    if (avgTemp < 12) {
      return "Kuna baridi sana kwa ajili ya kupanda. Ukuaji wa mbegu utachelewa sana.";
    } else if (avgTemp > 33) {
      return "Kuna joto sana kwa ajili ya kupanda. Joto la juu la udongo linaweza kuua mbegu changu.";
    } else if (totalRainfall < 10) {
      return "Unyevu wa udongo uko chini. Umwagiliaji wa ziada unapendekezwa sana ikiwa utapanda sasa.";
    } else {
      return "Unyevu wa kutosha wa udongo na joto linalofaa. Hali nzuri kwa ajili ya kupanda.";
    }
  }

  if (avgTemp < 12) {
    return "Too cold for planting. Germination will be severely delayed.";
  } else if (avgTemp > 33) {
    return "Too hot for planting. High soil temperatures may kill young seeds.";
  } else if (totalRainfall < 10) {
    return "Soil moisture is low. Supplemental irrigation is highly recommended if planting now.";
  } else {
    return "Adequate soil moisture and favorable temperatures. Good conditions for planting.";
  }
}

function generateIrrigationAdvice(weatherData: WeatherData, lang: string): string {
  const { forecast } = weatherData;
  const rainForecast = forecast.slice(0, 3);
  const willRain = rainForecast.some((day) => (day.rainChance || 0) >= 60 && (day.rainfall || 0) >= 2.0);

  if (lang === 'sw') {
    if (willRain) {
      return "Mvua kubwa inatarajiwa katika siku 3 zijazo. Punguza au usimamishe umwagiliaji ili kuzuia dimbwi la maji.";
    } else {
      return "Hakuna mvua kubwa inayotarajiwa. Kudumisha ratiba ya kawaida ya umwagiliaji kulingana na unyevu wa udongo.";
    }
  }

  if (willRain) {
    return "Significant rainfall expected in the next 3 days. Reduce or pause irrigation to prevent waterlogging.";
  } else {
    return "No significant rainfall expected. Maintain regular irrigation schedule based on soil moisture.";
  }
}

function generateHarvestAdvice(weatherData: WeatherData, lang: string): string {
  const { forecast } = weatherData;
  const rainRisk = forecast.slice(0, 2).some((day) => (day.rainChance || 0) >= 60 && (day.rainfall || 0) >= 2.0);

  if (lang === 'sw') {
    if (rainRisk) {
      return "Hali ya unyevu inatarajiwa. Chelewesha uvunaji ikiwezekana ili kuzuia ukungu wa nafaka, au weka mazao katika ghala kavu mara moja.";
    } else {
      return "Hali ya ukavu inafaa kwa uvunaji. Weka salama na ukaushe mazao yaliyokomaa sasa.";
    }
  }

  if (rainRisk) {
    return "Wet conditions expected. Delay harvest if possible to prevent grain molding, or secure crops in dry storage immediately.";
  } else {
    return "Dry conditions favorable for harvesting. Secure and dry mature crops now.";
  }
}

function getPestRiskLevel(conditions: boolean): 'LOW' | 'MODERATE' | 'HIGH' {
  return conditions ? 'HIGH' : 'LOW';
}

function generatePestRecommendation(conditions: boolean, lang: string): string {
  if (lang === 'sw') {
    if (conditions) {
      return "Hatari kubwa ya magonjwa ya kuvu (k.v. ukungu) na wadudu waharibifu kwa sababu ya unyevunyevu mwingi na joto. Kagua mashamba kila siku.";
    } else {
      return "Hatari ndogo ya wadudu. Endelea na ukaguzi wa kawaida wa kila wiki wa shamba.";
    }
  }

  if (conditions) {
    return "High risk of fungal diseases (e.g. blight) and insect pests due to high humidity and warm temperatures. Scout fields daily.";
  } else {
    return "Low pest risk. Continue regular weekly field scouting.";
  }
}

function generateFertilizerAdvice(weatherData: WeatherData, lang: string): string {
  const { forecast } = weatherData;
  const heavyRainExpected = forecast.some((day) => (day.rainfall || 0) >= 15.0);

  if (lang === 'sw') {
    if (heavyRainExpected) {
      return "Mvua kubwa inatarajiwa. Chelewesha uwekaji mbolea ili kuzuia upotevu wa virutubisho na mtiririko wa maji.";
    } else {
      return "Kasi nzuri ya upepo na mvua ndogo/hakuna mvua. Ni salama kuweka mbolea.";
    }
  }

  if (heavyRainExpected) {
    return "Heavy rain forecasted. Delay fertilizer application to prevent nutrient leaching and runoff.";
  } else {
    return "Favorable wind speeds and light/no rain. Safe to apply fertilizers.";
  }
}

function generateRiskAlerts(weatherData: WeatherData, lang: string): string[] {
  const alerts: string[] = [];
  const { forecast } = weatherData;

  const minTemp = Math.min(...forecast.map((day) => day.tempMin));
  if (minTemp < 6) {
    alerts.push(lang === 'sw' 
      ? "Hatari ya baridi kali: Joto la chini sana linaweza kuharibu majani laini."
      : "Frost risk: Extreme cold temperatures may damage sensitive foliage.");
  } else if (minTemp < 12) {
    alerts.push(lang === 'sw'
      ? "Baridi kali: Joto la usiku liko chini ya kiwango kizuri kwa mazao ya msimu wa joto."
      : "Cold stress: Night temperatures are below optimal for warm-season crops.");
  }

  const dryDays = forecast.filter((day) => (day.rainfall || 0) < 1.0).length;
  if (dryDays >= 6) {
    alerts.push(lang === 'sw'
      ? "Kipindi cha ukavu: Mvua ndogo au hakuna inayotarajiwa kwa wiki."
      : "Dry spell: Little to no rainfall forecasted for the week.");
  }

  const heavyRainDays = forecast.filter((day) => (day.rainfall || 0) >= 30.0).length;
  if (heavyRainDays > 0) {
    alerts.push(lang === 'sw'
      ? "Tahadhari ya mvua kubwa: Mtiririko wa maji na mmomonyoko wa udongo unawezekana."
      : "Heavy rain alert: Runoff and local soil erosion possible.");
  }

  return alerts;
}

interface CropCriteria {
  name: string;
  swName: string;
  minTemp: number;
  maxTemp: number;
  minRainfallWeekly: number;
  maxHumidity?: number;
  suitabilityText: string;
  suitabilityTextSw: string;
  unsuitableText: string;
  unsuitableTextSw: string;
}

const CROPS_DB: CropCriteria[] = [
  {
    name: 'maize',
    swName: 'mahindi',
    minTemp: 18,
    maxTemp: 28,
    minRainfallWeekly: 12,
    suitabilityText: 'Excellent temperature range and moderate rainfall for maize growth.',
    suitabilityTextSw: 'Joto nzuri na mvua ya wastani kwa ajili ya ukuaji wa mahindi.',
    unsuitableText: 'Suboptimal: Requires warm temperatures (18-28°C) and moderate moisture.',
    unsuitableTextSw: 'Chini ya kiwango: Inahimili joto (18-28°C) na unyevu wa kutosha.'
  },
  {
    name: 'tea',
    swName: 'chai',
    minTemp: 14,
    maxTemp: 25,
    minRainfallWeekly: 25,
    suitabilityText: 'Cool highland temperatures and high rainfall match tea plant requirements.',
    suitabilityTextSw: 'Joto la chini la nyanda za juu na mvua nyingi vinalingana na mahitaji ya mmea wa chai.',
    unsuitableText: 'Unsuitable: Tea requires consistently cool temperatures (14-25°C) and high rainfall.',
    unsuitableTextSw: 'Haitafaa: Chai inahitaji joto la chini (14-25°C) na mvua nyingi mfululizo.'
  },
  {
    name: 'coffee',
    swName: 'kahawa',
    minTemp: 16,
    maxTemp: 24,
    minRainfallWeekly: 15,
    suitabilityText: 'Mild temperatures and adequate soil moisture support coffee cherries maturation.',
    suitabilityTextSw: 'Joto la wastani na unyevu wa kutosha wa udongo unasaidia kukomaa kwa kahawa.',
    unsuitableText: 'Suboptimal: Coffee requires moderate temperatures (16-24°C) and well-drained soils.',
    unsuitableTextSw: 'Chini ya kiwango: Kahawa inahitaji joto la wastani (16-24°C) na udongo usiotuza maji.'
  },
  {
    name: 'tomatoes',
    swName: 'nyanya',
    minTemp: 18,
    maxTemp: 27,
    minRainfallWeekly: 5,
    maxHumidity: 80,
    suitabilityText: 'Warm temperature and dry conditions reduce tomato blight vulnerability.',
    suitabilityTextSw: 'Joto nzuri na hali ya ukavu inapunguza uwezekano wa nyanya kupata magonjwa ya ukungu.',
    unsuitableText: 'High risk: Excessively humid (>80% RH) or cold conditions promote fungal blights.',
    unsuitableTextSw: 'Hatari kubwa: Unyevunyevu mwingi (>80% RH) au baridi inachochea magonjwa ya kuvu.'
  },
  {
    name: 'potatoes',
    swName: 'viazi mviringo',
    minTemp: 12,
    maxTemp: 20,
    minRainfallWeekly: 10,
    suitabilityText: 'Cool highland climate is perfect for potato tuber bulking.',
    suitabilityTextSw: 'Hali ya hewa ya baridi ya nyanda za juu ni kamili kwa ajili ya viazi.',
    unsuitableText: 'Suboptimal: High temperatures (>24°C) severely inhibit potato tuberization.',
    unsuitableTextSw: 'Chini ya kiwango: Joto la juu (>24°C) linazuia viazi kutengeneza viazi vyenyewe.'
  }
];

function generateCropRecommendations(weatherData: WeatherData, lang: string): Record<string, string> {
  const { current, forecast } = weatherData;
  const avgTemp = forecast.reduce((sum, day) => sum + ((day.tempMax + day.tempMin) / 2), 0) / forecast.length;
  const totalRainfall = forecast.reduce((sum, day) => sum + (day.rainfall || 0), 0);
  const avgHumidity = forecast.reduce((sum, day) => sum + (day.humidity || current.humidity), 0) / forecast.length;

  const recommendations: Record<string, string> = {};

  for (const crop of CROPS_DB) {
    const isTempOk = avgTemp >= crop.minTemp && avgTemp <= crop.maxTemp;
    const isRainOk = totalRainfall >= crop.minRainfallWeekly;
    const isHumidityOk = crop.maxHumidity ? avgHumidity <= crop.maxHumidity : true;

    const cropKey = lang === 'sw' ? crop.swName : crop.name;

    if (isTempOk && isRainOk && isHumidityOk) {
      recommendations[cropKey] = lang === 'sw' 
        ? `Hali nzuri sana: ${crop.suitabilityTextSw}`
        : `Optimal conditions: ${crop.suitabilityText}`;
    } else if (isTempOk && !isRainOk) {
      recommendations[cropKey] = lang === 'sw'
        ? `Joto nzuri lakini kuna ukavu. Mazao yanaweza kukua kwa umwagiliaji.`
        : `Good temperature but dry. Crop can grow with supplemental irrigation.`;
    } else {
      recommendations[cropKey] = lang === 'sw' ? crop.unsuitableTextSw : crop.unsuitableText;
    }
  }

  return recommendations;
}