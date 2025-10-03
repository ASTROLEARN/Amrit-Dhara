import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const location = searchParams.get('location');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    // Build where clause for filtering
    const where: any = {};
    
    if (location) {
      where.location = {
        contains: location
      };
    }
    
    if (lat && lng) {
      where.latitude = parseFloat(lat);
      where.longitude = parseFloat(lng);
    }

    // Get samples with their analysis results
    const samples = await db.groundwaterSample.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        // We can join with analysis results if needed, but all data is in the sample table
      }
    });

    // Get total count for pagination
    const totalCount = await db.groundwaterSample.count({
      where
    });

    // Get statistics
    const stats = await db.groundwaterSample.aggregate({
      _avg: {
        hpi: true,
        hei: true,
        cd: true,
        npi: true
      },
      _max: {
        hpi: true,
        hei: true,
        cd: true,
        npi: true
      },
      _min: {
        hpi: true,
        hei: true,
        cd: true,
        npi: true
      }
    });

    // Get quality distribution
    const qualityDistribution = await db.groundwaterSample.groupBy({
      by: ['hpiCategory'],
      _count: {
        hpiCategory: true
      }
    });

    return NextResponse.json({
      success: true,
      data: samples,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      statistics: {
        averages: stats._avg,
        maximums: stats._max,
        minimums: stats._min
      },
      qualityDistribution: qualityDistribution.map(item => ({
        category: item.hpiCategory,
        count: item._count.hpiCategory
      }))
    });

  } catch (error) {
    console.error('Results fetch error:', error);
    return NextResponse.json({ 
      error: 'Internal server error while fetching results' 
    }, { status: 500 });
  }
}