import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, selectedIndex, mapStyle, samples, includeLegend, includeData, highQuality } = body;

    if (!samples || samples.length === 0) {
      return NextResponse.json({ 
        error: 'No samples to export' 
      }, { status: 400 });
    }

    // Generate PDF
    const doc = new jsPDF({
      orientation: highQuality ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add title
    doc.setFontSize(18);
    doc.text(title || 'Groundwater Pollution Map', 20, 20);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Pollution Index: ${selectedIndex?.toUpperCase() || 'HPI'}`, 20, 35);
    doc.text(`Map Style: ${mapStyle || 'Street'}`, 20, 40);
    doc.text(`Total Samples: ${samples.length}`, 20, 45);
    
    let yPosition = 60;
    
    // Add legend if requested
    if (includeLegend) {
      doc.setFontSize(12);
      doc.text('Pollution Level Legend:', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      doc.text('• Clean/Low: Safe for consumption', 25, yPosition);
      yPosition += 5;
      doc.text('• Moderate/Medium: Requires treatment', 25, yPosition);
      yPosition += 5;
      doc.text('• High/Severe: Unsafe for consumption', 25, yPosition);
      yPosition += 10;
    }
    
    // Add sample data if requested
    if (includeData) {
      doc.setFontSize(12);
      doc.text('Sample Data:', 20, yPosition);
      yPosition += 8;
      
      samples.forEach((sample: any, index: number) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(10);
        doc.text(`${index + 1}. ${sample.sampleId} - ${sample.location}`, 25, yPosition);
        yPosition += 5;
        doc.text(`   Coords: ${sample.latitude?.toFixed(4) || 'N/A'}, ${sample.longitude?.toFixed(4) || 'N/A'}`, 25, yPosition);
        yPosition += 5;
        doc.text(`   HPI: ${sample.hpi?.toFixed(2) || 'N/A'} (${sample.hpiCategory || 'N/A'})`, 25, yPosition);
        yPosition += 5;
        doc.text(`   HEI: ${sample.hei?.toFixed(2) || 'N/A'} (${sample.heiCategory || 'N/A'})`, 25, yPosition);
        yPosition += 8;
      });
    }
    
    // Add summary statistics
    const cleanCount = samples.filter((s: any) => 
      s.hpiCategory === 'Clean' || s.hpiCategory === 'Low'
    ).length;
    const moderateCount = samples.filter((s: any) => 
      s.hpiCategory === 'Moderate' || s.hpiCategory === 'Medium' || s.hpiCategory === 'Slight'
    ).length;
    const highCount = samples.filter((s: any) => 
      s.hpiCategory === 'High' || s.hpiCategory === 'Severe'
    ).length;
    
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(12);
    doc.text('Summary Statistics:', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.text(`Clean/Low: ${cleanCount} samples (${((cleanCount/samples.length)*100).toFixed(1)}%)`, 25, yPosition);
    yPosition += 5;
    doc.text(`Moderate: ${moderateCount} samples (${((moderateCount/samples.length)*100).toFixed(1)}%)`, 25, yPosition);
    yPosition += 5;
    doc.text(`High/Severe: ${highCount} samples (${((highCount/samples.length)*100).toFixed(1)}%)`, 25, yPosition);
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    const filename = `${title || 'groundwater-map'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Map PDF export error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during PDF export' 
    }, { status: 500 });
  }
}