'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  RefreshCw, 
  Layers, 
  Filter, 
  Globe, 
  Navigation,
  Activity,
  Download,
  FileDown,
  FileText,
  Image,
  Table,
  Settings,
  X,
  TrendingUp,
  BarChart3,
  LineChart,
  Database
} from 'lucide-react';
import { AlertTriangle, CheckCircle, Info, Maximize2, Minimize2, Search, Play, Pause, SkipBack, SkipForward, Ruler, Edit3, Zap, Clock, Thermometer, Droplets, Wind, Eye, EyeOff, Share2, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { RegionalAnalysis } from '@/components/RegionalAnalysis';

// Export libraries
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
);

const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

const Rectangle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Rectangle),
  { ssr: false }
);

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

interface MapViewProps {
  refreshKey: number;
}

interface TimeSeriesData {
  date: string;
  samples: Sample[];
}

export function EnhancedMapView({ refreshKey }: MapViewProps) {
  // Enhanced map view with regional analysis
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<string>('hpi');
  const [mapReady, setMapReady] = useState(false);
  const [L, setL] = useState<any>(null);
  const [mapStyle, setMapStyle] = useState('street');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('map');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Enhanced features state (keeping only time series and filters)
  const [showTimeSeries, setShowTimeSeries] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedPollutionLevels, setSelectedPollutionLevels] = useState<string[]>(['Clean', 'Moderate', 'High']);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Export functionality state
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [exportMode, setExportMode] = useState<string>('auto'); // 'auto', 'capture', 'visualization'
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeLegend: true,
    includeData: true,
    highQuality: false,
    customTitle: ''
  });

  // Individual sample tracking state
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [locationTrendData, setLocationTrendData] = useState<Sample[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedMetals, setSelectedMetals] = useState<string[]>(['arsenic', 'lead', 'cadmium', 'chromium']);

  // Import Leaflet dynamically
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      // Fix for default markers in webpack
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setL(leaflet);
      setMapReady(true);
    });
  }, []);

  const fetchSamples = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/results?limit=500');
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

  // Handle map resize when fullscreen toggles
  useEffect(() => {
    if (mapInstance && mapInstance.invalidateSize && typeof mapInstance.invalidateSize === 'function') {
      const timer = setTimeout(() => {
        try {
          mapInstance.invalidateSize();
        } catch (error) {
          console.error('Error invalidating map size:', error);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, mapInstance]);

  // Handle map resize when switching to map tab
  useEffect(() => {
    if (activeTab === 'map' && mapInstance && mapInstance.invalidateSize && typeof mapInstance.invalidateSize === 'function') {
      const timer = setTimeout(() => {
        try {
          mapInstance.invalidateSize();
        } catch (error) {
          console.error('Error invalidating map size after tab switch:', error);
        }
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, mapInstance]);

  const getPollutionColor = (category: string | null, index: string) => {
    const colorMap: Record<string, Record<string, string>> = {
      hpi: {
        "Clean": "#22c55e",
        "Moderate": "#eab308",
        "High": "#ef4444"
      },
      hei: {
        "Clean": "#22c55e",
        "Moderate": "#eab308",
        "High": "#ef4444"
      },
      cd: {
        "Low": "#22c55e",
        "Medium": "#eab308",
        "High": "#ef4444"
      },
      npi: {
        "Clean": "#22c55e",
        "Slight": "#86efac",
        "Moderate": "#eab308",
        "Severe": "#ef4444"
      }
    };

    return colorMap[index]?.[category || ''] || "#9ca3af";
  };

  const createCustomIcon = (category: string | null, index: string, size: number = 20) => {
    if (!L) return null;
    
    const color = getPollutionColor(category, index);
    
    try {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color}; 
            width: ${size}px; 
            height: ${size}px; 
            border-radius: 50%; 
            border: 3px solid white; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            animation: pulse 2s infinite;
            display: block;
          "></div>
          <style>
            @keyframes pulse {
              0% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
              100% { transform: scale(1); opacity: 1; }
            }
          </style>
        `,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2]
      });
    } catch (error) {
      console.error('Error creating custom icon:', error);
      return L.divIcon({
        className: 'default-marker',
        html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%;"></div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
        popupAnchor: [0, -size/2]
      });
    }
  };

  const getFilteredSamples = () => {
    return samples.filter(sample => {
      // Filter by selected index
      let hasValidIndex = false;
      let category = null;
      
      switch (selectedIndex) {
        case 'hpi':
          hasValidIndex = sample.hpi !== null && sample.hpiCategory !== null;
          category = sample.hpiCategory;
          break;
        case 'hei':
          hasValidIndex = sample.hei !== null && sample.heiCategory !== null;
          category = sample.heiCategory;
          break;
        case 'cd':
          hasValidIndex = sample.cd !== null && sample.cdCategory !== null;
          category = sample.cdCategory;
          break;
        case 'npi':
          hasValidIndex = sample.npi !== null && sample.npiCategory !== null;
          category = sample.npiCategory;
          break;
        default:
          hasValidIndex = true;
      }

      if (!hasValidIndex) return false;

      // Filter by selected pollution levels
      if (showAdvancedFilters) {
        // If no pollution levels are selected, show no results
        if (selectedPollutionLevels.length === 0) {
          return false;
        }
        
        return selectedPollutionLevels.some(level => {
          if (level === 'Clean' || level === 'Low') {
            return category === 'Clean' || category === 'Low';
          } else if (level === 'Moderate' || level === 'Medium') {
            return category === 'Moderate' || category === 'Medium' || category === 'Slight';
          } else if (level === 'High' || level === 'Severe') {
            return category === 'High' || category === 'Severe';
          }
          return false;
        });
      }

      return true;
    });
  };

  const getCenterPoint = () => {
    return { lat: 20.5937, lng: 78.9629 }; // Center of India
  };

  const getZoomLevel = () => {
    return 5; // Default zoom level for India view
  };

  // Enhanced functionality functions (keeping only time series and export)
  const generateTimeSeriesData = useCallback(() => {
    // Group samples by date
    const groupedByDate = samples.reduce((acc, sample) => {
      const date = new Date(sample.createdAt).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(sample);
      return acc;
    }, {} as Record<string, Sample[]>);
    
    const sorted = Object.entries(groupedByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, samples]) => ({ date, samples }));
    
    setTimeSeriesData(sorted);
  }, [samples]);

  // Individual location trend functions
  const getUniqueLocations = () => {
    const locationMap = new Map<string, { sampleId: string; location: string; latitude: number; longitude: number }>();
    
    samples.forEach(sample => {
      const key = `${sample.location}_${sample.latitude}_${sample.longitude}`;
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          sampleId: sample.sampleId,
          location: sample.location,
          latitude: sample.latitude,
          longitude: sample.longitude
        });
      }
    });
    
    return Array.from(locationMap.values()).sort((a, b) => a.location.localeCompare(b.location));
  };

  const fetchLocationTrendData = async (locationKey: string) => {
    setTrendLoading(true);
    try {
      // Parse location key to get location info
      const [location, lat, lng] = locationKey.split('_');
      
      // Fetch all samples for this location
      const response = await fetch(`/api/results?location=${encodeURIComponent(location)}&lat=${lat}&lng=${lng}&limit=100`);
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
        description: `Found ${sortedData.length} samples for ${location}`,
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

  const handleLocationChange = (locationKey: string) => {
    setSelectedLocation(locationKey);
    if (locationKey) {
      fetchLocationTrendData(locationKey);
    } else {
      setLocationTrendData([]);
    }
  };

  const getTrendChartData = () => {
    if (locationTrendData.length === 0) return [];
    
    return locationTrendData.map(sample => ({
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

  // Export functionality functions
  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      // Use server-side export for PDF instead of client-side html2canvas
      const filteredSamples = getFilteredSamples();
      const title = exportOptions.customTitle || 'Groundwater Pollution Map';
      
      const response = await fetch('/api/export/map-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          selectedIndex,
          mapStyle,
          samples: filteredSamples,
          includeLegend: exportOptions.includeLegend,
          includeData: exportOptions.includeData,
          highQuality: exportOptions.highQuality
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'PDF export failed');
      }

      // Get filename from content-disposition header or create default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${title}-${new Date().toISOString().split('T')[0]}.pdf`;
      
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
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Export Successful",
        description: "Map data has been exported as PDF file.",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Notice",
        description: "Server export unavailable. Using simplified data export instead.",
        variant: "default"
      });
      // Fallback to data-only export if server fails
      await exportDataAsPDF();
    } finally {
      setIsExporting(false);
    }
  };

  const exportDataAsPDF = async () => {
    try {
      const filteredSamples = getFilteredSamples();
      const title = exportOptions.customTitle || 'Groundwater Pollution Data';
      
      // Create a simple data-only PDF
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(18);
      doc.text(title, 20, 20);
      
      // Add metadata
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
      doc.text(`Pollution Index: ${selectedIndex.toUpperCase()}`, 20, 35);
      doc.text(`Total Samples: ${filteredSamples.length}`, 20, 40);
      
      let yPosition = 60;
      
      filteredSamples.forEach((sample, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.text(`${index + 1}. ${sample.sampleId} - ${sample.location}`, 20, yPosition);
        
        doc.setFontSize(9);
        doc.text(`Coords: ${sample.latitude.toFixed(4)}, ${sample.longitude.toFixed(4)}`, 25, yPosition + 5);
        doc.text(`HPI: ${sample.hpi?.toFixed(2) || 'N/A'} (${sample.hpiCategory || 'N/A'})`, 25, yPosition + 10);
        doc.text(`HEI: ${sample.hei?.toFixed(2) || 'N/A'} (${sample.heiCategory || 'N/A'})`, 25, yPosition + 15);
        
        yPosition += 25;
      });
      
      doc.save(`${title}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Export Successful",
        description: "Data has been exported as PDF file.",
      });
    } catch (error) {
      console.error('Error exporting data PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportAsPDFClient = async () => {
    if (!mapContainerRef.current) return;
    
    try {
      const element = mapContainerRef.current;
      
      // Wait a bit for any pending renders
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(element, {
        scale: exportOptions.highQuality ? 2 : 1,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Fix any image loading issues in the cloned document
          const images = clonedDoc.querySelectorAll('img');
          images.forEach(img => {
            if (img.src && !img.complete) {
              img.crossOrigin = 'anonymous';
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297;
      const pageHeight = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Add metadata
      const title = exportOptions.customTitle || 'Groundwater Pollution Map';
      pdf.setProperties({
        title: title,
        subject: 'Groundwater Quality Analysis',
        author: 'Groundwater Monitoring System',
        keywords: 'groundwater, pollution, HPI, quality',
        creator: 'Enhanced Map View'
      });
      
      pdf.save(`${title}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF Export Successful",
        description: "Map has been exported as PDF file.",
      });
    } catch (error) {
      console.error('Error exporting PDF (client-side):', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportAsPNG = async () => {
    setIsExporting(true);
    try {
      if (exportMode === 'capture') {
        // Force try to capture the actual map
        if (mapContainerRef.current) {
          toast({
            title: "Capturing Map",
            description: "Attempting to capture map with tiles... This may take a moment.",
            variant: "default"
          });
          await exportAsMapCapture();
        } else {
          throw new Error('Map container not available');
        }
      } else if (exportMode === 'visualization') {
        // Force use server-side visualization
        toast({
          title: "Creating Visualization",
          description: "Generating styled map visualization...",
          variant: "default"
        });
        await exportAsDataVisualization();
      } else {
        // Auto mode: try capture first, fallback to visualization
        if (mapContainerRef.current) {
          toast({
            title: "Smart Export",
            description: "Trying to capture real map first...",
            variant: "default"
          });
          await exportAsMapCapture();
        } else {
          throw new Error('Map container not available');
        }
      }
    } catch (error) {
      console.error('Error exporting PNG:', error);
      if (exportMode === 'auto') {
        toast({
          title: "Switching to Visualization",
          description: "Map capture failed. Creating beautiful styled visualization instead...",
          variant: "default"
        });
        // Fallback to server-side SVG visualization only in auto mode
        await exportAsDataVisualization();
      } else {
        toast({
          title: "Export Failed",
          description: "Unable to export map. Try Auto mode for best results.",
          variant: "destructive"
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsMapCapture = async () => {
    if (!mapContainerRef.current) return;
    
    const element = mapContainerRef.current;
    const title = exportOptions.customTitle || 'Groundwater Pollution Map';
    
    // Try multiple capture methods in order of reliability
    const captureMethods = [
      { name: 'domtoimage-png', method: captureWithDomToImagePNG },
      { name: 'html2canvas-improved', method: captureWithHtml2CanvasImproved },
      { name: 'domtoimage-jpeg', method: captureWithDomToImageJPEG },
      { name: 'html2canvas-basic', method: captureWithHtml2CanvasBasic },
      { name: 'simple-canvas', method: captureWithSimpleCanvas }
    ];
    
    for (const { name, method } of captureMethods) {
      try {
        console.log(`🎯 Trying capture method: ${name}`);
        toast({
          title: "Capturing Map",
          description: `Trying ${name} method...`,
          duration: 2000,
        });
        
        const startTime = Date.now();
        const dataUrl = await method(element);
        const endTime = Date.now();
        
        // Validate the captured data
        if (!dataUrl || !dataUrl.startsWith('data:image')) {
          throw new Error('Invalid image data returned');
        }
        
        // Download the captured image
        const link = document.createElement('a');
        link.download = `${title}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
        
        toast({
          title: "PNG Export Successful",
          description: `Map captured using ${name} method in ${endTime - startTime}ms.`,
        });
        
        return; // Success, exit the loop
      } catch (error) {
        console.warn(`Capture method ${name} failed:`, error);
        // Continue to next method without showing error to user unless it's the last method
        continue;
      }
    }
    
    // If all methods failed, throw detailed error
    const errorDetails = captureMethods.map(m => m.name).join(', ');
    throw new Error(`All capture methods failed (${errorDetails}). This may be due to browser security restrictions or missing map tiles.`);
  };

  const captureWithDomToImagePNG = async (element: HTMLElement): Promise<string> => {
    // Wait for any pending renders and map tiles
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Ensure the map container is fully visible
    const originalVisibility = element.style.visibility;
    const originalDisplay = element.style.display;
    element.style.visibility = 'visible';
    element.style.display = 'block';
    
    try {
      return await domtoimage.toPng(element, {
        quality: 1.0,
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          visibility: 'visible',
          display: 'block'
        },
        filter: (node) => {
          // Keep all nodes for complete map capture
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Include controls and legends for complete map
            return true;
          }
          return true;
        },
        cacheBust: true
      });
    } finally {
      // Restore original styles
      element.style.visibility = originalVisibility;
      element.style.display = originalDisplay;
    }
  };

  const captureWithDomToImageJPEG = async (element: HTMLElement): Promise<string> => {
    // Wait for any pending renders and map tiles
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Ensure the map container is fully visible
    const originalVisibility = element.style.visibility;
    const originalDisplay = element.style.display;
    element.style.visibility = 'visible';
    element.style.display = 'block';
    
    try {
      return await domtoimage.toJpeg(element, {
        quality: 0.95,
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          visibility: 'visible',
          display: 'block'
        },
        cacheBust: true
      });
    } finally {
      // Restore original styles
      element.style.visibility = originalVisibility;
      element.style.display = originalDisplay;
    }
  };

  const captureWithDomToImageSVG = async (element: HTMLElement): Promise<string> => {
    // Wait for any pending renders
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Ensure the map container is fully visible
    const originalVisibility = element.style.visibility;
    const originalDisplay = element.style.display;
    element.style.visibility = 'visible';
    element.style.display = 'block';
    
    try {
      const svgDataUrl = await domtoimage.toSvg(element, {
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          visibility: 'visible',
          display: 'block'
        },
        filter: (node) => {
          // Keep all nodes for complete map capture
          return true;
        },
        cacheBust: true
      });
      
      // Convert SVG to PNG using canvas
      return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
          reject(new Error('Image conversion not available in server environment'));
          return;
        }
        
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = element.scrollWidth;
          canvas.height = element.scrollHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png', 1.0));
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        img.onerror = reject;
        img.src = svgDataUrl;
      });
    } finally {
      // Restore original styles
      element.style.visibility = originalVisibility;
      element.style.display = originalDisplay;
    }
  };

  const captureWithHtml2CanvasImproved = async (element: HTMLElement): Promise<string> => {
    // Wait for map tiles to load and render
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Ensure element is fully visible
    const originalVisibility = element.style.visibility;
    const originalPosition = element.style.position;
    element.style.visibility = 'visible';
    element.style.position = 'relative';
    
    try {
      const canvas = await html2canvas(element, {
        scale: exportOptions.highQuality ? 2 : 1,
        useCORS: true,
        allowTaint: true, // Allow tainted canvas to capture map tiles
        foreignObjectRendering: true,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        backgroundColor: '#ffffff',
        imageTimeout: 15000, // Wait longer for images to load
        removeContainer: false,
        onclone: (clonedDoc) => {
          // Enhanced map tile handling
          const clonedElement = clonedDoc.querySelector('.leaflet-container');
          if (clonedElement) {
            // Force map tiles to load
            const tiles = clonedElement.querySelectorAll('.leaflet-tile');
            tiles.forEach(tile => {
              const img = tile.querySelector('img');
              if (img && img.src) {
                img.crossOrigin = 'Anonymous';
                // Remove cache busting to avoid loading issues
                if (img.src.includes('?')) {
                  img.src = img.src.split('?')[0];
                }
                // Force reload
                const originalSrc = img.src;
                img.src = '';
                setTimeout(() => {
                  img.src = originalSrc;
                }, 50);
              }
            });
            
            // Add white background to map container
            (clonedElement as HTMLElement).style.backgroundColor = '#ffffff';
          }
          
          // Fix all images
          const images = clonedDoc.querySelectorAll('img');
          images.forEach(img => {
            if (img.src) {
              img.crossOrigin = 'Anonymous';
              // Remove cache busting
              if (img.src.includes('?')) {
                img.src = img.src.split('?')[0];
              }
            }
          });
          
          // Ensure all elements are visible
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            if (el instanceof HTMLElement) {
              if (el.style.visibility === 'hidden') {
                el.style.visibility = 'visible';
              }
            }
          });
        }
      });
      
      return canvas.toDataURL('image/png', 1.0);
    } finally {
      // Restore original styles
      element.style.visibility = originalVisibility;
      element.style.position = originalPosition;
    }
  };

  const captureWithHtml2CanvasBasic = async (element: HTMLElement): Promise<string> => {
    // Wait for renders
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simplest capture approach
    const canvas = await html2canvas(element, {
      scale: 1,
      useCORS: true,
      allowTaint: true, // Most permissive setting
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      backgroundColor: '#f8fafc',
      ignoreElements: (element) => {
        // Only skip problematic elements
        return element.classList?.contains('leaflet-control-zoom') && 
               element.classList?.contains('leaflet-control');
      }
    });
    
    return canvas.toDataURL('image/png', 0.9);
  };

  const captureWithSimpleCanvas = async (element: HTMLElement): Promise<string> => {
    // Create a simple canvas representation as last resort
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Fill background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Groundwater Pollution Map', 20, 40);
    
    // Add subtitle
    ctx.font = '16px Arial';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`Export Mode: Capture | Index: ${selectedIndex.toUpperCase()}`, 20, 70);
    
    // Add map placeholder
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 90, 760, 400);
    
    // Add some sample points to show it's a map
    const filteredSamples = getFilteredSamples();
    const samplesToShow = filteredSamples.slice(0, 50); // Limit to 50 samples
    
    samplesToShow.forEach((sample, index) => {
      const x = 50 + (index % 10) * 70;
      const y = 120 + Math.floor(index / 10) * 70;
      
      // Draw point based on pollution category
      const color = getPollutionColor(
        sample[`${selectedIndex}Category` as keyof Sample] as string,
        selectedIndex
      );
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add point border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Add legend
    ctx.font = '14px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.fillText('Legend:', 20, 520);
    
    const categories = selectedIndex === 'npi' 
      ? ['Clean', 'Slight', 'Moderate', 'Severe']
      : ['Clean', 'Moderate', 'High'];
    
    const colors = ['#22c55e', '#eab308', '#ef4444'];
    if (selectedIndex === 'npi') colors.splice(1, 0, '#86efac');
    
    categories.forEach((category, index) => {
      const legendX = 100 + index * 120;
      const legendY = 515;
      
      ctx.fillStyle = colors[index] || '#9ca3af';
      ctx.fillRect(legendX, legendY, 15, 15);
      
      ctx.fillStyle = '#1f2937';
      ctx.fillText(category, legendX + 20, legendY + 12);
    });
    
    // Add footer
    ctx.font = '12px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`Generated: ${new Date().toLocaleString()} | Samples: ${filteredSamples.length}`, 20, 560);
    ctx.fillText('Map capture failed - showing simplified visualization', 20, 580);
    
    return canvas.toDataURL('image/png', 0.9);
  };

  const exportAsDataVisualization = async () => {
    try {
      const filteredSamples = getFilteredSamples();
      const title = exportOptions.customTitle || 'Groundwater Pollution Map';
      
      // Calculate map bounds from filtered samples
      const validSamples = filteredSamples.filter(s => s.latitude && s.longitude);
      let bounds = null;
      
      if (validSamples.length > 0) {
        const lats = validSamples.map(s => s.latitude);
        const lngs = validSamples.map(s => s.longitude);
        const latPadding = ((Math.max(...lats) - Math.min(...lats)) * 0.1) || 0.1;
        const lngPadding = ((Math.max(...lngs) - Math.min(...lngs)) * 0.1) || 0.1;
        
        bounds = {
          minLat: Math.min(...lats) - latPadding,
          maxLat: Math.max(...lats) + latPadding,
          minLng: Math.min(...lngs) - lngPadding,
          maxLng: Math.max(...lngs) + lngPadding
        };
      }
      
      const response = await fetch('/api/export/map-with-tiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          selectedIndex,
          mapStyle,
          samples: filteredSamples,
          bounds,
          zoom: getZoomLevel(),
          includeLegend: exportOptions.includeLegend,
          includeData: exportOptions.includeData,
          highQuality: exportOptions.highQuality
        }),
      });

      if (response.ok) {
        // Get filename from content-disposition header or create default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `${title}-${new Date().toISOString().split('T')[0]}.svg`;
        
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
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Map Visualization Exported",
          description: "Map with styled background has been exported as SVG.",
        });
      } else {
        throw new Error('Server export failed');
      }
    } catch (error) {
      console.error('Error exporting data visualization:', error);
      toast({
        title: "Export Notice",
        description: "Unable to create visualization. Downloading CSV data instead.",
        variant: "default"
      });
      // Final fallback to CSV
      await exportDataAsCSV();
    }
  };

  const exportDataAsCSV = async () => {
    try {
      const filteredSamples = getFilteredSamples();
      const title = exportOptions.customTitle || 'Groundwater Pollution Data';
      
      // Create CSV content
      const headers = [
        'Sample ID', 'Location', 'Latitude', 'Longitude',
        'Arsenic (mg/L)', 'Cadmium (mg/L)', 'Chromium (mg/L)', 'Lead (mg/L)', 
        'Mercury (mg/L)', 'Nickel (mg/L)', 'Copper (mg/L)', 'Zinc (mg/L)',
        'HPI', 'HPI Category', 'HEI', 'HEI Category', 
        'CD', 'CD Category', 'NPI', 'NPI Category'
      ];

      const csvRows = [
        headers.join(','),
        ...filteredSamples.map(sample => [
          sample.sampleId,
          `"${sample.location}"`,
          sample.latitude,
          sample.longitude,
          sample.arsenic,
          sample.cadmium,
          sample.chromium,
          sample.lead,
          sample.mercury,
          sample.nickel,
          sample.copper,
          sample.zinc,
          sample.hpi || 0,
          sample.hpiCategory || '',
          sample.hei || 0,
          sample.heiCategory || '',
          sample.cd || 0,
          sample.cdCategory || '',
          sample.npi || 0,
          sample.npiCategory || ''
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "CSV Export Successful",
        description: "Data has been exported as CSV file.",
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportAsPNGClient = async () => {
    if (!mapContainerRef.current) return;
    
    try {
      const element = mapContainerRef.current;
      
      // Wait a bit for any pending renders
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(element, {
        scale: exportOptions.highQuality ? 2 : 1,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Fix any image loading issues in the cloned document
          const images = clonedDoc.querySelectorAll('img');
          images.forEach(img => {
            if (img.src && !img.complete) {
              img.crossOrigin = 'anonymous';
            }
          });
        }
      });
      
      const title = exportOptions.customTitle || 'Groundwater Pollution Map';
      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `${title}-${new Date().toISOString().split('T')[0]}.png`);
        }
      }, 'image/png', 1.0);
      
      toast({
        title: "PNG Export Successful",
        description: "Map has been exported as PNG image.",
      });
    } catch (error) {
      console.error('Error exporting PNG (client-side):', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PNG. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportAsExcel = () => {
    setIsExporting(true);
    try {
      const filteredSamples = getFilteredSamples();
      const title = exportOptions.customTitle || 'Groundwater Pollution Data';
      
      // Prepare data for Excel
      const excelData = filteredSamples.map(sample => ({
        'Sample ID': sample.sampleId,
        'Location': sample.location,
        'Latitude': sample.latitude,
        'Longitude': sample.longitude,
        'Arsenic (mg/L)': sample.arsenic,
        'Cadmium (mg/L)': sample.cadmium,
        'Chromium (mg/L)': sample.chromium,
        'Lead (mg/L)': sample.lead,
        'Mercury (mg/L)': sample.mercury,
        'Nickel (mg/L)': sample.nickel,
        'Copper (mg/L)': sample.copper,
        'Zinc (mg/L)': sample.zinc,
        'HPI': sample.hpi,
        'HPI Category': sample.hpiCategory,
        'HEI': sample.hei,
        'HEI Category': sample.heiCategory,
        'CD': sample.cd,
        'CD Category': sample.cdCategory,
        'NPI': sample.npi,
        'NPI Category': sample.npiCategory,
        'Date': new Date(sample.createdAt).toLocaleDateString()
      }));
      
      // Create workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Groundwater Data');
      
      // Add summary sheet
      const summaryData = [
        ['Report Summary'],
        ['Title', title],
        ['Generated', new Date().toLocaleString()],
        ['Pollution Index', selectedIndex.toUpperCase()],
        ['Total Samples', filteredSamples.length],
        ['Map Style', mapStyle],
        [],
        ['Pollution Level Breakdown'],
        ['Clean/Low', filteredSamples.filter(s => {
          const cat = s[`${selectedIndex}Category` as keyof Sample] as string;
          return cat === 'Clean' || cat === 'Low';
        }).length],
        ['Moderate/Medium', filteredSamples.filter(s => {
          const cat = s[`${selectedIndex}Category` as keyof Sample] as string;
          return cat === 'Moderate' || cat === 'Medium' || cat === 'Slight';
        }).length],
        ['High/Severe', filteredSamples.filter(s => {
          const cat = s[`${selectedIndex}Category` as keyof Sample] as string;
          return cat === 'High' || cat === 'Severe';
        }).length]
      ];
      
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
      
      // Save file
      XLSX.writeFile(wb, `${title}-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Excel Export Successful",
        description: "Data has been exported to Excel file.",
      });
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export Excel. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsCSV = () => {
    setIsExporting(true);
    try {
      const filteredSamples = getFilteredSamples();
      const title = exportOptions.customTitle || 'Groundwater Pollution Data';
      
      // Prepare CSV data
      const csvData = filteredSamples.map(sample => ({
        sampleId: sample.sampleId,
        location: sample.location,
        latitude: sample.latitude,
        longitude: sample.longitude,
        arsenic: sample.arsenic,
        cadmium: sample.cadmium,
        chromium: sample.chromium,
        lead: sample.lead,
        mercury: sample.mercury,
        nickel: sample.nickel,
        copper: sample.copper,
        zinc: sample.zinc,
        hpi: sample.hpi,
        hpiCategory: sample.hpiCategory,
        hei: sample.hei,
        heiCategory: sample.heiCategory,
        cd: sample.cd,
        cdCategory: sample.cdCategory,
        npi: sample.npi,
        npiCategory: sample.npiCategory,
        createdAt: sample.createdAt
      }));
      
      // Convert to CSV
      const ws = XLSX.utils.json_to_sheet(csvData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      // Create blob and save
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${title}-${new Date().toISOString().split('T')[0]}.csv`);
      
      toast({
        title: "CSV Export Successful",
        description: "Data has been exported to CSV file.",
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export CSV. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsJSON = () => {
    setIsExporting(true);
    try {
      const filteredSamples = getFilteredSamples();
      const title = exportOptions.customTitle || 'Groundwater Pollution Data';
      
      const data = {
        metadata: {
          title: title,
          generated: new Date().toISOString(),
          pollutionIndex: selectedIndex,
          mapStyle: mapStyle,
          totalSamples: filteredSamples.length
        },
        samples: filteredSamples,
        timeSeriesData: exportOptions.includeData ? timeSeriesData : undefined,
        settings: {
          selectedIndex,
          mapStyle,
          selectedPollutionLevels
        }
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      saveAs(blob, `${title}-${new Date().toISOString().split('T')[0]}.json`);
      
      toast({
        title: "JSON Export Successful",
        description: "Data has been exported as JSON file.",
      });
    } catch (error) {
      console.error('Error exporting JSON:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export JSON. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    switch (exportFormat) {
      case 'pdf':
        exportAsPDF();
        break;
      case 'png':
        exportAsPNG();
        break;
      case 'excel':
        exportAsExcel();
        break;
      case 'csv':
        exportAsCSV();
        break;
      case 'json':
        exportAsJSON();
        break;
      default:
        exportAsPDF();
    }
  };

  const shareMapView = () => {
    const params = new URLSearchParams({
      index: selectedIndex,
      style: mapStyle,
      zoom: getZoomLevel().toString(),
      lat: getCenterPoint().lat.toString(),
      lng: getCenterPoint().lng.toString()
    });
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "Map view link has been copied to clipboard.",
      });
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast({
        title: "Link Copied",
        description: "Map view link has been copied to clipboard.",
      });
    });
  };

  // Auto-play time series
  useEffect(() => {
    if (isPlaying && timeSeriesData.length > 0) {
      const interval = setInterval(() => {
        setCurrentTimeIndex(prev => {
          if (prev >= timeSeriesData.length - 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [isPlaying, timeSeriesData]);

  // Generate time series data when samples change
  useEffect(() => {
    if (showTimeSeries) {
      generateTimeSeriesData();
    }
  }, [samples, showTimeSeries, generateTimeSeriesData]);

  // Inject custom CSS for fullscreen map responsiveness
  useEffect(() => {
    const styleId = 'fullscreen-map-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = `
        .fullscreen-map-card {
          background: white !important;
        }
        
        .fullscreen-map-container {
          position: relative !important;
        }
        
        .fullscreen-leaflet {
          height: 100% !important;
          width: 100% !important;
        }
        
        .fullscreen-controls {
          z-index: 1000 !important;
        }
        
        /* Mobile responsive adjustments */
        @media (max-width: 640px) {
          .fullscreen-map-card {
            padding: 0 !important;
          }
          
          .fullscreen-controls {
            top: 8px !important;
            right: 8px !important;
            padding: 4px 8px !important;
            font-size: 12px !important;
          }
        }
        
        /* Prevent header overlap in fullscreen */
        @media (min-width: 641px) {
          .fullscreen-map-container {
            padding-top: 80px;
          }
        }
        
        /* Ensure proper z-index layering */
        .leaflet-container {
          z-index: 10 !important;
        }
        
        .leaflet-control-container {
          z-index: 20 !important;
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    return () => {
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  const mapStyles = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interactive Map View</CardTitle>
          <CardDescription>
            Geographic visualization of groundwater quality data with state boundaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interactive Map View</CardTitle>
          <CardDescription>
            Geographic visualization of groundwater quality data with state boundaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchSamples} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredSamples = getFilteredSamples();

  return (
    <Card className={`relative ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none shadow-2xl fullscreen-map-card' : ''}`}>
      {/* Mobile Responsive Header */}
      <CardHeader className={`${isFullscreen ? 'absolute top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b' : ''} ${isFullscreen ? 'p-3 sm:p-4' : 'p-4 sm:p-6'}`}>
        <CardTitle className={`flex items-center gap-2 ${isFullscreen ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
          <MapPin className={`h-4 w-4 sm:h-5 sm:w-5`} />
          <span className={`${isFullscreen ? 'hidden sm:inline' : ''}`}>Interactive Map View</span>
          <span className={`${isFullscreen ? 'sm:hidden' : ''}`}>Map</span>
        </CardTitle>
        <CardDescription className={`${isFullscreen ? 'text-xs sm:text-sm' : 'text-sm'} ${isFullscreen ? 'hidden sm:block' : ''}`}>
          Geographic visualization of groundwater quality data with Indian state boundaries
        </CardDescription>
      </CardHeader>
      <CardContent className={`${isFullscreen ? 'absolute inset-0 pt-20 sm:pt-24' : 'relative'} p-0 sm:p-6`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className={`w-full ${isFullscreen ? 'h-full flex flex-col' : ''}`}>
          <TabsList className={`grid w-full grid-cols-2 ${isFullscreen ? 'w-auto mx-auto mt-2 sm:mt-4' : ''}`}>
            <TabsTrigger value="map" className={`${isFullscreen ? 'text-xs sm:text-sm px-2 sm:px-4' : ''}`}>Map View</TabsTrigger>
            <TabsTrigger value="charts" className={`${isFullscreen ? 'text-xs sm:text-sm px-2 sm:px-4' : ''}`}>Regional</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className={`space-y-4 tab-map-content ${isFullscreen ? 'flex-1 overflow-hidden' : ''}`}>
            {/* Enhanced Map Controls - Mobile Responsive */}
            <div className={`space-y-4 ${isFullscreen ? 'p-3 sm:p-4' : ''}`}>
              {/* Primary Controls */}
              <div className={`flex flex-wrap gap-2 sm:gap-4 items-center map-controls-container ${isFullscreen ? 'justify-center' : ''}`}>
                <div className="flex items-center gap-2 map-dropdown-container">
                  <label className="text-xs sm:text-sm font-medium">Pollution Index:</label>
                  <select 
                    value={selectedIndex} 
                    onChange={(e) => setSelectedIndex(e.target.value)}
                    className={`enhanced-select px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-md bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isFullscreen ? 'w-24 sm:w-32' : 'w-28 sm:w-32'}`}
                  >
                    <option value="hpi">HPI</option>
                    <option value="hei">HEI</option>
                    <option value="cd">CD</option>
                    <option value="npi">NPI</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 map-dropdown-container">
                  <label className="text-xs sm:text-sm font-medium">Map Style:</label>
                  <select 
                    value={mapStyle} 
                    onChange={(e) => setMapStyle(e.target.value)}
                    className={`enhanced-select px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-md bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isFullscreen ? 'w-24 sm:w-32' : 'w-28 sm:w-32'}`}
                  >
                    <option value="street">Street</option>
                    <option value="satellite">Satellite</option>
                    <option value="terrain">Terrain</option>
                  </select>
                </div>

                <Button onClick={fetchSamples} variant="outline" size="sm" className={`${isFullscreen ? 'h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm' : 'h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm'}`}>
                  <RefreshCw className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4`} />
                  <span className="hidden sm:inline">Refresh</span>
                  <span className="sm:hidden">↻</span>
                </Button>

                <Badge variant="secondary" className="text-xs sm:text-sm">
                  {getFilteredSamples().length} locations
                </Badge>
              </div>

              {/* Enhanced Features - Mobile Responsive */}
              <div className={`flex flex-wrap gap-2 sm:gap-4 items-center ${isFullscreen ? 'justify-center' : ''}`}>
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-time-series"
                    checked={showTimeSeries}
                    onCheckedChange={setShowTimeSeries}
                  />
                  <label htmlFor="show-time-series" className="text-xs sm:text-sm font-medium cursor-pointer">
                    <span className="hidden sm:inline">Time Series</span>
                    <span className="sm:hidden">⏱</span>
                  </label>
                </div>

                <Button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  variant="outline"
                  size="sm"
                  className={`${isFullscreen ? 'h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm' : 'h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm'}`}
                >
                  <Filter className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4`} />
                  <span className="hidden sm:inline">Advanced Filters</span>
                  <span className="sm:hidden">🔍</span>
                </Button>

                <Button onClick={() => setShowExportPanel(true)} variant="outline" size="sm" className={`${isFullscreen ? 'h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm' : 'h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm'}`}>
                  <Download className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4`} />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">📥</span>
                </Button>

                <Button onClick={shareMapView} variant="outline" size="sm" className={`${isFullscreen ? 'h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm' : 'h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm'}`}>
                  <Share2 className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4`} />
                  <span className="hidden sm:inline">Share</span>
                  <span className="sm:hidden">🔗</span>
                </Button>

                <Button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  variant="outline"
                  size="sm"
                  className={`${isFullscreen ? 'h-8 px-2 sm:h-9 sm:px-3 text-xs sm:text-sm' : 'h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm'}`}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4`} />
                      <span className="hidden sm:inline">Minimize</span>
                      <span className="sm:hidden">━</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4`} />
                      <span className="hidden sm:inline">Maximize</span>
                      <span className="sm:hidden">▓</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-3 block">Filter by Pollution Level</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="clean-low"
                            checked={selectedPollutionLevels.includes('Clean')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPollutionLevels([...selectedPollutionLevels, 'Clean']);
                              } else {
                                setSelectedPollutionLevels(selectedPollutionLevels.filter(l => l !== 'Clean'));
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor="clean-low" className="text-sm cursor-pointer flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Clean/Low
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="moderate-medium"
                            checked={selectedPollutionLevels.includes('Moderate')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPollutionLevels([...selectedPollutionLevels, 'Moderate']);
                              } else {
                                setSelectedPollutionLevels(selectedPollutionLevels.filter(l => l !== 'Moderate'));
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor="moderate-medium" className="text-sm cursor-pointer flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            Moderate/Medium
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="high-severe"
                            checked={selectedPollutionLevels.includes('High')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPollutionLevels([...selectedPollutionLevels, 'High']);
                              } else {
                                setSelectedPollutionLevels(selectedPollutionLevels.filter(l => l !== 'High'));
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor="high-severe" className="text-sm cursor-pointer flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            High/Severe
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-600">
                      Select one or more pollution levels to filter the map markers
                    </div>
                  </div>
                </div>
              )}

              {/* Export Panel */}
              {showExportPanel && (
                <div className="p-4 border rounded-lg bg-blue-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-900">Export Options</h4>
                    <Button
                      onClick={() => setShowExportPanel(false)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Format Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block text-blue-900">Export Format</label>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="pdf">PDF Document</option>
                        <option value="png">PNG Image</option>
                        <option value="excel">Excel Spreadsheet</option>
                        <option value="csv">CSV File</option>
                        <option value="json">JSON Data</option>
                      </select>
                    </div>

                    {/* Export Mode for PNG */}
                    {exportFormat === 'png' && (
                      <div>
                        <label className="text-sm font-medium mb-2 block text-blue-900">Export Mode</label>
                        <select
                          value={exportMode}
                          onChange={(e) => setExportMode(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="auto">Auto (Recommended)</option>
                          <option value="capture">Try to Capture Real Map</option>
                          <option value="visualization">Styled Visualization</option>
                        </select>
                        <div className="text-xs text-blue-600 mt-1">
                          {exportMode === 'auto' && 'Automatically tries to capture the real map, falls back to visualization.'}
                          {exportMode === 'capture' && 'Attempts to capture the actual map tiles. May not work due to browser restrictions.'}
                          {exportMode === 'visualization' && 'Creates a styled map visualization with sample points.'}
                        </div>
                      </div>
                    )}

                    {/* Custom Title */}
                    <div>
                      <label className="text-sm font-medium mb-2 block text-blue-900">Custom Title (Optional)</label>
                      <Input
                        value={exportOptions.customTitle}
                        onChange={(e) => setExportOptions({...exportOptions, customTitle: e.target.value})}
                        placeholder="Groundwater Pollution Map"
                        className="border-blue-200"
                      />
                    </div>

                    {/* Quality Options */}
                    <div>
                      <label className="text-sm font-medium mb-2 block text-blue-900">Quality Options</label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="high-quality"
                            checked={exportOptions.highQuality}
                            onChange={(e) => setExportOptions({...exportOptions, highQuality: e.target.checked})}
                            className="rounded"
                          />
                          <label htmlFor="high-quality" className="text-sm cursor-pointer text-blue-800">
                            High Quality (PDF/PNG)
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="include-legend"
                            checked={exportOptions.includeLegend}
                            onChange={(e) => setExportOptions({...exportOptions, includeLegend: e.target.checked})}
                            className="rounded"
                          />
                          <label htmlFor="include-legend" className="text-sm cursor-pointer text-blue-800">
                            Include Legend
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="include-data"
                            checked={exportOptions.includeData}
                            onChange={(e) => setExportOptions({...exportOptions, includeData: e.target.checked})}
                            className="rounded"
                          />
                          <label htmlFor="include-data" className="text-sm cursor-pointer text-blue-800">
                            Include Raw Data
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Format Description */}
                  <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-md">
                    <div className="font-medium mb-1">Format Details:</div>
                    {exportFormat === 'pdf' && 'PDF document with map data, statistics, and metadata. Ideal for reports and presentations.'}
                    {exportFormat === 'png' && exportMode === 'auto' && 'Smart PNG export: tries multiple capture methods (dom-to-image, html2canvas) for best results. Falls back to styled visualization if needed.'}
                    {exportFormat === 'png' && exportMode === 'capture' && 'Advanced map capture: uses 5 different methods (dom-to-image PNG/JPEG/SVG, html2canvas) to capture the actual map with controls and legends.'}
                    {exportFormat === 'png' && exportMode === 'visualization' && 'Styled visualization: creates a beautiful map with background patterns and sample locations. Always works.'}
                    {exportFormat === 'excel' && 'Excel spreadsheet with sample data, pollution indices, and summary statistics.'}
                    {exportFormat === 'csv' && 'CSV file with raw sample data for analysis in spreadsheet applications.'}
                    {exportFormat === 'json' && 'JSON format with complete data structure for developers and APIs.'}
                  </div>

                  {/* Export Button */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-600">
                      {getFilteredSamples().length} samples will be exported
                    </div>
                    <Button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isExporting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Export {exportFormat.toUpperCase()}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Time Series Controls */}
              {showTimeSeries && timeSeriesData.length > 0 && (
                <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Time Series Animation</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setCurrentTimeIndex(0)}
                        variant="outline"
                        size="sm"
                        disabled={currentTimeIndex === 0}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => setIsPlaying(!isPlaying)}
                        variant="outline"
                        size="sm"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        onClick={() => setCurrentTimeIndex(timeSeriesData.length - 1)}
                        variant="outline"
                        size="sm"
                        disabled={currentTimeIndex === timeSeriesData.length - 1}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">
                        {timeSeriesData[currentTimeIndex]?.date}
                      </span>
                    </div>
                  </div>
                  <Progress value={(currentTimeIndex / (timeSeriesData.length - 1)) * 100} className="w-full" />
                  <div className="text-sm text-gray-600">
                    Showing {timeSeriesData[currentTimeIndex]?.samples.length || 0} samples
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span>Clean/Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span>Moderate/Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>High/Severe</span>
              </div>
            </div>

            {/* Map - Mobile Responsive */}
            {mapReady && L ? (
              <div 
                ref={mapContainerRef}
                className={`relative ${
                  isFullscreen 
                    ? 'absolute inset-0 z-30 h-full w-full fullscreen-map-container' 
                    : 'h-64 sm:h-80 md:h-96 map-container'
                } rounded-lg overflow-hidden border`}
              >
                <MapContainer
                  center={[getCenterPoint().lat, getCenterPoint().lng]}
                  zoom={getZoomLevel()}
                  style={{ height: '100%', width: '100%', zIndex: 10 }}
                  ref={setMapInstance}
                  className={`${isFullscreen ? 'fullscreen-leaflet' : ''}`}
                >
                  <TileLayer
                    url={mapStyles[mapStyle as keyof typeof mapStyles]}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Sample Markers */}
                  {getFilteredSamples().map((sample) => {
                    const category = sample[`${selectedIndex}Category` as keyof Sample] as string;
                    const icon = createCustomIcon(category, selectedIndex);
                    
                    if (!icon) return null;
                    
                    return (
                      <Marker
                        key={sample.id}
                        position={[sample.latitude, sample.longitude]}
                        icon={icon}
                      >
                        <Popup>
                          <div className="text-sm max-w-xs">
                            <h4 className="font-semibold">{sample.location}</h4>
                            <p className="text-xs text-gray-600">{sample.sampleId}</p>
                            <div className="mt-2 space-y-1">
                              <p><strong>HPI:</strong> {sample.hpi?.toFixed(2)} ({sample.hpiCategory})</p>
                              <p><strong>HEI:</strong> {sample.hei?.toFixed(2)} ({sample.heiCategory})</p>
                              <p><strong>CD:</strong> {sample.cd?.toFixed(2)} ({sample.cdCategory})</p>
                              <p><strong>NPI:</strong> {sample.npi?.toFixed(2)} ({sample.npiCategory})</p>
                            </div>
                            <div className="mt-2 text-xs">
                              <p><strong>Metals (mg/L):</strong></p>
                              <p>As: {sample.arsenic}, Cd: {sample.cadmium}, Cr: {sample.chromium}</p>
                              <p>Pb: {sample.lead}, Hg: {sample.mercury}, Ni: {sample.nickel}</p>
                              <p>Cu: {sample.copper}, Zn: {sample.zinc}</p>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
                
                {/* Fullscreen Close Button - Better Mobile Positioning */}
                {isFullscreen && (
                  <Button
                    onClick={() => setIsFullscreen(false)}
                    className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white backdrop-blur-sm fullscreen-controls border shadow-lg"
                    variant="outline"
                    size="sm"
                  >
                    <Minimize2 className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">Exit Fullscreen</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className={`rounded-lg overflow-hidden border flex items-center justify-center bg-gray-100 ${
                isFullscreen ? 'h-full w-full' : 'h-64 sm:h-80 md:h-96'
              }`}>
                <div className="text-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}

            {/* Statistics - Mobile Responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {filteredSamples.filter(s => {
                    const cat = s[`${selectedIndex}Category` as keyof Sample] as string;
                    return cat === 'Clean' || cat === 'Low';
                  }).length}
                </div>
                <div className="text-xs sm:text-sm text-green-600">Clean/Low</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                  {filteredSamples.filter(s => {
                    const cat = s[`${selectedIndex}Category` as keyof Sample] as string;
                    return cat === 'Moderate' || cat === 'Medium' || cat === 'Slight';
                  }).length}
                </div>
                <div className="text-xs sm:text-sm text-yellow-600">Moderate</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">
                  {filteredSamples.filter(s => {
                    const cat = s[`${selectedIndex}Category` as keyof Sample] as string;
                    return cat === 'High' || cat === 'Severe';
                  }).length}
                </div>
                <div className="text-xs sm:text-sm text-red-600">High/Severe</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                  {filteredSamples.length}
                </div>
                <div className="text-xs sm:text-sm text-blue-600">Total Locations</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6 tab-charts-content">
            <RegionalAnalysis samples={samples} />
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}
