import { NextRequest, NextResponse } from 'next/server';

// WHO Standards data
const whoStandards = [
  { metal: 'Arsenic (As)', symbol: 'As', allowed: 0.01, background: 0.001, unit: 'mg/L' },
  { metal: 'Cadmium (Cd)', symbol: 'Cd', allowed: 0.003, background: 0.0005, unit: 'mg/L' },
  { metal: 'Chromium (Cr)', symbol: 'Cr', allowed: 0.05, background: 0.001, unit: 'mg/L' },
  { metal: 'Lead (Pb)', symbol: 'Pb', allowed: 0.01, background: 0.01, unit: 'mg/L' },
  { metal: 'Mercury (Hg)', symbol: 'Hg', allowed: 0.001, background: 0.0001, unit: 'mg/L' },
  { metal: 'Nickel (Ni)', symbol: 'Ni', allowed: 0.07, background: 0.002, unit: 'mg/L' },
  { metal: 'Copper (Cu)', symbol: 'Cu', allowed: 2.0, background: 0.001, unit: 'mg/L' },
  { metal: 'Zinc (Zn)', symbol: 'Zn', allowed: 3.0, background: 0.01, unit: 'mg/L' }
];

// Pollution Index Categories
const pollutionIndices = [
  {
    name: 'Heavy Metal Pollution Index (HPI)',
    description: 'Comprehensive index for overall heavy metal contamination',
    categories: [
      { range: '< 100', level: 'Clean', color: 'bg-green-500', textColor: 'text-green-700' },
      { range: '100-200', level: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
      { range: '> 200', level: 'High', color: 'bg-red-500', textColor: 'text-red-700' }
    ]
  },
  {
    name: 'Heavy Metal Evaluation Index (HEI)',
    description: 'Evaluation index for heavy metal toxicity assessment',
    categories: [
      { range: '< 10', level: 'Clean', color: 'bg-green-500', textColor: 'text-green-700' },
      { range: '10-20', level: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
      { range: '> 20', level: 'High', color: 'bg-red-500', textColor: 'text-red-700' }
    ]
  },
  {
    name: 'Contamination Degree (CD)',
    description: 'Degree of contamination from multiple heavy metals',
    categories: [
      { range: '< 1', level: 'Low', color: 'bg-green-500', textColor: 'text-green-700' },
      { range: '1-3', level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
      { range: '> 3', level: 'High', color: 'bg-red-500', textColor: 'text-red-700' }
    ]
  },
  {
    name: 'Nemerow Pollution Index (NPI)',
    description: 'Comprehensive pollution index considering maximum and average pollution',
    categories: [
      { range: '< 0.7', level: 'Clean', color: 'bg-green-500', textColor: 'text-green-700' },
      { range: '0.7-1.0', level: 'Slight', color: 'bg-lime-500', textColor: 'text-lime-700' },
      { range: '1.0-2.0', level: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
      { range: '> 2.0', level: 'Severe', color: 'bg-red-500', textColor: 'text-red-700' }
    ]
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'who') {
      return NextResponse.json({
        success: true,
        data: whoStandards
      });
    } else if (type === 'indices') {
      return NextResponse.json({
        success: true,
        data: pollutionIndices
      });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          whoStandards,
          pollutionIndices
        }
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch standards data' },
      { status: 500 }
    );
  }
}