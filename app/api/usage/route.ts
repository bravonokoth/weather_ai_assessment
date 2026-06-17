import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        requestsUsed: 0,
        requestsLimit: 1000,
        aiUsed: 0,
        aiLimit: 200,
        resetDate: new Date().toISOString()
      });
    }

    const response = await fetch(`https://api.weather-ai.co/v1/usage`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json({
        requestsUsed: 0,
        requestsLimit: 1000,
        aiUsed: 0,
        aiLimit: 200,
        resetDate: new Date().toISOString()
      });
    }

    const data = await response.json();

    return NextResponse.json({
      requestsUsed: data.period?.requestCount ?? 0,
      requestsLimit: data.limits?.requests ?? 1000,
      aiUsed: data.period?.aiRequestCount ?? 0,
      aiLimit: data.limits?.aiRequests ?? 200,
      resetDate: data.period?.end ?? new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      requestsUsed: 0,
      requestsLimit: 1000,
      aiUsed: 0,
      aiLimit: 200,
      resetDate: new Date().toISOString()
    });
  }
}