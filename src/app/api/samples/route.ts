import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
   try {
      console.log('API: Fetching all samples');

      // Fetch all samples from database
      const samples = await db.sample.findMany({
         orderBy: {
            createdAt: 'desc',
         },
      });

      console.log(`API: Found ${samples.length} samples`);

      return NextResponse.json({
         success: true,
         data: samples,
         count: samples.length,
      });
   } catch (error) {
      console.error('API: Error fetching samples:', error);
      return NextResponse.json(
         {
            success: false,
            error: 'Failed to fetch samples',
            details: error instanceof Error ? error.message : 'Unknown error',
         },
         { status: 500 }
      );
   }
}

export async function POST(request: NextRequest) {
   try {
      const body = await request.json();
      console.log('API: Creating new sample:', body);

      // Create a new sample
      const sample = await db.sample.create({
         data: {
            sampleId: body.sampleId || `SAMPLE_${Date.now()}`,
            location: body.location || 'Unknown Location',
            latitude: parseFloat(body.latitude) || 0,
            longitude: parseFloat(body.longitude) || 0,
            arsenic: parseFloat(body.arsenic) || 0,
            cadmium: parseFloat(body.cadmium) || 0,
            chromium: parseFloat(body.chromium) || 0,
            lead: parseFloat(body.lead) || 0,
            mercury: parseFloat(body.mercury) || 0,
            nickel: parseFloat(body.nickel) || 0,
            copper: parseFloat(body.copper) || 0,
            zinc: parseFloat(body.zinc) || 0,
            state: body.state || 'Unknown',
            region: body.region || 'Unknown',
         },
      });

      console.log('API: Sample created successfully:', sample.id);

      return NextResponse.json({
         success: true,
         data: sample,
         message: 'Sample created successfully',
      });
   } catch (error) {
      console.error('API: Error creating sample:', error);
      return NextResponse.json(
         {
            success: false,
            error: 'Failed to create sample',
            details: error instanceof Error ? error.message : 'Unknown error',
         },
         { status: 500 }
      );
   }
}
