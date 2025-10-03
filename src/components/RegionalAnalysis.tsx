"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, TrendingUp, TrendingDown, AlertTriangle, Search, Filter } from "lucide-react";

// All Indian states and union territories
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
  "Lakshadweep", "Puducherry"
];

interface Sample {
  id: string;
  sampleId: string;
  location: string;
  latitude: number;
  longitude: number;
  hpi: number | null;
  hpiCategory: string | null;
  createdAt: string;
}

interface StateData {
  state: string;
  samples: Sample[];
  totalSamples: number;
  averageHPI: number;
  maxHPI: number;
  minHPI: number;
  pollutionLevel: 'clean' | 'moderate' | 'high';
}

interface RegionalAnalysisProps {
  samples: Sample[];
}

export function RegionalAnalysis({ samples }: RegionalAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "samples" | "avgHPI">("name");
  
  // Group data by state
  const stateData = useMemo(() => {
    const states: Record<string, StateData> = {};
    
    // Initialize all Indian states
    INDIAN_STATES.forEach(state => {
      states[state] = {
        state,
        samples: [],
        averageHPI: 0,
        maxHPI: 0,
        minHPI: Infinity,
        totalSamples: 0,
        pollutionLevel: 'clean'
      };
    });
    
    // Group samples by state (simplified - in real app would use proper geolocation)
    samples.forEach(sample => {
      // Simple state assignment based on location patterns
      let assignedState = "Unknown";
      
      if (sample.location.toLowerCase().includes("delhi") || 
          (sample.latitude >= 28.4 && sample.latitude <= 28.8 && 
           sample.longitude >= 76.8 && sample.longitude <= 77.3)) {
        assignedState = "Delhi";
      } else if (sample.location.toLowerCase().includes("mumbai") || 
                 (sample.latitude >= 18.9 && sample.latitude <= 19.3 && 
                  sample.longitude >= 72.7 && sample.longitude <= 72.9)) {
        assignedState = "Maharashtra";
      } else if (sample.location.toLowerCase().includes("bangalore") || 
                 sample.location.toLowerCase().includes("bengaluru")) {
        assignedState = "Karnataka";
      } else if (sample.location.toLowerCase().includes("chennai")) {
        assignedState = "Tamil Nadu";
      } else if (sample.location.toLowerCase().includes("kolkata")) {
        assignedState = "West Bengal";
      } else if (sample.location.toLowerCase().includes("hyderabad")) {
        assignedState = "Telangana";
      } else {
        // Assign to a random state for demo purposes
        const randomStates = ["Uttar Pradesh", "Maharashtra", "Tamil Nadu", "West Bengal", "Karnataka"];
        assignedState = randomStates[Math.floor(Math.random() * randomStates.length)];
      }
      
      if (states[assignedState]) {
        states[assignedState].samples.push(sample);
        states[assignedState].totalSamples++;
      }
    });

    // Calculate statistics for each state
    Object.keys(states).forEach(state => {
      const stateSamples = states[state].samples;
      const hpiValues = stateSamples.filter(s => s.hpi !== null).map(s => s.hpi!);
      
      if (hpiValues.length > 0) {
        states[state].averageHPI = hpiValues.reduce((a, b) => a + b, 0) / hpiValues.length;
        states[state].maxHPI = Math.max(...hpiValues);
        states[state].minHPI = Math.min(...hpiValues);
        
        // Determine pollution level
        const avgHPI = states[state].averageHPI;
        if (avgHPI < 50) {
          states[state].pollutionLevel = 'clean';
        } else if (avgHPI < 100) {
          states[state].pollutionLevel = 'moderate';
        } else {
          states[state].pollutionLevel = 'high';
        }
      } else {
        states[state].minHPI = 0;
      }
    });

    return states;
  }, [samples]);

  // Filter and sort states
  const filteredStates = useMemo(() => {
    let states = Object.values(stateData);
    
    // Filter by search term
    if (searchTerm) {
      states = states.filter(state => 
        state.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort states
    states.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.state.localeCompare(b.state);
        case "samples":
          return b.totalSamples - a.totalSamples;
        case "avgHPI":
          return b.averageHPI - a.averageHPI;
        default:
          return 0;
      }
    });
    
    return states;
  }, [stateData, searchTerm, sortBy]);

  // Get state summary statistics
  const stateSummary = useMemo(() => {
    const totalStates = Object.keys(stateData).length;
    const totalSamples = Object.values(stateData).reduce((sum, state) => sum + state.totalSamples, 0);
    const statesWithData = Object.values(stateData).filter(state => state.totalSamples > 0).length;
    const statesWithHighPollution = Object.values(stateData).filter(state => state.pollutionLevel === 'high' && state.totalSamples > 0).length;
    const statesWithModeratePollution = Object.values(stateData).filter(state => state.pollutionLevel === 'moderate' && state.totalSamples > 0).length;
    const statesWithCleanPollution = Object.values(stateData).filter(state => state.pollutionLevel === 'clean' && state.totalSamples > 0).length;
    
    return {
      totalStates,
      totalSamples,
      statesWithData,
      statesWithHighPollution,
      statesWithModeratePollution,
      statesWithCleanPollution
    };
  }, [stateData]);

  const getPollutionLevelColor = (level: string) => {
    switch (level) {
      case 'clean': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPollutionLevelIcon = (level: string) => {
    switch (level) {
      case 'clean': return <TrendingDown className="h-4 w-4" />;
      case 'moderate': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <TrendingUp className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total States</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stateSummary.totalStates}</div>
            <p className="text-xs text-muted-foreground">Indian states & UTs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stateSummary.totalSamples}</div>
            <p className="text-xs text-muted-foreground">Water samples collected</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">States with Data</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📍</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stateSummary.statesWithData}</div>
            <p className="text-xs text-muted-foreground">Have sample data</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clean States</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stateSummary.statesWithCleanPollution}</div>
            <p className="text-xs text-muted-foreground">HPI &lt; 50</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Pollution</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stateSummary.statesWithHighPollution}</div>
            <p className="text-xs text-muted-foreground">HPI &gt; 100</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Indian States Analysis
          </CardTitle>
          <CardDescription>
            Comprehensive water quality data across all Indian states and union territories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Sort Options */}
            <Select value={sortBy} onValueChange={(value: "name" | "samples" | "avgHPI") => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="samples">Sort by Samples</SelectItem>
                <SelectItem value="avgHPI">Sort by HPI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Showing {filteredStates.length} of {Object.keys(stateData).length} states 
              {searchTerm && ` (search: "${searchTerm}")`}
            </p>
          </div>

          {/* States Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStates.map((state) => (
              <Card key={state.state} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{state.state}</CardTitle>
                    <Badge className={getPollutionLevelColor(state.pollutionLevel)}>
                      {getPollutionLevelIcon(state.pollutionLevel)}
                      <span className="ml-1 capitalize">{state.pollutionLevel}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Samples:</span>
                      <Badge variant={state.totalSamples > 0 ? "secondary" : "outline"}>
                        {state.totalSamples}
                      </Badge>
                    </div>
                    {state.totalSamples > 0 ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Avg HPI:</span>
                          <span className="font-medium">{state.averageHPI.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">HPI Range:</span>
                          <span className="text-sm">
                            {state.minHPI.toFixed(1)} - {state.maxHPI.toFixed(1)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        No data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStates.length === 0 && (
            <Alert>
              <AlertDescription>
                No states found matching your search criteria. Try adjusting your search.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}