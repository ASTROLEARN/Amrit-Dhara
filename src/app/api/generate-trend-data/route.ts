import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateAllIndices } from '@/lib/hmpi-calculations';

// Sample locations for trend analysis
const trendLocations = [
  { name: "Delhi Industrial Area", lat: 28.7041, lng: 77.1025, baseContamination: "high" },
  { name: "Mumbai Coastal Zone", lat: 19.0760, lng: 72.8777, baseContamination: "medium" },
  { name: "Bangalore Tech Park", lat: 12.9716, lng: 77.5946, baseContamination: "low" },
  { name: "Kolkata Industrial Belt", lat: 22.5726, lng: 88.3639, baseContamination: "high" },
  { name: "Chennai Manufacturing Hub", lat: 13.0827, lng: 80.2707, baseContamination: "medium" }
];

function getContaminationPattern(level: string, timeIndex: number, totalPoints: number) {
  const basePatterns = {
    low: {
      As: 0.005, Cd: 0.002, Cr: 0.02, Pb: 0.008, Hg: 0.0004, Ni: 0.02, Cu: 0.4, Zn: 1.0
    },
    medium: {
      As: 0.015, Cd: 0.006, Cr: 0.04, Pb: 0.015, Hg: 0.0008, Ni: 0.04, Cu: 0.8, Zn: 2.0
    },
    high: {
      As: 0.035, Cd: 0.012, Cr: 0.08, Pb: 0.035, Hg: 0.002, Ni: 0.08, Cu: 1.8, Zn: 4.0
    }
  };

  const pattern = basePatterns[level as keyof typeof basePatterns] || basePatterns.medium;
  
  // Add trend over time (simulating improvement or deterioration)
  const trendFactor = 1 + (timeIndex / totalPoints) * 0.3; // 30% change over time
  const seasonalFactor = 1 + Math.sin((timeIndex / totalPoints) * Math.PI * 2) * 0.2; // Seasonal variation
  
  const result: any = {};
  Object.keys(pattern).forEach(metal => {
    const baseValue = pattern[metal as keyof typeof pattern];
    const randomVariation = 1 + (Math.random() - 0.5) * 0.4; // ±20% random variation
    result[metal] = Math.max(0, baseValue * trendFactor * seasonalFactor * randomVariation);
  });
  
  return result;
}

function generateDate(monthsAgo: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(Math.floor(Math.random() * 28) + 1); // Random day in month
  return date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const locationsPerTrend = body.locationsPerTrend || 3; // Number of locations to generate trends for
    const dataPointsPerLocation = body.dataPointsPerLocation || 6; // Months of data

    const results = [];
    const selectedLocations = trendLocations.slice(0, locationsPerTrend);

    for (const location of selectedLocations) {
      const locationResults = [];
      
      for (let i = 0; i < dataPointsPerLocation; i++) {
        const concentrations = getContaminationPattern(
          location.baseContamination, 
          i, 
          dataPointsPerLocation
        );
        
        const indices = calculateAllIndices(concentrations);
        const sampleDate = generateDate(dataPointsPerLocation - i - 1); // Most recent last

        // Add small random offset to coordinates for each sample
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;

        const sample = await db.groundwaterSample.create({
          data: {
            sampleId: `TREND_${location.name.replace(/\s+/g, '_').toUpperCase()}_${String(i + 1).padStart(2, '0')}`,
            location: location.name,
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
            npiCategory: indices.npiCategory,
            createdAt: sampleDate,
            updatedAt: sampleDate
          }
        });

        locationResults.push({
          id: sample.id,
          sampleId: sample.sampleId,
          date: sampleDate.toISOString(),
          indices
        });
      }

      results.push({
        location: location.name,
        contaminationLevel: location.baseContamination,
        dataPoints: locationResults.length,
        samples: locationResults
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated trend data for ${locationsPerTrend} locations with ${dataPointsPerLocation} data points each`,
      summary: {
        totalLocations: results.length,
        totalSamples: results.reduce((sum, loc) => sum + loc.dataPoints, 0),
        dateRange: `${dataPointsPerLocation} months of historical data`
      },
      results
    });

  } catch (error) {
    console.error('Trend data generation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during trend data generation' 
    }, { status: 500 });
  }
}