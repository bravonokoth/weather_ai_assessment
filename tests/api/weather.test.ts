/**
 * Tests for /api/weather — GET route
 *
 * The route is tested in two modes:
 *   1. No API key → returns deterministic demo data
 *   2. API key present → fetch is mocked to return controlled responses
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../app/api/weather/route';


// Helper: construct a Request with query params

const makeRequest = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/weather');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
};

async function callWeather(params: Record<string, string> = {}) {
  const res = await GET(makeRequest(params)) as any;
  return { status: res.status, data: await res.json() };
}


// Mock fetch globally

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.WEATHER_API_KEY;
});


// 1. Input validation

describe('GET /api/weather — input validation', () => {
  it('returns 400 when lat is missing', async () => {
    const { status, data } = await callWeather({ lon: '36.8219' });
    expect(status).toBe(400);
    expect(data.error).toMatch(/latitude|longitude/i);
  });

  it('returns 400 when lon is missing', async () => {
    const { status, data } = await callWeather({ lat: '-1.2921' });
    expect(status).toBe(400);
    expect(data.error).toMatch(/latitude|longitude/i);
  });

  it('returns 400 when both lat and lon are missing', async () => {
    const { status } = await callWeather({});
    expect(status).toBe(400);
  });
});


// 2. Demo data fallback (no API key)

describe('GET /api/weather — demo data fallback', () => {
  it('returns demo data when no WEATHER_API_KEY is set', async () => {
    const { status, data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });
    expect(status).toBe(200);
    expect(data).toHaveProperty('current');
    expect(data).toHaveProperty('forecast');
    expect(data).toHaveProperty('aiSummary');
    expect(data).toHaveProperty('location');
  });

  it('demo data has correct location coords', async () => {
    const { data } = await callWeather({ lat: '-0.0917', lon: '34.7680' });
    expect(data.location.lat).toBeCloseTo(-0.0917, 3);
    expect(data.location.lon).toBeCloseTo(34.768, 3);
  });

  it('demo forecast has exactly 7 days', async () => {
    const { data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });
    expect(data.forecast).toHaveLength(7);
  });

  it('demo current weather has all required fields', async () => {
    const { data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });
    const { current } = data;
    expect(current).toHaveProperty('temp');
    expect(current).toHaveProperty('humidity');
    expect(current).toHaveProperty('windSpeed');
    expect(current).toHaveProperty('rainfall');
    expect(current).toHaveProperty('uvIndex');
    expect(current).toHaveProperty('condition');
  });

  it('demo forecast days have all required fields', async () => {
    const { data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });
    data.forecast.forEach((day: any) => {
      expect(day).toHaveProperty('date');
      expect(day).toHaveProperty('tempMax');
      expect(day).toHaveProperty('tempMin');
      expect(day).toHaveProperty('rainChance');
      expect(day).toHaveProperty('rainfall');
      expect(day).toHaveProperty('condition');
    });
  });

  it('demo forecast dates are in ISO format (YYYY-MM-DD)', async () => {
    const { data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });
    data.forecast.forEach((day: any) => {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});


// 3. Live API path (API key present)

describe('GET /api/weather — live API path', () => {
  beforeEach(() => {
    process.env.WEATHER_API_KEY = 'wai_test_key';
  });

  it('falls back to demo data when fetch returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    const { status, data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });
    expect(status).toBe(200);
    expect(data.location.county).toBe('Nairobi'); // demo data default
  });

  it('falls back to demo data when fetch throws a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const { status, data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });
    expect(status).toBe(200);
    expect(data).toHaveProperty('forecast');
  });

  it('transforms API response correctly when API returns valid data', async () => {
    const apiPayload = {
      current: { temperature: 22, humidity: 75, wind_speed: 12, condition_code: 2 },
      daily: [
        {
          date: '2026-06-05', temp_max: 26, temp_min: 18,
          precipitation_probability: 40, precipitation_sum: 8,
          humidity: 70, condition_code: 1,
        },
      ],
      ai_summary: 'Cloudy with moderate humidity.',
    };

    // First fetch → weather API; second fetch → Nominatim reverse geocode
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => apiPayload })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ address: { county: 'Kiambu' } }),
      });

    const { data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });

    expect(data.current.temp).toBe(22);
    expect(data.current.humidity).toBe(75);
    expect(data.location.county).toBe('Kiambu');
    expect(data.aiSummary).toBe('Cloudy with moderate humidity.');
    expect(data.forecast[0].tempMax).toBe(26);
    expect(data.forecast[0].rainChance).toBe(40);
  });

  it('falls back to demo data when API response has no current field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ daily: [] }),
    });
    const { data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });
    expect(data.location.county).toBe('Nairobi');
  });
});


// 4. WMO weather condition code mapping

describe('GET /api/weather — WMO condition code mapping (via API response)', () => {
  beforeEach(() => {
    process.env.WEATHER_API_KEY = 'wai_test_key';
  });

  const codeToCondition: Array<[number, string]> = [
    [0, 'Clear Sky'],
    [1, 'Mainly Clear'],
    [2, 'Partly Cloudy'],
    [3, 'Overcast'],
    [45, 'Foggy'],
    [63, 'Rainy'],
    [95, 'Thunderstorm'],
    [999, 'Partly Cloudy'], // unknown → default
  ];

  codeToCondition.forEach(([code, expected]) => {
    it(`maps WMO code ${code} → "${expected}"`, async () => {
      const apiPayload = {
        current: { temperature: 22, humidity: 70, wind_speed: 10, condition_code: code },
        daily: [{
          date: '2026-06-05', temp_max: 24, temp_min: 18,
          precipitation_probability: 20, precipitation_sum: 2,
          condition_code: code,
        }],
      };
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => apiPayload })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ address: {} }) });

      const { data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });
      expect(data.current.condition).toBe(expected);
    });
  });
});


// 5. AI summary generation

describe('GET /api/weather — local AI summary fallback', () => {
  beforeEach(() => {
    process.env.WEATHER_API_KEY = 'wai_test_key';
  });

  it('generates heavy rain summary when rainfall > 10mm', async () => {
    const apiPayload = {
      current: { temperature: 20, humidity: 85, wind_speed: 8, condition_code: 61 },
      daily: [{
        date: '2026-06-05', temp_max: 22, temp_min: 16,
        precipitation_probability: 80, precipitation_sum: 15, condition_code: 61,
      }],
      // no ai_summary → triggers local generation
    };
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => apiPayload })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ address: {} }) });

    const { data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });
    expect(data.aiSummary).toMatch(/replenishment|runoff|mvua/i);
  });

  it('generates dry conditions summary when rainfall = 0', async () => {
    const apiPayload = {
      current: { temperature: 28, humidity: 40, wind_speed: 15, condition_code: 0 },
      daily: [{
        date: '2026-06-05', temp_max: 32, temp_min: 22,
        precipitation_probability: 5, precipitation_sum: 0, condition_code: 0,
      }],
    };
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => apiPayload })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ address: {} }) });

    const { data } = await callWeather({ lat: '-1.2921', lon: '36.8219' });
    expect(data.aiSummary).toMatch(/dry|irrigation|mulch/i);
  });
});
