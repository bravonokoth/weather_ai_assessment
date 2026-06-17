import { NextResponse } from 'next/server';

interface ApiForecastDay {
  date: string;
  temp_max?: number;
  temp_min?: number;
  rain_chance?: number;
  rainfall?: number;
  humidity?: number;
  condition?: string;
}

interface ForecastDay {
  date: string;
  tempMax: number;
  tempMin: number;
  rainChance: number;
  rainfall: number;
  humidity: number;
  condition: string;
}

interface WeatherResponse {
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    rainfall: number;
    uvIndex: number;
    condition: string;
  };
  forecast: ForecastDay[];
  aiSummary: string;
  location: { lat: number; lon: number; county?: string };
}

function getDemoWeatherData(lat: string, lon: string): WeatherResponse {
  const today = new Date();
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      tempMax: 22 + Math.floor(Math.random() * 8),
      tempMin: 15 + Math.floor(Math.random() * 5),
      rainChance: 20 + Math.floor(Math.random() * 40),
      rainfall: 5 + Math.floor(Math.random() * 15),
      humidity: 60 + Math.floor(Math.random() * 20),
      condition: 'Partly Cloudy',
    };
  });

  return {
    current: {
      temp: 24,
      humidity: 70,
      windSpeed: 10,
      rainfall: 0,
      uvIndex: 6,
      condition: 'Partly Cloudy',
    },
    forecast,
    aiSummary: 'Good conditions for planting maize and beans. Moderate rainfall expected mid-week. Consider irrigation if no rain in 3 days.',
    location: {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      county: 'Nairobi',
    },
  };
}

function getWmoCondition(code: string | number | undefined): string {
  if (code === undefined || code === null) return 'Partly Cloudy';
  const c = Number(code);
  if (c === 0) return 'Clear Sky';
  if (c === 1) return 'Mainly Clear';
  if (c === 2) return 'Partly Cloudy';
  if (c === 3) return 'Overcast';
  if (c === 45 || c === 48) return 'Foggy';
  if (c >= 51 && c <= 55) return 'Drizzle';
  if (c >= 61 && c <= 65) return 'Rainy';
  if (c >= 71 && c <= 75) return 'Snowy';
  if (c >= 80 && c <= 82) return 'Rain showers';
  if (c >= 95 && c <= 99) return 'Thunderstorm';
  return 'Partly Cloudy';
}

function generateLocalAiSummary(currentTemp: number, rainfall: number, condition: string): string {
  let advice = '';
  if (rainfall > 10) {
    advice += 'Significant rainfall detected. Perfect time for soil moisture replenishment. Avoid applying spray treatments to crops to prevent runoff.';
  } else if (rainfall > 0) {
    advice += 'Light rain expected. Good moisture levels, but monitor crops for fungal growth and ensure proper drainage.';
  } else {
    advice += 'Dry conditions prevail. Focus on weeding, mulching, and setting up irrigation schedules to protect crops from heat stress.';
  }
  if (currentTemp > 28) {
    advice += ' High temperatures may stress young seedlings; consider providing light shade and watering in the early morning or evening.';
  } else if (currentTemp < 15) {
    advice += ' Cool weather might slow down maize and tomato germination. Consider focusing on cold-hardy crops.';
  }
  return advice || 'Favorable conditions overall. Monitor soil moisture levels and inspect for pests weekly.';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(getDemoWeatherData(lat, lon));
    }

    const url = `https://api.weather-ai.co/v1/weather?lat=${lat}&lon=${lon}&days=7&units=metric`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      next: { revalidate: 300 },
    }).catch(() => null);

    if (!response || !response.ok) {
      return NextResponse.json(getDemoWeatherData(lat, lon));
    }

    const data = await response.json();

    if (!data.current || (!data.daily?.length && !data.forecast?.length)) {
      return NextResponse.json(getDemoWeatherData(lat, lon));
    }

    // Determine the source of daily/forecast list
    const dailyForecasts = data.daily || data.forecast || [];
    const firstHourly = data.hourly?.[0] || {};
    const firstDaily = dailyForecasts[0] || {};

    // Reverse geocode using Nominatim to get actual county/city name
    let county = 'Kenya';
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        { headers: { 'User-Agent': 'Weather-AI-Farming-Assistant' } }
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        const address = geoData.address || {};
        county = address.county || address.city || address.town || address.suburb || address.village || 'Kenya';
      }
    } catch (e) {
      console.error('Reverse geocode failed:', e);
    }

    const currentTemp = data.current.temperature ?? data.current.temp ?? 24;
    const currentRainfall = firstDaily.precipitation_sum ?? data.current.rainfall ?? 0;
    const conditionText = getWmoCondition(data.current.condition_code ?? data.current.condition);

    const transformedData: WeatherResponse = {
      current: {
        temp: currentTemp,
        humidity: firstHourly.humidity ?? data.current.humidity ?? 70,
        windSpeed: data.current.wind_speed ?? data.current.windSpeed ?? 10,
        rainfall: currentRainfall,
        uvIndex: firstHourly.uv_index ?? data.current.uvIndex ?? 6,
        condition: conditionText,
      },
      forecast: dailyForecasts.map((day: any) => {
        return {
          date: day.date,
          tempMax: day.temp_max ?? day.tempMax ?? 22,
          tempMin: day.temp_min ?? day.tempMin ?? 15,
          rainChance: day.precipitation_probability ?? day.rainChance ?? day.rain_chance ?? 30,
          rainfall: day.precipitation_sum ?? day.rainfall ?? 5,
          humidity: day.humidity ?? 65,
          condition: getWmoCondition(day.condition_code ?? day.condition),
        };
      }),
      aiSummary: data.ai_summary ?? generateLocalAiSummary(currentTemp, currentRainfall, conditionText),
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        county: county,
      },
    };

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Weather route error:', error);
    const url = new URL(request.url);
    const lat = url.searchParams.get('lat') || '-1.2921';
    const lon = url.searchParams.get('lon') || '36.8219';
    return NextResponse.json(getDemoWeatherData(lat, lon));
  }
}