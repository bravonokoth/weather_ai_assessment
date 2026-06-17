/**
 * Tests for /api/geocode — GET route
 *
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../app/api/geocode/route';


// Helper: construct a Request with query params

const makeRequest = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/geocode');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
};

async function callGeocode(params: Record<string, string> = {}) {
  const res = await GET(makeRequest(params)) as any;
  return { status: res.status, data: await res.json() };
}

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.WEATHER_API_KEY;
});


// 1. Input validation

describe('GET /api/geocode — input validation', () => {
  it('returns 400 when city param is missing', async () => {
    const { status, data } = await callGeocode({});
    expect(status).toBe(400);
    expect(data.error).toMatch(/city/i);
  });

  it('returns 400 when city param is an empty string', async () => {
    const { status } = await callGeocode({ city: '' });
    expect(status).toBe(400);
  });
});

// 2. Built-in city lookup (CITY_COORDS)

describe('GET /api/geocode — built-in city lookup', () => {
  const knownCities: Array<[string, number, number]> = [
    ['nairobi',  -1.2921, 36.8219],
    ['mombasa',  -4.0435, 39.6582],
    ['kisumu',   -0.0917, 34.768],
    ['nakuru',   -0.2866, 36.0665],
    ['eldoret',   0.5143, 35.2698],
    ['thika',    -1.03,   37.0769],
    ['kakamega',  0.3186, 34.7778],
    ['kisii',    -0.6798, 34.7654],
    ['nyeri',    -0.5439, 36.957],
    ['meru',      0.0465, 37.7266],
  ];

  knownCities.forEach(([city, lat, lon]) => {
    it(`returns correct coords for "${city}"`, async () => {
      const { status, data } = await callGeocode({ city });
      expect(status).toBe(200);
      expect(data.lat).toBeCloseTo(lat, 2);
      expect(data.lon).toBeCloseTo(lon, 2);
    });
  });
});


// 3. Case-insensitive & whitespace trimming

describe('GET /api/geocode — case and whitespace handling', () => {
  it('resolves "Nairobi" (title case)', async () => {
    const { data } = await callGeocode({ city: 'Nairobi' });
    expect(data.lat).toBeCloseTo(-1.2921, 3);
  });

  it('resolves "MOMBASA" (all caps)', async () => {
    const { data } = await callGeocode({ city: 'MOMBASA' });
    expect(data.lat).toBeCloseTo(-4.0435, 3);
  });

  it('resolves " kisumu " (leading/trailing spaces)', async () => {
    const { data } = await callGeocode({ city: ' kisumu ' });
    expect(data.lat).toBeCloseTo(-0.0917, 3);
  });
});


// 4. Unknown city — fallback to Nairobi defaults

describe('GET /api/geocode — unknown city fallback', () => {
  it('returns Nairobi coords when city is unknown and no API key', async () => {
    const { status, data } = await callGeocode({ city: 'atlantis' });
    expect(status).toBe(200);
    expect(data.lat).toBeCloseTo(-1.2921, 3);
    expect(data.lon).toBeCloseTo(36.8219, 3);
  });
});


// 5. Live API path (with API key, unknown city)

describe('GET /api/geocode — live IP-lookup path', () => {
  beforeEach(() => {
    process.env.WEATHER_API_KEY = 'wai_test_key';
  });

  it('uses IP-lookup API coords when city is unknown and API key is set', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lat: 0.5143, lon: 35.2698 }), // Eldoret
    });
    const { status, data } = await callGeocode({ city: 'unknown-city-xyz' });
    expect(status).toBe(200);
    expect(data.lat).toBeCloseTo(0.5143, 3);
    expect(data.lon).toBeCloseTo(35.2698, 3);
  });

  it('falls back to Nairobi when IP-lookup API fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    const { data } = await callGeocode({ city: 'unknownplace' });
    expect(data.lat).toBeCloseTo(-1.2921, 3);
    expect(data.lon).toBeCloseTo(36.8219, 3);
  });

  it('falls back to Nairobi when IP-lookup fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const { data } = await callGeocode({ city: 'brokenplace' });
    expect(data.lat).toBeCloseTo(-1.2921, 3);
  });

  it('still resolves known city without calling external API', async () => {
    const { data } = await callGeocode({ city: 'nakuru' });
    // Nakuru is in the built-in map — fetch should NOT have been called
    expect(mockFetch).not.toHaveBeenCalled();
    expect(data.lat).toBeCloseTo(-0.2866, 3);
  });
});
