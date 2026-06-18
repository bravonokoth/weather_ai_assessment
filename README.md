# Weather AI Farming Assistant

An AI-powered weather and farming advisory application built for Kenyan farmers. It provides real-time weather data, a 7-day forecast, crop recommendations, and agricultural advice — all backed by the Weather AI API, with full English and Kiswahili support.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Run the Development Server](#4-run-the-development-server)
  - [5. Production Build](#5-production-build)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [Environment Variables Reference](#environment-variables-reference)
- [Getting a Weather AI API Key](#getting-a-weather-ai-api-key)
- [Testing](#testing)

## Features
- Real-time weather — current conditions fetched live from Weather AI API
- 7-day forecast — daily high/low temperatures and rain probability
- AI farming advice — planting, irrigation, harvesting, pest risk, and fertilizer timing
- Crop recommendations — science-based suitability for regional crops based on current climate
- API usage dashboard — live tracking of Weather API and AI Summary usage against plan limits
- Location search — OpenStreetMap-powered autocomplete for any Kenyan city or town
- Geolocation — one-click "Use My Location" via browser GPS
- Bilingual — full English and Kiswahili interface

## Tech Stack
| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State / Fetching | TanStack Query (React Query) v5 |
| Icons | Lucide React |
| Weather Data | Weather AI API |
| Geocoding | OpenStreetMap Nominatim (free, no key needed) |

## Prerequisites
Before you begin, make sure you have the following installed:

- Node.js >= 18.17.0 — [Download](https://nodejs.org/)
- npm >= 9 (comes bundled with Node.js)
- A Weather AI API key — see below

Verify your Node version:

```bash
node -v
npm -v
```

## Getting Started

### 1. Clone the Repository

HTTPS:
```bash
git clone https://github.com/JAPHETHNYARANGA/Weather-AI-Integration-Assessment.git
cd Weather-AI-Integration-Assessment
```

SSH:
```bash
git clone git@github.com:JAPHETHNYARANGA/Weather-AI-Integration-Assessment.git
cd Weather-AI-Integration-Assessment
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the example environment file and fill in your API key:
```bash
cp .env.local.example .env.local
```

Then open `.env.local` and replace the placeholder with your actual Weather AI API key:
```env
# .env.local
WEATHER_API_KEY=wai_your_actual_api_key_here
```

Important: Never commit `.env.local` to version control. It is already listed in `.gitignore`.

### 4. Run the Development Server
```bash
npm run dev
```

The app will be available at http://localhost:3000.

The dev server uses Turbopack for fast hot-module replacement (HMR). Changes to any file are reflected instantly in the browser.

### 5. Production Build
To build and run the optimised production bundle:

```bash
# Build
npm run build

# Start the production server
npm start
```

To lint the codebase:
```bash
npm run lint
```

## Project Structure
```text
weather-ai-assesment/
├── app/
│   ├── api/                    # Next.js API route handlers (server-side)
│   │   ├── analyze/route.ts    # POST — generates AI farming analysis from weather data
│   │   ├── geocode/route.ts    # GET  — location autocomplete via OpenStreetMap Nominatim
│   │   ├── usage/route.ts      # GET  — fetches API usage stats from Weather AI
│   │   └── weather/route.ts    # GET  — fetches real-time weather & forecast
│   ├── components/
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── LocationSearch.tsx  # Autocomplete location search input
│   │   └── ThemeToggle.tsx
│   ├── context/
│   │   └── LocationContext.tsx # Global state for selected lat/lon
│   ├── types/                  # Shared TypeScript interfaces
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                # Main dashboard page
│   └── providers.tsx           # TanStack Query provider wrapper
├── public/
├── .env.local                  # ← Your secret API keys (not committed)
├── .env.local.example          # ← Template — safe to commit
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

## API Routes
All routes live under `app/api/` and run entirely on the server, keeping your API key secret from the browser.

| Route | Method | Description |
| --- | --- | --- |
| `/api/weather` | GET | Fetches current weather and 7-day forecast. Params: lat, lon, lang |
| `/api/analyze` | POST | Generates farming advice from weather data. Body: { weatherData, lang } |
| `/api/geocode` | GET | Returns location suggestions. Params: q (search query) |
| `/api/usage` | GET | Returns current API usage stats from Weather AI account |

## Environment Variables Reference
| Variable | Required | Description |
| --- | --- | --- |
| `WEATHER_API_KEY` | Yes | Your Weather AI API key from weather-ai.co |

No other environment variables are required. The Nominatim geocoding API is free and requires no key.

## Getting a Weather AI API Key
1. Visit https://weather-ai.co and create an account.
2. Navigate to your Dashboard → API Keys.
3. Copy your key — it starts with `wai_`.
4. Paste it into your `.env.local` file as shown in step 3.

The free plan includes:
- 1,000 weather API calls / month
- 200 AI summary requests / month

The app's dashboard displays your live usage against these limits.

## Testing
The application uses Vitest as the test runner for its API route unit tests.

### Test Structure
The tests are located in the `tests/` directory:
- `tests/setup.ts` — Global setup file (handles mock resetting and environment config)
- `tests/api/geocode.test.ts` — Geocoding route tests (Kenyan city matches, Nominatim mock)
- `tests/api/weather.test.ts` — Weather route tests (live response formatting, API error fallback, WMO description mapping)
- `tests/api/analyze.test.ts` — AI farming analysis route tests (Kiswahili localization, planting/irrigation/harvest rules, temperature warnings, etc.)
- `tests/api/usage.test.ts` — Usage endpoint tests (resilience to third-party outages, rate limits)

### Running the Tests
You can run the tests using the following commands:

#### 1. Run all tests once
```bash
npm test
```

#### 2. Run tests in watch mode (interactive)
```bash
npm run test:watch
```

#### 3. Run tests with coverage report
```bash
npm run test:coverage
```

The coverage report will show file-by-file statements, branches, functions, and line coverage directly in the terminal, and output a detailed HTML report to `coverage/index.html`.

## Screenshots
  
## License
This project was created as part of the Weather AI Integration Assessment.
