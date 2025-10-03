'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Shield, 
  Leaf, 
  Filter,
  Droplets,
  Factory,
  TreePine,
  Beaker,
  ExternalLink,

  CheckCircle
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

interface InstagramContaminationCarouselProps {
  recommendations: Recommendation[];
  onViewActionPlan: (metal: string, recommendation: string) => void;
}

export function InstagramContaminationCarousel({
  recommendations,
  onViewActionPlan
}: InstagramContaminationCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);


  const currentRecommendation = recommendations[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigatePrev();
      if (e.key === 'ArrowRight') navigateNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const navigatePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? recommendations.length - 1 : prev - 1));
  }, [recommendations.length]);

  const navigateNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === recommendations.length - 1 ? 0 : prev + 1));
  }, [recommendations.length]);

  const handlePan = useCallback((info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 50;
    const velocityThreshold = 500;

    if (offset.x < -swipeThreshold || velocity.x < -velocityThreshold) {
      navigateNext();
    } else if (offset.x > swipeThreshold || velocity.x > velocityThreshold) {
      navigatePrev();
    }
  }, [navigateNext, navigatePrev]);



  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'High': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (recommendations.length === 0) {
    return null;
  }



  return (
    <div className="space-y-6">
      {/* Alert Header */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Contamination Detected:</strong> Swipe through action plans for each detected contaminant.
        </AlertDescription>
      </Alert>

      {/* Main Carousel Container */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-white border shadow-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -300, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                mass: 0.8
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => handlePan(info)}
              className="cursor-grab active:cursor-grabbing"
            >
              {/* Contamination Plan Card */}
              <Card className="border-0 shadow-none">
                {/* Header with Contamination Info */}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                      {/* Contamination Avatar */}
                      <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{currentRecommendation.metal} Contamination</span>
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                            Action Plan
                          </Badge>
                        </div>
                        <div className="text-sm text-orange-700">
                          {currentRecommendation.problem}
                        </div>
                      </div>
                    </div>
                </CardHeader>

                {/* Main Content */}
                <CardContent className="space-y-4">
                  {/* WHO Reference */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <a 
                      href={currentRecommendation.whoLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                      WHO Fact Sheet - {currentRecommendation.metal}
                    </a>
                  </div>

                  {/* Top Recommendation */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">Top Recommendation</h4>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 text-green-600">
                          {currentRecommendation.topRecommendation.icon}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-green-800 mb-2">
                            {currentRecommendation.topRecommendation.solution}
                          </h5>
                          <p className="text-sm text-green-700 mb-3">
                            {currentRecommendation.topRecommendation.reason}
                          </p>
                          <div className="flex gap-2">
                            <Badge className={getEffectivenessColor(currentRecommendation.topRecommendation.effectiveness)}>
                              Effectiveness: {currentRecommendation.topRecommendation.effectiveness}
                            </Badge>
                            <Badge className={getCostColor(currentRecommendation.topRecommendation.cost)}>
                              Cost: {currentRecommendation.topRecommendation.cost}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alternative Solution */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">Alternative Solution</h4>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 text-blue-600">
                          {currentRecommendation.alternative.icon}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-blue-800 mb-2">
                            {currentRecommendation.alternative.solution}
                          </h5>
                          <p className="text-sm text-blue-700 mb-3">
                            {currentRecommendation.alternative.reason}
                          </p>
                          <div className="flex gap-2">
                            <Badge className={getEffectivenessColor(currentRecommendation.alternative.effectiveness)}>
                              Effectiveness: {currentRecommendation.alternative.effectiveness}
                            </Badge>
                            <Badge className={getCostColor(currentRecommendation.alternative.cost)}>
                              Cost: {currentRecommendation.alternative.cost}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Plan Button */}
              <div className="border-t px-4 py-3 bg-gray-50">
                <Button 
                  onClick={() => onViewActionPlan(currentRecommendation.metal, currentRecommendation.topRecommendation.solution)}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  size="lg"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Detailed Action Plan
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        {recommendations.length > 1 && (
          <>
            {/* Left Arrow */}
            <Button
              variant="outline"
              size="icon"
              onClick={navigatePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border shadow-lg hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Right Arrow */}
            <Button
              variant="outline"
              size="icon"
              onClick={navigateNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm border shadow-lg hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2 mt-4">
              {recommendations.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-orange-500 w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            {/* Plan Counter */}
            <div className="text-center mt-2 text-sm text-muted-foreground">
              Action Plan {currentIndex + 1} of {recommendations.length}
            </div>
          </>
        )}

        {/* Keyboard Navigation Hint */}
        <div className="text-center mt-4 text-xs text-muted-foreground">
          Use arrow keys or swipe to navigate • Click and drag to pan
        </div>
      </div>

      {/* Footer Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Consult with environmental authorities and water treatment specialists before implementing any remediation solutions.
        </AlertDescription>
      </Alert>
    </div>
  );
}