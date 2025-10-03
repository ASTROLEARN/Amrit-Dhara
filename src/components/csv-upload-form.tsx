'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  File,
  X,
  RefreshCw,
  Database,
  Download
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { notificationManager } from '@/lib/notifications';

interface CSVUploadFormProps {
  onSuccess: () => void;
}

export function CSVUploadForm({ onSuccess }: CSVUploadFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<'idle' | 'validating' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');

  const resetUpload = useCallback(() => {
    setUploadedFile(null);
    setUploadResult(null);
    setError(null);
    setUploadProgress(0);
    setUploadStage('idle');
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      setUploadStage('error');
      return;
    }

    setUploadedFile(file);
    setUploading(true);
    setError(null);
    setUploadResult(null);
    setUploadProgress(0);
    setUploadStage('validating');

    try {
      // Simulate file validation
      await new Promise(resolve => setTimeout(resolve, 500));
      setUploadStage('uploading');
      setUploadProgress(20);

      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 70) return prev + 10;
          if (prev < 90) return prev + 5;
          return prev;
        });
      }, 300);

      setUploadStage('processing');
      
      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResult(result);
      setUploadStage('completed');
      
      toast({
        title: "Upload Successful",
        description: `Processed ${result.successCount} samples successfully`,
      });

      // Add notification for successful upload
      notificationManager.addDataUploadNotification(result.successCount, file.name);

      if (result.successCount > 0) {
        onSuccess();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setUploadStage('error');
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTimeout(() => {
        if (uploadStage !== 'completed') {
          setUploadProgress(0);
        }
      }, 2000);
    }
  }, [onSuccess, uploadStage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: uploading,
  });

  const getUploadStageIcon = () => {
    switch (uploadStage) {
      case 'validating':
        return <RefreshCw className="h-12 w-12 text-blue-500 mx-auto animate-spin" />;
      case 'uploading':
        return <Upload className="h-12 w-12 text-blue-500 mx-auto animate-bounce" />;
      case 'processing':
        return <RefreshCw className="h-12 w-12 text-orange-500 mx-auto animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />;
      case 'error':
        return <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />;
      default:
        return <FileText className="h-12 w-12 text-muted-foreground mx-auto" />;
    }
  };

  const getUploadStageText = () => {
    switch (uploadStage) {
      case 'validating':
        return 'Validating file format...';
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Processing data...';
      case 'completed':
        return 'Upload completed successfully!';
      case 'error':
        return 'Upload failed';
      default:
        return isDragActive ? 'Drop CSV file here' : 'Drag & drop CSV file here';
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = `SampleID,Lat,Lng,As,Cd,Cr,Pb,Hg,Ni,Cu,Zn
LOC001,40.7128,-74.0060,0.005,0.001,0.02,0.008,0.0005,0.03,0.5,1.0
LOC002,34.0522,-118.2437,0.08,0.006,0.15,0.08,0.002,0.25,8.0,12.0
LOC003,41.8781,-87.6298,0.25,0.015,0.35,0.25,0.008,0.55,18.0,28.0`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'water_quality_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Upload Area */}
      <Card
        {...getRootProps()}
        className={`card-hover border-2 border-dashed transition-all cursor-pointer relative overflow-hidden ${
          isDragActive
            ? 'border-blue-400 bg-blue-50/50 scale-[1.02] shadow-xl'
            : uploadStage === 'completed'
            ? 'border-green-400 bg-gradient-to-br from-green-50/50 to-emerald-50/30 shadow-lg'
            : uploadStage === 'error'
            ? 'border-red-400 bg-gradient-to-br from-red-50/50 to-rose-50/30 shadow-lg'
            : 'border-gray-300 bg-gradient-to-br from-gray-50/50 to-slate-50/30 hover:border-blue-300 hover:bg-blue-50/30'
        } ${uploading ? 'pointer-events-none' : ''}`}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-200/10 rounded-full -ml-12 -mb-12"></div>
        
        <CardContent className="flex flex-col items-center justify-center p-10 text-center relative z-10">
          <input {...getInputProps()} />
          
          {uploading || uploadStage !== 'idle' ? (
            <div className="space-y-6 w-full">
              {getUploadStageIcon()}
              <div className="space-y-3">
                <p className="text-lg font-semibold text-gray-800">{getUploadStageText()}</p>
                {uploadedFile && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200">
                    <File className="h-4 w-4" />
                    {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>
              {uploadStage !== 'completed' && uploadStage !== 'error' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Progress value={uploadProgress} className="w-full h-3 bg-gray-200" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full transition-all duration-300" 
                         style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{uploadProgress}% Complete</p>
                </div>
              )}
              {uploadStage === 'completed' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 bg-green-100 px-6 py-3 rounded-full border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">Upload Successful</span>
                  </div>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      resetUpload();
                    }} 
                    variant="outline" 
                    className="btn-hover bg-white/50 backdrop-blur-sm border-green-300 hover:bg-green-50 px-6 py-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Upload Another File
                  </Button>
                </div>
              )}
              {uploadStage === 'error' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3 bg-red-100 px-6 py-3 rounded-full border border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-800 font-medium">Upload Failed</span>
                  </div>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      resetUpload();
                    }} 
                    variant="outline" 
                    className="btn-hover bg-white/50 backdrop-blur-sm border-red-300 hover:bg-red-50 px-6 py-2"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <FileText className="h-20 w-20 text-blue-500 mx-auto" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Upload className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-2xl font-bold text-gray-800">
                  {getUploadStageText()}
                </p>
                <p className="text-lg text-gray-600">
                  or click to browse files
                </p>
              </div>
              <Button 
                variant="outline" 
                disabled={uploading} 
                className="btn-hover bg-white/70 backdrop-blur-sm border-blue-300 hover:bg-blue-50 hover:border-blue-400 px-8 py-3 text-lg font-medium shadow-md"
              >
                <Upload className="h-5 w-5 mr-2" />
                Select CSV File
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced File Info */}
      {uploadedFile && uploadStage === 'idle' && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/20 rounded-full -mr-8 -mt-8"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <File className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{uploadedFile.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </Badge>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      CSV Format
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  resetUpload();
                }}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 hover:bg-red-50 hover:text-red-600 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive" className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-rose-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
          </div>
        </Alert>
      )}

      {uploadResult && (
        <Alert className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 success-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <AlertDescription className="text-green-800">
              <div className="space-y-4">
                <p className="font-semibold text-lg">{uploadResult.message}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full border border-blue-200">
                    <Database className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Total: {uploadResult.totalProcessed}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full border border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Success: {uploadResult.successCount}</span>
                  </div>
                  {uploadResult.errorCount > 0 && (
                    <div className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-full border border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">Errors: {uploadResult.errorCount}</span>
                    </div>
                  )}
                </div>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <details className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-green-200">
                    <summary className="cursor-pointer font-medium text-red-700 hover:text-red-800 transition-colors flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      View errors ({uploadResult.errors.length})
                    </summary>
                    <div className="mt-3 max-h-40 overflow-y-auto bg-red-50 rounded-lg p-4 border border-red-200">
                      <ul className="space-y-2 text-sm">
                        {uploadResult.errors.slice(0, 10).map((error: string, index: number) => (
                          <li key={index} className="text-red-600 flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                        {uploadResult.errors.length > 10 && (
                          <li className="text-muted-foreground italic">
                            ... and {uploadResult.errors.length - 10} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  </details>
                )}
              </div>
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Enhanced Format Guide */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/10 rounded-full -mr-12 -mt-12"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-cyan-200/10 rounded-full -ml-10 -mb-10"></div>
        
        <CardHeader className="gradient-header relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-gray-800">Expected CSV Format</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6 relative z-10">
          <div className="space-y-6">
            {/* Download Template Button */}
            <div className="flex justify-center">
              <Button 
                onClick={downloadCSVTemplate}
                variant="outline" 
                className="flex items-center gap-2 bg-white/70 backdrop-blur-sm border-blue-300 hover:bg-blue-50 hover:border-blue-400"
              >
                <Download className="h-4 w-4" />
                Download CSV Template
              </Button>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
              <code className="text-sm block font-mono break-all leading-relaxed text-gray-800">
                <div className="font-semibold text-blue-600 mb-2">Header Row:</div>
                SampleID,Lat,Lng,As,Cd,Cr,Pb,Hg,Ni,Cu,Zn
                <div className="font-semibold text-blue-600 mt-4 mb-2">Example Row:</div>
                LOC001,40.7128,-74.0060,0.005,0.001,0.02,0.008,0.0005,0.03,0.5,1.0
              </code>
            </div>
            
        {/* 3 boxes in vertical column layout for all screens */}
            <div className="flex flex-col gap-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Required Columns
                </h4>
                <p className="text-sm text-gray-600">All 11 columns must be present for proper processing</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Units
                </h4>
                <p className="text-sm text-gray-600">All metal concentrations in mg/L (milligrams per liter)</p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Coordinates
                </h4>
                <p className="text-sm text-gray-600">Decimal degrees (-90 to 90 lat, -180 to 180 lng)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}