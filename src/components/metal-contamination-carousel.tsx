'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ContaminationCarousel } from './contamination-carousel';
import { 
  AlertTriangle, 
  Download, 
  X, 
  Clock, 
  DollarSign, 
  Users, 
  CheckCircle, 
  FileText, 
  Phone,
  Mail,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MetalContaminationData {
  metal: string;
  concentration: number;
  samples: number;
  whoStandard: number;
  severity: 'Low' | 'Medium' | 'High';
  effectiveness: string;
  cost: string;
  recommendation: string;
  alternative: string;
  alternativeEffectiveness: string;
  alternativeCost: string;
}

const contaminationData: MetalContaminationData[] = [
  {
    metal: 'Zinc',
    concentration: 15.2,
    samples: 3,
    whoStandard: 5.0,
    severity: 'High',
    effectiveness: 'High',
    cost: 'Medium',
    recommendation: 'Multi-Stage Filtration System',
    alternative: 'Phytoremediation',
    alternativeEffectiveness: 'Medium',
    alternativeCost: 'Low'
  },
  {
    metal: 'Arsenic',
    concentration: 0.025,
    samples: 2,
    whoStandard: 0.01,
    severity: 'High',
    effectiveness: 'High',
    cost: 'High',
    recommendation: 'Reverse Osmosis System',
    alternative: 'Ion Exchange',
    alternativeEffectiveness: 'High',
    alternativeCost: 'Medium'
  },
  {
    metal: 'Lead',
    concentration: 0.015,
    samples: 4,
    whoStandard: 0.01,
    severity: 'Medium',
    effectiveness: 'High',
    cost: 'Medium',
    recommendation: 'Activated Carbon Filtration',
    alternative: 'Distillation',
    alternativeEffectiveness: 'High',
    alternativeCost: 'Low'
  },
  {
    metal: 'Cadmium',
    concentration: 0.008,
    samples: 1,
    whoStandard: 0.003,
    severity: 'Medium',
    effectiveness: 'Medium',
    cost: 'Medium',
    recommendation: 'Chemical Precipitation',
    alternative: 'Membrane Filtration',
    alternativeEffectiveness: 'High',
    alternativeCost: 'High'
  }
];

export function MetalContaminationCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [position, setPosition] = useState(0);
  const [hasContamination, setHasContamination] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentData = contaminationData[currentIndex];

  // Check for actual contamination in database
  useEffect(() => {
    const checkContamination = async () => {
      try {
        const response = await fetch('/api/samples');
        if (response.ok) {
          const data = await response.json();
          // Check if there are any contaminated samples
          const contaminated = data.samples?.some((sample: any) => 
            sample.hpi > 100 || sample.hei > 50 || sample.cd > 1 ||
            sample.arsenic > 0.01 || sample.cadmium > 0.003 || 
            sample.lead > 0.01 || sample.mercury > 0.001 ||
            sample.chromium > 0.05 || sample.nickel > 0.07 ||
            sample.copper > 2.0 || sample.zinc > 5.0
          );
          setHasContamination(contaminated || false);
        }
      } catch (error) {
        console.error('Failed to check contamination:', error);
        setHasContamination(false);
      } finally {
        setLoading(false);
      }
    };

    checkContamination();
    const interval = setInterval(checkContamination, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showActionPlan || !hasContamination) return;
      
      const step = 50;
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setPosition(prev => Math.max(-200, prev - step));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setPosition(prev => Math.min(200, prev + step));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showActionPlan, hasContamination]);

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + contaminationData.length) % contaminationData.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % contaminationData.length);
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const downloadActionPlan = () => {
    const actionPlanContent = generateActionPlanText(currentData);
    const blob = new Blob([actionPlanContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `action-plan-${currentData.metal.toLowerCase()}-contamination.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateActionPlanText = (data: MetalContaminationData) => {
    return `
Action Plan: ${data.metal} Contamination
Comprehensive remediation plan for ${data.recommendation}

Timeline
3-6 months

Budget
$5,000 - $15,000

Stakeholders
3 key partners

Implementation Steps
1. Immediate Action
Provide alternative drinking water sources
1-2 weeks
High Priority

2. Professional Assessment
Conduct comprehensive water quality testing
2-4 weeks
High Priority

3. Treatment System Installation
Install community-level ${data.metal.toLowerCase()} removal filters
1-3 months
High Priority

4. Monitoring & Maintenance
Regular testing and filter maintenance schedule
Ongoing
Medium Priority

Resources & References
EPA ${data.metal} Treatment Guidelines
Document

Local Water Treatment Companies
Service

Community Grant Programs
Funding

Key Contacts
Local Health Department
555-0100
health@local.gov

Environmental Protection Agency
555-0200
epa@contact.gov

Important: This action plan provides general guidance. Always consult with local environmental authorities and certified water treatment professionals before implementing any remediation solutions. Site-specific conditions may require specialized approaches.
    `.trim();
  };

  // Don't render anything if no contamination is found
  if (loading || !hasContamination) {
    return null;
  }

  if (showActionPlan) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Action Plan: {currentData.metal} Contamination</h2>
            <div className="flex gap-2">
              <Button onClick={downloadActionPlan} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Action Plan
              </Button>
              <Button onClick={() => setShowActionPlan(false)} variant="outline" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Comprehensive remediation plan for {currentData.recommendation}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">3-6 months</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">$5,000 - $15,000</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Stakeholders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-600">3 key partners</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Implementation Steps</h3>
              <div className="space-y-4">
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">1. Immediate Action</h4>
                        <p className="text-gray-600">Provide alternative drinking water sources</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">1-2 weeks</Badge>
                        <Badge className="ml-2" variant="secondary">High Priority</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">2. Professional Assessment</h4>
                        <p className="text-gray-600">Conduct comprehensive water quality testing</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">2-4 weeks</Badge>
                        <Badge className="ml-2" variant="secondary">High Priority</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">3. Treatment System Installation</h4>
                        <p className="text-gray-600">Install community-level {currentData.metal.toLowerCase()} removal filters</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">1-3 months</Badge>
                        <Badge className="ml-2" variant="secondary">High Priority</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">4. Monitoring & Maintenance</h4>
                        <p className="text-gray-600">Regular testing and filter maintenance schedule</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">Ongoing</Badge>
                        <Badge className="ml-2" variant="outline">Medium Priority</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Resources & References</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <h4 className="font-semibold">EPA {currentData.metal} Treatment Guidelines</h4>
                        <p className="text-sm text-gray-500">Document</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <ExternalLink className="h-8 w-8 text-green-500" />
                      <div>
                        <h4 className="font-semibold">Local Water Treatment Companies</h4>
                        <p className="text-sm text-gray-500">Service</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-purple-500" />
                      <div>
                        <h4 className="font-semibold">Community Grant Programs</h4>
                        <p className="text-sm text-gray-500">Funding</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Key Contacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Local Health Department</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>555-0100</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>health@local.gov</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Environmental Protection Agency</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>555-0200</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>epa@contact.gov</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> This action plan provides general guidance. Always consult with local environmental authorities and certified water treatment professionals before implementing any remediation solutions. Site-specific conditions may require specialized approaches.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create individual report cards for the carousel
  const reportCards = contaminationData.map((data) => (
    <div key={data.metal}>
      <Card className="w-80 shadow-lg border-2 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                {data.metal} Contamination
              </CardTitle>
              <CardDescription>
                High concentration of {data.metal} detected in {data.samples} sample(s)
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowActionPlan(true)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">WHO Standard</span>
              <Badge variant="outline">{data.whoStandard} mg/L</Badge>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Current Level</span>
              <Badge variant={data.severity === 'High' ? 'destructive' : 'secondary'}>
                {data.concentration} mg/L
              </Badge>
            </div>
            <Progress 
              value={(data.concentration / data.whoStandard) * 100} 
              className="h-2"
            />
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-2">Top Recommendation</h4>
            <p className="text-sm font-medium text-blue-600 mb-1">{data.recommendation}</p>
            <p className="text-xs text-gray-600 mb-2">Comprehensive treatment for various heavy metals</p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                Effectiveness: {data.effectiveness}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Cost: {data.cost}
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-2">Alternative Solution</h4>
            <p className="text-sm font-medium text-green-600 mb-1">{data.alternative}</p>
            <p className="text-xs text-gray-600 mb-2">Eco-friendly solution using hyperaccumulator plants</p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                Effectiveness: {data.alternativeEffectiveness}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Cost: {data.alternativeCost}
              </Badge>
            </div>
          </div>

          <Button 
            onClick={() => setShowActionPlan(true)} 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Action Plan
          </Button>
        </CardContent>
      </Card>
    </div>
  ));

  return (
    <div 
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 transition-transform duration-200"
      style={{ transform: `translateX(calc(-50% + ${position}px))` }}
    >
      <ContaminationCarousel
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        className="w-80"
      >
        {reportCards}
      </ContaminationCarousel>
    </div>
  );
}