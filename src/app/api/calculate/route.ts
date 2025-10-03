import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateAllIndices, validateConcentrations } from '@/lib/hmpi-calculations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      sampleId,
      location,
      latitude,
      longitude,
      concentrations
    } = body;

    // Validate required fields
    if (!sampleId || !location || latitude === undefined || longitude === undefined || !concentrations) {
      return NextResponse.json({ 
        error: 'Missing required fields: sampleId, location, latitude, longitude, concentrations' 
      }, { status: 400 });
    }

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ 
        error: 'Invalid coordinates: must be numbers' 
      }, { status: 400 });
    }
    
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ 
        error: 'Coordinates out of valid range' 
      }, { status: 400 });
    }

    // Validate concentrations
    if (!validateConcentrations(concentrations)) {
      return NextResponse.json({ 
        error: 'Invalid concentration values: must be non-negative numbers' 
      }, { status: 400 });
    }

    // Calculate indices
    const indices = calculateAllIndices(concentrations);

    // Save to database
    const sample = await db.groundwaterSample.create({
      data: {
        sampleId,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        arsenic: concentrations.As || 0,
        cadmium: concentrations.Cd || 0,
        chromium: concentrations.Cr || 0,
        lead: concentrations.Pb || 0,
        mercury: concentrations.Hg || 0,
        nickel: concentrations.Ni || 0,
        copper: concentrations.Cu || 0,
        zinc: concentrations.Zn || 0,
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

    // Save analysis result
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

    return NextResponse.json({
      success: true,
      message: 'Sample processed successfully',
      result: {
        id: sample.id,
        sampleId,
        location,
        latitude,
        longitude,
        concentrations,
        indices
      }
    });

  } catch (error) {
    console.error('Manual calculation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during calculation' 
    }, { status: 500 });
  }
}