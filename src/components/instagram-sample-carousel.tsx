'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Trash2, 
  Heart,
  Bookmark,
  Share2,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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

interface InstagramSampleCarouselProps {
  samples: Sample[];
  onDeleteSample: (sampleId: string, sampleName: string) => void;
  deleting: string | null;
  getQualityColor: (category: string | null) => string;
  getQualityIcon: (category: string | null) => React.ReactNode;
  getPollutionLevel: (hpi: number | null) => { level: string; color: string; percentage: number };
}

export function InstagramSampleCarousel({
  samples,
  onDeleteSample,
  deleting,
  getQualityColor,
  getQualityIcon,
  getPollutionLevel
}: InstagramSampleCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedSamples, setLikedSamples] = useState<Set<string>>(new Set());
  const [savedSamples, setSavedSamples] = useState<Set<string>>(new Set());

  const currentSample = samples[currentIndex];
  const pollutionLevel = currentSample ? getPollutionLevel(currentSample.hpi) : null;

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
    setCurrentIndex((prev) => (prev === 0 ? samples.length - 1 : prev - 1));
  }, [samples.length]);

  const navigateNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === samples.length - 1 ? 0 : prev + 1));
  }, [samples.length]);

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

  const toggleLike = useCallback(() => {
    if (!currentSample) return;
    
    setLikedSamples(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentSample.id)) {
        newSet.delete(currentSample.id);
        toast({
          title: "Removed from likes",
          description: `Sample ${currentSample.sampleId} removed from likes`,
        });
      } else {
        newSet.add(currentSample.id);
        toast({
          title: "Added to likes",
          description: `Sample ${currentSample.sampleId} added to likes`,
        });
      }
      return newSet;
    });
  }, [currentSample]);

  const toggleSave = useCallback(() => {
    if (!currentSample) return;
    
    setSavedSamples(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentSample.id)) {
        newSet.delete(currentSample.id);
        toast({
          title: "Removed from saved",
          description: `Sample ${currentSample.sampleId} removed from saved items`,
        });
      } else {
        newSet.add(currentSample.id);
        toast({
          title: "Saved sample",
          description: `Sample ${currentSample.sampleId} saved for later`,
        });
      }
      return newSet;
    });
  }, [currentSample]);

  const handleShare = useCallback(() => {
    if (!currentSample) return;
    
    const shareText = `Water Sample ${currentSample.sampleId} from ${currentSample.location}\nHPI: ${currentSample.hpi?.toFixed(2) || 'N/A'} (${currentSample.hpiCategory})\nCoordinates: ${currentSample.latitude.toFixed(4)}, ${currentSample.longitude.toFixed(4)}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Water Sample ${currentSample.sampleId}`,
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard",
        description: "Sample details copied to clipboard",
      });
    }
  }, [currentSample]);

  if (samples.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          No samples to display
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Main Carousel Container */}
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
            {/* Sample Card */}
            <Card className="border-0 shadow-none">
              {/* Header with Sample Info */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Avatar/Indicator */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pollutionLevel?.color || 'bg-gray-500'}`}>
                      <span className="text-white font-bold text-sm">
                        {currentSample.sampleId.slice(-2)}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{currentSample.sampleId}</span>
                        <Badge
                          variant="outline"
                          className={getQualityColor(currentSample.hpiCategory)}
                        >
                          {currentSample.hpiCategory || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{currentSample.location}</span>
                      </div>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              {/* Main Content */}
              <CardContent className="space-y-4">
                {/* Pollution Level Visualization */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Pollution Level</span>
                    <span className="text-sm font-bold">{pollutionLevel?.level}</span>
                  </div>
                  <Progress value={pollutionLevel?.percentage || 0} className="h-3" />
                  <div className="mt-2 text-center">
                    <span className="text-2xl font-bold text-gray-800">
                      {currentSample.hpi?.toFixed(2) || 'N/A'}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">HPI</span>
                  </div>
                </div>

                {/* Quality Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">HEI</div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{currentSample.hei?.toFixed(1) || 'N/A'}</span>
                      {getQualityIcon(currentSample.heiCategory)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">CD</div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{currentSample.cd?.toFixed(1) || 'N/A'}</span>
                      {getQualityIcon(currentSample.cdCategory)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">NPI</div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{currentSample.npi?.toFixed(1) || 'N/A'}</span>
                      {getQualityIcon(currentSample.npiCategory)}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Coordinates</div>
                    <div className="text-xs font-medium">
                      {currentSample.latitude.toFixed(2)}, {currentSample.longitude.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Heavy Metals Preview */}
                <div className="border-t pt-3">
                  <div className="text-sm font-medium mb-2">Heavy Metals (mg/L)</div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-muted-foreground">As</div>
                      <div className="font-medium">{currentSample.arsenic.toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Cd</div>
                      <div className="font-medium">{currentSample.cadmium.toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Cr</div>
                      <div className="font-medium">{currentSample.chromium.toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted-foreground">Pb</div>
                      <div className="font-medium">{currentSample.lead.toFixed(3)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instagram-style Actions Bar */}
            <div className="border-t px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLike}
                    className={`p-2 ${likedSamples.has(currentSample.id) ? 'text-red-500' : 'text-gray-600'}`}
                  >
                    <Heart className={`h-6 w-6 ${likedSamples.has(currentSample.id) ? 'fill-current' : ''}`} />
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="p-2 text-gray-600">
                    <MessageCircle className="h-6 w-6" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="p-2 text-gray-600"
                  >
                    <Share2 className="h-6 w-6" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSave}
                    className={`p-2 ${savedSamples.has(currentSample.id) ? 'text-blue-500' : 'text-gray-600'}`}
                  >
                    <Bookmark className={`h-6 w-6 ${savedSamples.has(currentSample.id) ? 'fill-current' : ''}`} />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deleting === currentSample.id}
                      >
                        {deleting === currentSample.id ? (
                          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Sample?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete sample "{currentSample.sampleId}" from {currentSample.location}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => onDeleteSample(currentSample.id, currentSample.sampleId)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      {samples.length > 1 && (
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
            {samples.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-blue-500 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Sample Counter */}
          <div className="text-center mt-2 text-sm text-muted-foreground">
            {currentIndex + 1} of {samples.length}
          </div>
        </>
      )}

      {/* Keyboard Navigation Hint */}
      <div className="text-center mt-4 text-xs text-muted-foreground">
        Use arrow keys or swipe to navigate • Click and drag to pan
      </div>
    </div>
  );
}