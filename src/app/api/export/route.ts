import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format, sampleIds } = body;

    if (!format || format !== 'csv') {
      return NextResponse.json({ 
        error: 'Invalid format. Only CSV export is supported' 
      }, { status: 400 });
    }

    // Get samples to export
    const whereClause = sampleIds && sampleIds.length > 0 
      ? { id: { in: sampleIds } }
      : {};

    const samples = await db.groundwaterSample.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (samples.length === 0) {
      return NextResponse.json({ 
        error: 'No samples found to export' 
      }, { status: 404 });
    }

    // Generate CSV
    const headers = [
      'SampleID', 'Location', 'Latitude', 'Longitude',
      'As (mg/L)', 'Cd (mg/L)', 'Cr (mg/L)', 'Pb (mg/L)', 
      'Hg (mg/L)', 'Ni (mg/L)', 'Cu (mg/L)', 'Zn (mg/L)',
      'HPI', 'HPI Category', 'HEI', 'HEI Category', 
      'CD', 'CD Category', 'NPI', 'NPI Category', 'Created At'
    ];

    const csvRows = [
      headers.join(','),
      ...samples.map(sample => [
        sample.sampleId,
        `"${sample.location}"`,
        sample.latitude,
        sample.longitude,
        sample.arsenic,
        sample.cadmium,
        sample.chromium,
        sample.lead,
        sample.mercury,
        sample.nickel,
        sample.copper,
        sample.zinc,
        sample.hpi || 0,
        sample.hpiCategory || '',
        sample.hei || 0,
        sample.heiCategory || '',
        sample.cd || 0,
        sample.cdCategory || '',
        sample.npi || 0,
        sample.npiCategory || '',
        sample.createdAt.toISOString()
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="hmpi_results_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during export' 
    }, { status: 500 });
  }
}