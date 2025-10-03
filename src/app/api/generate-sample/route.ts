import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateAllIndices } from '@/lib/hmpi-calculations';

// Sample locations across India with realistic contamination patterns
const sampleLocations = [
  // Major cities and industrial areas
  { name: "Delhi", lat: 28.7041, lng: 77.1025, region: "north" },
  { name: "Mumbai", lat: 19.0760, lng: 72.8777, region: "west" },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946, region: "south" },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, region: "south" },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, region: "east" },
  { name: "Hyderabad", lat: 17.3850, lng: 78.4867, region: "south" },
  { name: "Pune", lat: 18.5204, lng: 73.8567, region: "west" },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, region: "west" },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, region: "north" },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462, region: "north" },
  
  // Industrial areas with higher contamination
  { name: "Bhilai", lat: 21.2087, lng: 81.3776, region: "central" },
  { name: "Bokaro", lat: 23.2913, lng: 86.0941, region: "east" },
  { name: "Rourkela", lat: 22.2579, lng: 84.8338, region: "east" },
  { name: "Dhanbad", lat: 23.7957, lng: 86.4304, region: "east" },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558, region: "south" },
  
  // Agricultural areas
  { name: "Ludhiana", lat: 30.9010, lng: 75.8573, region: "north" },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882, region: "central" },
  { name: "Indore", lat: 22.7196, lng: 75.8577, region: "central" },
  { name: "Vadodara", lat: 22.3072, lng: 73.1812, region: "west" },
  { name: "Agra", lat: 27.1767, lng: 78.0081, region: "north" },
  
  // Coastal areas
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, region: "east" },
  { name: "Kochi", lat: 9.9312, lng: 76.2673, region: "south" },
  { name: "Surat", lat: 21.1702, lng: 72.8311, region: "west" },
  { name: "Goa", lat: 15.2993, lng: 74.1240, region: "west" },
  
  // Rural areas with lower contamination
  { name: "Shimla", lat: 31.1048, lng: 77.1734, region: "north" },
  { name: "Dehradun", lat: 30.3165, lng: 78.0322, region: "north" },
  { name: "Rishikesh", lat: 30.0869, lng: 78.2676, region: "north" },
  { name: "Haridwar", lat: 29.9457, lng: 78.1642, region: "north" },
  { name: "Nainital", lat: 29.3819, lng: 79.4532, region: "north" },
  { name: "Mysore", lat: 12.2958, lng: 76.6394, region: "south" },
  { name: "Trivandrum", lat: 8.5241, lng: 76.9366, region: "south" },
  { name: "Guwahati", lat: 26.1445, lng: 91.7362, region: "east" },
  
  // HIGH CONTAMINATION HOTSPOTS - Real Indian pollution crisis areas
  { name: "Bhatinda", lat: 30.2025, lng: 74.9345, region: "high_contamination" }, // Punjab - Uranium contamination
  { name: "Murshidabad", lat: 24.1828, lng: 88.2791, region: "high_contamination" }, // West Bengal - Severe Arsenic
  { name: "Patancheru", lat: 17.5319, lng: 78.2699, region: "high_contamination" } // Telangana - Industrial corridor
];

// Regional contamination patterns based on Indian groundwater studies
function getRegionalContamination(region: string) {
  const patterns = {
    north: {
      // Higher arsenic in Ganga plains, industrial pollution
      As: { base: 0.015, variance: 0.02 },
      Cd: { base: 0.004, variance: 0.006 },
      Cr: { base: 0.025, variance: 0.03 },
      Pb: { base: 0.012, variance: 0.015 },
      Hg: { base: 0.0008, variance: 0.001 },
      Ni: { base: 0.035, variance: 0.04 },
      Cu: { base: 0.6, variance: 0.8 },
      Zn: { base: 1.2, variance: 1.5 }
    },
    south: {
      // Moderate contamination, industrial areas
      As: { base: 0.008, variance: 0.01 },
      Cd: { base: 0.003, variance: 0.004 },
      Cr: { base: 0.04, variance: 0.05 },
      Pb: { base: 0.008, variance: 0.01 },
      Hg: { base: 0.0006, variance: 0.0008 },
      Ni: { base: 0.045, variance: 0.05 },
      Cu: { base: 0.9, variance: 1.2 },
      Zn: { base: 1.8, variance: 2.0 }
    },
    east: {
      // High arsenic in Bengal, industrial areas
      As: { base: 0.025, variance: 0.03 },
      Cd: { base: 0.006, variance: 0.008 },
      Cr: { base: 0.035, variance: 0.04 },
      Pb: { base: 0.015, variance: 0.02 },
      Hg: { base: 0.001, variance: 0.0012 },
      Ni: { base: 0.05, variance: 0.06 },
      Cu: { base: 1.1, variance: 1.3 },
      Zn: { base: 2.2, variance: 2.5 }
    },
    west: {
      // Industrial pollution, mining areas
      As: { base: 0.012, variance: 0.015 },
      Cd: { base: 0.005, variance: 0.007 },
      Cr: { base: 0.05, variance: 0.06 },
      Pb: { base: 0.018, variance: 0.022 },
      Hg: { base: 0.0009, variance: 0.0011 },
      Ni: { base: 0.06, variance: 0.07 },
      Cu: { base: 1.4, variance: 1.6 },
      Zn: { base: 2.5, variance: 2.8 }
    },
    central: {
      // Mixed industrial and agricultural
      As: { base: 0.01, variance: 0.012 },
      Cd: { base: 0.004, variance: 0.005 },
      Cr: { base: 0.03, variance: 0.035 },
      Pb: { base: 0.01, variance: 0.012 },
      Hg: { base: 0.0007, variance: 0.0009 },
      Ni: { base: 0.04, variance: 0.045 },
      Cu: { base: 0.8, variance: 1.0 },
      Zn: { base: 1.6, variance: 1.8 }
    },
    high_contamination: {
      // CRISIS ZONES - Based on real Indian pollution hotspots
      // Bhatinda: Uranium + heavy metals, Murshidabad: Extreme arsenic, Patancheru: Industrial waste
      As: { base: 0.15, variance: 0.1 }, // Extreme arsenic (15x WHO limit)
      Cd: { base: 0.03, variance: 0.02 }, // Very high cadmium
      Cr: { base: 0.12, variance: 0.08 }, // High chromium
      Pb: { base: 0.08, variance: 0.05 }, // High lead
      Hg: { base: 0.005, variance: 0.003 }, // Elevated mercury
      Ni: { base: 0.15, variance: 0.1 }, // High nickel
      Cu: { base: 3.5, variance: 2.0 }, // Very high copper
      Zn: { base: 8.0, variance: 4.0 } // Extreme zinc
    }
  };
  
  return patterns[region as keyof typeof patterns] || patterns.central;
}

function generateRandomConcentration(base: number, variance: number): number {
  return Math.max(0, base + (Math.random() - 0.5) * variance);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const count = Math.min(body.count || 10, 50); // Limit to 50 samples

    const results = [];

    for (let i = 0; i < count; i++) {
      const location = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
      const contamination = getRegionalContamination(location.region);
      
      // Add some random offset to make locations unique
      const latOffset = (Math.random() - 0.5) * 0.2; // Larger spread for India
      const lngOffset = (Math.random() - 0.5) * 0.2;

      const concentrations = {
        As: generateRandomConcentration(contamination.As.base, contamination.As.variance),
        Cd: generateRandomConcentration(contamination.Cd.base, contamination.Cd.variance),
        Cr: generateRandomConcentration(contamination.Cr.base, contamination.Cr.variance),
        Pb: generateRandomConcentration(contamination.Pb.base, contamination.Pb.variance),
        Hg: generateRandomConcentration(contamination.Hg.base, contamination.Hg.variance),
        Ni: generateRandomConcentration(contamination.Ni.base, contamination.Ni.variance),
        Cu: generateRandomConcentration(contamination.Cu.base, contamination.Cu.variance),
        Zn: generateRandomConcentration(contamination.Zn.base, contamination.Zn.variance)
      };

      const indices = calculateAllIndices(concentrations);

      const sample = await db.groundwaterSample.create({
        data: {
          sampleId: `IN_${location.code || location.name.substring(0, 3).toUpperCase()}_${String(i + 1).padStart(3, '0')}`,
          location: `${location.name}, ${location.region.charAt(0).toUpperCase() + location.region.slice(1)} India`,
          latitude: location.lat + latOffset,
          longitude: location.lng + lngOffset,
          arsenic: concentrations.As,
          cadmium: concentrations.Cd,
          chromium: concentrations.Cr,
          lead: concentrations.Pb,
          mercury: concentrations.Hg,
          nickel: concentrations.Ni,
          copper: concentrations.Cu,
          zinc: concentrations.Zn,
          hpi: indices.hpi,
          hei: indices.hei,
          cd: indices.cd,
          npi: indices.npi,
          hpiCategory: indices.hpiCategory,
          heiCategory: indices.heiCategory,
          cdCategory: indices.cdCategory,
          npiCategory: indices.npiCategory
        }
      });

      await db.analysisResult.create({
        data: {
          sampleId: sample.id,
          hpi: indices.hpi,
          hei: indices.hei,
          cd: indices.cd,
          npi: indices.npi,
          hpiCategory: indices.hpiCategory,
          heiCategory: indices.heiCategory,
          cdCategory: indices.cdCategory,
          npiCategory: indices.npiCategory,
          overallQuality: indices.overallQuality
        }
      });

      results.push({
        id: sample.id,
        sampleId: sample.sampleId,
        location: sample.location,
        region: location.region,
        indices
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${count} sample records for Indian locations`,
      results
    });

  } catch (error) {
    console.error('Sample generation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during sample generation' 
    }, { status: 500 });
  }
}