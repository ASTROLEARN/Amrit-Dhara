import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF to include autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface ExportData {
  location: string;
  data: any[];
  selectedMetals: string[];
  selectedIndices: string[];
  chartType: 'line' | 'bar';
  chartImages?: {
    metalChart?: string;
    indexChart?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { location, data, selectedMetals, selectedIndices, chartType, chartImages }: ExportData = await request.json();

    if (!location || !data || data.length === 0) {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }

    // Create PDF document with better margins
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Set up response headers
    const filename = `${location.replace(/\s+/g, '_')}_trend_analysis_${new Date().toISOString().split('T')[0]}.pdf`;
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    // Helper function to add new page if needed
    const checkPageBreak = (yPosition: number, requiredSpace: number = 30) => {
      if (yPosition > pageHeight - requiredSpace) {
        doc.addPage();
        return margin;
      }
      return yPosition;
    };

    // Helper function to add colored header
    const addSectionHeader = (title: string, yPosition: number, color: [number, number, number] = [41, 128, 185]) => {
      // Add colored background
      doc.setFillColor(...color);
      doc.rect(margin, yPosition - 5, contentWidth, 10, 'F');
      
      // Add white text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 5, yPosition);
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      return yPosition + 15;
    };

    // Title Page with professional header
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Groundwater Quality Monitoring', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Location Trend Analysis Report', pageWidth / 2, 30, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Location: ${location}`, pageWidth / 2, 60, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth / 2, 70, { align: 'center' });

    // Executive Summary Box
    let yPosition = 90;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, yPosition - 5, contentWidth, 40, 3, 3, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin + 10, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const totalSamples = data.length;
    const dateRange = {
      start: new Date(data[0]?.createdAt).toLocaleDateString(),
      end: new Date(data[data.length - 1]?.createdAt).toLocaleDateString()
    };
    
    const avgHPI = (data.reduce((sum, s) => sum + (s.hpi || 0), 0) / totalSamples).toFixed(2);
    const trendDirection = data.length > 1 ? 
      (data[data.length - 1].hpi! > data[0].hpi! ? '📈 Increasing' : 
       data[data.length - 1].hpi! < data[0].hpi! ? '📉 Decreasing' : '➡️ Stable') : 
      '📊 Insufficient data';

    const summaryText = [
      `📊 Total Samples Analyzed: ${totalSamples}`,
      `📅 Analysis Period: ${dateRange.start} to ${dateRange.end}`,
      `🎯 Average HPI: ${avgHPI}`,
      `📈 Trend Direction: ${trendDirection}`
    ];

    summaryText.forEach(text => {
      doc.text(text, margin + 10, yPosition);
      yPosition += 8;
    });

    yPosition += 15;

    // Metal Concentrations Section
    yPosition = addSectionHeader('🧪 Metal Concentrations Analysis', yPosition, [52, 152, 219]);
    
    // Add description
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Detailed analysis of heavy metal concentrations in groundwater samples (mg/L)', margin, yPosition);
    yPosition += 10;

    // Prepare table data for metals
    const metalHeaders = ['Sample ID', 'Date', ...selectedMetals.map(m => {
      const metalNames: Record<string, string> = {
        'arsenic': 'As',
        'cadmium': 'Cd', 
        'chromium': 'Cr',
        'lead': 'Pb',
        'mercury': 'Hg',
        'nickel': 'Ni',
        'copper': 'Cu',
        'zinc': 'Zn'
      };
      return metalNames[m] || m.charAt(0).toUpperCase() + m.slice(1);
    })];
    
    const metalRows = data.map(sample => [
      sample.sampleId.slice(-4),
      new Date(sample.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...selectedMetals.map(metal => {
        const value = sample[metal] || 0;
        return value < 0.01 ? value.toExponential(1) : value.toFixed(3);
      })
    ]);

    // Add metal table with professional styling
    (doc as any).autoTable({
      head: [metalHeaders],
      body: metalRows,
      startY: yPosition,
      theme: 'grid',
      styles: { 
        fontSize: selectedMetals.length > 6 ? 6 : 7, 
        cellPadding: 2,
        font: 'helvetica'
      },
      columnStyles: {
        0: { cellWidth: 15, fontStyle: 'bold' },
        1: { cellWidth: 18 }
      },
      headStyles: { 
        fillColor: [52, 152, 219], 
        textColor: 255,
        fontStyle: 'bold',
        fontSize: selectedMetals.length > 6 ? 6 : 7
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Pollution Indices Section
    yPosition = checkPageBreak(yPosition, 50);
    yPosition = addSectionHeader('📈 Pollution Indices Analysis', yPosition, [46, 204, 113]);
    
    // Add description
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Comprehensive pollution index calculations for water quality assessment', margin, yPosition);
    yPosition += 10;

    // Prepare table data for indices
    const indexHeaders = ['Sample ID', 'Date', ...selectedIndices.map(i => {
      const indexNames: Record<string, string> = {
        'hpi': 'HPI',
        'hei': 'HEI', 
        'cd': 'CD',
        'npi': 'NPI'
      };
      return indexNames[i] || i.toUpperCase();
    }), 'Status'];
    
    const indexRows = data.map(sample => [
      sample.sampleId.slice(-4),
      new Date(sample.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...selectedIndices.map(index => {
        const value = sample[index] || 0;
        return typeof value === 'number' ? value.toFixed(1) : '0';
      }),
      (sample.hpiCategory || 'Unknown').replace('Moderate/Medium', 'Moderate').replace('High/Severe', 'High')
    ]);

    // Add indices table with professional styling
    (doc as any).autoTable({
      head: [indexHeaders],
      body: indexRows,
      startY: yPosition,
      theme: 'grid',
      styles: { 
        fontSize: 7, 
        cellPadding: 2,
        font: 'helvetica'
      },
      columnStyles: {
        0: { cellWidth: 15, fontStyle: 'bold' },
        1: { cellWidth: 18 },
        [indexHeaders.length - 1]: { cellWidth: 20, fontStyle: 'bold' }
      },
      headStyles: { 
        fillColor: [46, 204, 113], 
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 7
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Chart Visualizations Section
    yPosition = checkPageBreak(yPosition, 100);
    yPosition = addSectionHeader('📊 Chart Visualizations', yPosition, [155, 89, 182]);
    
    // Add description
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Visual trend analysis of metal concentrations and pollution indices over time', margin, yPosition);
    yPosition += 15;

    // Helper function to add chart image with professional styling
    const addChartImage = (imageData: string, title: string, caption: string) => {
      if (!imageData) {
        // Add placeholder if no image
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, yPosition, contentWidth, 60, 3, 3, 'F');
        doc.setTextColor(128, 128, 128);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'italic');
        doc.text(`[Chart: ${title}]`, margin + contentWidth/2, yPosition + 30, { align: 'center' });
        return yPosition + 70;
      }
      
      yPosition = checkPageBreak(yPosition, 120);
      
      // Add chart title with background
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(margin, yPosition - 8, contentWidth, 12, 2, 2, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin + 5, yPosition);
      yPosition += 10;
      
      try {
        // Extract base64 data and add image
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imgWidth = contentWidth;
        const imgHeight = 80;
        
        // Add image with border
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPosition, imgWidth, imgHeight);
        doc.addImage(base64Data, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 8;
        
        // Add caption
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(caption, margin, yPosition);
        yPosition += 15;
        
      } catch (error) {
        console.error('Error adding chart image:', error);
        doc.setTextColor(128, 128, 128);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(`[Error loading chart: ${title}]`, margin + contentWidth/2, yPosition + 30, { align: 'center' });
        yPosition += 60;
      }
      
      return yPosition;
    };

    // Add metal concentration chart
    yPosition = addChartImage(
      chartImages?.metalChart || '',
      'Metal Concentrations Trend',
      `Trend analysis for selected metals (${chartType} chart) - ${selectedMetals.join(', ')}`
    );

    // Add pollution indices chart
    yPosition = addChartImage(
      chartImages?.indexChart || '',
      'Pollution Indices Trend',
      `Trend analysis for pollution indices (${chartType} chart) - ${selectedIndices.join(', ').toUpperCase()}`
    );

    // Quality Distribution Section
    yPosition = checkPageBreak(yPosition, 50);
    yPosition = addSectionHeader('🎯 Quality Distribution Analysis', yPosition, [230, 126, 34]);
    
    // Add description
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Distribution of water quality categories based on HPI classification', margin, yPosition);
    yPosition += 10;

    const qualityDistribution = data.reduce((acc, sample) => {
      const category = sample.hpiCategory || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Create quality distribution table
    const qualityData = Object.entries(qualityDistribution).map(([category, count]) => {
      const percentage = ((count / totalSamples) * 100).toFixed(1);
      let color = 'gray';
      let status = '⚪';
      
      if (category.includes('Clean') || category.includes('Low')) {
        color = 'green';
        status = '🟢';
      } else if (category.includes('Moderate') || category.includes('Medium')) {
        color = 'orange';
        status = '🟡';
      } else if (category.includes('High') || category.includes('Severe')) {
        color = 'red';
        status = '🔴';
      }
      
      return [status, category, count, `${percentage}%`];
    });

    (doc as any).autoTable({
      head: [['Status', 'Category', 'Samples', 'Percentage']],
      body: qualityData,
      startY: yPosition,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        font: 'helvetica'
      },
      headStyles: { 
        fillColor: [230, 126, 34], 
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });

    // Footer on each page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Add footer background
      doc.setFillColor(41, 128, 185);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      // Add footer text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text('Generated by Groundwater Quality Monitoring System', pageWidth / 2, pageHeight - 3, { align: 'center' });
    }

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, { headers });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}