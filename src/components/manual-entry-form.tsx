'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  MapPin,
  FlaskConical,
  Info,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  sampleId: z.string()
    .min(1, 'Sample ID is required')
    .max(20, 'Sample ID must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Sample ID can only contain letters, numbers, underscores, and hyphens'),
  location: z.string()
    .min(1, 'Location is required')
    .min(3, 'Location name must be at least 3 characters')
    .max(100, 'Location name must be less than 100 characters'),
  latitude: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .refine(val => Math.abs(val) >= 0.0001, 'Latitude cannot be 0'),
  longitude: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .refine(val => Math.abs(val) >= 0.0001, 'Longitude cannot be 0'),
  As: z.number()
    .min(0, 'Arsenic concentration must be non-negative')
    .max(100, 'Arsenic concentration seems too high (max 100 mg/L)')
    .refine(val => val <= 0.05 || val >= 0.05, {
      message: 'Warning: Arsenic exceeds WHO standard (0.01 mg/L)',
    }),
  Cd: z.number()
    .min(0, 'Cadmium concentration must be non-negative')
    .max(100, 'Cadmium concentration seems too high (max 100 mg/L)'),
  Cr: z.number()
    .min(0, 'Chromium concentration must be non-negative')
    .max(100, 'Chromium concentration seems too high (max 100 mg/L)'),
  Pb: z.number()
    .min(0, 'Lead concentration must be non-negative')
    .max(100, 'Lead concentration seems too high (max 100 mg/L)'),
  Hg: z.number()
    .min(0, 'Mercury concentration must be non-negative')
    .max(100, 'Mercury concentration seems too high (max 100 mg/L)'),
  Ni: z.number()
    .min(0, 'Nickel concentration must be non-negative')
    .max(100, 'Nickel concentration seems too high (max 100 mg/L)'),
  Cu: z.number()
    .min(0, 'Copper concentration must be non-negative')
    .max(100, 'Copper concentration seems too high (max 100 mg/L)'),
  Zn: z.number()
    .min(0, 'Zinc concentration must be non-negative')
    .max(100, 'Zinc concentration seems too high (max 100 mg/L)'),
});

type FormData = z.infer<typeof formSchema>;

interface ManualEntryFormProps {
  onSuccess: () => void;
}

export function ManualEntryForm({ onSuccess }: ManualEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      sampleId: '',
      location: '',
      latitude: 0,
      longitude: 0,
      As: 0,
      Cd: 0,
      Cr: 0,
      Pb: 0,
      Hg: 0,
      Ni: 0,
      Cu: 0,
      Zn: 0,
    },
  });

  const watchedValues = form.watch();
  const formState = form.formState;

  const getFieldValueStatus = (fieldName: keyof FormData) => {
    const value = watchedValues[fieldName];
    const error = formState.errors[fieldName];
    const isTouched = formState.touchedFields[fieldName];
    
    if (error) return 'error';
    if (isTouched && value !== undefined && value !== null && value !== '') return 'success';
    if (isTouched && value !== undefined && value !== null && value === '') return 'error';
    return 'idle';
  };

  const getFieldIcon = (fieldName: keyof FormData) => {
    const status = getFieldValueStatus(fieldName);
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getExceedsStandard = (metal: string, value: number) => {
    const standards = {
      As: 0.01,
      Cd: 0.003,
      Cr: 0.05,
      Pb: 0.01,
      Hg: 0.001,
      Ni: 0.07,
      Cu: 2.0,
      Zn: 3.0,
    };
    return value > standards[metal as keyof typeof standards];
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const concentrations = {
        As: data.As,
        Cd: data.Cd,
        Cr: data.Cr,
        Pb: data.Pb,
        Hg: data.Hg,
        Ni: data.Ni,
        Cu: data.Cu,
        Zn: data.Zn,
      };

      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sampleId: data.sampleId,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
          concentrations,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Calculation failed');
      }

      setResult(result);
      form.reset();
      
      toast({
        title: "Success",
        description: "Sample processed and calculated successfully!",
      });

      onSuccess();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="card-hover">
        <CardHeader className="gradient-header">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
              <FlaskConical className="h-6 w-6 text-white" />
            </div>
            Manual Sample Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* Sample Information Group */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-muted">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-blue-900">Sample Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="sampleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-medium">
                          Sample ID
                          {getFieldIcon('sampleId')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., S001" 
                            {...field} 
                            className={`input-focus h-11 text-base ${
                              getFieldValueStatus('sampleId') === 'error' ? 'border-red-300 bg-red-50/30' : ''
                            }`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-medium">
                          Location Name
                          {getFieldIcon('location')}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Site A" 
                            {...field}
                            className={`input-focus h-11 text-base ${
                              getFieldValueStatus('location') === 'error' ? 'border-red-300 bg-red-50/30' : ''
                            }`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Location Coordinates Group */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-muted">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900">Location Coordinates</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-medium">
                          Latitude
                          {getFieldIcon('latitude')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g., 40.7128"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className={`input-focus h-11 text-base ${
                              getFieldValueStatus('latitude') === 'error' ? 'border-red-300 bg-red-50/30' : ''
                            }`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-base font-medium">
                          Longitude
                          {getFieldIcon('longitude')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="any"
                            placeholder="e.g., -74.0060"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className={`input-focus h-11 text-base ${
                              getFieldValueStatus('longitude') === 'error' ? 'border-red-300 bg-red-50/30' : ''
                            }`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Heavy Metal Concentrations Group */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-muted">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <FlaskConical className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-orange-900">Heavy Metal Concentrations (mg/L)</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Toxic Metals Group */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-red-700 uppercase tracking-wide">Highly Toxic Metals</h4>
                    <div className="space-y-4">
                      {[
                        { name: 'As', label: 'Arsenic (As)', standard: 0.01 },
                        { name: 'Cd', label: 'Cadmium (Cd)', standard: 0.003 },
                        { name: 'Pb', label: 'Lead (Pb)', standard: 0.01 },
                        { name: 'Hg', label: 'Mercury (Hg)', standard: 0.001 },
                      ].map((metal) => (
                        <FormField
                          key={metal.name}
                          control={form.control}
                          name={metal.name as keyof FormData}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                {metal.label}
                                {getFieldIcon(metal.name as keyof FormData)}
                                {watchedValues[metal.name as keyof FormData] > metal.standard && (
                                  <Badge variant="destructive" className="text-xs px-2 py-1">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Exceeds WHO
                                  </Badge>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="0.000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className={`input-focus h-10 text-sm ${
                                    getFieldValueStatus(metal.name as keyof FormData) === 'error' 
                                      ? 'border-red-300 bg-red-50/30' 
                                      : watchedValues[metal.name as keyof FormData] > metal.standard
                                      ? 'border-orange-300 bg-orange-50/30'
                                      : ''
                                  }`}
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">WHO Standard: {metal.standard} mg/L</p>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Other Metals Group */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Other Metals</h4>
                    <div className="space-y-4">
                      {[
                        { name: 'Cr', label: 'Chromium (Cr)', standard: 0.05 },
                        { name: 'Ni', label: 'Nickel (Ni)', standard: 0.07 },
                        { name: 'Cu', label: 'Copper (Cu)', standard: 2.0 },
                        { name: 'Zn', label: 'Zinc (Zn)', standard: 3.0 },
                      ].map((metal) => (
                        <FormField
                          key={metal.name}
                          control={form.control}
                          name={metal.name as keyof FormData}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-sm font-medium">
                                {metal.label}
                                {getFieldIcon(metal.name as keyof FormData)}
                                {watchedValues[metal.name as keyof FormData] > metal.standard && (
                                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-orange-100 text-orange-800">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Exceeds WHO
                                  </Badge>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="any"
                                  placeholder="0.000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className={`input-focus h-10 text-sm ${
                                    getFieldValueStatus(metal.name as keyof FormData) === 'error' 
                                      ? 'border-red-300 bg-red-50/30' 
                                      : watchedValues[metal.name as keyof FormData] > metal.standard
                                      ? 'border-orange-300 bg-orange-50/30'
                                      : ''
                                  }`}
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground">WHO Standard: {metal.standard} mg/L</p>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              {error && (
                <Alert variant="destructive" className="animate-hover">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && (
                <Alert className="border-green-200 bg-green-50 success-pulse">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <div className="space-y-3">
                      <p className="font-medium text-base">Sample processed successfully!</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">HPI:</span> {result.result.indices.hpi.toFixed(2)} 
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {result.result.indices.hpiCategory}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">HEI:</span> {result.result.indices.hei.toFixed(2)} 
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {result.result.indices.heiCategory}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="btn-hover w-full h-12 text-base font-semibold"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FlaskConical className="mr-3 h-5 w-5" />
                    Calculate Pollution Indices
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}