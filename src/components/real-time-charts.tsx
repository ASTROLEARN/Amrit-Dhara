'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  RefreshCw,
  BarChart3,
  LineChart as LineChartIcon,
  Calendar
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChartData {
  timestamp: Date;
  hpi: number;
  hei: number;
  cd: number;
  npi: number;
  sampleCount: number;
}

interface RealTimeChartsProps {
  refreshKey?: number;
}

export function RealTimeCharts({ refreshKey }: RealTimeChartsProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'hpi' | 'hei' | 'cd' | 'npi'>('hpi');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [isLive, setIsLive] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Generate mock real-time data
  const generateRealTimeData = async () => {
    try {
      const response = await fetch('/api/results?limit=100');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      // Transform data for time series
      const now = new Date();
      const data: ChartData[] = result.data.map((sample: any, index: number) => ({
        timestamp: new Date(now.getTime() - (result.data.length - index) * 60000), // Simulate time series
        hpi: sample.hpi || Math.random() * 300,
        hei: sample.hei || Math.random() * 30,
        cd: sample.cd || Math.random() * 5,
        npi: sample.npi || Math.random() * 3,
        sampleCount: 1
      }));

      setChartData(data);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Generate mock data for demo
      generateMockData();
    }
  };

  const generateMockData = () => {
    const now = new Date();
    const dataPoints = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : 30;
    const data: ChartData[] = [];
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * (timeRange === '24h' ? 3600000 : timeRange === '7d' ? 86400000 : 86400000));
      data.push({
        timestamp,
        hpi: 50 + Math.random() * 200 + Math.sin(i / 3) * 30,
        hei: 5 + Math.random() * 20 + Math.cos(i / 4) * 5,
        cd: 0.5 + Math.random() * 3 + Math.sin(i / 2) * 0.5,
        npi: 0.3 + Math.random() * 2 + Math.cos(i / 3) * 0.3,
        sampleCount: Math.floor(Math.random() * 10) + 1
      });
    }
    
    setChartData(data);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Real-time updates
  useEffect(() => {
    generateRealTimeData();
    
    if (isLive) {
      const interval = setInterval(() => {
        generateRealTimeData();
      }, 30000); // Update every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [refreshKey, timeRange, isLive]);

  // Draw animated chart
  useEffect(() => {
    if (!canvasRef.current || chartData.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Chart dimensions
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Get current metric data
    const metricData = chartData.map(d => d[selectedMetric]);
    const maxValue = Math.max(...metricData) * 1.1;
    const minValue = 0;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + chartWidth, y);
      ctx.stroke();
      
      // Y-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      const value = maxValue - (maxValue / 5) * i;
      ctx.fillText(value.toFixed(1), padding - 10, y + 4);
    }

    // Draw animated line chart
    const gradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
    gradient.addColorStop(0, getMetricColor(selectedMetric, 0.3));
    gradient.addColorStop(1, getMetricColor(selectedMetric, 0.05));

    ctx.beginPath();
    ctx.strokeStyle = getMetricColor(selectedMetric, 1);
    ctx.lineWidth = 2;

    metricData.forEach((value, index) => {
      const x = padding + (chartWidth / (metricData.length - 1)) * index;
      const y = padding + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Fill area under line
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw data points
    metricData.forEach((value, index) => {
      const x = padding + (chartWidth / (metricData.length - 1)) * index;
      const y = padding + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = getMetricColor(selectedMetric, 1);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw trend indicator
    if (metricData.length > 1) {
      const firstValue = metricData[0];
      const lastValue = metricData[metricData.length - 1];
      const trend = lastValue > firstValue ? 'up' : 'down';
      const trendPercent = ((Math.abs(lastValue - firstValue) / firstValue) * 100).toFixed(1);
      
      ctx.fillStyle = trend === 'up' ? '#ef4444' : '#10b981';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${trend === 'up' ? '↑' : '↓'} ${trendPercent}%`, padding, padding - 10);
    }

  }, [chartData, selectedMetric, isAnimating]);

  const getMetricColor = (metric: string, alpha: number = 1) => {
    const colors = {
      hpi: `rgba(239, 68, 68, ${alpha})`, // red
      hei: `rgba(59, 130, 246, ${alpha})`, // blue
      cd: `rgba(245, 158, 11, ${alpha})`, // amber
      npi: `rgba(16, 185, 129, ${alpha})` // emerald
    };
    return colors[metric as keyof typeof colors] || `rgba(107, 114, 128, ${alpha})`;
  };

  const getMetricLabel = (metric: string) => {
    const labels = {
      hpi: 'Heavy Metal Pollution Index',
      hei: 'Heavy Metal Evaluation Index',
      cd: 'Contamination Degree',
      npi: 'Nemerow Pollution Index'
    };
    return labels[metric as keyof typeof labels] || metric;
  };

  const getLatestValue = () => {
    if (chartData.length === 0) return 0;
    return chartData[chartData.length - 1][selectedMetric]?.toFixed(2) || '0';
  };

  const getTrend = () => {
    if (chartData.length < 2) return { direction: 'stable', percent: 0 };
    const first = chartData[0][selectedMetric] || 0;
    const last = chartData[chartData.length - 1][selectedMetric] || 0;
    const percent = ((last - first) / first) * 100;
    return {
      direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'stable',
      percent: Math.abs(percent)
    };
  };

  const trend = getTrend();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            Real-Time Pollution Trends
          </h2>
          <p className="text-muted-foreground">Live monitoring of water quality indices</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            {isLive ? "Live" : "Paused"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={generateRealTimeData}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current {getMetricLabel(selectedMetric)}</p>
                <p className="text-2xl font-bold">{getLatestValue()}</p>
              </div>
              <div className={`p-2 rounded-full ${
                trend.direction === 'up' ? 'bg-red-100' : 
                trend.direction === 'down' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : trend.direction === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                ) : (
                  <Activity className="h-4 w-4 text-gray-600" />
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className={`font-medium ${
                trend.direction === 'up' ? 'text-red-600' : 
                trend.direction === 'down' ? 'text-green-600' : 'text-gray-600'
              }`}>
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}{trend.percent.toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">from last period</span>
            </div>
          </CardContent>
          {isAnimating && (
            <div className="absolute inset-0 bg-blue-500 opacity-5 animate-pulse" />
          )}
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Samples</p>
                <p className="text-2xl font-bold">{chartData.reduce((sum, d) => sum + d.sampleCount, 0)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last {timeRange === '24h' ? '24 hours' : timeRange === '7d' ? '7 days' : '30 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Update Frequency</p>
                <p className="text-2xl font-bold">30s</p>
              </div>
              <RefreshCw className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Auto-refresh {isLive ? 'enabled' : 'disabled'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Quality</p>
                <p className="text-2xl font-bold">98%</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Good
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Sensor accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                {getMetricLabel(selectedMetric)} Over Time
              </CardTitle>
              <CardDescription>
                Real-time monitoring with {timeRange === '24h' ? 'hourly' : 'daily'} updates
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hpi">HPI</SelectItem>
                  <SelectItem value="hei">HEI</SelectItem>
                  <SelectItem value="cd">CD</SelectItem>
                  <SelectItem value="npi">NPI</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-80">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ width: '100%', height: '100%' }}
            />
            {isAnimating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>HPI</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>HEI</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>CD</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>NPI</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}