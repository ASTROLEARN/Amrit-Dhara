'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  children: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  className?: string;
}

export function ContaminationCarousel({ 
  children, 
  currentIndex, 
  onIndexChange, 
  className = '' 
}: CarouselProps) {
  const [direction, setDirection] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const handlePrevious = () => {
    if (children.length <= 1) return;
    setDirection(-1);
    const newIndex = currentIndex === 0 ? children.length - 1 : currentIndex - 1;
    onIndexChange(newIndex);
  };

  const handleNext = () => {
    if (children.length <= 1) return;
    setDirection(1);
    const newIndex = (currentIndex + 1) % children.length;
    onIndexChange(newIndex);
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    
    if (children.length <= 1) return;

    const swipeThreshold = 50;
    const swipeConfidenceThreshold = 10000;

    if (offset.x > swipeThreshold || velocity.x > swipeConfidenceThreshold) {
      // Swiped right (go to previous)
      handlePrevious();
    } else if (offset.x < -swipeThreshold || velocity.x < -swipeConfidenceThreshold) {
      // Swiped left (go to next)
      handleNext();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (children.length <= 1) return;
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, children.length]);

  // Auto-play functionality (optional - can be disabled)
  useEffect(() => {
    if (children.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isDragging) {
        handleNext();
      }
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [currentIndex, isDragging, children.length]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.8
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  if (children.length === 0) return null;
  if (children.length === 1) return <div className={className}>{children[0]}</div>;

  return (
    <div className={`relative w-full ${className}`} ref={constraintsRef}>
      {/* Instagram-like dots indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-1">
        {children.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              onIndexChange(index);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-white w-6' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handlePrevious}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm rounded-full"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm rounded-full"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Carousel container */}
      <div className="relative overflow-hidden rounded-lg">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={constraintsRef}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            onDrag={() => setIsDragging(true)}
            onAnimationComplete={() => setIsDragging(false)}
            className="cursor-grab active:cursor-grabbing"
          >
            {children[currentIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-4 right-4 z-20 bg-black/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
        {currentIndex + 1} / {children.length}
      </div>
    </div>
  );
}