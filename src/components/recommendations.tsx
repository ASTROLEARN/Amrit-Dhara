'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { ActionPlanModal } from '@/components/action-plan-modal';
import { InstagramContaminationCarousel } from '@/components/instagram-contamination-carousel';
import { useState } from 'react';
import { 
  AlertTriangle,
  Filter,
  Droplets,
  Factory,
  TreePine,
  Beaker,
  Leaf
} from 'lucide-react';

interface Recommendation {
  metal: string;
  problem: string;
  whoLink: string;
  topRecommendation: {
    solution: string;
    reason: string;
    effectiveness: 'High' | 'Medium' | 'Low';
    cost: 'Low' | 'Medium' | 'High';
    icon: React.ReactNode;
  };
  alternative: {
    solution: string;
    reason: string;
    effectiveness: 'High' | 'Medium' | 'Low';
    cost: 'Low' | 'Medium' | 'High';
    icon: React.ReactNode;
  };
}

interface RecommendationsProps {
  samples: any[];
}

export function Recommendations({ samples }: RecommendationsProps) {
  const [selectedMetal, setSelectedMetal] = useState<string>('');
  const [selectedRecommendation, setSelectedRecommendation] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const getContaminantRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    // Check for high contamination in samples
    const contaminatedSamples = samples.filter(sample => 
      sample.hpiCategory === 'High' || sample.heiCategory === 'High' || sample.npiCategory === 'Severe'
    );

    if (contaminatedSamples.length === 0) {
      return [];
    }

    // Analyze which metals are causing high contamination
    const metalContamination: { [key: string]: number } = {};
    const whoStandards: { [key: string]: number } = {
      arsenic: 0.01,
      cadmium: 0.003,
      chromium: 0.05,
      lead: 0.01,
      mercury: 0.001,
      nickel: 0.07,
      copper: 2.0,
      zinc: 3.0
    };

    contaminatedSamples.forEach(sample => {
      Object.entries(whoStandards).forEach(([metal, standard]) => {
        const concentration = sample[metal as keyof typeof sample] as number;
        if (concentration > standard) {
          metalContamination[metal] = (metalContamination[metal] || 0) + 1;
        }
      });
    });

    // Generate recommendations for each contaminated metal
    Object.entries(metalContamination).forEach(([metal, count]) => {
      const metalName = metal.charAt(0).toUpperCase() + metal.slice(1);
      
      switch (metal) {
        case 'arsenic':
          recommendations.push({
            metal: metalName,
            problem: `High concentration of Arsenic detected in ${count} sample(s)`,
            whoLink: 'https://www.who.int/news-room/fact-sheets/detail/arsenic',
            topRecommendation: {
              solution: 'Community-Level Arsenic Removal Filter',
              reason: 'Highly effective for drinking water sources; moderate cost',
              effectiveness: 'High',
              cost: 'Medium',
              icon: <Filter className="h-5 w-5" />
            },
            alternative: {
              solution: 'Phytoremediation using ferns',
              reason: 'Long-term soil/water improvement using natural processes',
              effectiveness: 'Medium',
              cost: 'Low',
              icon: <Leaf className="h-5 w-5" />
            }
          });
          break;
          
        case 'lead':
          recommendations.push({
            metal: metalName,
            problem: `High concentration of Lead detected in ${count} sample(s)`,
            whoLink: 'https://www.who.int/news-room/fact-sheets/detail/lead',
            topRecommendation: {
              solution: 'Activated Carbon Filtration System',
              reason: 'Proven technology for lead removal; relatively low maintenance',
              effectiveness: 'High',
              cost: 'Medium',
              icon: <Filter className="h-5 w-5" />
            },
            alternative: {
              solution: 'Reverse Osmosis Treatment',
              reason: 'Comprehensive removal of multiple contaminants including lead',
              effectiveness: 'High',
              cost: 'High',
              icon: <Droplets className="h-5 w-5" />
            }
          });
          break;
          
        case 'mercury':
          recommendations.push({
            metal: metalName,
            problem: `High concentration of Mercury detected in ${count} sample(s)`,
            whoLink: 'https://www.who.int/news-room/fact-sheets/detail/mercury-and-health',
            topRecommendation: {
              solution: 'Activated Carbon with Sulfur Impregnation',
              reason: 'Specialized treatment for mercury removal; high efficiency',
              effectiveness: 'High',
              cost: 'High',
              icon: <Beaker className="h-5 w-5" />
            },
            alternative: {
              solution: 'Constructed Wetlands',
              reason: 'Natural treatment system; low operational costs',
              effectiveness: 'Medium',
              cost: 'Low',
              icon: <TreePine className="h-5 w-5" />
            }
          });
          break;
          
        case 'cadmium':
          recommendations.push({
            metal: metalName,
            problem: `High concentration of Cadmium detected in ${count} sample(s)`,
            whoLink: 'https://www.who.int/news-room/fact-sheets/detail/cadmium',
            topRecommendation: {
              solution: 'Ion Exchange Resin Treatment',
              reason: 'Selective removal of cadmium ions; reusable media',
              effectiveness: 'High',
              cost: 'Medium',
              icon: <Factory className="h-5 w-5" />
            },
            alternative: {
              solution: 'Chemical Precipitation',
              reason: 'Cost-effective for large volumes; well-established process',
              effectiveness: 'Medium',
              cost: 'Low',
              icon: <Beaker className="h-5 w-5" />
            }
          });
          break;
          
        default:
          recommendations.push({
            metal: metalName,
            problem: `High concentration of ${metalName} detected in ${count} sample(s)`,
            whoLink: 'https://www.who.int/teams/environment-climate-change-and-health/water-sanitation-and-health/chemical-hazards/drinking-water-quality',
            topRecommendation: {
              solution: 'Multi-Stage Filtration System',
              reason: 'Comprehensive treatment for various heavy metals',
              effectiveness: 'High',
              cost: 'Medium',
              icon: <Filter className="h-5 w-5" />
            },
            alternative: {
              solution: 'Phytoremediation',
              reason: 'Eco-friendly solution using hyperaccumulator plants',
              effectiveness: 'Medium',
              cost: 'Low',
              icon: <Leaf className="h-5 w-5" />
            }
          });
      }
    });

    return recommendations;
  };

  const recommendations = getContaminantRecommendations();

  if (recommendations.length === 0) {
    return null;
  }

  const viewActionPlan = (metal: string, recommendation: string) => {
    setSelectedMetal(metal);
    setSelectedRecommendation(recommendation);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <InstagramContaminationCarousel
        recommendations={recommendations}
        onViewActionPlan={viewActionPlan}
      />

      {/* Action Plan Modal */}
      <ActionPlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metal={selectedMetal}
        recommendation={selectedRecommendation}
      />
    </div>
  );
}