import { NextResponse } from 'next/server';

function getDemoAnalysisData(
  farmerId: string,
  county: string,
  landAcres: number,
  locationName: string,
  notes: string
) {
  const totalTrees = 84;
  const acres = landAcres || 2.5;
  return {
    analysis_id: 'demo_' + Math.random().toString(36).substring(2, 11),
    timestamp: new Date().toISOString(),
    farmer_id: farmerId || 'F-DEMO',
    county: county || 'Bomet',
    location: locationName || 'Demo Agroforestry Farm',
    land_acres: acres,
    total_tree_count: totalTrees,
    tree_density_per_acre: Math.round((totalTrees / acres) * 10) / 10,
    confidence_score: 0.89,
    canopy_coverage_pct: 42.5,
    tree_health: {
      healthy: 71,
      needs_care: 10,
      needs_replacement: 3,
    },
    low_confidence: false,
    tree_species_guess: notes.toLowerCase().includes('tea')
      ? 'Tea (Camellia sinensis)'
      : 'Eucalyptus / Grevillea',
    observations: [
      'Good canopy development observed in the southern and western regions.',
      'A small cluster of 3 trees near the center-east boundary displays signs of potential foliage degradation.',
      'Optimized tree density suggests healthy light penetration across most quadrants.',
    ],
    recommendations: [
      'Prune surrounding branches in dense zones to optimize air circulation.',
      'Monitor soil pH and drainage in the center-east quadrant.',
      'Plan replanting for the 3 identified unhealthy spots in the next season.',
    ],
    original_image_url:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
    overlay_image_url:
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&auto=format&fit=crop&q=80',
    cv_debug: {
      orig_resolution: '4000x3000',
      work_resolution: '1500x1125',
      canopy_px: 425000,
      peaks_detected: 87,
      after_area_filter: 84,
    },
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');
    const farmerId = (formData.get('farmerId') as string) || '';
    const county = (formData.get('county') as string) || '';
    const landAcres = parseFloat(formData.get('landAcres') as string) || 0;
    const location = (formData.get('location') as string) || '';
    const notes = (formData.get('notes') as string) || '';

    if (!image) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        getDemoAnalysisData(farmerId, county, landAcres, location, notes)
      );
    }

    const apiFormData = new FormData();
    apiFormData.append('image', image);
    if (farmerId) apiFormData.append('farmerId', farmerId);
    if (county) apiFormData.append('county', county);
    if (landAcres) apiFormData.append('landAcres', landAcres.toString());
    if (location) apiFormData.append('location', location);
    if (notes) apiFormData.append('notes', notes);

    const response = await fetch('https://api.weather-ai.co/v1/trees/analyze', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: apiFormData,
    }).catch(() => null);

    if (!response || !response.ok) {
      return NextResponse.json(
        getDemoAnalysisData(farmerId, county, landAcres, location, notes)
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Agroforestry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
