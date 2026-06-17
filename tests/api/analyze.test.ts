/**
 * Tests for /api/analyze — POST route
 */
import { describe, it, expect, vi } from 'vitest';
import { POST } from '../../app/api/analyze/route';


/** A single forecast day with sensible defaults */
const makeDay = (overrides: Partial<{
  date: string; tempMax: number; tempMin: number;
  rainChance: number; rainfall: number; humidity: number; condition: string;
}> = {}) => ({
  date: '2026-06-05',
  tempMax: 24,
  tempMin: 18,
  rainChance: 30,
  rainfall: 5,
  humidity: 65,
  condition: 'Partly Cloudy',
  ...overrides,
});

/** Standard current weather with sensible defaults */
const makeCurrent = (overrides: Partial<{
  temp: number; humidity: number; windSpeed: number;
  rainfall: number; uvIndex: number; condition: string;
}> = {}) => ({
  temp: 22,
  humidity: 65,
  windSpeed: 10,
  rainfall: 2,
  uvIndex: 5,
  condition: 'Partly Cloudy',
  ...overrides,
});

/** Builds a complete WeatherData payload */
const makeWeatherData = (
  currentOverrides = {},
  forecastDays = 7,
  dayOverrides = {}
) => ({
  current: makeCurrent(currentOverrides),
  forecast: Array.from({ length: forecastDays }, () => makeDay(dayOverrides)),
  aiSummary: 'Test summary',
  location: { lat: -1.2921, lon: 36.8219, county: 'Nairobi' },
});

/** Wraps a payload in a Request for the POST handler */
const makeRequest = (body: object) =>
  new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// Helper: call handler and extract JSON response body

async function callAnalyze(body: object) {
  const res = await POST(makeRequest(body)) as any;
  return { status: res.status, data: await res.json() };
}

// 1. Input validation
describe('POST /api/analyze — input validation', () => {
  it('returns 400 when weatherData is missing', async () => {
    const { status, data } = await callAnalyze({});
    expect(status).toBe(400);
    expect(data).toMatchObject({ error: 'Weather data is required' });
  });

  it('returns 400 when body is empty object with no weatherData key', async () => {
    const { status } = await callAnalyze({ lang: 'en' });
    expect(status).toBe(400);
  });
});

// 2. Response shape

describe('POST /api/analyze — response shape', () => {
  it('returns all expected top-level keys', async () => {
    const { status, data } = await callAnalyze({ weatherData: makeWeatherData() });
    expect(status).toBe(200);
    expect(data).toHaveProperty('plantingAdvice');
    expect(data).toHaveProperty('irrigationAdvice');
    expect(data).toHaveProperty('harvestAdvice');
    expect(data).toHaveProperty('pestRisk');
    expect(data).toHaveProperty('pestRecommendation');
    expect(data).toHaveProperty('fertilizerAdvice');
    expect(data).toHaveProperty('riskAlerts');
    expect(data).toHaveProperty('cropRecommendations');
    expect(data).toHaveProperty('analysis');
  });

  it('analysis sub-object has all expected keys', async () => {
    const { data } = await callAnalyze({ weatherData: makeWeatherData() });
    const { analysis } = data;
    expect(analysis).toHaveProperty('temperatureTrend');
    expect(analysis).toHaveProperty('rainfallTotal');
    expect(analysis).toHaveProperty('droughtRisk');
    expect(analysis).toHaveProperty('floodRisk');
    expect(analysis).toHaveProperty('pestConditions');
    expect(analysis).toHaveProperty('plantingWindows');
    expect(analysis).toHaveProperty('harvestingWindows');
    expect(analysis).toHaveProperty('cropHealth');
  });

  it('cropRecommendations contains entries for all 5 regional crops', async () => {
    const { data } = await callAnalyze({ weatherData: makeWeatherData() });
    const crops = Object.keys(data.cropRecommendations);
    expect(crops).toHaveLength(5);
    // English crop names expected when lang defaults to 'en'
    expect(crops).toEqual(expect.arrayContaining(['maize', 'tea', 'coffee', 'tomatoes', 'potatoes']));
  });
});


// 3. Planting advice logic

describe('POST /api/analyze — planting advice', () => {
  it('returns cold planting warning when avgTemp < 12', async () => {
    const wd = makeWeatherData({}, 7, { tempMax: 10, tempMin: 5 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.plantingAdvice.toLowerCase()).toMatch(/cold|baridi/i);
  });

  it('returns hot planting warning when avgTemp > 33', async () => {
    const wd = makeWeatherData({}, 7, { tempMax: 38, tempMin: 32 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.plantingAdvice.toLowerCase()).toMatch(/hot|joto/i);
  });

  it('recommends irrigation when total weekly rainfall < 10mm', async () => {
    const wd = makeWeatherData({}, 7, { tempMax: 24, tempMin: 18, rainfall: 1 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.plantingAdvice).toMatch(/irrigation|umwagiliaji/i);
  });

  it('gives positive planting advice in ideal conditions', async () => {
    const wd = makeWeatherData({}, 7, { tempMax: 25, tempMin: 19, rainfall: 8 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.plantingAdvice).toMatch(/good|favorable|adequate|nzuri/i);
  });
});


// 4. Irrigation advice logic

describe('POST /api/analyze — irrigation advice', () => {
  it('advises reducing irrigation when significant rain expected in 3 days', async () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      makeDay(i < 3 ? { rainChance: 70, rainfall: 5 } : {})
    );
    const wd = { ...makeWeatherData(), forecast: days };
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.irrigationAdvice).toMatch(/reduce|pause|punguza/i);
  });

  it('advises maintaining schedule when no significant rain expected', async () => {
    const wd = makeWeatherData({}, 7, { rainChance: 10, rainfall: 0 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.irrigationAdvice).toMatch(/maintain|regular|kawaida/i);
  });
});

// 5. Harvest advice logic

describe('POST /api/analyze — harvest advice', () => {
  it('warns to delay harvest when rain expected in next 2 days', async () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      makeDay(i < 2 ? { rainChance: 75, rainfall: 4 } : {})
    );
    const wd = { ...makeWeatherData(), forecast: days };
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.harvestAdvice).toMatch(/delay|wet|unyevu|chelewesha/i);
  });

  it('gives positive harvest advice when dry conditions forecast', async () => {
    const wd = makeWeatherData({}, 7, { rainChance: 5, rainfall: 0 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.harvestAdvice).toMatch(/dry|favorable|ukavu|nzuri/i);
  });
});

// 6. Pest risk logic

describe('POST /api/analyze — pest risk', () => {
  it('returns HIGH pest risk when humidity > 70% and avgTemp > 20°C', async () => {
    const wd = makeWeatherData({ humidity: 80 }, 7, { tempMax: 26, tempMin: 22 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.pestRisk).toBe('HIGH');
  });

  it('returns LOW pest risk when humidity ≤ 70% or temp ≤ 20°C', async () => {
    const wd = makeWeatherData({ humidity: 50 }, 7, { tempMax: 18, tempMin: 12 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.pestRisk).toBe('LOW');
  });
});

// 7. Fertilizer advice logic

describe('POST /api/analyze — fertilizer advice', () => {
  it('advises delaying fertilizer when heavy rain (≥15mm) is forecast', async () => {
    const wd = makeWeatherData({}, 7, { rainfall: 20 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.fertilizerAdvice).toMatch(/delay|leach|chelewesha/i);
  });

  it('marks fertilizer safe when rain is light', async () => {
    const wd = makeWeatherData({}, 7, { rainfall: 2 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.fertilizerAdvice).toMatch(/safe|salama/i);
  });
});

// 8. Risk alerts

describe('POST /api/analyze — risk alerts', () => {
  it('issues frost alert when tempMin < 6°C', async () => {
    const wd = makeWeatherData({}, 7, { tempMin: 3 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.riskAlerts.some((a: string) => /frost|baridi kali/i.test(a))).toBe(true);
  });

  it('issues dry spell alert when ≥6 days have < 1mm rainfall', async () => {
    const wd = makeWeatherData({}, 7, { rainfall: 0 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.riskAlerts.some((a: string) => /dry spell|ukavu/i.test(a))).toBe(true);
  });

  it('issues heavy rain alert when any day has ≥30mm rainfall', async () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      makeDay(i === 3 ? { rainfall: 40 } : {})
    );
    const wd = { ...makeWeatherData(), forecast: days };
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.riskAlerts.some((a: string) => /heavy rain|mvua kubwa/i.test(a))).toBe(true);
  });

  it('returns empty alerts array under normal conditions', async () => {
    const wd = makeWeatherData({}, 7, { tempMin: 16, rainfall: 4 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(Array.isArray(data.riskAlerts)).toBe(true);
    // Under normal conditions no extreme alerts should fire
    expect(data.riskAlerts.every((a: string) => !/frost|dry spell|heavy rain/i.test(a))).toBe(true);
  });
});


// 9. Temperature trend calculation

describe('POST /api/analyze — temperature trend', () => {
  it('detects warming trend', async () => {
    const days = [
      makeDay({ tempMax: 18, tempMin: 14 }),
      makeDay({ tempMax: 19, tempMin: 15 }),
      makeDay({ tempMax: 20, tempMin: 16 }),
      makeDay({ tempMax: 23, tempMin: 18 }),
      makeDay({ tempMax: 25, tempMin: 20 }),
      makeDay({ tempMax: 26, tempMin: 21 }),
      makeDay({ tempMax: 28, tempMin: 22 }),
    ];
    const wd = { ...makeWeatherData(), forecast: days };
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.analysis.temperatureTrend).toBe('warming');
  });

  it('detects cooling trend', async () => {
    const days = [
      makeDay({ tempMax: 30, tempMin: 24 }),
      makeDay({ tempMax: 28, tempMin: 22 }),
      makeDay({ tempMax: 26, tempMin: 20 }),
      makeDay({ tempMax: 22, tempMin: 17 }),
      makeDay({ tempMax: 20, tempMin: 15 }),
      makeDay({ tempMax: 18, tempMin: 13 }),
      makeDay({ tempMax: 17, tempMin: 12 }),
    ];
    const wd = { ...makeWeatherData(), forecast: days };
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.analysis.temperatureTrend).toBe('cooling');
  });

  it('detects stable trend when temperatures are flat', async () => {
    const wd = makeWeatherData({}, 7, { tempMax: 24, tempMin: 18 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.analysis.temperatureTrend).toBe('stable');
  });
});

// 10. Drought & flood risk flags

describe('POST /api/analyze — drought and flood risk', () => {
  it('sets droughtRisk=true when all forecast days have < 5mm rainfall', async () => {
    const wd = makeWeatherData({}, 7, { rainfall: 0 });
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.analysis.droughtRisk).toBe(true);
  });

  it('sets droughtRisk=false when at least one day has ≥5mm rainfall', async () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      makeDay(i === 0 ? { rainfall: 10 } : { rainfall: 0 })
    );
    const wd = { ...makeWeatherData(), forecast: days };
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.analysis.droughtRisk).toBe(false);
  });

  it('sets floodRisk=true when any day has > 50mm rainfall', async () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      makeDay(i === 2 ? { rainfall: 60 } : { rainfall: 3 })
    );
    const wd = { ...makeWeatherData(), forecast: days };
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.analysis.floodRisk).toBe(true);
  });
});


// 11. Swahili localisation
describe('POST /api/analyze — Swahili localisation (lang=sw)', () => {
  it('returns Swahili crop keys instead of English', async () => {
    const { data } = await callAnalyze({ weatherData: makeWeatherData(), lang: 'sw' });
    const crops = Object.keys(data.cropRecommendations);
    expect(crops).toEqual(expect.arrayContaining(['mahindi', 'chai', 'kahawa', 'nyanya', 'viazi mviringo']));
  });

  it('planting advice is in Swahili when lang=sw and conditions are cold', async () => {
    const wd = makeWeatherData({}, 7, { tempMax: 8, tempMin: 4 });
    const { data } = await callAnalyze({ weatherData: wd, lang: 'sw' });
    expect(data.plantingAdvice).toMatch(/baridi/i);
  });

  it('fertilizer advice is in Swahili when lang=sw and heavy rain forecast', async () => {
    const wd = makeWeatherData({}, 7, { rainfall: 20 });
    const { data } = await callAnalyze({ weatherData: wd, lang: 'sw' });
    expect(data.fertilizerAdvice).toMatch(/chelewesha|mbolea/i);
  });

  it('risk alert for dry spell is in Swahili', async () => {
    const wd = makeWeatherData({}, 7, { rainfall: 0 });
    const { data } = await callAnalyze({ weatherData: wd, lang: 'sw' });
    expect(data.riskAlerts.some((a: string) => /ukavu/i.test(a))).toBe(true);
  });
});


// 12. Optimal planting & harvesting windows

describe('POST /api/analyze — planting and harvesting windows', () => {
  it('identifies optimal planting days (15–28°C avg, rainChance ≥ 20%)', async () => {
    const days = [
      makeDay({ tempMax: 26, tempMin: 18, rainChance: 40 }), // avg 22 ✓
      makeDay({ tempMax: 10, tempMin: 5, rainChance: 40 }),   // avg 7.5 ✗ too cold
      makeDay({ tempMax: 22, tempMin: 16, rainChance: 5 }),   // rainChance < 20 ✗
    ];
    const wd = { ...makeWeatherData(), forecast: days };
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.analysis.plantingWindows).toHaveLength(1);
  });

  it('identifies harvesting days (rainChance < 30%)', async () => {
    const days = [
      makeDay({ rainChance: 10 }), // ✓
      makeDay({ rainChance: 25 }), // ✓
      makeDay({ rainChance: 70 }), // ✗
    ];
    const wd = { ...makeWeatherData(), forecast: days };
    const { data } = await callAnalyze({ weatherData: wd });
    expect(data.analysis.harvestingWindows).toHaveLength(2);
  });
});
