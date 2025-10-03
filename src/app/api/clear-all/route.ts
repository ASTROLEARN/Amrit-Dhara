import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    // Delete all analysis results first (foreign key constraint)
    await db.analysisResult.deleteMany({});

    // Then delete all samples
    const deleteResult = await db.groundwaterSample.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Successfully deleted all data: ${deleteResult.count} samples and their analysis results`,
      deletedSamples: deleteResult.count
    });

  } catch (error) {
    console.error('Clear all data error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during data clearing' 
    }, { status: 500 });
  }
}