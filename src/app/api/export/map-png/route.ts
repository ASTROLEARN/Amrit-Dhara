import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, selectedIndex, mapStyle, samples, includeLegend, includeData, highQuality } = body;

    if (!samples || samples.length === 0) {
      return NextResponse.json({ 
        error: 'No samples to export' 
      }, { status: 400 });
    }

    // For PNG export, we'll create a simple data visualization using SVG
    // This is a fallback since we can't easily capture the Leaflet map on the server
    const svgContent = createMapVisualization(samples, {
      title,
      selectedIndex,
      mapStyle,
      includeLegend,
      includeData,
      highQuality
    });

    // Convert SVG to PNG buffer (simplified approach)
    // In a real implementation, you might use a library like sharp or puppeteer
    const pngBuffer = Buffer.from(svgContent, 'utf-8');
    
    const filename = `${title || 'groundwater-map'}-${new Date().toISOString().split('T')[0]}.svg`;
    
    return new NextResponse(pngBuffer, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Map PNG export error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during PNG export' 
    }, { status: 500 });
  }
}

function createMapVisualization(samples: any[], options: any) {
  const { title, selectedIndex, mapStyle, includeLegend, includeData, highQuality } = options;
  const width = highQuality ? 1200 : 800;
  const height = highQuality ? 900 : 600;
  
  // Calculate bounds for sample coordinates
  const validSamples = samples.filter(s => s.latitude && s.longitude);
  const lats = validSamples.map(s => s.latitude);
  const lngs = validSamples.map(s => s.longitude);
  
  if (validSamples.length === 0) {
    // Return a simple SVG if no valid coordinates
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f8fafc"/>
      <text x="${width/2}" y="${height/2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#64748b">No valid location data to display</text>
    </svg>`;
  }
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Add some padding to the bounds
  const latPadding = (maxLat - minLat) * 0.1 || 0.1;
  const lngPadding = (maxLng - minLng) * 0.1 || 0.1;
  
  // Function to convert lat/lng to SVG coordinates
  const latLngToSvg = (lat: number, lng: number) => {
    const x = ((lng - (minLng - lngPadding)) / ((maxLng + lngPadding) - (minLng - lngPadding))) * (width - 100) + 50;
    const y = height - (((lat - (minLat - latPadding)) / ((maxLat + latPadding) - (minLat - latPadding))) * (height - 150) + 50);
    return { x, y };
  };
  
  // Get pollution color
  const getPollutionColor = (category: string) => {
    switch (category) {
      case 'Clean':
      case 'Low':
        return '#22c55e';
      case 'Moderate':
      case 'Medium':
      case 'Slight':
        return '#eab308';
      case 'High':
      case 'Severe':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  };

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="#f8fafc"/>`;
  
  // Title
  svg += `<text x="${width/2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1e293b">${title || 'Groundwater Pollution Map'}</text>`;
  
  // Map area background
  svg += `<rect x="40" y="60" width="${width - 80}" height="${height - 120}" fill="white" stroke="#e2e8f0" stroke-width="2"/>`;
  
  // Draw samples
  validSamples.forEach((sample, index) => {
    const { x, y } = latLngToSvg(sample.latitude, sample.longitude);
    const color = getPollutionColor(sample.hpiCategory || '');
    
    // Sample point
    svg += `<circle cx="${x}" cy="${y}" r="8" fill="${color}" stroke="white" stroke-width="2"/>`;
    
    // Sample label (if not too many samples)
    if (validSamples.length <= 50) {
      svg += `<text x="${x}" y="${y - 12}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#475569">${sample.sampleId}</text>`;
    }
  });
  
  // Legend
  if (includeLegend) {
    const legendX = width - 150;
    const legendY = 80;
    
    svg += `<rect x="${legendX - 10}" y="${legendY - 10}" width="140" height="100" fill="white" stroke="#e2e8f0" stroke-width="1" rx="5"/>`;
    svg += `<text x="${legendX + 60}" y="${legendY + 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#1e293b">Legend</text>`;
    
    const legendItems = [
      { color: '#22c55e', label: 'Clean/Low' },
      { color: '#eab308', label: 'Moderate' },
      { color: '#ef4444', label: 'High/Severe' }
    ];
    
    legendItems.forEach((item, index) => {
      const yPos = legendY + 30 + (index * 20);
      svg += `<circle cx="${legendX + 10}" cy="${yPos}" r="5" fill="${item.color}"/>`;
      svg += `<text x="${legendX + 25}" y="${yPos + 4}" font-family="Arial, sans-serif" font-size="12" fill="#475569">${item.label}</text>`;
    });
  }
  
  // Statistics
  const cleanCount = validSamples.filter(s => s.hpiCategory === 'Clean' || s.hpiCategory === 'Low').length;
  const moderateCount = validSamples.filter(s => s.hpiCategory === 'Moderate' || s.hpiCategory === 'Medium' || s.hpiCategory === 'Slight').length;
  const highCount = validSamples.filter(s => s.hpiCategory === 'High' || s.hpiCategory === 'Severe').length;
  
  svg += `<text x="50" y="${height - 40}" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Total Samples: ${validSamples.length}</text>`;
  svg += `<text x="50" y="${height - 25}" font-family="Arial, sans-serif" font-size="12" fill="#22c55e">Clean: ${cleanCount}</text>`;
  svg += `<text x="150" y="${height - 25}" font-family="Arial, sans-serif" font-size="12" fill="#eab308">Moderate: ${moderateCount}</text>`;
  svg += `<text x="270" y="${height - 25}" font-family="Arial, sans-serif" font-size="12" fill="#ef4444">High: ${highCount}</text>`;
  
  // Metadata
  svg += `<text x="${width - 50}" y="${height - 40}" text-anchor="end" font-family="Arial, sans-serif" font-size="10" fill="#94a3b8">Generated: ${new Date().toLocaleString()}</text>`;
  svg += `<text x="${width - 50}" y="${height - 25}" text-anchor="end" font-family="Arial, sans-serif" font-size="10" fill="#94a3b8">Index: ${selectedIndex?.toUpperCase() || 'HPI'}</text>`;
  
  svg += '</svg>';
  
  return svg;
}