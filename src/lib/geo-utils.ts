// Point-in-polygon detection using ray casting algorithm
export function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [lng, lat] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = ((yi > lat) !== (yj > lat))
      && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

// Load and parse GeoJSON data
export async function loadIndiaStatesGeoJSON() {
  try {
    const response = await fetch('/india-states.geojson');
    const geoData = await response.json();
    return geoData;
  } catch (error) {
    console.error('Error loading GeoJSON:', error);
    return null;
  }
}

// Find which state contains a given point
export async function findStateForPoint(lat: number, lng: number): Promise<string | null> {
  const geoData = await loadIndiaStatesGeoJSON();
  
  if (!geoData || !geoData.features) {
    return null;
  }
  
  for (const feature of geoData.features) {
    if (feature.geometry && feature.geometry.type === 'Polygon') {
      const coordinates = feature.geometry.coordinates[0] as [number, number][];
      if (isPointInPolygon([lng, lat], coordinates)) {
        return feature.properties.name;
      }
    }
  }
  
  return null;
}

// Get state boundary data for rendering
export async function getStateBoundaries() {
  const geoData = await loadIndiaStatesGeoJSON();
  return geoData;
}

// Calculate sample counts per state
export function calculateStateStats(samples: any[], geoData: any) {
  if (!geoData || !geoData.features) {
    return {};
  }
  
  const stateStats: Record<string, any> = {};
  
  // Initialize stats for all states
  geoData.features.forEach((feature: any) => {
    const stateName = feature.properties.name;
    stateStats[stateName] = {
      name: stateName,
      code: feature.properties.code,
      samples: 0,
      contaminated: 0,
      clean: 0,
      moderate: 0,
      coordinates: feature.geometry.coordinates[0]
    };
  });
  
  // Count samples per state
  samples.forEach(sample => {
    for (const feature of geoData.features) {
      if (feature.geometry && feature.geometry.type === 'Polygon') {
        const coordinates = feature.geometry.coordinates[0] as [number, number][];
        if (isPointInPolygon([sample.longitude, sample.latitude], coordinates)) {
          const stateName = feature.properties.name;
          stateStats[stateName].samples++;
          
          // Categorize by HPI
          const category = sample.hpiCategory;
          if (category === 'High' || category === 'Severe') {
            stateStats[stateName].contaminated++;
          } else if (category === 'Clean' || category === 'Low') {
            stateStats[stateName].clean++;
          } else if (category === 'Moderate' || category === 'Medium' || category === 'Slight') {
            stateStats[stateName].moderate++;
          }
          break;
        }
      }
    }
  });
  
  return stateStats;
}