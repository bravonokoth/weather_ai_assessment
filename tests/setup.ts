import { vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock next/server so route handlers can be imported in a plain Node env
// ---------------------------------------------------------------------------
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((data: unknown, init?: ResponseInit) => ({
        _data: data,
        status: init?.status ?? 200,
        ok: (init?.status ?? 200) < 400,
        json: async () => data,
      })),
    },
  };
});

// ---------------------------------------------------------------------------
// Reset all mocks before each test
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks();
  // Default: no API key set
  delete process.env.WEATHER_API_KEY;
});
