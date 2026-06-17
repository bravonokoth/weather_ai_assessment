/**
 * Tests for /api/usage — GET route
 *
 * Covers: no-API-key zero fallback, successful API response mapping,
 * non-ok API response fallback, and network error fallback.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../app/api/usage/route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const makeRequest = () => new Request('http://localhost/api/usage');

async function callUsage() {
  const res = await GET() as any;
  return { status: res.status, data: await res.json() };
}

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.WEATHER_API_KEY;
});


// 1. No API key — zero fallback

describe('GET /api/usage — no API key', () => {
  it('returns 200 with zeroed usage when no API key is configured', async () => {
    const { status, data } = await callUsage();
    expect(status).toBe(200);
    expect(data.requestsUsed).toBe(0);
    expect(data.aiUsed).toBe(0);
  });

  it('returns default limits (1000 / 200) when no API key is configured', async () => {
    const { data } = await callUsage();
    expect(data.requestsLimit).toBe(1000);
    expect(data.aiLimit).toBe(200);
  });

  it('returns a valid ISO date string for resetDate', async () => {
    const { data } = await callUsage();
    expect(() => new Date(data.resetDate).toISOString()).not.toThrow();
  });

  it('does NOT call fetch when no API key is set', async () => {
    await callUsage();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});


// 2. Successful API response — data mapping

describe('GET /api/usage — successful API response', () => {
  beforeEach(() => {
    process.env.WEATHER_API_KEY = 'wai_test_key';
  });

  it('maps period.requestCount → requestsUsed', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        period: { requestCount: 64, aiRequestCount: 12, end: '2026-07-01T00:00:00Z' },
        limits: { requests: 1000, aiRequests: 200 },
      }),
    });
    const { data } = await callUsage();
    expect(data.requestsUsed).toBe(64);
  });

  it('maps period.aiRequestCount → aiUsed', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        period: { requestCount: 64, aiRequestCount: 12, end: '2026-07-01T00:00:00Z' },
        limits: { requests: 1000, aiRequests: 200 },
      }),
    });
    const { data } = await callUsage();
    expect(data.aiUsed).toBe(12);
  });

  it('maps limits.requests → requestsLimit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        period: { requestCount: 0, aiRequestCount: 0, end: '2026-07-01T00:00:00Z' },
        limits: { requests: 500, aiRequests: 100 },
      }),
    });
    const { data } = await callUsage();
    expect(data.requestsLimit).toBe(500);
  });

  it('maps limits.aiRequests → aiLimit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        period: { requestCount: 0, aiRequestCount: 0, end: '2026-07-01T00:00:00Z' },
        limits: { requests: 1000, aiRequests: 50 },
      }),
    });
    const { data } = await callUsage();
    expect(data.aiLimit).toBe(50);
  });

  it('maps period.end → resetDate', async () => {
    const resetDate = '2026-07-04T00:00:00Z';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        period: { requestCount: 10, aiRequestCount: 5, end: resetDate },
        limits: { requests: 1000, aiRequests: 200 },
      }),
    });
    const { data } = await callUsage();
    expect(data.resetDate).toBe(resetDate);
  });

  it('defaults requestsUsed to 0 when period.requestCount is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        period: { aiRequestCount: 5, end: '2026-07-01T00:00:00Z' },
        limits: { requests: 1000, aiRequests: 200 },
      }),
    });
    const { data } = await callUsage();
    expect(data.requestsUsed).toBe(0);
  });

  it('defaults requestsLimit to 1000 when limits.requests is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        period: { requestCount: 10, aiRequestCount: 5, end: '2026-07-01T00:00:00Z' },
        limits: { aiRequests: 200 },
      }),
    });
    const { data } = await callUsage();
    expect(data.requestsLimit).toBe(1000);
  });
});


// 3. Non-ok API response — fallback to zeros

describe('GET /api/usage — non-ok API response', () => {
  beforeEach(() => {
    process.env.WEATHER_API_KEY = 'wai_test_key';
  });

  it('returns zeroed usage when API returns 401', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) });
    const { data } = await callUsage();
    expect(data.requestsUsed).toBe(0);
    expect(data.aiUsed).toBe(0);
    expect(data.requestsLimit).toBe(1000);
    expect(data.aiLimit).toBe(200);
  });

  it('returns zeroed usage when API returns 500', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    const { data } = await callUsage();
    expect(data.requestsUsed).toBe(0);
  });
});


// 4. Network error — fallback to zeros

describe('GET /api/usage — network errors', () => {
  beforeEach(() => {
    process.env.WEATHER_API_KEY = 'wai_test_key';
  });

  it('returns zeroed usage when fetch throws a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const { data } = await callUsage();
    expect(data.requestsUsed).toBe(0);
    expect(data.aiUsed).toBe(0);
  });

  it('returns valid resetDate even after a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'));
    const { data } = await callUsage();
    expect(() => new Date(data.resetDate).toISOString()).not.toThrow();
  });
});
