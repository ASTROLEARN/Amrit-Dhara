'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, ReferenceLine, Brush, Dot, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Area, AreaChart } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, TrendingDown, RefreshCw, Download, MapPin, Database, LineChart as LineChartIcon, Calendar, Target, Activity, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

interface DataVisualizationProps {
  refreshKey: number;
}

const COLORS = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  blue: '#3b82f6',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
  cyan: '#06b6d4'
};

// Benchmark standards for heavy metals (mg/L)
const BENCHMARK_STANDARDS = {
  WHO: {
    arsenic: 0.01,
    cadmium: 0.003,
    chromium: 0.05,
    lead: 0.01,
    mercury: 0.001,
    nickel: 0.02,
    copper: 2.0,
    zinc: 3.0
  },
  EPA: {
    arsenic: 0.01,
    cadmium: 0.005,
    chromium: 0.1,
    lead: 0.015,
    mercury: 0.002,
    nickel: 0.1,
    copper: 1.3,
    zinc: 5.0
  }
};

// WHO Standard values for HPI calculation
const WHO_STANDARD_VALUES = {
  arsenic: 0.01,
  cadmium: 0.003,
  chromium: 0.05,
  lead: 0.01,
  mercury: 0.001,
  nickel: 0.02,
  copper: 2.0,
  zinc: 3.0
};

export function DataVisualization({ refreshKey }: DataVisualizationProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<string>('concentrations');
  
  // Individual location trend state
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [locationTrendData, setLocationTrendData] = useState<Sample[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedMetals, setSelectedMetals] = useState<string[]>(['arsenic', 'lead', 'cadmium', 'chromium']);
  const [selectedIndices, setSelectedIndices] = useState<string[]>(['hpi', 'hei', 'cd', 'npi']);
  const [generating, setGenerating] = useState(false);
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);

  // Dynamic Time Range Selector state
  const [timeRange, setTimeRange] = useState<{start: string, end: string}>({
    start: '',
    end: ''
  });
  const [customTimeRange, setCustomTimeRange] = useState(false);

  // Benchmark Comparison Overlay state
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [benchmarkType, setBenchmarkType] = useState<'WHO' | 'EPA' | 'Custom'>('WHO');
  const [customBenchmark, setCustomBenchmark] = useState<Record<string, number>>({});

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

  // Calculate overview metrics
  useEffect(() => {
    if (samples.length > 0) {
      calculateOverviewMetrics();
    }
  }, [samples]);

  const calculateOverviewMetrics = () => {
    const totalSamples = samples.length;
    const avgHpi = samples.reduce((sum, s) => sum + (s.hpi || 0), 0) / totalSamples;
    const highPollutionCount = samples.filter(s => (s.hpi || 0) > 100).length;
    const criticalLocations = samples
      .filter(s => (s.hpi || 0) > 100)
      .map(s => s.location)
      .filter((loc, index, arr) => arr.indexOf(loc) === index)
      .slice(0, 3);
    
    // Calculate trend (compare first half vs second half)
    const midPoint = Math.floor(totalSamples / 2);
    const firstHalfAvg = samples.slice(0, midPoint).reduce((sum, s) => sum + (s.hpi || 0), 0) / midPoint;
    const secondHalfAvg = samples.slice(midPoint).reduce((sum, s) => sum + (s.hpi || 0), 0) / (totalSamples - midPoint);
    const trend = secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing';
    const trendPercentage = Math.abs(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);
    
    setOverviewMetrics({
      totalSamples,
      avgHpi: avgHpi.toFixed(1),
      highPollutionCount,
      criticalLocations,
      trend,
      trendPercentage: trendPercentage.toFixed(1),
      mostPollutedMetal: getMostPollutedMetal(),
      complianceRate: ((totalSamples - highPollutionCount) / totalSamples * 100).toFixed(1)
    });
  };

  const getMostPollutedMetal = () => {
    const metals = ['arsenic', 'cadmium', 'chromium', 'lead', 'mercury', 'nickel', 'copper', 'zinc'];
    const metalNames = {
      'arsenic': 'Arsenic',
      'cadmium': 'Cadmium',
      'chromium': 'Chromium',
      'lead': 'Lead',
      'mercury': 'Mercury',
      'nickel': 'Nickel',
      'copper': 'Copper',
      'zinc': 'Zinc'
    };
    
    const metalAverages = metals.map(metal => {
      const avg = samples.reduce((sum, s) => sum + (s[metal] || 0), 0) / samples.length;
      const standard = WHO_STANDARD_VALUES[metal];
      const ratio = standard > 0 ? avg / standard : 0;
      return { metal: metalNames[metal], ratio };
    });
    
    return metalAverages.reduce((max, current) => current.ratio > max.ratio ? current : max).metal;
  };

  // Prepare data for metal concentrations bar chart
  const getConcentrationData = () => {
    if (samples.length === 0) return [];

    const metals = ['As', 'Cd', 'Cr', 'Pb', 'Hg', 'Ni', 'Cu', 'Zn'];
    const metalNames = {
      'As': 'Arsenic',
      'Cd': 'Cadmium',
      'Cr': 'Chromium',
      'Pb': 'Lead',
      'Hg': 'Mercury',
      'Ni': 'Nickel',
      'Cu': 'Copper',
      'Zn': 'Zinc'
    };

    return metals.map(metal => {
      const values = samples.map(sample => {
        switch (metal) {
          case 'As': return sample.arsenic;
          case 'Cd': return sample.cadmium;
          case 'Cr': return sample.chromium;
          case 'Pb': return sample.lead;
          case 'Hg': return sample.mercury;
          case 'Ni': return sample.nickel;
          case 'Cu': return sample.copper;
          case 'Zn': return sample.zinc;
          default: return 0;
        }
      });

      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);

      return {
        name: metalNames[metal as keyof typeof metalNames],
        average: parseFloat(avg.toFixed(4)),
        maximum: parseFloat(max.toFixed(4)),
        minimum: parseFloat(min.toFixed(4))
      };
    });
  };

  // Prepare data for pollution indices comparison
  const getIndicesData = () => {
    if (samples.length === 0) return [];

    return samples.slice(0, 20).map(sample => ({
      name: sample.sampleId,
      HPI: sample.hpi || 0,
      HEI: sample.hei || 0,
      CD: sample.cd || 0,
      NPI: sample.npi || 0
    }));
  };

  // Prepare data for quality distribution pie charts
  const getQualityDistribution = (index: string) => {
    if (samples.length === 0) return [];

    const distribution: Record<string, number> = {};
    
    samples.forEach(sample => {
      let category = '';
      switch (index) {
        case 'hpi':
          category = sample.hpiCategory || 'Unknown';
          break;
        case 'hei':
          category = sample.heiCategory || 'Unknown';
          break;
        case 'cd':
          category = sample.cdCategory || 'Unknown';
          break;
        case 'npi':
          category = sample.npiCategory || 'Unknown';
          break;
      }
      distribution[category] = (distribution[category] || 0) + 1;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      color: name.includes('Clean') || name.includes('Low') ? COLORS.green :
             name.includes('Moderate') || name.includes('Medium') || name.includes('Slight') ? COLORS.yellow :
             name.includes('High') || name.includes('Severe') ? COLORS.red : COLORS.blue
    }));
  };

  // Prepare data for temporal trends
  const getTemporalData = () => {
    if (samples.length === 0) return [];

    const sortedSamples = [...samples].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return sortedSamples.map((sample, index) => ({
      index: index + 1,
      HPI: sample.hpi || 0,
      HEI: sample.hei || 0,
      CD: sample.cd || 0,
      NPI: sample.npi || 0,
      date: new Date(sample.createdAt).toLocaleDateString()
    }));
  };

  // Individual location trend functions
  const getUniqueLocations = () => {
    const locationMap = new Map<string, { count: number; location: string; samples: Sample[] }>();
    
    samples.forEach(sample => {
      const key = sample.location;
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          count: 0,
          location: sample.location,
          samples: []
        });
      }
      const locationData = locationMap.get(key)!;
      locationData.count++;
      locationData.samples.push(sample);
    });
    
    return Array.from(locationMap.values()).sort((a, b) => a.location.localeCompare(b.location));
  };

  const fetchLocationTrendData = async (locationName: string) => {
    setTrendLoading(true);
    try {
      // Fetch all samples for this location by name only
      const response = await fetch(`/api/results?location=${encodeURIComponent(locationName)}&limit=100`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch location data');
      }
      
      // Sort by date
      const sortedData = result.data.sort((a: Sample, b: Sample) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      setLocationTrendData(sortedData);
      
      toast({
        title: "Location Data Loaded",
        description: `Found ${sortedData.length} samples for ${locationName}`,
      });
    } catch (error) {
      console.error('Error fetching location trend data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch location trend data",
        variant: "destructive"
      });
    } finally {
      setTrendLoading(false);
    }
  };

  const handleLocationChange = (locationName: string) => {
    setSelectedLocation(locationName);
    if (locationName) {
      fetchLocationTrendData(locationName);
    } else {
      setLocationTrendData([]);
    }
  };

  const getTrendChartData = () => {
    const filteredData = getFilteredTrendData();
    if (filteredData.length === 0) return [];
    
    return filteredData.map(sample => ({
      date: new Date(sample.createdAt).toLocaleDateString(),
      fullDate: sample.createdAt,
      arsenic: sample.arsenic,
      cadmium: sample.cadmium,
      chromium: sample.chromium,
      lead: sample.lead,
      mercury: sample.mercury,
      nickel: sample.nickel,
      copper: sample.copper,
      zinc: sample.zinc,
      hpi: sample.hpi,
      hei: sample.hei,
      cd: sample.cd,
      npi: sample.npi
    }));
  };

  const generateSampleTrendData = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-trend-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationsPerTrend: 3, dataPointsPerLocation: 6 })
      });
      const result = await response.json();
      if (response.ok) {
        toast({
          title: "Trend Data Generated",
          description: result.message,
        });
        fetchSamples(); // Refresh the data
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate trend data",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  // Helper functions for new features
  const getFilteredTrendData = () => {
    let filteredData = [...locationTrendData];
    
    // Apply time range filter
    if (customTimeRange && timeRange.start && timeRange.end) {
      filteredData = filteredData.filter(sample => {
        const sampleDate = new Date(sample.createdAt);
        const startDate = new Date(timeRange.start);
        const endDate = new Date(timeRange.end);
        return sampleDate >= startDate && sampleDate <= endDate;
      });
    }
    
    return filteredData;
  };

  const getCurrentBenchmark = () => {
    if (benchmarkType === 'Custom') {
      return customBenchmark;
    }
    return BENCHMARK_STANDARDS[benchmarkType];
  };

  const getBenchmarkValue = (metal: string) => {
    const benchmark = getCurrentBenchmark();
    return benchmark[metal] || 0;
  };

  // Improved benchmark display - show only most critical benchmarks
  const getCriticalBenchmarkLines = (selectedItems: string[], itemType: 'metals' | 'indices') => {
    if (!showBenchmark) return [];
    
    const lines: Array<{key: string, y: number, label: string, position: string}> = [];
    
    if (itemType === 'metals') {
      // Only show benchmarks for metals that have values exceeding 50% of the limit
      selectedItems.forEach((metal, index) => {
        const benchmarkValue = getBenchmarkValue(metal);
        if (benchmarkValue > 0) {
          const maxDataValue = Math.max(...getFilteredTrendData().map(d => d[metal] || 0));
          if (maxDataValue > benchmarkValue * 0.5) {
            lines.push({
              key: `benchmark-${metal}`,
              y: benchmarkValue,
              label: metal.charAt(0).toUpperCase() + metal.slice(1),
              position: index % 2 === 0 ? 'left' : 'right'
            });
          }
        }
      });
    } else {
      // For indices, only show HPI threshold if HPI is selected
      if (selectedItems.includes('hpi')) {
        lines.push({
          key: 'hpi-threshold',
          y: 100,
          label: 'HPI Limit',
          position: 'left'
        });
      }
    }
    
    return lines;
  };

  // PDF Export function for location trends
  // Enhanced PDF export function with improved formatting and colors
  const exportLocationTrendsToPdf = async () => {
    if (!locationTrendData || locationTrendData.length === 0) {
      toast({
        title: "No Data",
        description: "No location trends data available to export",
        variant: "destructive"
      });
      return;
    }

    setExportingPdf(true);
    
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const jsPDF = (await import('jspdf')).jsPDF;
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate date range from the data or use custom time range
      let startDate: Date;
      let endDate: Date;
      
      if (customTimeRange && timeRange.start && timeRange.end) {
        startDate = new Date(timeRange.start);
        endDate = new Date(timeRange.end);
      } else {
        // Derive from the actual data
        const dates = locationTrendData.map(d => new Date(d.createdAt));
        startDate = new Date(Math.min(...dates.map(d => d.getTime())));
        endDate = new Date(Math.max(...dates.map(d => d.getTime())));
      }
      
      // Add header with background color
      pdf.setFillColor(59, 130, 246); // Blue background
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      // Add title in white
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255); // White text
      pdf.text('Location Trends Analysis Report', pageWidth / 2, 25, { align: 'center' });
      
      // Reset text color
      pdf.setTextColor(0, 0, 0);
      
      // Add location information section with colored background
      pdf.setFillColor(249, 250, 251); // Light gray background
      pdf.rect(10, 50, pageWidth - 20, 35, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Report Details', 20, 60);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.text(`Location: ${selectedLocation}`, 20, 70);
      pdf.text(`Total Samples: ${locationTrendData.length}`, 20, 78);
      pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, 86);
      
      // Add data range information
      if (locationTrendData.length > 0) {
        const firstDate = new Date(locationTrendData[0].createdAt).toLocaleDateString();
        const lastDate = new Date(locationTrendData[locationTrendData.length - 1].createdAt).toLocaleDateString();
        pdf.text(`Data Range: ${firstDate} to ${lastDate}`, pageWidth - 80, 78);
      }
      
      let yPosition = 100;
      
      // Add section divider
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.5);
      pdf.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 10;
      
      // Capture and add metal concentration chart
      console.log('Looking for metal chart element...');
      const metalChartElement = document.getElementById('location-trends-chart');
      console.log('Metal chart element:', metalChartElement);
      
      if (metalChartElement) {
        try {
          console.log('Capturing metal chart...');
          
          // Wait for chart to fully render
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Add metal chart title with colored background
          pdf.setFillColor(239, 68, 68); // Red background for metals
          pdf.rect(10, yPosition - 8, pageWidth - 20, 12, 'F');
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255); // White text
          pdf.text('Metal Concentration Trends', pageWidth / 2, yPosition, { align: 'center' });
          pdf.setTextColor(0, 0, 0); // Reset to black
          yPosition += 15;
          
          // Add metal information
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'italic');
          pdf.text(`Selected Metals: ${selectedMetals.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}`, 20, yPosition);
          yPosition += 8;
          pdf.text(`Chart Type: ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`, 20, yPosition);
          yPosition += 10;
          
          const metalCanvas = await html2canvas(metalChartElement, {
            backgroundColor: '#ffffff',
            scale: 3,
            logging: false,
            useCORS: true,
            allowTaint: true,
            ignoreElements: (element) => {
              return element.tagName === 'STYLE' || element.tagName === 'LINK' || element.tagName === 'SCRIPT';
            }
          });
          
          console.log('Metal chart captured successfully');
          const metalImgData = metalCanvas.toDataURL('image/png', 1.0);
          const metalImgWidth = 170;
          const metalImgHeight = (metalCanvas.height * metalImgWidth) / metalCanvas.width;
          
          if (yPosition + metalImgHeight > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Add chart with border
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(20, yPosition, metalImgWidth, metalImgHeight);
          pdf.addImage(metalImgData, 'PNG', 20, yPosition, metalImgWidth, metalImgHeight);
          yPosition += metalImgHeight + 25;
          
          console.log('Metal chart added to PDF');
        } catch (error) {
          console.error('Error capturing metal chart:', error);
          toast({
            title: "Chart Capture Error",
            description: "Failed to capture metal concentration chart",
            variant: "destructive"
          });
        }
      }
      
      // Capture and add pollution indices chart
      console.log('Looking for index chart element...');
      const indexChartElement = document.getElementById('pollution-index-chart');
      console.log('Index chart element:', indexChartElement);
      
      if (indexChartElement) {
        try {
          console.log('Capturing index chart...');
          
          // Wait for chart to fully render
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Add index chart title with colored background
          pdf.setFillColor(168, 85, 247); // Purple background for indices
          pdf.rect(10, yPosition - 8, pageWidth - 20, 12, 'F');
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255); // White text
          pdf.text('Pollution Indices Trends', pageWidth / 2, yPosition, { align: 'center' });
          pdf.setTextColor(0, 0, 0); // Reset to black
          yPosition += 15;
          
          // Add indices information
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'italic');
          pdf.text(`Selected Indices: ${selectedIndices.map(i => i.toUpperCase()).join(', ')}`, 20, yPosition);
          yPosition += 8;
          pdf.text(`Chart Type: ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`, 20, yPosition);
          yPosition += 10;
          
          const indexCanvas = await html2canvas(indexChartElement, {
            backgroundColor: '#ffffff',
            scale: 3,
            logging: false,
            useCORS: true,
            allowTaint: true,
            ignoreElements: (element) => {
              return element.tagName === 'STYLE' || element.tagName === 'LINK' || element.tagName === 'SCRIPT';
            }
          });
          
          console.log('Index chart captured successfully');
          const indexImgData = indexCanvas.toDataURL('image/png', 1.0);
          const indexImgWidth = 170;
          const indexImgHeight = (indexCanvas.height * indexImgWidth) / indexCanvas.width;
          
          if (yPosition + indexImgHeight > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Add chart with border
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(20, yPosition, indexImgWidth, indexImgHeight);
          pdf.addImage(indexImgData, 'PNG', 20, yPosition, indexImgWidth, indexImgHeight);
          yPosition += indexImgHeight + 20;
          
          console.log('Index chart added to PDF');
        } catch (error) {
          console.error('Error capturing index chart:', error);
          toast({
            title: "Chart Capture Error",
            description: "Failed to capture pollution indices chart",
            variant: "destructive"
          });
        }
      }
      
      // Add summary statistics with enhanced formatting
      pdf.addPage();
      yPosition = 20;
      
      // Add section header with color
      pdf.setFillColor(34, 197, 94); // Green background for summary
      pdf.rect(10, yPosition - 8, pageWidth - 20, 12, 'F');
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255); // White text
      pdf.text('Summary Statistics & Analysis', pageWidth / 2, yPosition, { align: 'center' });
      pdf.setTextColor(0, 0, 0); // Reset to black
      yPosition += 20;
      
      // Add statistics section with background
      pdf.setFillColor(249, 250, 251); // Light gray background
      pdf.rect(10, yPosition - 5, pageWidth - 20, 60, 'F');
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('HPI Statistics', 20, yPosition);
      yPosition += 12;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      
      // Calculate statistics
      const hpiValues = locationTrendData.map(d => d.hpi || 0);
      const avgHPI = hpiValues.reduce((a, b) => a + b, 0) / hpiValues.length;
      const maxHPI = Math.max(...hpiValues);
      const minHPI = Math.min(...hpiValues);
      
      // Add colored indicators for HPI levels
      const hpiCategory = avgHPI < 100 ? 'Low' : avgHPI < 200 ? 'Medium' : 'High';
      const hpiColor = avgHPI < 100 ? [34, 197, 94] : avgHPI < 200 ? [250, 204, 21] : [239, 68, 68];
      
      pdf.text(`Average HPI: ${avgHPI.toFixed(2)}`, 20, yPosition);
      pdf.text(`Category: ${hpiCategory}`, 120, yPosition);
      // Use square indicator instead of circle
      pdf.setFillColor(...hpiColor);
      pdf.rect(100, yPosition - 3, 4, 4, 'F');
      yPosition += 10;
      
      pdf.text(`Maximum HPI: ${maxHPI.toFixed(2)}`, 20, yPosition);
      pdf.text(`Minimum HPI: ${minHPI.toFixed(2)}`, 120, yPosition);
      yPosition += 10;
      
      // Add trend analysis with indicator
      const trend = hpiValues.length > 1 ? 
        (hpiValues[hpiValues.length - 1] > hpiValues[0] ? 'Increasing' : 
         hpiValues[hpiValues.length - 1] < hpiValues[0] ? 'Decreasing' : 'Stable') : 
        'Insufficient data';
      
      const trendColor = trend === 'Increasing' ? [239, 68, 68] : trend === 'Decreasing' ? [34, 197, 94] : [107, 114, 128];
      pdf.text(`Trend Direction: ${trend}`, 20, yPosition);
      // Use square indicator instead of circle
      pdf.setFillColor(...trendColor);
      pdf.rect(100, yPosition - 3, 4, 4, 'F');
      yPosition += 15;
      
      // Add metal concentration summary
      pdf.setFont('helvetica', 'bold');
      pdf.text('Metal Concentration Summary', 20, yPosition);
      yPosition += 10;
      
      pdf.setFont('helvetica', 'normal');
      const metals = ['arsenic', 'cadmium', 'lead', 'chromium'];
      metals.forEach(metal => {
        const values = locationTrendData.map(d => d[metal] || 0);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        pdf.text(`${metal.charAt(0).toUpperCase() + metal.slice(1)}: Avg ${avg.toFixed(4)} mg/L, Max ${max.toFixed(4)} mg/L`, 20, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
      
      // Add enhanced data table
      pdf.setFillColor(59, 130, 246); // Blue background for table header
      pdf.rect(10, yPosition - 5, pageWidth - 20, 10, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255); // White text
      pdf.setFontSize(12);
      pdf.text('Recent Sample Data (First 10 Samples)', 20, yPosition);
      pdf.setTextColor(0, 0, 0); // Reset to black
      yPosition += 12;
      
      // Enhanced table header with colored background
      pdf.setFillColor(243, 244, 246); // Light background for header
      pdf.rect(10, yPosition - 3, pageWidth - 20, 10, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Date', 15, yPosition);
      pdf.text('HPI', 50, yPosition);
      pdf.text('HEI', 75, yPosition);
      pdf.text('As', 100, yPosition);
      pdf.text('Cd', 125, yPosition);
      pdf.text('Pb', 150, yPosition);
      pdf.text('Cr', 175, yPosition);
      yPosition += 8;
      
      // Add table border
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(10, yPosition - 11, pageWidth - 20, 8 + (Math.min(10, locationTrendData.length) * 7));
      
      // Table data with alternating row colors
      pdf.setFont('helvetica', 'normal');
      const samplesToShow = Math.min(10, locationTrendData.length);
      for (let i = 0; i < samplesToShow; i++) {
        const sample = locationTrendData[i];
        
        // Alternating row colors
        if (i % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(10, yPosition - 2, pageWidth - 20, 7, 'F');
        }
        
        pdf.setFontSize(9);
        pdf.text(new Date(sample.createdAt).toLocaleDateString(), 15, yPosition);
        pdf.text((sample.hpi || 0).toFixed(1), 50, yPosition);
        pdf.text((sample.hei || 0).toFixed(1), 75, yPosition);
        pdf.text((sample.arsenic || 0).toFixed(3), 100, yPosition);
        pdf.text((sample.cadmium || 0).toFixed(3), 125, yPosition);
        pdf.text((sample.lead || 0).toFixed(3), 150, yPosition);
        pdf.text((sample.chromium || 0).toFixed(3), 175, yPosition);
        yPosition += 7;
        
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
      }
      
      // Add footer with additional information
      yPosition += 15;
      pdf.setFillColor(249, 250, 251);
      pdf.rect(10, yPosition - 5, pageWidth - 20, 25, 'F');
      
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      pdf.text('Report Information:', 20, yPosition);
      yPosition += 7;
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated by Amrit Dhara Water Quality Analysis System`, 20, yPosition);
      yPosition += 6;
      pdf.text(`For more information, contact: support@aquabot.ai`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Page ${pdf.internal.pages.length - 1} of ${pdf.internal.pages.length - 1}`, pageWidth - 40, yPosition);
      
      // Save the PDF
      pdf.save(`location-trends-${selectedLocation}-${new Date().toISOString().slice(0, 10)}.pdf`);
      
      toast({
        title: "Export Successful",
        description: "Location trends data has been exported to PDF",
      });
      
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export location trends to PDF: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setExportingPdf(false);
    }
  };

  // New PDF export function for all charts
  const exportAllChartsPDF = async () => {
    if (samples.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    try {
      toast({
        title: "Generating PDF",
        description: "Exporting all charts (Concentrations, Indices, Distribution, Trends)...",
      });

      const jsPDF = (await import('jspdf')).jsPDF;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = 30;

      // Add title page
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Groundwater Quality Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 15;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Comprehensive Charts and Analysis', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      pdf.text(`Total Samples: ${samples.length}`, pageWidth / 2, yPosition, { align: 'center' });

      // Add overview metrics if available
      if (overviewMetrics) {
        yPosition += 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Overview Metrics', margin, yPosition);
        
        yPosition += 10;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Average HPI: ${overviewMetrics.avgHpi}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`High Pollution Samples: ${overviewMetrics.highPollutionCount}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Compliance Rate: ${overviewMetrics.complianceRate}%`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Trend: ${overviewMetrics.trend} (${overviewMetrics.trendPercentage}%)`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Most Polluted Metal: ${overviewMetrics.mostPollutedMetal}`, margin, yPosition);
      }

      // Function to capture a chart and add it to PDF
      const captureChartToPDF = async (chartId: string, title: string, description: string) => {
        // Add new page for each chart
        pdf.addPage();
        yPosition = 30;

        // Add chart title
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, margin, yPosition);
        
        yPosition += 8;
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text(description, margin, yPosition);

        // Find and capture the chart element
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
          try {
            // Wait a moment for chart to render
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const canvas = await html2canvas(chartElement, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false,
              useCORS: true,
              allowTaint: true
            });
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Add the chart image to PDF
            yPosition += 15;
            pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, Math.min(imgHeight, pageHeight - yPosition - 20));
            
          } catch (error) {
            console.error(`Error capturing chart ${chartId}:`, error);
            yPosition += 15;
            pdf.setFontSize(10);
            pdf.text(`[Chart could not be rendered: ${title}]`, margin, yPosition);
          }
        }
      };

      // Get data for charts
      const concentrationData = getConcentrationData();
      const indicesData = getIndicesData();
      const hpiDistribution = getQualityDistribution('hpi');
      const heiDistribution = getQualityDistribution('hei');
      const temporalData = getTemporalData();

      // Create temporary hidden divs for rendering charts
      const tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        top: -10000px;
        left: -10000px;
        width: 800px;
        background: white;
        padding: 20px;
      `;
      document.body.appendChild(tempContainer);

      try {
        // Chart 1: Concentrations
        tempContainer.innerHTML = `
          <div id="temp-concentrations-chart" style="height: 400px; width: 100%;">
            <div style="height: 100%; width: 100%;">
              <svg width="100%" height="100%" viewBox="0 0 800 400">
                <text x="400" y="30" text-anchor="middle" font-size="18" font-weight="bold">Metal Concentrations</text>
                ${concentrationData.map((metal, index) => {
                  const barWidth = 60;
                  const barSpacing = 80;
                  const x = 100 + index * barSpacing;
                  const maxValue = Math.max(...concentrationData.map(d => d.maximum));
                  const height = (metal.average / maxValue) * 250;
                  const y = 320 - height;
                  
                  return `
                    <rect x="${x}" y="${y}" width="${barWidth}" height="${height}" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>
                    <text x="${x + barWidth/2}" y="340" text-anchor="middle" font-size="10">${metal.name.substring(0, 3)}</text>
                    <text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="8">${metal.average.toFixed(3)}</text>
                  `;
                }).join('')}
                <line x1="80" y1="320" x2="720" y2="320" stroke="#000" stroke-width="2"/>
                <line x1="80" y1="70" x2="80" y2="320" stroke="#000" stroke-width="2"/>
                <text x="40" y="200" text-anchor="middle" font-size="10" transform="rotate(-90 40 200)">Concentration (mg/L)</text>
              </svg>
            </div>
          </div>
        `;
        
        await captureChartToPDF('temp-concentrations-chart', 'Metal Concentrations', 'Average concentrations of heavy metals across all samples');

        // Chart 2: Indices
        tempContainer.innerHTML = `
          <div id="temp-indices-chart" style="height: 400px; width: 100%;">
            <div style="height: 100%; width: 100%;">
              <svg width="100%" height="100%" viewBox="0 0 800 400">
                <text x="400" y="30" text-anchor="middle" font-size="18" font-weight="bold">Pollution Indices Comparison</text>
                ${indicesData.slice(0, 10).map((sample, index) => {
                  const barWidth = 30;
                  const groupWidth = 140;
                  const x = 100 + index * groupWidth;
                  const maxValue = Math.max(...indicesData.reduce((acc, s) => [...acc, s.HPI, s.HEI, s.CD, s.NPI], []));
                  
                  const hpiHeight = (sample.HPI / maxValue) * 200;
                  const heiHeight = (sample.HEI / maxValue) * 200;
                  const cdHeight = (sample.CD / maxValue) * 200;
                  const npiHeight = (sample.NPI / maxValue) * 200;
                  
                  return `
                    <rect x="${x}" y="${320 - hpiHeight}" width="${barWidth}" height="${hpiHeight}" fill="#a855f7"/>
                    <rect x="${x + barWidth + 2}" y="${320 - heiHeight}" width="${barWidth}" height="${heiHeight}" fill="#f97316"/>
                    <rect x="${x + (barWidth + 2) * 2}" y="${320 - cdHeight}" width="${barWidth}" height="${cdHeight}" fill="#06b6d4"/>
                    <rect x="${x + (barWidth + 2) * 3}" y="${320 - npiHeight}" width="${barWidth}" height="${npiHeight}" fill="#ec4899"/>
                    <text x="${x + groupWidth/2}" y="340" text-anchor="middle" font-size="8">${sample.name.substring(0, 6)}</text>
                  `;
                }).join('')}
                <line x1="80" y1="320" x2="750" y2="320" stroke="#000" stroke-width="2"/>
                <line x1="80" y1="120" x2="80" y2="320" stroke="#000" stroke-width="2"/>
                <text x="40" y="220" text-anchor="middle" font-size="10" transform="rotate(-90 40 220)">Index Value</text>
                <rect x="600" y="80" width="15" height="15" fill="#a855f7"/>
                <text x="620" y="92" font-size="10">HPI</text>
                <rect x="600" y="100" width="15" height="15" fill="#f97316"/>
                <text x="620" y="112" font-size="10">HEI</text>
                <rect x="600" y="120" width="15" height="15" fill="#06b6d4"/>
                <text x="620" y="132" font-size="10">CD</text>
                <rect x="600" y="140" width="15" height="15" fill="#ec4899"/>
                <text x="620" y="152" font-size="10">NPI</text>
              </svg>
            </div>
          </div>
        `;
        
        await captureChartToPDF('temp-indices-chart', 'Pollution Indices Comparison', 'Comparison of HPI, HEI, CD, and NPI across samples');

        // Chart 3: Distribution
        tempContainer.innerHTML = `
          <div id="temp-distribution-chart" style="height: 400px; width: 100%;">
            <div style="height: 100%; width: 100%;">
              <svg width="100%" height="100%" viewBox="0 0 800 400">
                <text x="400" y="30" text-anchor="middle" font-size="18" font-weight="bold">Pollution Distribution Analysis</text>
                
                <!-- HPI Distribution Pie Chart -->
                <text x="200" y="70" text-anchor="middle" font-size="14" font-weight="bold">HPI Distribution</text>
                ${hpiDistribution.map((item, index) => {
                  const total = hpiDistribution.reduce((sum, d) => sum + d.value, 0);
                  const percentage = (item.value / total) * 100;
                  const angle = (percentage / 100) * 360;
                  const startAngle = hpiDistribution.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
                  const endAngle = startAngle + angle;
                  
                  const x1 = 200 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 180 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 200 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 180 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                  
                  const largeArcFlag = angle > 180 ? 1 : 0;
                  
                  return `
                    <path d="M 200 180 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z" 
                          fill="${item.color}" stroke="white" stroke-width="2"/>
                    <text x="${200 + 100 * Math.cos((startAngle + angle/2 - 90) * Math.PI / 180)}" 
                          y="${180 + 100 * Math.sin((startAngle + angle/2 - 90) * Math.PI / 180)}" 
                          text-anchor="middle" font-size="10" fill="white">${percentage.toFixed(0)}%</text>
                  `;
                }).join('')}
                
                <!-- HEI Distribution Pie Chart -->
                <text x="600" y="70" text-anchor="middle" font-size="14" font-weight="bold">HEI Distribution</text>
                ${heiDistribution.map((item, index) => {
                  const total = heiDistribution.reduce((sum, d) => sum + d.value, 0);
                  const percentage = (item.value / total) * 100;
                  const angle = (percentage / 100) * 360;
                  const startAngle = heiDistribution.slice(0, index).reduce((sum, d) => sum + (d.value / total) * 360, 0);
                  const endAngle = startAngle + angle;
                  
                  const x1 = 600 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                  const y1 = 180 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                  const x2 = 600 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                  const y2 = 180 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                  
                  const largeArcFlag = angle > 180 ? 1 : 0;
                  
                  return `
                    <path d="M 600 180 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z" 
                          fill="${item.color}" stroke="white" stroke-width="2"/>
                    <text x="${600 + 100 * Math.cos((startAngle + angle/2 - 90) * Math.PI / 180)}" 
                          y="${180 + 100 * Math.sin((startAngle + angle/2 - 90) * Math.PI / 180)}" 
                          text-anchor="middle" font-size="10" fill="white">${percentage.toFixed(0)}%</text>
                  `;
                }).join('')}
                
                <!-- Legend -->
                ${[...new Set([...hpiDistribution, ...heiDistribution])].map((item, index) => `
                  <rect x="300" y="280 + ${index * 20}" width="15" height="15" fill="${item.color}"/>
                  <text x="320" y="292 + ${index * 20}" font-size="10">${item.name}: ${item.value}</text>
                `).join('')}
              </svg>
            </div>
          </div>
        `;
        
        await captureChartToPDF('temp-distribution-chart', 'Pollution Distribution Analysis', 'Distribution of water quality categories for HPI and HEI');

        // Chart 4: Overall Trends
        tempContainer.innerHTML = `
          <div id="temp-trends-chart" style="height: 400px; width: 100%;">
            <div style="height: 100%; width: 100%;">
              <svg width="100%" height="100%" viewBox="0 0 800 400">
                <text x="400" y="30" text-anchor="middle" font-size="18" font-weight="bold">Overall Pollution Trends</text>
                
                <!-- Grid lines -->
                ${[0, 1, 2, 3, 4].map(i => `
                  <line x1="100" y1="${80 + i * 60}" x2="720" y2="${80 + i * 60}" stroke="#e5e7eb" stroke-width="1"/>
                `).join('')}
                
                <!-- Axes -->
                <line x1="100" y1="320" x2="720" y2="320" stroke="#000" stroke-width="2"/>
                <line x1="100" y1="80" x2="100" y2="320" stroke="#000" stroke-width="2"/>
                
                <!-- HPI Line -->
                <polyline points="${temporalData.slice(0, 20).map((sample, index) => {
                  const x = 100 + (index * 620 / 20);
                  const maxValue = Math.max(...temporalData.reduce((acc, s) => [...acc, s.HPI, s.HEI, s.CD, s.NPI], []));
                  const y = 320 - (sample.HPI / maxValue) * 240;
                  return `${x},${y}`;
                }).join(' ')}" fill="none" stroke="#a855f7" stroke-width="2"/>
                
                <!-- HEI Line -->
                <polyline points="${temporalData.slice(0, 20).map((sample, index) => {
                  const x = 100 + (index * 620 / 20);
                  const maxValue = Math.max(...temporalData.reduce((acc, s) => [...acc, s.HPI, s.HEI, s.CD, s.NPI], []));
                  const y = 320 - (sample.HEI / maxValue) * 240;
                  return `${x},${y}`;
                }).join(' ')}" fill="none" stroke="#f97316" stroke-width="2"/>
                
                <!-- CD Line -->
                <polyline points="${temporalData.slice(0, 20).map((sample, index) => {
                  const x = 100 + (index * 620 / 20);
                  const maxValue = Math.max(...temporalData.reduce((acc, s) => [...acc, s.HPI, s.HEI, s.CD, s.NPI], []));
                  const y = 320 - (sample.CD / maxValue) * 240;
                  return `${x},${y}`;
                }).join(' ')}" fill="none" stroke="#06b6d4" stroke-width="2"/>
                
                <!-- NPI Line -->
                <polyline points="${temporalData.slice(0, 20).map((sample, index) => {
                  const x = 100 + (index * 620 / 20);
                  const maxValue = Math.max(...temporalData.reduce((acc, s) => [...acc, s.HPI, s.HEI, s.CD, s.NPI], []));
                  const y = 320 - (sample.NPI / maxValue) * 240;
                  return `${x},${y}`;
                }).join(' ')}" fill="none" stroke="#ec4899" stroke-width="2"/>
                
                <!-- Legend -->
                <rect x="600" y="100" width="15" height="15" fill="#a855f7"/>
                <text x="620" y="112" font-size="10">HPI</text>
                <rect x="600" y="120" width="15" height="15" fill="#f97316"/>
                <text x="620" y="132" font-size="10">HEI</text>
                <rect x="600" y="140" width="15" height="15" fill="#06b6d4"/>
                <text x="620" y="152" font-size="10">CD</text>
                <rect x="600" y="160" width="15" height="15" fill="#ec4899"/>
                <text x="620" y="172" font-size="10">NPI</text>
                
                <!-- Labels -->
                <text x="40" y="200" text-anchor="middle" font-size="10" transform="rotate(-90 40 200)">Index Value</text>
                <text x="400" y="350" text-anchor="middle" font-size="10">Sample Sequence</text>
              </svg>
            </div>
          </div>
        `;
        
        await captureChartToPDF('temp-trends-chart', 'Overall Pollution Trends', 'Temporal trends of pollution indices across all samples');

      } finally {
        // Clean up temporary container
        document.body.removeChild(tempContainer);
      }

      // Add final summary page
      pdf.addPage();
      yPosition = 30;
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data Summary', margin, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Concentration Statistics (mg/L):', margin, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      concentrationData.forEach(metal => {
        pdf.text(`${metal.name}: Avg=${metal.average}, Max=${metal.maximum}, Min=${metal.minimum}`, margin + 10, yPosition);
        yPosition += 7;
      });
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.text('Index Statistics:', margin, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      const hpiValues = samples.map(s => s.hpi || 0).filter(v => v > 0);
      const heiValues = samples.map(s => s.hei || 0).filter(v => v > 0);
      const cdValues = samples.map(s => s.cd || 0).filter(v => v > 0);
      const npiValues = samples.map(s => s.npi || 0).filter(v => v > 0);
      
      if (hpiValues.length > 0) {
        const hpiAvg = hpiValues.reduce((sum, val) => sum + val, 0) / hpiValues.length;
        pdf.text(`HPI: Average=${hpiAvg.toFixed(2)}, Range=${Math.min(...hpiValues).toFixed(2)}-${Math.max(...hpiValues).toFixed(2)}`, margin + 10, yPosition);
        yPosition += 7;
      }
      
      if (heiValues.length > 0) {
        const heiAvg = heiValues.reduce((sum, val) => sum + val, 0) / heiValues.length;
        pdf.text(`HEI: Average=${heiAvg.toFixed(2)}, Range=${Math.min(...heiValues).toFixed(2)}-${Math.max(...heiValues).toFixed(2)}`, margin + 10, yPosition);
        yPosition += 7;
      }
      
      if (cdValues.length > 0) {
        const cdAvg = cdValues.reduce((sum, val) => sum + val, 0) / cdValues.length;
        pdf.text(`CD: Average=${cdAvg.toFixed(2)}, Range=${Math.min(...cdValues).toFixed(2)}-${Math.max(...cdValues).toFixed(2)}`, margin + 10, yPosition);
        yPosition += 7;
      }
      
      if (npiValues.length > 0) {
        const npiAvg = npiValues.reduce((sum, val) => sum + val, 0) / npiValues.length;
        pdf.text(`NPI: Average=${npiAvg.toFixed(2)}, Range=${Math.min(...npiValues).toFixed(2)}-${Math.max(...npiValues).toFixed(2)}`, margin + 10, yPosition);
        yPosition += 7;
      }

      // Save the PDF
      const fileName = `groundwater-charts-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Export Successful",
        description: `All charts have been exported to ${fileName}`,
      });

    } catch (error: any) {
      console.error('PDF export failed:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export PDF: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <BarChart3 className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (samples.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No data to visualize</h3>
          <p className="text-muted-foreground text-center">
            Upload sample data to see charts and analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const concentrationData = getConcentrationData();
  const indicesData = getIndicesData();
  const hpiDistribution = getQualityDistribution('hpi');
  const heiDistribution = getQualityDistribution('hei');
  const cdDistribution = getQualityDistribution('cd');
  const npiDistribution = getQualityDistribution('npi');
  const temporalData = getTemporalData();

  return (
    <div className="space-y-6">
      {/* Hidden container for PDF export with all charts rendered */}
      <div id="report-container" style={{ display: "none", padding: "20px", backgroundColor: "white", width: "100%" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#1f2937" }}>
          Heavy Metal Pollution Report
        </h2>
        <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "30px" }}>
          Generated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} | Total Samples: {samples.length}
        </p>
        
        {/* Overview Metrics */}
        {overviewMetrics && (
          <div style={{ marginBottom: "30px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
              Overview Metrics
            </h3>
            <div style={{ fontSize: "12px", lineHeight: "1.5", color: "#374151" }}>
              <p>Average HPI: {overviewMetrics.avgHpi}</p>
              <p>High Pollution Samples: {overviewMetrics.highPollutionCount}</p>
              <p>Compliance Rate: {overviewMetrics.complianceRate}%</p>
              <p>Trend: {overviewMetrics.trend} ({overviewMetrics.trendPercentage}%)</p>
              <p>Most Polluted Metal: {overviewMetrics.mostPollutedMetal}</p>
            </div>
          </div>
        )}

        {/* Chart 1: Metal Concentrations */}
        <div id="chart1" style={{ marginBottom: "40px", pageBreakAfter: "always" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
            Metal Concentrations
          </h3>
          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "20px" }}>
            Average, maximum, and minimum concentrations of heavy metals (mg/L)
          </p>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={concentrationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="average" fill={COLORS.blue} name="Average" />
                <Bar dataKey="maximum" fill={COLORS.red} name="Maximum" />
                <Bar dataKey="minimum" fill={COLORS.green} name="Minimum" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pollution Indices Comparison */}
        <div id="chart2" style={{ marginBottom: "40px", pageBreakAfter: "always" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
            Pollution Indices Comparison
          </h3>
          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "20px" }}>
            Comparison of different pollution indices across samples
          </p>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={indicesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="HPI" fill={COLORS.purple} />
                <Bar dataKey="HEI" fill={COLORS.orange} />
                <Bar dataKey="CD" fill={COLORS.cyan} />
                <Bar dataKey="NPI" fill={COLORS.pink} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Pollution Distribution */}
        <div id="chart3" style={{ marginBottom: "40px", pageBreakAfter: "always" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
            Pollution Distribution Analysis
          </h3>
          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "20px" }}>
            Distribution of water quality categories across different indices
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", height: "300px" }}>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "10px", textAlign: "center" }}>HPI Distribution</h4>
              <ResponsiveContainer width="100%" height="250px">
                <PieChart>
                  <Pie
                    data={hpiDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${((percent as number) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {hpiDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "10px", textAlign: "center" }}>HEI Distribution</h4>
              <ResponsiveContainer width="100%" height="250px">
                <PieChart>
                  <Pie
                    data={heiDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${((percent as number) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {heiDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Chart 4: Overall Trends */}
        <div id="chart4" style={{ marginBottom: "40px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
            Overall Pollution Trends
          </h3>
          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "20px" }}>
            Pollution indices trends over time across all samples (chronological order)
          </p>
          <div style={{ height: "300px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temporalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" label={{ value: "Sample Sequence", position: "insideBottom", offset: -5 }} fontSize={12} />
                <YAxis 
                  label={{ value: "Pollution Index Value", angle: -90, position: "insideLeft" }}
                  domain={['auto', 'dataMax']}
                  padding={{ top: 20, bottom: 20 }}
                  fontSize={12}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="HPI" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="HEI" stroke={COLORS.orange} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="CD" stroke={COLORS.cyan} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="NPI" stroke={COLORS.pink} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Report Info */}
        <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px", color: "#1f2937" }}>
            Data Summary
          </h3>
          <div style={{ fontSize: "11px", lineHeight: "1.6", color: "#374151" }}>
            <p><strong>Metal Concentrations Summary:</strong></p>
            {concentrationData.map(metal => (
              <p key={metal.name} style={{ marginLeft: "20px" }}>
                {metal.name}: Average={metal.average} mg/L, Maximum={metal.maximum} mg/L, Minimum={metal.minimum} mg/L
              </p>
            ))}
            
            <p style={{ marginTop: "15px" }}><strong>Pollution Indices Summary:</strong></p>
            {(() => {
              const hpiValues = indicesData.map(d => d.HPI).filter(v => v > 0);
              const heiValues = indicesData.map(d => d.HEI).filter(v => v > 0);
              const cdValues = indicesData.map(d => d.CD).filter(v => v > 0);
              const npiValues = indicesData.map(d => d.NPI).filter(v => v > 0);
              
              return (
                <div style={{ marginLeft: "20px" }}>
                  {hpiValues.length > 0 && <p>HPI: Average={(hpiValues.reduce((sum, val) => sum + val, 0) / hpiValues.length).toFixed(2)}, Range={Math.min(...hpiValues).toFixed(2)}-{Math.max(...hpiValues).toFixed(2)}</p>}
                  {heiValues.length > 0 && <p>HEI: Average={(heiValues.reduce((sum, val) => sum + val, 0) / heiValues.length).toFixed(2)}, Range={Math.min(...heiValues).toFixed(2)}-{Math.max(...heiValues).toFixed(2)}</p>}
                  {cdValues.length > 0 && <p>CD: Average={(cdValues.reduce((sum, val) => sum + val, 0) / cdValues.length).toFixed(2)}, Range={Math.min(...cdValues).toFixed(2)}-{Math.max(...cdValues).toFixed(2)}</p>}
                  {npiValues.length > 0 && <p>NPI: Average={(npiValues.reduce((sum, val) => sum + val, 0) / npiValues.length).toFixed(2)}, Range={Math.min(...npiValues).toFixed(2)}-{Math.max(...npiValues).toFixed(2)}</p>}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      {/* Header with Export Options */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Data Visualization</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Charts and analytics for groundwater pollution data</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchSamples}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">↻</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportAllChartsPDF}
            disabled={loading || samples.length === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">📄</span>
          </Button>
        </div>
      </div>

      {/* Data Overview Section */}
      {overviewMetrics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Data Overview</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Samples Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Samples</p>
                      <p className="text-2xl font-bold text-blue-800">{overviewMetrics.totalSamples}</p>
                    </div>
                    <Database className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Average HPI Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className={`bg-gradient-to-br ${
                parseFloat(overviewMetrics.avgHpi) > 100 
                  ? 'from-red-50 to-red-100 border-red-200' 
                  : parseFloat(overviewMetrics.avgHpi) > 50 
                  ? 'from-yellow-50 to-yellow-100 border-yellow-200'
                  : 'from-green-50 to-green-100 border-green-200'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Average HPI</p>
                      <p className="text-2xl font-bold">{overviewMetrics.avgHpi}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {parseFloat(overviewMetrics.avgHpi) > 100 ? (
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      ) : parseFloat(overviewMetrics.avgHpi) > 50 ? (
                        <Target className="h-8 w-8 text-yellow-500" />
                      ) : (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trend Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Trend</p>
                      <div className="flex items-center gap-1">
                        <p className="text-2xl font-bold text-purple-800">{overviewMetrics.trendPercentage}%</p>
                        {overviewMetrics.trend === 'increasing' ? (
                          <ArrowUp className="h-5 w-5 text-red-500" />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {overviewMetrics.trend === 'increasing' ? (
                        <TrendingUp className="h-8 w-8 text-red-500" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-green-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Compliance Rate Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Compliance Rate</p>
                      <p className="text-2xl font-bold text-green-800">{overviewMetrics.complianceRate}%</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Additional Metrics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Critical Locations */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <p className="text-sm font-medium text-orange-700">Critical Locations ({overviewMetrics.highPollutionCount} samples)</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {overviewMetrics.criticalLocations.length > 0 ? (
                      overviewMetrics.criticalLocations.map((location: string, index: number) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {location}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-green-600">No critical locations found</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Most Polluted Metal */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-red-500" />
                    <p className="text-sm font-medium text-red-700">Most Polluted Metal</p>
                  </div>
                  <Badge variant="destructive" className="text-sm">
                    {overviewMetrics.mostPollutedMetal}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}

      <Tabs value={selectedChart} onValueChange={setSelectedChart} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="concentrations" className="text-xs sm:text-sm py-2 px-2">Concentrations</TabsTrigger>
          <TabsTrigger value="indices" className="text-xs sm:text-sm py-2 px-2">Indices</TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs sm:text-sm py-2 px-2">Distribution</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm py-2 px-2 hidden sm:block">Overall Trends</TabsTrigger>
          <TabsTrigger value="location-trends" className="text-xs sm:text-sm py-2 px-2 hidden lg:block">Location Trends</TabsTrigger>
          {/* Mobile fallback for hidden tabs */}
          <TabsTrigger value="trends" className="text-xs sm:text-sm py-2 px-2 sm:hidden">Trends</TabsTrigger>
          <TabsTrigger value="location-trends" className="text-xs sm:text-sm py-2 px-2 lg:hidden">Location</TabsTrigger>
        </TabsList>

        <TabsContent value="concentrations" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card id="concentrations-chart">
              <CardHeader>
                <CardTitle>Metal Concentrations</CardTitle>
                <CardDescription>
                  Average, maximum, and minimum concentrations of heavy metals (mg/L)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={concentrationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={80} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="average" fill={COLORS.blue} name="Average" />
                    <Bar dataKey="maximum" fill={COLORS.red} name="Maximum" />
                    <Bar dataKey="minimum" fill={COLORS.green} name="Minimum" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="indices" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card id="indices-chart">
              <CardHeader>
                <CardTitle>Pollution Indices Comparison</CardTitle>
                <CardDescription>
                  Comparison of different pollution indices across samples
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={indicesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={80} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="HPI" fill={COLORS.purple} />
                    <Bar dataKey="HEI" fill={COLORS.orange} />
                    <Bar dataKey="CD" fill={COLORS.cyan} />
                    <Bar dataKey="NPI" fill={COLORS.pink} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2" id="distribution-chart">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>HPI Distribution</CardTitle>
                    <CardDescription>Heavy Metal Pollution Index categories</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={hpiDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => {
                            const percentage = ((percent as number) * 100).toFixed(0);
                            return window.innerWidth < 640 ? `${percentage}%` : `${name} ${percentage}%`;
                          }}
                          outerRadius={window.innerWidth < 640 ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {hpiDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>HEI Distribution</CardTitle>
                    <CardDescription>Heavy Metal Evaluation Index categories</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={heiDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => {
                            const percentage = ((percent as number) * 100).toFixed(0);
                            return window.innerWidth < 640 ? `${percentage}%` : `${name} ${percentage}%`;
                          }}
                          outerRadius={window.innerWidth < 640 ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {heiDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>CD Distribution</CardTitle>
                    <CardDescription>Contamination Degree categories</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={cdDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => {
                            const percentage = ((percent as number) * 100).toFixed(0);
                            return window.innerWidth < 640 ? `${percentage}%` : `${name} ${percentage}%`;
                          }}
                          outerRadius={window.innerWidth < 640 ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {cdDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>NPI Distribution</CardTitle>
                    <CardDescription>Nemerow Pollution Index categories</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={npiDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => {
                            const percentage = ((percent as number) * 100).toFixed(0);
                            return window.innerWidth < 640 ? `${percentage}%` : `${name} ${percentage}%`;
                          }}
                          outerRadius={window.innerWidth < 640 ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {npiDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Enhanced Temporal Trends */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Card id="trends-chart">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Overall Pollution Trends
                </CardTitle>
                <CardDescription>
                  Pollution indices trends over time across all samples (chronological order)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={temporalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" label={{ value: "Sample Sequence", position: "insideBottom", offset: -5 }} fontSize={12} />
                    <YAxis 
                      label={{ value: "Pollution Index Value", angle: -90, position: "insideLeft" }}
                      domain={['auto', 'dataMax']}
                      padding={{ top: 20, bottom: 20 }}
                      fontSize={12}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-2 sm:p-3 border rounded-lg shadow-lg max-w-xs">
                              <p className="font-semibold mb-1 sm:mb-2 text-sm">Sample #{label}</p>
                              <p className="text-xs text-gray-500 mb-1 sm:mb-2">{data.date}</p>
                              {payload.map((entry, index) => (
                                <p key={index} style={{ color: entry.color }} className="text-xs sm:text-sm">
                                  {entry.name}: {entry.value?.toFixed(2)}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="HPI" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="HEI" stroke={COLORS.orange} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="CD" stroke={COLORS.cyan} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="NPI" stroke={COLORS.pink} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="location-trends" className="space-y-4 sm:space-y-6">
          {/* Individual Location Trend Analysis */}
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MapPin className="h-5 w-5" />
                Individual Location Trend Analysis
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Track pollution trends for specific locations over time. Perfect for monitoring repeated sampling at the same location.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {samples.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-amber-50 rounded-lg px-4">
                  <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-amber-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-amber-800 mb-2">No Data Available</h3>
                  <p className="text-amber-600 mb-4 text-sm sm:text-base">Please add some sample data first to see location trends.</p>
                  <p className="text-xs sm:text-sm text-amber-500">Go to the main page and add sample data using the Data Input tab.</p>
                </div>
              ) : getUniqueLocations().length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-blue-50 rounded-lg px-4">
                  <MapPin className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-2">Processing Data</h3>
                  <p className="text-blue-600 text-sm sm:text-base">Please wait while we process the location data...</p>
                </div>
              ) : (
                <>
                  {/* Location Statistics Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-blue-600 font-medium">Unique Locations</p>
                            <p className="text-xl sm:text-2xl font-bold text-blue-800">{getUniqueLocations().length}</p>
                          </div>
                          <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-green-600 font-medium">Locations with Trends</p>
                            <p className="text-xl sm:text-2xl font-bold text-green-800">
                              {getUniqueLocations().filter(loc => loc.count > 1).length}
                            </p>
                          </div>
                          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-purple-600 font-medium">Total Samples</p>
                            <p className="text-xl sm:text-2xl font-bold text-purple-800">{samples.length}</p>
                          </div>
                          <Database className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Enhanced Location Selector */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Location for Trend Analysis</label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex-1">
                          <Select value={selectedLocation} onValueChange={handleLocationChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a location to analyze trends..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getUniqueLocations().map((loc) => (
                                <SelectItem 
                                  key={loc.location} 
                                  value={loc.location}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="truncate">{loc.location}</span>
                                    <Badge variant="outline" className="ml-2 flex-shrink-0">
                                      {loc.count} samples
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant={chartType === 'line' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setChartType('line')}
                            disabled={locationTrendData.length === 0}
                          >
                            <LineChartIcon className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Line</span>
                            <span className="sm:hidden">━</span>
                          </Button>
                          <Button
                            variant={chartType === 'bar' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setChartType('bar')}
                            disabled={locationTrendData.length === 0}
                          >
                            <BarChart3 className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Bar</span>
                            <span className="sm:hidden">▓</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Metal Selection Buttons */}
                    {locationTrendData.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Metals to Display:</label>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {[
                            { key: 'arsenic', label: 'As', color: 'bg-blue-500' },
                            { key: 'cadmium', label: 'Cd', color: 'bg-red-500' },
                            { key: 'chromium', label: 'Cr', color: 'bg-green-500' },
                            { key: 'lead', label: 'Pb', color: 'bg-yellow-500' },
                            { key: 'mercury', label: 'Hg', color: 'bg-purple-500' },
                            { key: 'nickel', label: 'Ni', color: 'bg-orange-500' },
                            { key: 'copper', label: 'Cu', color: 'bg-cyan-500' },
                            { key: 'zinc', label: 'Zn', color: 'bg-pink-500' }
                          ].map((metal) => (
                            <Button
                              key={metal.key}
                              variant={selectedMetals.includes(metal.key) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedMetals(prev => 
                                  prev.includes(metal.key) 
                                    ? prev.filter(m => m !== metal.key)
                                    : [...prev, metal.key]
                                );
                              }}
                              className={`text-xs px-2 py-1 ${selectedMetals.includes(metal.key) ? metal.color : ''}`}
                            >
                              <span className="hidden sm:inline">{metal.label}</span>
                              <span className="sm:hidden">{metal.label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pollution Indices Selection Buttons */}
                    {locationTrendData.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Pollution Indices to Display:</label>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {[
                            { key: 'hpi', label: 'HPI', color: 'bg-purple-500' },
                            { key: 'hei', label: 'HEI', color: 'bg-orange-500' },
                            { key: 'cd', label: 'CD', color: 'bg-cyan-500' },
                            { key: 'npi', label: 'NPI', color: 'bg-pink-500' }
                          ].map((index) => (
                            <Button
                              key={index.key}
                              variant={selectedIndices.includes(index.key) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedIndices(prev => 
                                  prev.includes(index.key) 
                                    ? prev.filter(i => i !== index.key)
                                    : [...prev, index.key]
                                );
                              }}
                              className={`text-xs px-2 py-1 ${selectedIndices.includes(index.key) ? index.color : ''}`}
                            >
                              {index.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* New Feature Controls */}
                    {locationTrendData.length > 0 && (
                      <div className="space-y-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Advanced Chart Features</h3>
                        
                        {/* Dynamic Time Range Selector */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Time Range Filter
                          </label>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <Button
                              variant={customTimeRange ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCustomTimeRange(!customTimeRange)}
                              className="text-xs px-2 py-1"
                            >
                              {customTimeRange ? 'Custom Range' : 'All Data'}
                            </Button>
                            {customTimeRange && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                  type="date"
                                  value={timeRange.start}
                                  onChange={(e) => setTimeRange(prev => ({...prev, start: e.target.value}))}
                                  className="px-2 py-1 text-xs sm:text-sm border rounded-md"
                                />
                                <span className="text-xs sm:text-sm">to</span>
                                <input
                                  type="date"
                                  value={timeRange.end}
                                  onChange={(e) => setTimeRange(prev => ({...prev, end: e.target.value}))}
                                  className="px-2 py-1 text-xs sm:text-sm border rounded-md"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Benchmark Comparison Overlay */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Benchmark Comparison
                          </label>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
                            <Button
                              variant={showBenchmark ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setShowBenchmark(!showBenchmark)}
                              className="text-xs px-2 py-1"
                            >
                              {showBenchmark ? 'Hide' : 'Show'} Standards
                            </Button>
                            {showBenchmark && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <Select value={benchmarkType} onValueChange={(value: 'WHO' | 'EPA' | 'Custom') => setBenchmarkType(value)}>
                                  <SelectTrigger className="w-24 sm:w-32 text-xs sm:text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="WHO">WHO</SelectItem>
                                    <SelectItem value="EPA">EPA</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                  <span>Style:</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => {
                                      // Toggle between minimal and full benchmark display
                                      const event = new CustomEvent('toggleBenchmarkStyle');
                                      window.dispatchEvent(event);
                                    }}
                                  >
                                    Minimal
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                          {showBenchmark && (
                            <div className="text-xs text-gray-500 mt-1">
                              💡 Only shows benchmarks for metals approaching limits
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Loading State */}
                    {trendLoading && (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin mr-3 h-6 w-6 border-2 border-current border-t-transparent rounded-full" />
                        <span>Loading location trend data...</span>
                      </div>
                    )}

                    {/* No Location Selected */}
                    {!trendLoading && !selectedLocation && (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Location</h3>
                        <p className="text-gray-500">Choose a location from the dropdown to view trend analysis.</p>
                      </div>
                    )}

                    {/* Location Trend Charts */}
                    {!trendLoading && selectedLocation && locationTrendData.length > 0 && (
                      <div className="space-y-4 sm:space-y-6">
                        {/* Trend Chart */}
                        <Card>
                          <CardHeader className="pb-4 sm:pb-6">
                            <div className="flex flex-col gap-4">
                              <div>
                                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                  <TrendingUp className="h-5 w-5" />
                                  Pollution Trends for {selectedLocation}
                                </CardTitle>
                                <CardDescription className="text-sm sm:text-base">
                                  Metal concentration changes over time for {selectedLocation}
                                </CardDescription>
                              </div>
                              <div className="flex justify-start sm:justify-end">
                                <Button
                                  onClick={exportLocationTrendsToPdf}
                                  disabled={exportingPdf}
                                  className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm px-2 sm:px-4 py-2"
                                >
                                  {exportingPdf ? (
                                    <>
                                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                      <span className="hidden sm:inline">Exporting...</span>
                                      <span className="sm:hidden">...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="mr-2 h-4 w-4" />
                                      <span className="hidden sm:inline">Export PDF</span>
                                      <span className="sm:hidden">PDF</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent id="location-trends-chart" className="p-2 sm:p-4">
                            <ResponsiveContainer width="100%" height={450}>
                              {chartType === 'line' ? (
                                <LineChart 
                                  data={getTrendChartData()}
                                  margin={{ top: 20, right: 20, left: 100, bottom: 100 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    interval={0}
                                  />
                                  <YAxis 
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Concentration (mg/L)', angle: -90, position: 'insideLeft', style: { fontSize: 14, textAnchor: 'middle' }, offset: -50 }}
                                  />
                                  <Tooltip 
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white p-3 border rounded shadow-lg">
                                            <p className="font-semibold">{data.fullDate}</p>
                                            {selectedMetals.map(metal => (
                                              <p key={metal} className="text-sm">
                                                {metal.charAt(0).toUpperCase() + metal.slice(1)}: {data[metal]} mg/L
                                              </p>
                                            ))}
                                            <p className="text-sm font-semibold mt-1">HPI: {data.hpi}</p>
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Legend />
                                  {/* Improved Benchmark Reference Lines */}
                                  {getCriticalBenchmarkLines(selectedMetals, 'metals').map((line, index) => (
                                    <ReferenceLine
                                      key={line.key}
                                      y={line.y}
                                      stroke="#ff6b6b"
                                      strokeDasharray="8 4"
                                      strokeWidth={1.5}
                                      label={{
                                        value: line.label,
                                        position: line.position,
                                        offset: 8,
                                        fill: '#ff6b6b',
                                        fontSize: 10,
                                        fontWeight: 'normal'
                                      }}
                                    />
                                  ))}
                                  {selectedMetals.map((metal, index) => (
                                    <Line
                                      key={metal}
                                      type="monotone"
                                      dataKey={metal}
                                      stroke={['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#f97316', '#06b6d4', '#ec4899'][index]}
                                      strokeWidth={2}
                                      dot={{ r: 4 }}
                                    />
                                  ))}
                                  {/* Time Range Brush */}
                                  {customTimeRange && (
                                    <Brush 
                                      dataKey="date" 
                                      height={30} 
                                      stroke="#8884d8"
                                      startIndex={getTrendChartData().findIndex(item => item.date >= new Date(timeRange.start).toLocaleDateString())}
                                      endIndex={getTrendChartData().findIndex(item => item.date >= new Date(timeRange.end).toLocaleDateString())}
                                    />
                                  )}
                                </LineChart>
                              ) : (
                                <BarChart 
                                  data={getTrendChartData()}
                                  margin={{ top: 20, right: 20, left: 100, bottom: 100 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    interval={0}
                                  />
                                  <YAxis 
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Concentration (mg/L)', angle: -90, position: 'insideLeft', style: { fontSize: 14, textAnchor: 'middle' }, offset: -50 }}
                                  />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
                                    labelStyle={{ fontWeight: 'bold' }}
                                  />
                                  <Legend />
                                  {/* Improved Benchmark Reference Lines */}
                                  {getCriticalBenchmarkLines(selectedMetals, 'metals').map((line, index) => (
                                    <ReferenceLine
                                      key={line.key}
                                      y={line.y}
                                      stroke="#ff6b6b"
                                      strokeDasharray="8 4"
                                      strokeWidth={1.5}
                                      label={{
                                        value: line.label,
                                        position: line.position,
                                        offset: 8,
                                        fill: '#ff6b6b',
                                        fontSize: 10,
                                        fontWeight: 'normal'
                                      }}
                                    />
                                  ))}
                                  {selectedMetals.map((metal, index) => (
                                    <Bar
                                      key={metal}
                                      dataKey={metal}
                                      fill={['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#f97316', '#06b6d4', '#ec4899'][index]}
                                    />
                                  ))}
                                  {/* Time Range Brush */}
                                  {customTimeRange && (
                                    <Brush 
                                      dataKey="date" 
                                      height={30} 
                                      stroke="#8884d8"
                                      startIndex={getTrendChartData().findIndex(item => item.date >= new Date(timeRange.start).toLocaleDateString())}
                                      endIndex={getTrendChartData().findIndex(item => item.date >= new Date(timeRange.end).toLocaleDateString())}
                                    />
                                  )}
                                </BarChart>
                              )}
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Pollution Indices Trends Chart */}
                        <Card>
                          <CardHeader className="pb-4 sm:pb-6">
                            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                              <TrendingUp className="h-5 w-5" />
                              Pollution Indices Trends for {selectedLocation}
                            </CardTitle>
                            <CardDescription className="text-sm sm:text-base">
                              Pollution index changes over time for {selectedLocation}
                            </CardDescription>
                          </CardHeader>
                          <CardContent id="pollution-index-chart" className="p-2 sm:p-4">
                            <ResponsiveContainer width="100%" height={450}>
                              {chartType === 'line' ? (
                                <LineChart 
                                  data={getTrendChartData()}
                                  margin={{ top: 20, right: 20, left: 100, bottom: 100 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="date"
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    interval={0}
                                  />
                                  <YAxis 
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Pollution Index Value', angle: -90, position: 'insideLeft', style: { fontSize: 14, textAnchor: 'middle' }, offset: -50 }}
                                  />
                                  <Tooltip 
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                          <div className="bg-white p-3 border rounded shadow-lg">
                                            <p className="font-semibold">{data.fullDate}</p>
                                            {selectedIndices.map(index => (
                                              <p key={index} className="text-sm">
                                                {index.toUpperCase()}: {data[index]}
                                              </p>
                                            ))}
                                          </div>
                                        );
                                      }
                                      return null;
                                    }}
                                  />
                                  <Legend />
                                  {/* Improved Benchmark Reference Lines */}
                                  {getCriticalBenchmarkLines(selectedIndices, 'indices').map((line) => (
                                    <ReferenceLine
                                      key={line.key}
                                      y={line.y}
                                      stroke="#ff6b6b"
                                      strokeDasharray="8 4"
                                      strokeWidth={1.5}
                                      label={{
                                        value: line.label,
                                        position: line.position,
                                        offset: 8,
                                        fill: '#ff6b6b',
                                        fontSize: 10,
                                        fontWeight: 'normal'
                                      }}
                                    />
                                  ))}
                                  {selectedIndices.map((index, idx) => (
                                    <Line
                                      key={index}
                                      type="monotone"
                                      dataKey={index}
                                      stroke={['#a855f7', '#f97316', '#06b6d4', '#ec4899'][idx]}
                                      strokeWidth={2}
                                      dot={{ r: 4 }}
                                    />
                                  ))}
                                  {/* Time Range Brush */}
                                  {customTimeRange && (
                                    <Brush 
                                      dataKey="date" 
                                      height={30} 
                                      stroke="#8884d8"
                                      startIndex={getTrendChartData().findIndex(item => item.date >= new Date(timeRange.start).toLocaleDateString())}
                                      endIndex={getTrendChartData().findIndex(item => item.date >= new Date(timeRange.end).toLocaleDateString())}
                                    />
                                  )}
                                </LineChart>
                              ) : (
                                <BarChart 
                                  data={getTrendChartData()}
                                  margin={{ top: 20, right: 20, left: 100, bottom: 100 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    interval={0}
                                  />
                                  <YAxis 
                                    tick={{ fontSize: 12 }}
                                    label={{ value: 'Pollution Index Value', angle: -90, position: 'insideLeft', style: { fontSize: 14, textAnchor: 'middle' }, offset: -50 }}
                                  />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
                                    labelStyle={{ fontWeight: 'bold' }}
                                  />
                                  <Legend />
                                  {/* Improved Benchmark Reference Lines */}
                                  {getCriticalBenchmarkLines(selectedIndices, 'indices').map((line) => (
                                    <ReferenceLine
                                      key={line.key}
                                      y={line.y}
                                      stroke="#ff6b6b"
                                      strokeDasharray="8 4"
                                      strokeWidth={1.5}
                                      label={{
                                        value: line.label,
                                        position: line.position,
                                        offset: 8,
                                        fill: '#ff6b6b',
                                        fontSize: 10,
                                        fontWeight: 'normal'
                                      }}
                                    />
                                  ))}
                                  {selectedIndices.map((index, idx) => (
                                    <Bar
                                      key={index}
                                      dataKey={index}
                                      fill={['#a855f7', '#f97316', '#06b6d4', '#ec4899'][idx]}
                                    />
                                  ))}
                                  {/* Time Range Brush */}
                                  {customTimeRange && (
                                    <Brush 
                                      dataKey="date" 
                                      height={30} 
                                      stroke="#8884d8"
                                      startIndex={getTrendChartData().findIndex(item => item.date >= new Date(timeRange.start).toLocaleDateString())}
                                      endIndex={getTrendChartData().findIndex(item => item.date >= new Date(timeRange.end).toLocaleDateString())}
                                    />
                                  )}
                                </BarChart>
                              )}
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Historical Data Table */}
                        <Card>
                          <CardHeader className="pb-4 sm:pb-6">
                            <CardTitle className="text-lg sm:text-xl">Historical Data for {selectedLocation}</CardTitle>
                            <CardDescription className="text-sm sm:text-base">
                              Detailed sample data for {selectedLocation} sorted by date
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-2 sm:p-4">
                            <div className="overflow-x-auto max-w-full">
                              <table className="w-full text-xs sm:text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2">Sample ID</th>
                                    <th className="text-left p-2">Date</th>
                                    <th className="text-left p-2">As</th>
                                    <th className="text-left p-2">Cd</th>
                                    <th className="text-left p-2">Cr</th>
                                    <th className="text-left p-2">Pb</th>
                                    <th className="text-left p-2">Hg</th>
                                    <th className="text-left p-2">Ni</th>
                                    <th className="text-left p-2">Cu</th>
                                    <th className="text-left p-2">Zn</th>
                                    <th className="text-left p-2">HPI</th>
                                    <th className="text-left p-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {locationTrendData.map((sample, index) => (
                                    <tr key={sample.id} className="border-b hover:bg-gray-50">
                                      <td className="p-2 font-medium">{sample.sampleId}</td>
                                      <td className="p-2">{new Date(sample.createdAt).toLocaleDateString()}</td>
                                      <td className="p-2">{sample.arsenic}</td>
                                      <td className="p-2">{sample.cadmium}</td>
                                      <td className="p-2">{sample.chromium}</td>
                                      <td className="p-2">{sample.lead}</td>
                                      <td className="p-2">{sample.mercury}</td>
                                      <td className="p-2">{sample.nickel}</td>
                                      <td className="p-2">{sample.copper}</td>
                                      <td className="p-2">{sample.zinc}</td>
                                      <td className="p-2 font-semibold">{sample.hpi?.toFixed(2)}</td>
                                      <td className="p-2">
                                        <Badge 
                                          variant={sample.hpiCategory === 'Clean' ? 'default' : 
                                                  sample.hpiCategory === 'Moderate' ? 'secondary' : 'destructive'}
                                          className="text-xs"
                                        >
                                          {sample.hpiCategory}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Trend Analysis Summary */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-lg">
                          <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Trend Analysis Summary</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Date Range</p>
                              <p className="font-semibold">
                                {new Date(locationTrendData[0]?.createdAt).toLocaleDateString()} - {new Date(locationTrendData[locationTrendData.length - 1]?.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Average HPI</p>
                              <p className="font-semibold">
                                {(locationTrendData.reduce((sum, s) => sum + (s.hpi || 0), 0) / locationTrendData.length).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Trend Direction</p>
                              <p className="font-semibold">
                                {locationTrendData.length > 1 ? (
                                  locationTrendData[locationTrendData.length - 1].hpi! > locationTrendData[0].hpi! ? (
                                    <span className="text-red-600">↑ Increasing</span>
                                  ) : locationTrendData[locationTrendData.length - 1].hpi! < locationTrendData[0].hpi! ? (
                                    <span className="text-green-600">↓ Decreasing</span>
                                  ) : (
                                    <span className="text-gray-600">→ Stable</span>
                                  )
                                ) : (
                                  <span className="text-gray-600">Insufficient data</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}