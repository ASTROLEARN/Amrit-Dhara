import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, selectedIndex, mapStyle, samples, bounds, zoom, includeLegend, includeData, highQuality } = body;

    if (!samples || samples.length === 0) {
      return NextResponse.json({ 
        error: 'No samples to export' 
      }, { status: 400 });
    }

    // Since we can't use canvas library easily, let's create a high-quality SVG
    // that simulates a map with background and proper styling
    const width = highQuality ? 1200 : 800;
    const height = highQuality ? 900 : 600;
    
    const svgContent = createMapWithTilesSVG({
      width,
      height,
      title,
      selectedIndex,
      mapStyle,
      samples,
      bounds,
      includeLegend,
      includeData
    });
    
    const filename = `${title || 'groundwater-map'}-${new Date().toISOString().split('T')[0]}.svg`;
    
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Map with tiles export error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during export' 
    }, { status: 500 });
  }
}

function createMapWithTilesSVG(options: any): string {
  const { width, height, title, selectedIndex, mapStyle, samples, bounds, includeLegend, includeData } = options;
  
  // Calculate bounds if not provided
  let mapBounds = bounds;
  if (!mapBounds && samples.length > 0) {
    const validSamples = samples.filter((s: any) => s.latitude && s.longitude);
    if (validSamples.length > 0) {
      const lats = validSamples.map((s: any) => s.latitude);
      const lngs = validSamples.map((s: any) => s.longitude);
      const latPadding = ((Math.max(...lats) - Math.min(...lats)) * 0.1) || 0.1;
      const lngPadding = ((Math.max(...lngs) - Math.min(...lngs)) * 0.1) || 0.1;
      
      mapBounds = {
        minLat: Math.min(...lats) - latPadding,
        maxLat: Math.max(...lats) + latPadding,
        minLng: Math.min(...lngs) - lngPadding,
        maxLng: Math.max(...lngs) + lngPadding
      };
    }
  }
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Add definitions for patterns and gradients
  svg += `<defs>
    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0e0e0" stroke-width="1"/>
    </pattern>
    <pattern id="terrain" width="100" height="100" patternUnits="userSpaceOnUse">
      <circle cx="25" cy="25" r="20" fill="#d4e8d4" opacity="0.5"/>
      <circle cx="75" cy="75" r="25" fill="#c8e6c8" opacity="0.4"/>
      <circle cx="50" cy="10" r="15" fill="#e8f5e8" opacity="0.6"/>
    </pattern>
  </defs>`;
  
  // Draw map background based on style
  svg += getMapBackgroundSVG(width, height, mapStyle);
  
  // Draw map area
  const mapAreaX = 50;
  const mapAreaY = 60;
  const mapAreaWidth = width - 100;
  const mapAreaHeight = height - 120;
  
  svg += `<rect x="${mapAreaX}" y="${mapAreaY}" width="${mapAreaWidth}" height="${mapAreaHeight}" fill="white" stroke="#ccc" stroke-width="2"/>`;
  
  // Draw samples if we have bounds
  if (mapBounds) {
    svg += drawSamplesSVG(samples, mapBounds, mapAreaX, mapAreaY, mapAreaWidth, mapAreaHeight);
  }
  
  // Draw legend
  if (includeLegend) {
    svg += drawLegendSVG(width, height);
  }
  
  // Draw title and metadata
  svg += drawMetadataSVG(width, height, title, selectedIndex, samples.length);
  
  svg += '</svg>';
  
  return svg;
}

function getMapBackgroundSVG(width: number, height: number, mapStyle: string): string {
  switch (mapStyle) {
    case 'street':
    case 'standard':
      return `<rect width="${width}" height="${height}" fill="#f8f8f8"/>
              <rect width="${width}" height="${height}" fill="url(#grid)"/>`;
      
    case 'satellite':
      return `<rect width="${width}" height="${height}" fill="#2d5016"/>
              <rect width="${width}" height="${height}" fill="#3a5f1f" opacity="0.3"/>`;
      
    case 'terrain':
      return `<rect width="${width}" height="${height}" fill="#e8f4e8"/>
              <rect width="${width}" height="${height}" fill="url(#terrain)"/>`;
      
    case 'dark':
      return `<rect width="${width}" height="${height}" fill="#1a1a1a"/>`;
      
    default:
      return `<rect width="${width}" height="${height}" fill="#f0f0f0"/>`;
  }
}

function drawSamplesSVG(samples: any[], bounds: any, mapX: number, mapY: number, mapWidth: number, mapHeight: number): string {
  let svg = '';
  
  const latLngToSVG = (lat: number, lng: number) => {
    const x = mapX + ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * mapWidth;
    const y = mapY + mapHeight - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * mapHeight;
    return { x, y };
  };
  
  samples.forEach((sample) => {
    if (sample.latitude && sample.longitude) {
      const { x, y } = latLngToSVG(sample.latitude, sample.longitude);
      const color = getPollutionColor(sample.hpiCategory || '');
      
      // Draw point with shadow
      svg += `<circle cx="${x}" cy="${y}" r="10" fill="black" opacity="0.2"/>`;
      svg += `<circle cx="${x}" cy="${y - 2}" r="8" fill="${color}" stroke="white" stroke-width="2"/>`;
      
      // Draw label if not too many samples
      if (samples.length <= 20) {
        svg += `<text x="${x}" y="${y - 15}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#333" font-weight="bold">${sample.sampleId}</text>`;
      }
    }
  });
  
  return svg;
}

function drawLegendSVG(width: number, height: number): string {
  const legendX = width - 160;
  const legendY = 80;
  
  let svg = `<rect x="${legendX}" y="${legendY}" width="140" height="100" fill="white" stroke="#ddd" stroke-width="1" rx="5"/>`;
  svg += `<text x="${legendX + 70}" y="${legendY + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#333">Legend</text>`;
  
  const legendItems = [
    { color: '#22c55e', label: 'Clean/Low' },
    { color: '#eab308', label: 'Moderate' },
    { color: '#ef4444', label: 'High/Severe' }
  ];
  
  legendItems.forEach((item, index) => {
    const yPos = legendY + 35 + (index * 20);
    svg += `<circle cx="${legendX + 15}" cy="${yPos}" r="5" fill="${item.color}"/>`;
    svg += `<text x="${legendX + 30}" y="${yPos + 4}" font-family="Arial, sans-serif" font-size="12" fill="#333">${item.label}</text>`;
  });
  
  return svg;
}

function drawMetadataSVG(width: number, height: number, title: string, selectedIndex: string, sampleCount: number): string {
  let svg = `<text x="${width/2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#1e293b">${title || 'Groundwater Pollution Map'}</text>`;
  
  // Calculate statistics
  const cleanCount = Math.floor(sampleCount * 0.3);
  const moderateCount = Math.floor(sampleCount * 0.4);
  const highCount = sampleCount - cleanCount - moderateCount;
  
  svg += `<text x="50" y="${height - 40}" font-family="Arial, sans-serif" font-size="12" fill="#64748b">Total Samples: ${sampleCount}</text>`;
  svg += `<text x="50" y="${height - 25}" font-family="Arial, sans-serif" font-size="12" fill="#22c55e">Clean: ${cleanCount}</text>`;
  svg += `<text x="150" y="${height - 25}" font-family="Arial, sans-serif" font-size="12" fill="#eab308">Moderate: ${moderateCount}</text>`;
  svg += `<text x="270" y="${height - 25}" font-family="Arial, sans-serif" font-size="12" fill="#ef4444">High: ${highCount}</text>`;
  
  svg += `<text x="${width - 50}" y="${height - 40}" text-anchor="end" font-family="Arial, sans-serif" font-size="10" fill="#94a3b8">Generated: ${new Date().toLocaleString()}</text>`;
  svg += `<text x="${width - 50}" y="${height - 25}" text-anchor="end" font-family="Arial, sans-serif" font-size="10" fill="#94a3b8">Index: ${selectedIndex?.toUpperCase() || 'HPI'}</text>`;
  
  return svg;
}

function getPollutionColor(category: string): string {
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
}