import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sampleId = searchParams.get('sampleId');

    if (!sampleId) {
      return NextResponse.json({ 
        error: 'Sample ID is required' 
      }, { status: 400 });
    }

    // First delete related analysis results
    await db.analysisResult.deleteMany({
      where: {
        sampleId: sampleId
      }
    });

    // Then delete the sample
    const deletedSample = await db.groundwaterSample.delete({
      where: {
        id: sampleId
      }
    });

    if (!deletedSample) {
      return NextResponse.json({ 
        error: 'Sample not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sample deleted successfully',
      deletedSample: {
        id: deletedSample.id,
        sampleId: deletedSample.sampleId,
        location: deletedSample.location
      }
    });

  } catch (error) {
    console.error('Delete sample error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during deletion' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sampleIds } = body;

    if (!sampleIds || !Array.isArray(sampleIds) || sampleIds.length === 0) {
      return NextResponse.json({ 
        error: 'Sample IDs array is required' 
      }, { status: 400 });
    }

    // Delete related analysis results first
    await db.analysisResult.deleteMany({
      where: {
        sampleId: {
          in: sampleIds
        }
      }
    });

    // Then delete the samples
    const deleteResult = await db.groundwaterSample.deleteMany({
      where: {
        id: {
          in: sampleIds
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} samples`,
      deletedCount: deleteResult.count
    });

  } catch (error) {
    console.error('Bulk delete samples error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during bulk deletion' 
    }, { status: 500 });
  }
}