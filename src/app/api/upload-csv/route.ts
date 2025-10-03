import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Papa from 'papaparse';
import { calculateAllIndices, validateConcentrations } from '@/lib/hmpi-calculations';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    const text = await file.text();
    
    const parseResult = await new Promise<any>((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: resolve,
        error: reject
      });
    });

    const data = parseResult.data;
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No data found in CSV file' }, { status: 400 });
    }
    
    // Validate required columns
    const requiredColumns = ['SampleID', 'Lat', 'Lng', 'As', 'Cd', 'Cr', 'Pb', 'Hg', 'Ni', 'Cu', 'Zn'];
    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Validate and parse data
        const sampleId = String(row.SampleID || `Sample_${i + 1}`);
        const location = String(row.Location || row.SampleID || `Location ${i + 1}`);
        const latitude = parseFloat(row.Lat);
        const longitude = parseFloat(row.Lng);
        
        if (isNaN(latitude) || isNaN(longitude)) {
          errors.push(`Row ${i + 1}: Invalid coordinates`);
          continue;
        }
        
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          errors.push(`Row ${i + 1}: Coordinates out of range`);
          continue;
        }

        const concentrations = {
          As: parseFloat(row.As) || 0,
          Cd: parseFloat(row.Cd) || 0,
          Cr: parseFloat(row.Cr) || 0,
          Pb: parseFloat(row.Pb) || 0,
          Hg: parseFloat(row.Hg) || 0,
          Ni: parseFloat(row.Ni) || 0,
          Cu: parseFloat(row.Cu) || 0,
          Zn: parseFloat(row.Zn) || 0
        };

        if (!validateConcentrations(concentrations)) {
          errors.push(`Row ${i + 1}: Invalid concentration values`);
          continue;
        }

        // Calculate indices
        const indices = calculateAllIndices(concentrations);

        // Save to database
        const sample = await db.groundwaterSample.create({
          data: {
            sampleId,
            location,
            latitude,
            longitude,
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

        results.push({
          id: sample.id,
          sampleId,
          location,
          latitude,
          longitude,
          concentrations,
          indices
        });

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push(`Row ${i + 1}: Processing error`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${results.length} samples`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      totalProcessed: data.length,
      successCount: results.length,
      errorCount: errors.length
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during CSV processing' 
    }, { status: 500 });
  }
}