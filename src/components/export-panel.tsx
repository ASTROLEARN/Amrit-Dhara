'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, AlertCircle, CheckCircle, ChevronDown, Clock, Filter, BarChart3, FileSpreadsheet, History, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { notificationManager } from '@/lib/notifications';

interface Sample {
  id: string;
  sampleId: string;
  location: string;
  latitude: number;
  longitude: number;
  arsenic: number;
  cadmium: number;
  chromium: number;
  lead: number;
  mercury: number;
  nickel: number;
  copper: number;
  zinc: number;
  hpi: number | null;
  hei: number | null;
  cd: number | null;
  npi: number | null;
  hpiCategory: string | null;
  heiCategory: string | null;
  cdCategory: string | null;
  npiCategory: string | null;
  createdAt: string;
}

interface ExportPanelProps {
  refreshKey: number;
}

export function ExportPanel({ refreshKey }: ExportPanelProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([]);
  const [exporting, setExporting] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf-with-charts');
  const [exportHistory, setExportHistory] = useState<Array<{format: string, timestamp: Date, sampleCount: number}>>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [customFileName, setCustomFileName] = useState('');

  const fetchSamples = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/results?limit=200');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch samples');
      }

      setSamples(result.data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch samples';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [refreshKey]);

  const handleSelectAll = (checked: boolean) => {
    const filteredSamples = getFilteredSamples();
    if (checked) {
      setSelectedSamples(filteredSamples.map(sample => sample.id));
    } else {
      setSelectedSamples([]);
    }
  };

  const handleSelectSample = (sampleId: string, checked: boolean) => {
    if (checked) {
      setSelectedSamples(prev => [...prev, sampleId]);
    } else {
      setSelectedSamples(prev => prev.filter(id => id !== sampleId));
    }
  };

  const getFilteredSamples = () => {
    if (filterCategory === 'all') return samples;
    return samples.filter(sample => sample.hpiCategory === filterCategory);
  };

  const handleFilterChange = (category: string) => {
    setFilterCategory(category);
    setSelectedSamples([]); // Clear selection when filter changes
  };

  const handleSelectFiltered = (checked: boolean) => {
    const filteredSamples = getFilteredSamples();
    if (checked) {
      setSelectedSamples(filteredSamples.map(sample => sample.id));
    } else {
      setSelectedSamples([]);
    }
  };

  const generateFileName = (format: string) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const baseName = customFileName || `hmpi_results_${timestamp}`;
    const extension = format.includes('pdf') ? 'pdf' : 'csv';
    return `${baseName}.${extension}`;
  };

  const addToExportHistory = (format: string, sampleCount: number) => {
    const newEntry = {
      format,
      timestamp: new Date(),
      sampleCount
    };
    setExportHistory(prev => [newEntry, ...prev.slice(0, 4)]); // Keep last 5 exports
  };

  const handleExport = async () => {
    if (!selectedFormat) {
      toast({
        title: "No Format Selected",
        description: "Please select an export format",
        variant: "destructive",
      });
      return;
    }

    setExporting(selectedFormat);
    
    try {
      let response: Response;
      let filename: string;
      let formatDescription: string;

      if (selectedFormat === 'csv') {
        response = await fetch('/api/export', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            format: 'csv',
            sampleIds: selectedSamples.length > 0 ? selectedSamples : undefined
          }),
        });
        filename = `hmpi_results.csv`;
        formatDescription = 'CSV';
      } else {
        // PDF exports - use the existing PDF export API
        const includeCharts = selectedFormat === 'pdf-with-charts';
        
        // Check if samples are selected for PDF export
        if (selectedSamples.length === 0) {
          toast({
            title: "No Samples Selected",
            description: "Please select at least one sample to export PDF with charts",
            variant: "destructive",
          });
          setExporting(null);
          return;
        }
        
        // For PDF, we'll need to create a different approach since the API only supports CSV
        // Let's create a client-side PDF generation for now
        const selectedSamplesData = samples.filter(s => selectedSamples.includes(s.id));

        // Generate PDF client-side
        await generatePDF(selectedSamplesData, includeCharts);
        
        addToExportHistory(selectedFormat, selectedSamplesData.length);
        
        // Add notification
        const fileName = generateFileName(`pdf_${includeCharts ? 'with_charts' : 'data_only'}`);
        notificationManager.addPDFExportNotification(fileName, selectedSamplesData.length, includeCharts);
        
        toast({
          title: "Export Successful",
          description: `Data exported as PDF (${includeCharts ? 'with charts' : 'data only'}) file`,
        });
        
        setExporting(null);
        return;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = generateFileName('csv');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToExportHistory('csv', selectedSamples.length > 0 ? selectedSamples.length : samples.length);

      // Add notification
      const fileName = generateFileName('csv');
      const sampleCount = selectedSamples.length > 0 ? selectedSamples.length : samples.length;
      notificationManager.addCSVExportNotification(fileName, sampleCount);

      toast({
        title: "Export Successful",
        description: `Data exported as ${formatDescription} file`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  // Client-side PDF generation function
  const generatePDF = async (data: Sample[], includeCharts: boolean) => {
    // Import jsPDF dynamically
    const { default: jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Add header background
    pdf.setFillColor(59, 130, 246); // Blue background
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Add title with white text
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255); // White text
    pdf.text('Heavy Metal Pollution Analysis Report', pageWidth / 2, yPosition + 10, { align: 'center' });
    
    // Add subtitle
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Comprehensive Water Quality Assessment', pageWidth / 2, yPosition + 18, { align: 'center' });
    
    yPosition = 55;

    // Reset text color to black
    pdf.setTextColor(0, 0, 0);
    
    // Add generation info in a bordered box
    pdf.setDrawColor(200, 200, 200);
    pdf.setFillColor(248, 250, 252); // Light blue background
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 25, 3, 3, 'FD');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Report Information', 20, yPosition + 2);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPosition + 8);
    pdf.text(`Total Samples Analyzed: ${data.length}`, 20, yPosition + 14);
    pdf.text(`Report Type: ${includeCharts ? 'Comprehensive with Charts' : 'Data Summary'}`, 120, yPosition + 8);
    pdf.text(`Analysis Method: HPI Calculation`, 120, yPosition + 14);
    
    yPosition += 35;

    // Add summary statistics section with colored background
    pdf.setFillColor(254, 249, 195); // Light yellow background
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 45, 3, 3, 'FD');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Executive Summary', 20, yPosition + 5);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const cleanSamples = data.filter(s => s.hpiCategory === 'Clean').length;
    const moderateSamples = data.filter(s => s.hpiCategory === 'Moderate').length;
    const highSamples = data.filter(s => s.hpiCategory === 'High').length;
    const totalSamples = data.length;
    
    // Add colored indicators
    pdf.setFillColor(34, 197, 94); // Green
    pdf.rect(22, yPosition + 12, 6, 6, 'F');
    pdf.text(`Clean Water: ${cleanSamples} samples (${((cleanSamples/totalSamples)*100).toFixed(1)}%)`, 35, yPosition + 17);
    
    pdf.setFillColor(234, 179, 8); // Yellow/Orange
    pdf.rect(22, yPosition + 22, 6, 6, 'F');
    pdf.text(`Moderate Pollution: ${moderateSamples} samples (${((moderateSamples/totalSamples)*100).toFixed(1)}%)`, 35, yPosition + 27);
    
    pdf.setFillColor(239, 68, 68); // Red
    pdf.rect(22, yPosition + 32, 6, 6, 'F');
    pdf.text(`High Pollution: ${highSamples} samples (${((highSamples/totalSamples)*100).toFixed(1)}%)`, 35, yPosition + 37);
    
    yPosition += 55;

    if (includeCharts) {
      // Add chart section with background
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFillColor(237, 233, 254); // Light purple background
      pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 75, 3, 3, 'FD');
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pollution Distribution Chart', 20, yPosition + 5);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Visual representation of water quality categories across all samples', 20, yPosition + 12);
      
      yPosition += 20;

      // Enhanced bar chart with better styling
      const barWidth = 35;
      const barSpacing = 25;
      const maxHeight = 45;
      const maxCount = Math.max(cleanSamples, moderateSamples, highSamples, 1);
      const chartStartX = 30;
      
      // Draw chart axis
      pdf.setDrawColor(100, 100, 100);
      pdf.line(chartStartX, yPosition + maxHeight, chartStartX + (barWidth + barSpacing) * 3 - barSpacing, yPosition + maxHeight);
      pdf.line(chartStartX, yPosition, chartStartX, yPosition + maxHeight);
      
      // Draw bars with gradients effect (simulated)
      // Clean bar - Green
      pdf.setFillColor(34, 197, 94);
      const cleanHeight = (cleanSamples / maxCount) * maxHeight;
      pdf.rect(chartStartX, yPosition + maxHeight - cleanHeight, barWidth, cleanHeight, 'F');
      pdf.setDrawColor(22, 163, 74);
      pdf.rect(chartStartX, yPosition + maxHeight - cleanHeight, barWidth, cleanHeight, 'D');
      
      // Moderate bar - Orange
      pdf.setFillColor(251, 146, 60);
      const moderateHeight = (moderateSamples / maxCount) * maxHeight;
      pdf.rect(chartStartX + barWidth + barSpacing, yPosition + maxHeight - moderateHeight, barWidth, moderateHeight, 'F');
      pdf.setDrawColor(234, 88, 12);
      pdf.rect(chartStartX + barWidth + barSpacing, yPosition + maxHeight - moderateHeight, barWidth, moderateHeight, 'D');
      
      // High bar - Red
      pdf.setFillColor(239, 68, 68);
      const highHeight = (highSamples / maxCount) * maxHeight;
      pdf.rect(chartStartX + (barWidth + barSpacing) * 2, yPosition + maxHeight - highHeight, barWidth, highHeight, 'F');
      pdf.setDrawColor(220, 38, 38);
      pdf.rect(chartStartX + (barWidth + barSpacing) * 2, yPosition + maxHeight - highHeight, barWidth, highHeight, 'D');
      
      // Add value labels on top of bars
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(cleanSamples.toString(), chartStartX + barWidth/2, yPosition + maxHeight - cleanHeight - 3, { align: 'center' });
      pdf.text(moderateSamples.toString(), chartStartX + barWidth + barSpacing + barWidth/2, yPosition + maxHeight - moderateHeight - 3, { align: 'center' });
      pdf.text(highSamples.toString(), chartStartX + (barWidth + barSpacing) * 2 + barWidth/2, yPosition + maxHeight - highHeight - 3, { align: 'center' });
      
      // Labels with percentages
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Clean', chartStartX + barWidth/2, yPosition + maxHeight + 5, { align: 'center' });
      pdf.text(`(${((cleanSamples/totalSamples)*100).toFixed(0)}%)`, chartStartX + barWidth/2, yPosition + maxHeight + 9, { align: 'center' });
      
      pdf.text('Moderate', chartStartX + barWidth + barSpacing + barWidth/2, yPosition + maxHeight + 5, { align: 'center' });
      pdf.text(`(${((moderateSamples/totalSamples)*100).toFixed(0)}%)`, chartStartX + barWidth + barSpacing + barWidth/2, yPosition + maxHeight + 9, { align: 'center' });
      
      pdf.text('High', chartStartX + (barWidth + barSpacing) * 2 + barWidth/2, yPosition + maxHeight + 5, { align: 'center' });
      pdf.text(`(${((highSamples/totalSamples)*100).toFixed(0)}%)`, chartStartX + (barWidth + barSpacing) * 2 + barWidth/2, yPosition + maxHeight + 9, { align: 'center' });
      
      yPosition += 85;
    }

    // Add data table with enhanced formatting
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFillColor(254, 240, 138); // Light amber background
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 20, 3, 3, 'FD');
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Detailed Sample Analysis', 20, yPosition + 8);
    
    yPosition += 25;

    // Enhanced table header with background
    pdf.setFillColor(30, 58, 138); // Dark blue background
    pdf.rect(15, yPosition - 3, pageWidth - 30, 10, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255); // White text for headers
    pdf.text('Sample ID', 18, yPosition + 3);
    pdf.text('Location', 55, yPosition + 3);
    pdf.text('HPI Value', 100, yPosition + 3);
    pdf.text('Category', 130, yPosition + 3);
    pdf.text('Arsenic', 155, yPosition + 3);
    pdf.text('Lead', 175, yPosition + 3);
    
    yPosition += 8;

    // Table data with alternating row colors
    pdf.setTextColor(0, 0, 0); // Reset text color
    pdf.setFont('helvetica', 'normal');
    const samplesToShow = Math.min(25, data.length); // Show more samples
    
    for (let i = 0; i < samplesToShow; i++) {
      const sample = data[i];
      
      if (yPosition > pageHeight - 15) {
        pdf.addPage();
        yPosition = 20;
        
        // Repeat table header on new page
        pdf.setFillColor(30, 58, 138);
        pdf.rect(15, yPosition - 3, pageWidth - 30, 10, 'F');
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('Sample ID', 18, yPosition + 3);
        pdf.text('Location', 55, yPosition + 3);
        pdf.text('HPI Value', 100, yPosition + 3);
        pdf.text('Category', 130, yPosition + 3);
        pdf.text('Arsenic', 155, yPosition + 3);
        pdf.text('Lead', 175, yPosition + 3);
        yPosition += 8;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
      }
      
      // Alternating row colors
      if (i % 2 === 0) {
        pdf.setFillColor(248, 250, 252); // Light blue for even rows
        pdf.rect(15, yPosition - 2, pageWidth - 30, 6, 'F');
      }
      
      // Color code the category
      if (sample.hpiCategory === 'Clean') {
        pdf.setTextColor(34, 197, 94); // Green
      } else if (sample.hpiCategory === 'Moderate') {
        pdf.setTextColor(251, 146, 60); // Orange
      } else if (sample.hpiCategory === 'High') {
        pdf.setTextColor(239, 68, 68); // Red
      } else {
        pdf.setTextColor(100, 100, 100); // Gray for unknown
      }
      
      pdf.setFontSize(9);
      pdf.text(sample.sampleId, 18, yPosition + 3);
      pdf.setTextColor(0, 0, 0);
      pdf.text(sample.location.length > 12 ? sample.location.substring(0, 12) + '...' : sample.location, 55, yPosition + 3);
      pdf.text((sample.hpi || 0).toFixed(1), 100, yPosition + 3);
      
      // Category with color
      if (sample.hpiCategory === 'Clean') {
        pdf.setTextColor(34, 197, 94);
      } else if (sample.hpiCategory === 'Moderate') {
        pdf.setTextColor(251, 146, 60);
      } else if (sample.hpiCategory === 'High') {
        pdf.setTextColor(239, 68, 68);
      }
      pdf.text(sample.hpiCategory || 'N/A', 130, yPosition + 3);
      
      pdf.setTextColor(0, 0, 0);
      pdf.text(sample.arsenic.toFixed(3), 155, yPosition + 3);
      pdf.text(sample.lead.toFixed(3), 175, yPosition + 3);
      
      yPosition += 6;
    }
    
    // Add note if more samples exist
    if (data.length > samplesToShow) {
      yPosition += 5;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`... and ${data.length - samplesToShow} more samples`, 20, yPosition);
    }

    // Add footer with additional information
    const footerY = pageHeight - 20;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(15, footerY, pageWidth - 15, footerY);
    
    // Add legend box
    pdf.setFillColor(245, 245, 245);
    pdf.roundedRect(15, footerY + 2, pageWidth - 30, 12, 2, 2, 'FD');
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    
    // Legend items
    pdf.setFillColor(34, 197, 94);
    pdf.rect(18, footerY + 6, 4, 4, 'F');
    pdf.text('Clean (HPI<100)', 25, footerY + 9);
    
    pdf.setFillColor(251, 146, 60);
    pdf.rect(63, footerY + 6, 4, 4, 'F');
    pdf.text('Moderate (HPI 100-200)', 70, footerY + 9);
    
    pdf.setFillColor(239, 68, 68);
    pdf.rect(118, footerY + 6, 4, 4, 'F');
    pdf.text('High (HPI>200)', 125, footerY + 9);
    
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 60, footerY + 9);
    
    // Page number
    pdf.setFontSize(8);
    pdf.text(`Page ${pdf.internal.pages.length - 1}`, pageWidth / 2, footerY + 13, { align: 'center' });

    // Save the PDF
    const includeChartsText = includeCharts ? 'with_charts' : 'data_only';
    const fileName = generateFileName(`pdf_${includeChartsText}`);
    pdf.save(fileName);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="card-hover">
          <CardHeader>
            <Skeleton className="h-6 w-32 shimmer" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full shimmer" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (samples.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Download className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No data to export</h3>
          <p className="text-muted-foreground text-center">
            Upload sample data to export results.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export Data</h2>
          <p className="text-muted-foreground">Download analysis results in various formats</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Advanced
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSamples}>
            Refresh
          </Button>
        </div>
      </div>

      {showAdvancedOptions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Export Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Custom File Name (optional)</label>
                <input
                  type="text"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  placeholder="Enter custom file name without extension"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by Category</label>
                <Select value={filterCategory} onValueChange={handleFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter samples" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Samples</SelectItem>
                    <SelectItem value="Clean">Clean Only</SelectItem>
                    <SelectItem value="Moderate">Moderate Pollution Only</SelectItem>
                    <SelectItem value="High">High Pollution Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Export Options</CardTitle>
            <CardDescription className="text-sm">
              Choose format and select samples to export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Samples:</span>
                <Badge variant="outline" className="text-xs">
                  {selectedSamples.length > 0 ? selectedSamples.length : 'All'} samples
                </Badge>
              </div>
              <div className="flex items-start sm:items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedSamples.length === getFilteredSamples().length && getFilteredSamples().length > 0}
                  onCheckedChange={handleSelectAll}
                  className="mt-0.5 sm:mt-0"
                />
                <label htmlFor="select-all" className="text-sm leading-tight">
                  Select all ({getFilteredSamples().length} samples)
                </label>
              </div>
              {filterCategory !== 'all' && (
                <div className="flex items-start sm:items-center space-x-2">
                  <Checkbox
                    id="select-filtered"
                    checked={selectedSamples.length === getFilteredSamples().length && getFilteredSamples().length > 0}
                    onCheckedChange={handleSelectFiltered}
                    className="mt-0.5 sm:mt-0"
                  />
                  <label htmlFor="select-filtered" className="text-sm text-blue-600 leading-tight">
                    Select filtered ({filterCategory}) samples
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Export Format:</h4>
              
              {/* Export Format Dropdown */}
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent>
                  {/* PDF Options */}
                  <div className="px-2 py-1.5">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">PDF Export</div>
                    <SelectItem value="pdf-with-charts">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        PDF with Charts
                      </div>
                    </SelectItem>
                    <SelectItem value="pdf-data-only">
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        PDF Data Only
                      </div>
                    </SelectItem>
                  </div>
                  
                  {/* CSV Option */}
                  <div className="px-2 py-1.5">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">CSV Export</div>
                    <SelectItem value="csv">
                      <div className="flex items-center">
                        <Download className="mr-2 h-4 w-4" />
                        CSV Raw Data
                      </div>
                    </SelectItem>
                  </div>
                </SelectContent>
              </Select>

              {/* Export Button */}
              <Button
                onClick={handleExport}
                disabled={exporting !== null || !selectedFormat}
                className="w-full btn-hover relative overflow-hidden group"
              >
                {exporting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    {exporting === 'csv' ? 'Exporting CSV...' : 
                     exporting === 'pdf-with-charts' ? 'Exporting PDF with Charts...' :
                     exporting === 'pdf-data-only' ? 'Exporting PDF Data Only...' :
                     'Exporting...'}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                    Export Data
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>- <strong>PDF with Charts:</strong> Complete report with visualizations</p>
              <p>- <strong>PDF Data Only:</strong> Tables and statistics without charts</p>
              <p>- <strong>CSV:</strong> Raw data for further processing</p>
              <p>- If no samples selected, all data will be exported</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Sample Selection</CardTitle>
            <CardDescription className="text-sm">
              Choose specific samples to export
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto">
              {getFilteredSamples().map((sample) => (
                <div key={sample.id} className="flex items-start sm:items-center space-x-2">
                  <Checkbox
                    id={sample.id}
                    checked={selectedSamples.includes(sample.id)}
                    onCheckedChange={(checked) => handleSelectSample(sample.id, checked as boolean)}
                    className="mt-0.5 sm:mt-0"
                  />
                  <label htmlFor={sample.id} className="text-sm flex-1 leading-tight">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{sample.sampleId}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs flex-shrink-0 ${
                          sample.hpiCategory === 'Clean' ? 'border-green-200 text-green-800' :
                          sample.hpiCategory === 'Moderate' ? 'border-yellow-200 text-yellow-800' :
                          sample.hpiCategory === 'High' ? 'border-red-200 text-red-800' :
                          'border-gray-200 text-gray-800'
                        }`}
                      >
                        {sample.hpiCategory || 'N/A'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {sample.location} - {sample.latitude.toFixed(4)}, {sample.longitude.toFixed(4)}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Export Summary</CardTitle>
            <CardDescription>
              Overview of data that will be exported
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="text-center p-3 bg-blue-50/50 rounded-lg border border-blue-100 hover:bg-blue-100/50 transition-colors duration-300">
                <div className="text-2xl font-bold text-blue-600">{samples.length}</div>
                <div className="text-sm text-muted-foreground">Total Samples</div>
              </div>
              <div className="text-center p-3 bg-green-50/50 rounded-lg border border-green-100 hover:bg-green-100/50 transition-colors duration-300">
                <div className="text-2xl font-bold text-green-600">
                  {samples.filter(s => s.hpiCategory === 'Clean').length}
                </div>
                <div className="text-sm text-muted-foreground">Clean Samples</div>
              </div>
              <div className="text-center p-3 bg-yellow-50/50 rounded-lg border border-yellow-100 hover:bg-yellow-100/50 transition-colors duration-300">
                <div className="text-2xl font-bold text-yellow-600">
                  {samples.filter(s => s.hpiCategory === 'Moderate').length}
                </div>
                <div className="text-sm text-muted-foreground">Moderate Pollution</div>
              </div>
              <div className="text-center p-3 bg-red-50/50 rounded-lg border border-red-100 hover:bg-red-100/50 transition-colors duration-300">
                <div className="text-2xl font-bold text-red-600">
                  {samples.filter(s => s.hpiCategory === 'High').length}
                </div>
                <div className="text-sm text-muted-foreground">High Pollution</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Export History</CardTitle>
            <CardDescription>
              Recent export activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exportHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No export history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exportHistory.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-center space-x-2">
                      {entry.format.includes('pdf') ? (
                        <FileText className="h-4 w-4 text-red-500" />
                      ) : (
                        <FileSpreadsheet className="h-4 w-4 text-green-500" />
                      )}
                      <span className="capitalize">
                        {entry.format.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground">{entry.sampleCount} samples</div>
                      <div className="text-xs text-muted-foreground">
                        {entry.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Data Insights</CardTitle>
            <CardDescription>
              Quick statistics about your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg HPI Score</span>
                <span className="font-medium">
                  {samples.length > 0 
                    ? (samples.reduce((sum, s) => sum + (s.hpi || 0), 0) / samples.length).toFixed(1)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Highest HPI</span>
                <span className="font-medium text-red-600">
                  {samples.length > 0 
                    ? Math.max(...samples.map(s => s.hpi || 0)).toFixed(1)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lowest HPI</span>
                <span className="font-medium text-green-600">
                  {samples.length > 0 
                    ? Math.min(...samples.map(s => s.hpi || 0)).toFixed(1)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pollution Rate</span>
                <span className="font-medium">
                  {samples.length > 0 
                    ? ((samples.filter(s => s.hpiCategory !== 'Clean').length / samples.length) * 100).toFixed(1) + '%'
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}