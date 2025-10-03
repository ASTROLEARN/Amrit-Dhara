'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Info, Download, RefreshCw, ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    reference: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8695248/',
    categories: [
      { range: '< 100', level: 'Clean', color: 'bg-green-500', textColor: 'text-green-700' },
      { range: '100-200', level: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
      { range: '> 200', level: 'High', color: 'bg-red-500', textColor: 'text-red-700' }
    ]
  },
  {
    name: 'Heavy Metal Evaluation Index (HEI)',
    description: 'Evaluation index for heavy metal toxicity assessment',
    reference: 'https://www.nature.com/articles/s41598-023-43161-3',
    categories: [
      { range: '< 10', level: 'Clean', color: 'bg-green-500', textColor: 'text-green-700' },
      { range: '10-20', level: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
      { range: '> 20', level: 'High', color: 'bg-red-500', textColor: 'text-red-700' }
    ]
  },
  {
    name: 'Contamination Degree (CD)',
    description: 'Degree of contamination from multiple heavy metals',
    reference: 'https://www.jelsciences.com/articles/jbres1299.php',
    categories: [
      { range: '< 1', level: 'Low', color: 'bg-green-500', textColor: 'text-green-700' },
      { range: '1-3', level: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
      { range: '> 3', level: 'High', color: 'bg-red-500', textColor: 'text-red-700' }
    ]
  },
  {
    name: 'Nemerow Pollution Index (NPI)',
    description: 'Comprehensive pollution index considering maximum and average pollution',
    reference: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7560403/',
    categories: [
      { range: '< 0.7', level: 'Clean', color: 'bg-green-500', textColor: 'text-green-700' },
      { range: '0.7-1.0', level: 'Slight', color: 'bg-lime-500', textColor: 'text-lime-700' },
      { range: '1.0-2.0', level: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
      { range: '> 2.0', level: 'Severe', color: 'bg-red-500', textColor: 'text-red-700' }
    ]
  }
];

export default function StandardsPage() {
  const [selectedTab, setSelectedTab] = useState('who');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const downloadStandards = () => {
    const csvContent = [
      'Metal,Symbol,Allowed Concentration (mg/L),Background Value (mg/L)',
      ...whoStandards.map(standard => 
        `${standard.metal},${standard.symbol},${standard.allowed},${standard.background}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'who-standards-heavy-metals.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: "WHO standards have been downloaded as CSV file.",
    });
  };

  const downloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      console.log('Starting PDF generation for WHO standards...');
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('WHO Standards for Heavy Metals', pageWidth / 2, 20, { align: 'center' });
      
      // Add subtitle
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('World Health Organization permissible limits for heavy metals in drinking water', pageWidth / 2, 30, { align: 'center' });
      
      // Table headers
      const headers = ['Heavy Metal', 'Symbol', 'Allowed (mg/L)', 'Background (mg/L)'];
      const data = whoStandards.map(standard => [
        standard.metal,
        standard.symbol,
        standard.allowed.toString(),
        standard.background.toString()
      ]);
      
      // Add table
      let yPosition = 50;
      const cellHeight = 10;
      const cellWidth = (pageWidth - 40) / 4; // 4 columns, 20mm margin total
      
      // Draw headers
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      headers.forEach((header, index) => {
        const x = 20 + (index * cellWidth);
        pdf.rect(x, yPosition, cellWidth, cellHeight);
        pdf.text(header, x + 2, yPosition + 7);
      });
      
      // Draw data
      pdf.setFont('helvetica', 'normal');
      data.forEach((row, rowIndex) => {
        yPosition += cellHeight;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
          
          // Redraw headers on new page
          pdf.setFont('helvetica', 'bold');
          headers.forEach((header, index) => {
            const x = 20 + (index * cellWidth);
            pdf.rect(x, yPosition, cellWidth, cellHeight);
            pdf.text(header, x + 2, yPosition + 7);
          });
          pdf.setFont('helvetica', 'normal');
          yPosition += cellHeight;
        }
        
        row.forEach((cell, cellIndex) => {
          const x = 20 + (cellIndex * cellWidth);
          pdf.rect(x, yPosition, cellWidth, cellHeight);
          pdf.text(cell, x + 2, yPosition + 7);
        });
      });
      
      // Add footer note
      yPosition += cellHeight + 10;
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      const noteText = 'These standards are based on WHO guidelines for drinking water quality. Background values represent typical natural concentrations in uncontaminated water sources.';
      const lines = pdf.splitTextToSize(noteText, pageWidth - 40);
      lines.forEach((line: string, index: number) => {
        pdf.text(line, 20, yPosition + (index * 5));
      });

      console.log('PDF created successfully');

      // Save the PDF
      pdf.save('who-standards-heavy-metals.pdf');

      // Add notification
      if ((window as any).addWaterQualityNotification) {
        (window as any).addWaterQualityNotification({
          type: 'success',
          title: 'PDF Exported Successfully',
          message: 'WHO standards for heavy metals PDF has been generated',
          category: 'pdf_export',
          metadata: {
            pdfName: 'who-standards-heavy-metals.pdf',
            exportType: 'WHO Standards'
          }
        });
      }

      toast({
        title: "PDF Generated Successfully",
        description: "WHO standards have been downloaded as PDF file.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: `Error: ${error.message || 'Unknown error occurred'}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadIndicesPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      console.log('Starting PDF generation for pollution indices...');
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pollution Index Categories', pageWidth / 2, 20, { align: 'center' });
      
      // Add subtitle
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Classification categories for different water quality pollution indices', pageWidth / 2, 30, { align: 'center' });
      
      let yPosition = 50;
      
      // Process each pollution index
      pollutionIndices.forEach((index, indexIndex) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Add index name
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(index.name, 20, yPosition);
        yPosition += 10;
        
        // Add description
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(index.description, pageWidth - 40);
        descLines.forEach((line: string) => {
          pdf.text(line, 20, yPosition);
          yPosition += 5;
        });
        
        yPosition += 5;
        
        // Add reference link
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(0, 0, 255);
        pdf.text(`Reference: ${index.reference}`, 20, yPosition);
        pdf.setTextColor(0, 0, 0);
        yPosition += 8;
        
        // Add categories title
        pdf.setFont('helvetica', 'bold');
        pdf.text('Categories:', 20, yPosition);
        yPosition += 8;
        
        // Add categories
        pdf.setFont('helvetica', 'normal');
        index.categories.forEach((category) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }
          
          const categoryText = `${category.range}: ${category.level}`;
          pdf.text(`• ${categoryText}`, 25, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
      });
      
      // Add footer note
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      const noteText = 'Pollution indices are calculated using different methodologies to assess water quality. Each index provides unique insights into contamination levels and should be used in conjunction with other water quality parameters for comprehensive assessment.';
      const lines = pdf.splitTextToSize(noteText, pageWidth - 40);
      lines.forEach((line: string, index: number) => {
        pdf.text(line, 20, yPosition + (index * 5));
      });

      console.log('PDF created successfully');

      // Save the PDF
      pdf.save('pollution-indices-categories.pdf');

      // Add notification
      if ((window as any).addWaterQualityNotification) {
        (window as any).addWaterQualityNotification({
          type: 'success',
          title: 'PDF Exported Successfully',
          message: 'Pollution indices categories PDF has been generated',
          category: 'pdf_export',
          metadata: {
            pdfName: 'pollution-indices-categories.pdf',
            exportType: 'Pollution Indices'
          }
        });
      }

      toast({
        title: "PDF Generated Successfully",
        description: "Pollution indices have been downloaded as PDF file.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: `Error: ${error.message || 'Unknown error occurred'}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="flex justify-between items-center mb-4">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2 text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Calculator</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <div></div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Water Quality Standards
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
            WHO standards for heavy metals in drinking water and pollution index classification categories
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-11 sm:h-12">
            <TabsTrigger value="who" className="text-xs sm:text-sm px-2 sm:px-4">WHO Standards</TabsTrigger>
            <TabsTrigger value="indices" className="text-xs sm:text-sm px-2 sm:px-4">Pollution Indices</TabsTrigger>
          </TabsList>

          <TabsContent value="who" className="space-y-6">
            <Card id="who-standards-content">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <BookOpen className="h-5 w-5" />
                      WHO Standards for Heavy Metals
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base mt-1">
                      World Health Organization permissible limits for heavy metals in drinking water
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={downloadPDF} variant="outline" disabled={isGeneratingPDF} className="w-full sm:w-auto text-sm">
                      <FileText className="mr-2 h-4 w-4" />
                      {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                    </Button>
                    <Button onClick={downloadStandards} variant="outline" className="w-full sm:w-auto text-sm">
                      <Download className="mr-2 h-4 w-4" />
                      Download CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                  <table className="w-full border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">Heavy Metal</th>
                        <th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">Symbol</th>
                        <th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">Allowed (mg/L)</th>
                        <th className="text-left p-2 sm:p-3 font-semibold text-xs sm:text-sm">Background (mg/L)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whoStandards.map((standard, index) => (
                        <tr key={index} className="border-b hover:bg-muted/25 transition-colors">
                          <td className="p-2 sm:p-3 font-medium text-xs sm:text-sm">{standard.metal}</td>
                          <td className="p-2 sm:p-3">
                            <Badge variant="secondary" className="text-xs">{standard.symbol}</Badge>
                          </td>
                          <td className="p-2 sm:p-3">
                            <span className="font-mono text-xs sm:text-sm">{standard.allowed}</span>
                          </td>
                          <td className="p-2 sm:p-3">
                            <span className="font-mono text-xs sm:text-sm text-muted-foreground">{standard.background}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <Alert className="mt-6">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <AlertDescription className="text-sm">
                    These standards are based on WHO guidelines for drinking water quality. 
                    Background values represent typical natural concentrations in uncontaminated water sources.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indices" className="space-y-6">
            <Card id="pollution-indices-content">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <BookOpen className="h-5 w-5" />
                      Pollution Index Categories
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base mt-1">
                      Classification categories for different water quality pollution indices
                    </CardDescription>
                  </div>
                  <Button onClick={downloadIndicesPDF} variant="outline" disabled={isGeneratingPDF} className="w-full sm:w-auto text-sm">
                    <FileText className="mr-2 h-4 w-4" />
                    {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  {pollutionIndices.map((index, indexIndex) => (
                    <Card key={indexIndex} className="h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
                              <span className="truncate">{index.name}</span>
                              <a 
                                href={index.reference}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
                                title="View reference documentation"
                              >
                                <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                              </a>
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm mt-1 line-clamp-2">
                              {index.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3 sm:space-y-4">
                          <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">
                            Pollution Index Categories
                          </h4>
                          <div className="space-y-2 sm:space-y-3">
                            {index.categories.map((category, catIndex) => (
                              <div key={catIndex} className="flex items-center justify-between p-2 sm:p-3 rounded-lg border gap-2">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${category.color} flex-shrink-0`}></div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-xs sm:text-sm truncate">{category.level}</div>
                                    <div className="text-xs text-muted-foreground">{category.range}</div>
                                  </div>
                                </div>
                                <Badge className={`${category.textColor} text-xs flex-shrink-0`} variant="outline">
                                  {category.level}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t">
                            <a 
                              href={index.reference}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View scientific reference
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Alert className="mt-6">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <AlertDescription className="text-sm">
                    Pollution indices are calculated using different methodologies to assess water quality. 
                    Each index provides unique insights into contamination levels and should be used in conjunction 
                    with other water quality parameters for comprehensive assessment.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}