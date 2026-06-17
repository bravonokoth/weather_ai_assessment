import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../../app/api/trees/analyze/route';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.WEATHER_API_KEY;
});

// Helper to make a POST Request with FormData
const makeFormRequest = (fields: Record<string, string | Blob> = {}) => {
  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    formData.append(k, v);
  });
  return new Request('http://localhost/api/trees/analyze', {
    method: 'POST',
    body: formData,
  });
};

async function callTreesAnalyze(fields: Record<string, string | Blob> = {}) {
  const res = await POST(makeFormRequest(fields)) as any;
  return { status: res.status, data: await res.json() };
}

describe('POST /api/trees/analyze — input validation', () => {
  it('returns 400 when image is missing', async () => {
    const { status, data } = await callTreesAnalyze({ farmerId: 'F-01' });
    expect(status).toBe(400);
    expect(data.error).toMatch(/image/i);
  });
});

describe('POST /api/trees/analyze — demo fallback', () => {
  it('returns demo analysis data when WEATHER_API_KEY is not configured', async () => {
    const fakeImage = new Blob(['fake image content'], { type: 'image/jpeg' });
    const { status, data } = await callTreesAnalyze({
      image: fakeImage,
      farmerId: 'F-100',
      county: 'Kericho',
      landAcres: '3.5',
      location: 'Main Field',
      notes: 'Tea plants here',
    });

    expect(status).toBe(200);
    expect(data.analysis_id).toBeDefined();
    expect(data.total_tree_count).toBe(84);
    expect(data.farmer_id).toBe('F-100');
    expect(data.county).toBe('Kericho');
    expect(data.land_acres).toBe(3.5);
    expect(data.tree_species_guess).toBe('Tea (Camellia sinensis)');
    expect(data.observations.length).toBeGreaterThan(0);
  });
});

describe('POST /api/trees/analyze — live path', () => {
  beforeEach(() => {
    process.env.WEATHER_API_KEY = 'wai_test_tree_key';
  });

  it('forwards request to Weather AI API and returns live response', async () => {
    const mockSuccessResponse = {
      analysis_id: 'api_live_123',
      total_tree_count: 150,
      tree_health: { healthy: 140, needs_care: 8, needs_replacement: 2 },
      observations: ['Mock observations'],
      recommendations: ['Mock recommendations'],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    const fakeImage = new Blob(['live image data'], { type: 'image/png' });
    const { status, data } = await callTreesAnalyze({ image: fakeImage });

    expect(status).toBe(200);
    expect(data.analysis_id).toBe('api_live_123');
    expect(data.total_tree_count).toBe(150);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('falls back to demo response if upstream API fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const fakeImage = new Blob(['live image data'], { type: 'image/png' });
    const { status, data } = await callTreesAnalyze({ image: fakeImage });

    expect(status).toBe(200);
    expect(data.analysis_id).toMatch(/^demo_/);
    expect(data.total_tree_count).toBe(84);
  });

  it('falls back to demo response if fetch throws error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const fakeImage = new Blob(['live image data'], { type: 'image/png' });
    const { status, data } = await callTreesAnalyze({ image: fakeImage });

    expect(status).toBe(200);
    expect(data.analysis_id).toMatch(/^demo_/);
  });
});
