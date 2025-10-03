'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CSVUploadForm } from '@/components/csv-upload-form';
import { ManualEntryForm } from '@/components/manual-entry-form';
import { ResultsDashboard } from '@/components/results-dashboard';
import { EnhancedMapView } from '@/components/enhanced-map-view';
import { DataVisualization } from '@/components/data-visualization';
import { ExportPanel } from '@/components/export-panel';
import { FloatingEnhancedChatBot } from '@/components/floating-enhanced-chatbot';
import { MetalContaminationCarousel } from '@/components/metal-contamination-carousel';
import { ModernLayout } from '@/components/modern-layout';
import { MobileDataEntry } from '@/components/mobile-data-entry';
import { toast } from '@/hooks/use-toast';
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
import { 
  FlaskConical, 
  Database, 
  Trash2, 
  Upload, 
  Droplets, 
  Shield, 
  TrendingUp, 
  MapPin, 
  BarChart3,
  FileText,
  Globe,
  TestTube
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataUpdate = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Success",
      description: "Data processed successfully!",
    });
    setActiveTab('dashboard');
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const clearAllData = async () => {
    try {
      const response = await fetch('/api/clear-all', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear data');
      }

      toast({
        title: "All Data Cleared",
        description: result.message,
      });

      handleRefresh();

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to clear data',
        variant: "destructive",
      });
    }
  };

  return (
    <ModernLayout activeTab={activeTab} onTabChange={setActiveTab} onDataUpdate={handleDataUpdate}>
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome Section - Only show on dashboard */}
        {activeTab === 'dashboard' && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-4 sm:p-6 lg:p-8 border border-border shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Enhanced Logo */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-3 sm:p-4 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <Droplets className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold font-heading text-foreground mb-2 leading-tight">
                  Welcome to Amrit Dhara
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  Advanced groundwater quality analysis system for comprehensive environmental assessment 
                  using Heavy Metal Pollution Indices (HPI, HEI, CD, NPI).
                </p>
              </div>
            </div>
            
            {/* Quick Stats - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">WHO Standards</p>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate">Compliant</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Real-time</p>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate">Analysis</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-amber-500/10 rounded-lg">
                    <Globe className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Interactive</p>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate">Maps</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">Data</p>
                    <p className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate">Visualization</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

          <TabsContent value="upload" className="space-y-8 mt-8">
            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FlaskConical className="h-5 w-5 text-primary" />
                    </div>
                    Generate Sample Data
                  </CardTitle>
                  <CardDescription>
                    Create realistic groundwater data to test the analysis system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        fetch('/api/generate-sample', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ count: 10 })
                        }).then(() => {
                          toast({ title: "Success", description: "Sample data generated!" });
                          handleDataUpdate();
                        });
                      }}
                      className="flex-1"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Generate 10 Samples
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex-1">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear All Data?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete all samples and analysis results.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={clearAllData}>Clear All</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-info/10 rounded-lg">
                      <TestTube className="h-5 w-5 text-info" />
                    </div>
                    Quick Start Guide
                  </CardTitle>
                  <CardDescription>
                    Get started with your groundwater analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span>Upload CSV file with sample data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span>View real-time analysis results</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span>Export reports in multiple formats</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Input Methods */}
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-primary" />
                    CSV File Upload
                  </CardTitle>
                  <CardDescription>
                    Upload multiple samples at once with a properly formatted CSV file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CSVUploadForm onSuccess={handleDataUpdate} />
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    Manual Entry
                  </CardTitle>
                  <CardDescription>
                    Enter sample data manually for individual testing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ManualEntryForm onSuccess={handleDataUpdate} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-8">
            <ResultsDashboard refreshKey={refreshKey} onRefresh={handleRefresh} setActiveTab={setActiveTab} />
          </TabsContent>

          <TabsContent value="map" className="mt-8">
            <EnhancedMapView refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="visualization" className="mt-8">
            <DataVisualization refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="export" className="mt-8">
            <ExportPanel refreshKey={refreshKey} />
          </TabsContent>
        </Tabs>

        {/* Additional Components */}
        <MetalContaminationCarousel />
        <FloatingEnhancedChatBot />
      </div>
    </ModernLayout>
  );
}