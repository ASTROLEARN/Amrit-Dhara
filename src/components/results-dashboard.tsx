'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

import { 
  Droplets, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Trash2,
  AlertCircle,
  MapPin,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  Download,
  Eye,
  Calendar,
  Globe,
  Shield,
  Zap,
  Target,
  Layers,
  Database,
  FileText,
  Settings,
  Search,
  ChevronUp,
  ChevronDown,
  Users,
  Clock,
  Award,
  Thermometer,
  Beaker
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Recommendations } from '@/components/recommendations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface ResultsDashboardProps {
  refreshKey: number;
  onRefresh: () => void;
  setActiveTab?: (tab: string) => void;
}

export function ResultsDashboard({ refreshKey, onRefresh, setActiveTab }: ResultsDashboardProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [qualityDistribution, setQualityDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');


  const deleteSample = async (sampleId: string, sampleName: string) => {
    setDeleting(sampleId);
    
    try {
      const response = await fetch(`/api/delete?sampleId=${sampleId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete sample');
      }

      toast({
        title: "Sample Deleted",
        description: `Sample ${sampleName} has been deleted successfully.`,
      });

      // Refresh the data
      fetchResults();
      onRefresh();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete sample';
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const deleteAllSamples = async () => {
    try {
      const response = await fetch('/api/clear-all', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete all samples');
      }

      toast({
        title: "All Samples Deleted",
        description: result.message,
      });

      // Refresh the data
      fetchResults();
      onRefresh();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete all samples';
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/results?limit=100');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch results');
      }

      setSamples(result.data);
      setStatistics(result.statistics);
      setQualityDistribution(result.qualityDistribution);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch results';
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
    fetchResults();
  }, [refreshKey]);









  // Monitor for high HPI values and create alerts
  useEffect(() => {
    if (samples.length > 0 && (window as any).addWaterQualityNotification) {
      const highHPISamples = samples.filter(sample => 
        sample.hpi && sample.hpi > 100 && sample.hpiCategory === 'High'
      );
      
      const criticalSamples = samples.filter(sample => 
        sample.hpi && sample.hpi > 200
      );

      // Create alerts for high HPI values
      highHPISamples.forEach(sample => {
        (window as any).addWaterQualityNotification({
          type: sample.hpi > 200 ? 'alert' : 'warning',
          title: sample.hpi > 200 ? 'Critical Contamination Level' : 'High HPI Detected',
          message: `Location ${sample.location} shows HPI value of ${sample.hpi}, indicating ${sample.hpi > 200 ? 'severe' : 'high'} contamination`,
          category: 'water_quality',
          metadata: {
            location: sample.location,
            hpiValue: sample.hpi
          }
        });
      });

      // Create alerts for critical samples
      criticalSamples.forEach(sample => {
        (window as any).addWaterQualityNotification({
          type: 'alert',
          title: 'Critical Contamination Level',
          message: `Location ${sample.location} shows multiple heavy metals above WHO limits with HPI of ${sample.hpi}`,
          category: 'water_quality',
          metadata: {
            location: sample.location,
            hpiValue: sample.hpi
          }
        });
      });
    }
  }, [samples]);

  const getQualityColor = (category: string | null) => {
    switch (category) {
      case 'Clean':
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Moderate':
      case 'Medium':
      case 'Slight':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High':
      case 'Severe':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getQualityIcon = (category: string | null) => {
    switch (category) {
      case 'Clean':
      case 'Low':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Moderate':
      case 'Medium':
      case 'Slight':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'High':
      case 'Severe':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getFilteredAndSortedSamples = () => {
    let filtered = samples;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(sample => 
        sample.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sample.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(sample => sample.hpiCategory === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Sample];
      let bValue: any = b[sortBy as keyof Sample];

      if (aValue === null) aValue = sortOrder === 'asc' ? Infinity : -Infinity;
      if (bValue === null) bValue = sortOrder === 'asc' ? Infinity : -Infinity;

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const getPollutionLevel = (hpi: number | null) => {
    if (hpi === null) return { level: 'Unknown', color: 'bg-gray-500', percentage: 0 };
    if (hpi < 50) return { level: 'Excellent', color: 'bg-green-500', percentage: (hpi / 50) * 100 };
    if (hpi < 100) return { level: 'Good', color: 'bg-blue-500', percentage: ((hpi - 50) / 50) * 100 };
    if (hpi < 200) return { level: 'Moderate', color: 'bg-yellow-500', percentage: ((hpi - 100) / 100) * 100 };
    return { level: 'Poor', color: 'bg-red-500', percentage: Math.min(((hpi - 200) / 200) * 100, 100) };
  };

  const getTopContaminants = () => {
    const contaminants = ['arsenic', 'cadmium', 'chromium', 'lead', 'mercury', 'nickel', 'copper', 'zinc'];
    const averages = contaminants.map(contaminant => ({
      name: contaminant.charAt(0).toUpperCase() + contaminant.slice(1),
      value: samples.reduce((sum, sample) => sum + (sample[contaminant as keyof Sample] as number || 0), 0) / samples.length,
      unit: 'mg/L'
    }));
    return averages.sort((a, b) => b.value - a.value).slice(0, 3);
  };

  const getLocationStats = () => {
    const locationMap = new Map<string, number>();
    samples.forEach(sample => {
      const count = locationMap.get(sample.location) || 0;
      locationMap.set(sample.location, count + 1);
    });
    return Array.from(locationMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row Skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3 border rounded">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (samples.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <Droplets className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold mb-4">No Water Quality Data Yet</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Start analyzing groundwater quality by uploading sample data or entering measurements manually. 
            Get instant insights about heavy metal contamination and pollution levels.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => {
                setActiveTab?.('upload');
                onRefresh();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Upload CSV Data
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                setActiveTab?.('map');
              }} 
              className="flex items-center gap-2"
            >
              <MapPin className="h-5 w-5" />
              View Sample Map
            </Button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Real-time Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get instant HPI, HEI, CD, and NPI calculations for all your water samples
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Interactive Maps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualize contamination patterns across geographic locations
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Health Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Receive actionable insights for water treatment and safety measures
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Water Quality Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Real-time monitoring and analysis of groundwater contamination levels
          </p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">


          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Advanced
          </Button>
          <Button variant="outline" size="sm" onClick={fetchResults}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>





      {/* Quick Navigation */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab?.('upload')}
              className="flex items-center gap-2 bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              Add Data
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab?.('map')}
              className="flex items-center gap-2 bg-white"
            >
              <MapPin className="h-4 w-4" />
              Map View
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab?.('visualization')}
              className="flex items-center gap-2 bg-white"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setActiveTab?.('export')}
              className="flex items-center gap-2 bg-white"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
            <Droplets className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{samples.length}</div>
            <p className="text-xs text-muted-foreground">
              Water samples analyzed
            </p>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Active monitoring
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average HPI</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.averages?.hpi?.toFixed(2) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Heavy Metal Pollution Index
            </p>
            <div className="mt-2">
              <Progress value={Math.min((statistics?.averages?.hpi || 0) / 2, 100)} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-100 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clean Water Rate</CardTitle>
            <Shield className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {samples.length > 0 
                ? ((samples.filter(s => s.hpiCategory === 'Clean').length / samples.length) * 100).toFixed(1)
                : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Safe for consumption
            </p>
            <div className="mt-2 flex items-center text-xs text-blue-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              WHO Standards
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full -mr-10 -mt-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alert Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {samples.filter(s => s.hpiCategory === 'High').length}
            </div>
            <p className="text-xs text-muted-foreground">
              High contamination sites
            </p>
            {samples.filter(s => s.hpiCategory === 'High').length > 0 && (
              <div className="mt-2 flex items-center text-xs text-red-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Action required
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Statistics Panel */}
      {showAdvancedStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Advanced Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {/* Top Contaminants */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Beaker className="h-4 w-4" />
                  Top Contaminants
                </h4>
                <div className="space-y-2">
                  {getTopContaminants().map((contaminant, index) => (
                    <div key={contaminant.name} className="flex items-center justify-between">
                      <span className="text-sm">{contaminant.name}</span>
                      <span className="text-sm font-medium">
                        {contaminant.value.toFixed(3)} {contaminant.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Stats */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Top Locations
                </h4>
                <div className="space-y-2">
                  {getLocationStats().map((location, index) => (
                    <div key={location.location} className="flex items-center justify-between">
                      <span className="text-sm truncate">{location.location}</span>
                      <Badge variant="outline">{location.count} samples</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Metrics */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Quality Metrics
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Avg HEI</span>
                    <span className="text-sm font-medium">{statistics?.averages?.hei?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg CD</span>
                    <span className="text-sm font-medium">{statistics?.averages?.cd?.toFixed(2) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg NPI</span>
                    <span className="text-sm font-medium">{statistics?.averages?.npi?.toFixed(2) || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Quality Distribution */}
      {qualityDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Water Quality Distribution
                </CardTitle>
                <CardDescription>
                  Overview of contamination levels across all samples
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Total:</span>
                <Badge variant="outline">{samples.length} samples</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {/* Visual Distribution */}
              <div className="space-y-3">
                {qualityDistribution.map((item) => {
                  const percentage = samples.length > 0 ? (item.count / samples.length) * 100 : 0;
                  const pollutionLevel = getPollutionLevel(
                    item.category === 'Clean' ? 25 : 
                    item.category === 'Moderate' ? 150 : 
                    item.category === 'High' ? 250 : 100
                  );
                  
                  return (
                    <div key={item.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getQualityIcon(item.category)}
                          <span className="text-sm font-medium">{item.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{item.count} samples</span>
                          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${pollutionLevel.color}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {samples.filter(s => s.hpiCategory === 'Clean').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Safe Samples</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {samples.filter(s => s.hpiCategory === 'High').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Critical</div>
                    </div>
                  </Card>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Risk Assessment</span>
                  </div>
                  <div className="text-sm text-blue-700">
                    {samples.filter(s => s.hpiCategory === 'High').length > 0 
                      ? `${samples.filter(s => s.hpiCategory === 'High').length} locations require immediate attention`
                      : 'All locations within acceptable limits'
                    }
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations - Only show if there's contamination */}
      <Recommendations samples={samples} />

      {/* Enhanced Data Table Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Database className="h-5 w-5" />
                Sample Analysis Results
              </CardTitle>
              <CardDescription className="text-sm">
                Detailed water quality measurements and contamination indices
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search samples..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-24 sm:w-32 h-8 border-0 bg-transparent"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-28 sm:w-32 h-8 text-xs sm:text-sm">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Clean">Clean</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-7 w-7 p-0"
                >
                  <Layers className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-7 w-7 p-0"
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </div>

              {samples.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Samples?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {samples.length} samples and their analysis results. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAllSamples} className="bg-red-600 hover:bg-red-700">
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              <Button variant="outline" size="sm" onClick={fetchResults}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <>
              <div className="sm:hidden text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <div className="animate-pulse">→</div>
                Swipe horizontally to see more columns
              </div>
              <div className="h-96 overflow-hidden">
                <div className="h-full overflow-y-auto overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                  <div className="min-w-full">
                    <Table>
                      <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 whitespace-nowrap min-w-[100px]"
                      onClick={() => {
                        setSortBy('sampleId');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Sample ID
                        {sortBy === 'sampleId' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 whitespace-nowrap min-w-[120px]"
                      onClick={() => {
                        setSortBy('location');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <div className="flex items-center gap-1">
                        Location
                        {sortBy === 'location' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap min-w-[120px]">Coordinates</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50 whitespace-nowrap min-w-[80px]"
                      onClick={() => {
                        setSortBy('hpi');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      <div className="flex items-center gap-1">
                        HPI
                        {sortBy === 'hpi' && (
                          sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="whitespace-nowrap min-w-[80px]">HEI</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[80px]">CD</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[80px]">NPI</TableHead>
                    <TableHead className="whitespace-nowrap min-w-[100px]">Quality</TableHead>
                    <TableHead className="w-20 whitespace-nowrap min-w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredAndSortedSamples().map((sample) => (
                    <TableRow key={sample.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium min-w-[100px]">{sample.sampleId}</TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{sample.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground min-w-[120px]">
                        {sample.latitude.toFixed(4)}, {sample.longitude.toFixed(4)}
                      </TableCell>
                      <TableCell className="min-w-[80px]">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{sample.hpi?.toFixed(2) || 'N/A'}</span>
                          {getQualityIcon(sample.hpiCategory)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[80px]">
                        <div className="flex items-center gap-2">
                          <span>{sample.hei?.toFixed(2) || 'N/A'}</span>
                          {getQualityIcon(sample.heiCategory)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[80px]">
                        <div className="flex items-center gap-2">
                          <span>{sample.cd?.toFixed(2) || 'N/A'}</span>
                          {getQualityIcon(sample.cdCategory)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[80px]">
                        <div className="flex items-center gap-2">
                          <span>{sample.npi?.toFixed(2) || 'N/A'}</span>
                          {getQualityIcon(sample.npiCategory)}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <Badge
                          variant="outline"
                          className={getQualityColor(sample.hpiCategory)}
                        >
                          {sample.hpiCategory || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-20 min-w-[100px]">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={deleting === sample.id}
                            >
                              {deleting === sample.id ? (
                                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Sample?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete sample "{sample.sampleId}" from {sample.location}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteSample(sample.id, sample.sampleId)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <ScrollArea className="h-96">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {getFilteredAndSortedSamples().map((sample) => {
                  const pollutionLevel = getPollutionLevel(sample.hpi);
                  return (
                    <Card key={sample.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${pollutionLevel.color}`}></div>
                            <span className="font-medium text-sm">{sample.sampleId}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={getQualityColor(sample.hpiCategory)}
                          >
                            {sample.hpiCategory || 'N/A'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{sample.location}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">HPI:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{sample.hpi?.toFixed(1) || 'N/A'}</span>
                              {getQualityIcon(sample.hpiCategory)}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">HEI:</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{sample.hei?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Pollution Level</span>
                            <span className="font-medium">{pollutionLevel.level}</span>
                          </div>
                          <Progress value={pollutionLevel.percentage} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            {sample.latitude.toFixed(4)}, {sample.longitude.toFixed(4)}
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                disabled={deleting === sample.id}
                              >
                                {deleting === sample.id ? (
                                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Sample?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete sample "{sample.sampleId}" from {sample.location}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteSample(sample.id, sample.sampleId)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
          
          {getFilteredAndSortedSamples().length === 0 && (
            <div className="text-center py-12">
              <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No samples found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Upload sample data to see results here'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}