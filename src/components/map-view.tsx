'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, RefreshCw, Layers, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

// Map component with ref
const MapContainerWithRef = dynamic(
  () => import('react-leaflet').then((mod) => {
    const { MapContainer } = mod;
    return (props: any) => {
      const mapRef = useRef<any>(null);
      useEffect(() => {
        if (mapRef.current && props.setMap) {
          props.setMap(mapRef.current);
        }
      }, [mapRef.current]);
      return (
        <MapContainer
          {...props}
          ref={mapRef}
          whenCreated={(mapInstance: any) => {
            if (props.setMap) {
              props.setMap(mapInstance);
            }
          }}
        />
      );
    };
  }),
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
  selectedState?: string;
  onStateSelect?: (state: string) => void;
}

// Indian states with their coordinates and boundaries
const INDIAN_STATES = [
  { name: "Andhra Pradesh", code: "AP", lat: 15.9129, lng: 79.7400, zoom: 7 },
  { name: "Arunachal Pradesh", code: "AR", lat: 28.2180, lng: 94.7278, zoom: 7 },
  { name: "Assam", code: "AS", lat: 26.2006, lng: 92.9376, zoom: 7 },
  { name: "Bihar", code: "BR", lat: 25.0961, lng: 85.3131, zoom: 7 },
  { name: "Chhattisgarh", code: "CT", lat: 21.2787, lng: 81.8661, zoom: 7 },
  { name: "Goa", code: "GA", lat: 15.2993, lng: 74.1240, zoom: 9 },
  { name: "Gujarat", code: "GJ", lat: 22.2587, lng: 71.1924, zoom: 7 },
  { name: "Haryana", code: "HR", lat: 29.0588, lng: 76.0856, zoom: 8 },
  { name: "Himachal Pradesh", code: "HP", lat: 31.1048, lng: 77.1734, zoom: 8 },
  { name: "Jharkhand", code: "JH", lat: 23.6102, lng: 85.2799, zoom: 7 },
  { name: "Karnataka", code: "KA", lat: 15.3173, lng: 75.7139, zoom: 7 },
  { name: "Kerala", code: "KL", lat: 10.8505, lng: 76.2711, zoom: 8 },
  { name: "Madhya Pradesh", code: "MP", lat: 22.9734, lng: 78.6569, zoom: 6 },
  { name: "Maharashtra", code: "MH", lat: 19.6016, lng: 75.3239, zoom: 7 },
  { name: "Manipur", code: "MN", lat: 24.6637, lng: 93.9063, zoom: 8 },
  { name: "Meghalaya", code: "ML", lat: 25.4670, lng: 91.3662, zoom: 8 },
  { name: "Mizoram", code: "MZ", lat: 23.1645, lng: 92.9376, zoom: 8 },
  { name: "Nagaland", code: "NL", lat: 26.1584, lng: 94.5624, zoom: 8 },
  { name: "Odisha", code: "OR", lat: 20.9517, lng: 85.0985, zoom: 7 },
  { name: "Punjab", code: "PB", lat: 31.1471, lng: 75.3412, zoom: 8 },
  { name: "Rajasthan", code: "RJ", lat: 27.0238, lng: 74.2179, zoom: 6 },
  { name: "Sikkim", code: "SK", lat: 27.5330, lng: 88.5122, zoom: 9 },
  { name: "Tamil Nadu", code: "TN", lat: 11.1271, lng: 78.6569, zoom: 7 },
  { name: "Telangana", code: "TS", lat: 17.1232, lng: 78.6569, zoom: 8 },
  { name: "Tripura", code: "TR", lat: 23.8315, lng: 91.2868, zoom: 8 },
  { name: "Uttar Pradesh", code: "UP", lat: 26.8467, lng: 80.9462, zoom: 7 },
  { name: "Uttarakhand", code: "UT", lat: 30.0668, lng: 79.0193, zoom: 8 },
  { name: "West Bengal", code: "WB", lat: 22.9868, lng: 87.8550, zoom: 7 },
  { name: "Andaman and Nicobar Islands", code: "AN", lat: 11.7401, lng: 92.6586, zoom: 7 },
  { name: "Chandigarh", code: "CH", lat: 30.7333, lng: 76.7794, zoom: 10 },
  { name: "Dadra and Nagar Haveli", code: "DN", lat: 20.1809, lng: 73.0169, zoom: 9 },
  { name: "Daman and Diu", code: "DD", lat: 20.4283, lng: 70.9318, zoom: 9 },
  { name: "Lakshadweep", code: "LD", lat: 10.5726, lng: 72.6417, zoom: 9 },
  { name: "Delhi", code: "DL", lat: 28.7041, lng: 77.1025, zoom: 9 },
  { name: "Puducherry", code: "PY", lat: 11.9416, lng: 79.8083, zoom: 10 },
  { name: "Jammu and Kashmir", code: "JK", lat: 33.7782, lng: 76.5762, zoom: 7 },
  { name: "Ladakh", code: "LA", lat: 34.1526, lng: 77.5770, zoom: 7 }
];

export function MapView({ refreshKey, selectedState, onStateSelect }: MapViewProps) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<string>('hpi');
  const [mapReady, setMapReady] = useState(false);
  const [L, setL] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const createCustomIcon = (category: string | null, index: string) => {
    if (!L) return null;
    
    const color = getPollutionColor(category, index);
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });
  };

  const getFilteredSamples = () => {
    return samples.filter(sample => {
      switch (selectedIndex) {
        case 'hpi':
          return sample.hpi !== null && sample.hpiCategory !== null;
        case 'hei':
          return sample.hei !== null && sample.heiCategory !== null;
        case 'cd':
          return sample.cd !== null && sample.cdCategory !== null;
        case 'npi':
          return sample.npi !== null && sample.npiCategory !== null;
        default:
          return true;
      }
    });
  };

  const getCenterPoint = () => {
    // If a state is selected, use its coordinates
    if (selectedState) {
      const state = INDIAN_STATES.find(s => s.name === selectedState);
      if (state) {
        return { lat: state.lat, lng: state.lng, zoom: state.zoom };
      }
    }
    
    // Always default to India center
    return { lat: 20.5937, lng: 78.9629, zoom: 5 }; // Center of India
  };

  const zoomToState = (stateName: string) => {
    if (!map) return;
    
    const state = INDIAN_STATES.find(s => s.name === stateName);
    if (state) {
      map.setView([state.lat, state.lng], state.zoom);
      if (onStateSelect) {
        onStateSelect(stateName);
      }
    }
  };

  const resetView = () => {
    if (!map) return;
    map.setView([20.5937, 78.9629], 5); // Center of India with appropriate zoom
    if (onStateSelect) {
      onStateSelect('');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interactive Map</CardTitle>
          <CardDescription>
            Geographic visualization of groundwater sample locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <MapPin className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (samples.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No sample locations</h3>
          <p className="text-muted-foreground text-center">
            Upload sample data with geographic coordinates to see them on the map.
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredSamples = getFilteredSamples();
  const center = getCenterPoint();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="relative map-controls-container">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Interactive Map</CardTitle>
              <CardDescription>
                Geographic visualization of groundwater pollution levels across India
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 relative map-dropdown-container" ref={dropdownRef}>
              <Select value={selectedIndex} onValueChange={setSelectedIndex}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  className="data-[state=open]:z-50"
                  style={{ zIndex: 9999 }}
                >
                  <SelectItem value="hpi">HPI</SelectItem>
                  <SelectItem value="hei">HEI</SelectItem>
                  <SelectItem value="cd">CD</SelectItem>
                  <SelectItem value="npi">NPI</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchSamples}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              {selectedState && (
                <Button variant="outline" size="sm" onClick={resetView}>
                  Reset View
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* State Selector */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Quick Navigation - Indian States:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-muted/20">
              {INDIAN_STATES.map((state) => (
                <Button
                  key={state.code}
                  variant={selectedState === state.name ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8 px-2"
                  onClick={() => zoomToState(state.name)}
                >
                  {state.code}
                </Button>
              ))}
            </div>
            {selectedState && (
              <div className="mt-2 text-sm text-muted-foreground">
                Currently viewing: <span className="font-medium">{selectedState}</span>
              </div>
            )}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Clean/Low</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Moderate/Medium</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>High/Severe</span>
            </div>
            <Badge variant="outline" className="ml-auto">
              {filteredSamples.length} locations
            </Badge>
          </div>
          
          {mapReady && L ? (
            <div className="h-96 w-full rounded-lg overflow-hidden border relative map-container" style={{ zIndex: 1 }}>
              <MapContainerWithRef
                center={[center.lat, center.lng]}
                zoom={center.zoom}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                setMap={setMap}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredSamples.map((sample) => {
                  let category: string | null = null;
                  switch (selectedIndex) {
                    case 'hpi':
                      category = sample.hpiCategory;
                      break;
                    case 'hei':
                      category = sample.heiCategory;
                      break;
                    case 'cd':
                      category = sample.cdCategory;
                      break;
                    case 'npi':
                      category = sample.npiCategory;
                      break;
                  }

                  const icon = createCustomIcon(category, selectedIndex);
                  
                  return (
                    <Marker
                      key={sample.id}
                      position={[sample.latitude, sample.longitude]}
                      icon={icon}
                    >
                      <Popup>
                        <div className="space-y-2 p-2">
                          <h4 className="font-semibold">{sample.sampleId}</h4>
                          <p className="text-sm text-muted-foreground">{sample.location}</p>
                          <div className="text-xs space-y-1">
                            <p>Coordinates: {sample.latitude.toFixed(4)}, {sample.longitude.toFixed(4)}</p>
                            <p>HPI: {sample.hpi?.toFixed(2)} ({sample.hpiCategory})</p>
                            <p>HEI: {sample.hei?.toFixed(2)} ({sample.heiCategory})</p>
                            <p>CD: {sample.cd?.toFixed(2)} ({sample.cdCategory})</p>
                            <p>NPI: {sample.npi?.toFixed(2)} ({sample.npiCategory})</p>
                          </div>
                          <div className="text-xs space-y-1 border-t pt-2">
                            <p>As: {sample.arsenic} mg/L</p>
                            <p>Cd: {sample.cadmium} mg/L</p>
                            <p>Cr: {sample.chromium} mg/L</p>
                            <p>Pb: {sample.lead} mg/L</p>
                            <p>Hg: {sample.mercury} mg/L</p>
                            <p>Ni: {sample.nickel} mg/L</p>
                            <p>Cu: {sample.copper} mg/L</p>
                            <p>Zn: {sample.zinc} mg/L</p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainerWithRef>
            </div>
          ) : (
            <Skeleton className="h-96 w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}