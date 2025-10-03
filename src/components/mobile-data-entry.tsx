'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Save,
  Plus,
  Minus,
  Navigation,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { offlineStorage, syncManager } from '@/lib/offline-storage';

interface MobileDataEntryProps {
  onSubmit?: (data: any) => void;
}

interface SampleData {
  sampleId: string;
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  temperature: number;
  ph: number;
  conductivity: number;
  turbidity: number;
  arsenic: number;
  cadmium: number;
  chromium: number;
  lead: number;
  mercury: number;
  nickel: number;
  copper: number;
  zinc: number;
  notes: string;
  photos: string[];
}

export function MobileDataEntry({ onSubmit }: MobileDataEntryProps) {
  const [formData, setFormData] = useState<SampleData>({
    sampleId: '',
    location: '',
    latitude: 0,
    longitude: 0,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    temperature: 20,
    ph: 7,
    conductivity: 500,
    turbidity: 5,
    arsenic: 0,
    cadmium: 0,
    chromium: 0,
    lead: 0,
    mercury: 0,
    nickel: 0,
    copper: 0,
    zinc: 0,
    notes: '',
    photos: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineMode, setOfflineMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setOfflineMode(false);
      toast({
        title: "Connection Restored",
        description: "You're back online. Data will be synced automatically.",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineMode(true);
      toast({
        title: "Offline Mode",
        description: "Data will be saved locally and synced when you're back online.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize offline storage
  useEffect(() => {
    offlineStorage.init().catch(console.error);
  }, []);

  // Get current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setLocationLoading(false);
          toast({
            title: "Location Updated",
            description: "GPS coordinates captured successfully",
          });
        },
        (error) => {
          setLocationLoading(false);
          toast({
            title: "Location Error",
            description: "Unable to get GPS location",
            variant: "destructive",
          });
        }
      );
    } else {
      setLocationLoading(false);
      toast({
        title: "GPS Not Available",
        description: "Your device doesn't support GPS",
        variant: "destructive",
      });
    }
  };

  // Handle photo capture
  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos]
      }));
    }
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.sampleId.trim()) {
      errors.sampleId = 'Sample ID is required';
    }
    
    if (!formData.location.trim()) {
      errors.location = 'Location is required';
    }
    
    if (formData.latitude === 0 && formData.longitude === 0) {
      errors.location = 'Please capture GPS coordinates';
    }
    
    if (formData.arsenic < 0 || formData.cadmium < 0 || formData.chromium < 0 || 
        formData.lead < 0 || formData.mercury < 0 || formData.nickel < 0 || 
        formData.copper < 0 || formData.zinc < 0) {
      errors.metals = 'Metal concentrations cannot be negative';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitProgress(0);

    try {
      if (isOnline) {
        // Online submission
        const progressInterval = setInterval(() => {
          setSubmitProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const response = await fetch('/api/samples', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        clearInterval(progressInterval);
        setSubmitProgress(100);

        if (!response.ok) {
          throw new Error('Failed to submit sample data');
        }

        const result = await response.json();
        
        toast({
          title: "Sample Submitted",
          description: `Sample ${formData.sampleId} has been recorded successfully`,
        });

        if (onSubmit) {
          onSubmit(result);
        }

      } else {
        // Offline submission - store locally
        const progressInterval = setInterval(() => {
          setSubmitProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 15;
          });
        }, 150);

        // Store photos first
        const storedPhotoIds: number[] = [];
        for (const photo of formData.photos) {
          try {
            const photoId = await offlineStorage.storePhoto(
              formData.sampleId,
              photo,
              `photo_${Date.now()}.jpg`
            );
            storedPhotoIds.push(photoId);
          } catch (error) {
            console.error('Failed to store photo:', error);
          }
        }

        // Store sample data
        await offlineStorage.storeSample(formData, formData.photos);
        
        // Store pending API request for sync
        await offlineStorage.storePendingRequest({
          url: '/api/samples',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          timestamp: Date.now(),
          type: 'sample'
        });

        clearInterval(progressInterval);
        setSubmitProgress(100);

        toast({
          title: "Sample Saved Offline",
          description: `Sample ${formData.sampleId} will be synced when you're back online`,
        });
      }

      // Reset form
      setFormData({
        sampleId: '',
        location: '',
        latitude: 0,
        longitude: 0,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        temperature: 20,
        ph: 7,
        conductivity: 500,
        turbidity: 5,
        arsenic: 0,
        cadmium: 0,
        chromium: 0,
        lead: 0,
        mercury: 0,
        nickel: 0,
        copper: 0,
        zinc: 0,
        notes: '',
        photos: []
      });

    } catch (error) {
      toast({
        title: offlineMode ? "Offline Save Failed" : "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit sample",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitProgress(0), 1000);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof SampleData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Offline Status Indicator */}
      {offlineMode && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800">Offline Mode</p>
                <p className="text-xs text-orange-600">Data will be saved locally and synced when you're back online</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Mobile Data Entry</h1>
        <p className="text-muted-foreground">Record water quality samples on-site</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-xs text-muted-foreground">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {isSubmitting && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Submitting sample...</span>
              <span className="text-sm text-muted-foreground">{submitProgress}%</span>
            </div>
            <Progress value={submitProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>Sample identification and location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sampleId">Sample ID *</Label>
            <Input
              id="sampleId"
              value={formData.sampleId}
              onChange={(e) => handleInputChange('sampleId', e.target.value)}
              placeholder="e.g., LOC001"
              className="mt-1"
              disabled={isSubmitting}
            />
            {validationErrors.sampleId && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.sampleId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., River Site A"
                className="flex-1"
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={getCurrentLocation}
                disabled={locationLoading || isSubmitting}
                className="touch-manipulation"
              >
                {locationLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
              </Button>
            </div>
            {validationErrors.location && (
              <p className="text-sm text-red-500 mt-1">{validationErrors.location}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value))}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value))}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="h-5 w-5" />
            Field Parameters
          </CardTitle>
          <CardDescription>On-site measurements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ph">pH</Label>
              <Input
                id="ph"
                type="number"
                step="0.1"
                value={formData.ph}
                onChange={(e) => handleInputChange('ph', parseFloat(e.target.value))}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="conductivity">Conductivity (µS/cm)</Label>
              <Input
                id="conductivity"
                type="number"
                step="1"
                value={formData.conductivity}
                onChange={(e) => handleInputChange('conductivity', parseFloat(e.target.value))}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="turbidity">Turbidity (NTU)</Label>
              <Input
                id="turbidity"
                type="number"
                step="0.1"
                value={formData.turbidity}
                onChange={(e) => handleInputChange('turbidity', parseFloat(e.target.value))}
                disabled={isSubmitting}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heavy Metals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5" />
            Heavy Metals (mg/L)
          </CardTitle>
          <CardDescription>Laboratory analysis results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'arsenic', label: 'Arsenic (As)' },
              { key: 'cadmium', label: 'Cadmium (Cd)' },
              { key: 'chromium', label: 'Chromium (Cr)' },
              { key: 'lead', label: 'Lead (Pb)' },
              { key: 'mercury', label: 'Mercury (Hg)' },
              { key: 'nickel', label: 'Nickel (Ni)' },
              { key: 'copper', label: 'Copper (Cu)' },
              { key: 'zinc', label: 'Zinc (Zn)' }
            ].map((metal) => (
              <div key={metal.key}>
                <Label htmlFor={metal.key}>{metal.label}</Label>
                <Input
                  id={metal.key}
                  type="number"
                  step="0.001"
                  value={formData[metal.key as keyof SampleData]}
                  onChange={(e) => handleInputChange(metal.key as keyof SampleData, parseFloat(e.target.value))}
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
          {validationErrors.metals && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationErrors.metals}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Site Photos
          </CardTitle>
          <CardDescription>Document the sampling location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={handlePhotoCapture}
            disabled={isSubmitting}
            className="w-full touch-manipulation"
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>

          {formData.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Site photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(index)}
                    disabled={isSubmitting}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Additional observations</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Enter any additional observations or notes..."
            disabled={isSubmitting}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full touch-manipulation h-14 text-lg"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full mr-2" />
            Submitting...
          </>
        ) : (
          <>
            <Save className="h-5 w-5 mr-2" />
            Submit Sample
          </>
        )}
      </Button>
    </div>
  );
}