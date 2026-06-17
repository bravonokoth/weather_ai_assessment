import { NextResponse } from 'next/server';

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  nairobi: { lat: -1.2921, lon: 36.8219 },
  mombasa: { lat: -4.0435, lon: 39.6582 },
  kisumu: { lat: -0.0917, lon: 34.7680 },
  nakuru: { lat: -0.2866, lon: 36.0665 },
  eldoret: { lat: 0.5143, lon: 35.2698 },
  thika: { lat: -1.0300, lon: 37.0769 },
  kakamega: { lat: 0.3186, lon: 34.7778 },
  kisii: { lat: -0.6798, lon: 34.7654 },
  nyeri: { lat: -0.5439, lon: 36.9570 },
  meru: { lat: 0.0465, lon: 37.7266 },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city) {
      return NextResponse.json(
        { error: 'City name is required' },
        { status: 400 }
      );
    }

    const normalized = city.toLowerCase().trim();
    const coords = CITY_COORDS[normalized];

    if (coords) {
      return NextResponse.json(coords);
    }

    const apiKey = process.env.WEATHER_API_KEY;
    if (apiKey) {
      const url = `https://api.weather-ai.co/v1/ip-lookup`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({ lat: data.lat, lon: data.lon });
      }
    }

    return NextResponse.json({ lat: -1.2921, lon: 36.8219 });
  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { lat: -1.2921, lon: 36.8219 }
    );
  }
}