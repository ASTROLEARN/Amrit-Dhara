'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface MapSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  items: { value: string; label: string }[];
  className?: string;
}

export function MapSelect({ value, onValueChange, items, className }: MapSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create portal container if it doesn't exist
    if (!portalRef.current) {
      portalRef.current = document.createElement('div');
      portalRef.current.id = 'map-select-portal';
      portalRef.current.style.position = 'fixed';
      portalRef.current.style.top = '0';
      portalRef.current.style.left = '0';
      portalRef.current.style.zIndex = '9999';
      document.body.appendChild(portalRef.current);
    }

    return () => {
      if (portalRef.current && portalRef.current.parentNode) {
        portalRef.current.parentNode.removeChild(portalRef.current);
        portalRef.current = null;
      }
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleItemClick = (itemValue: string) => {
    onValueChange(itemValue);
    setIsOpen(false);
  };

  return (
    <>
      <Select value={value} onValueChange={onValueChange} open={isOpen} onOpenChange={handleOpenChange}>
        <SelectTrigger className={className} ref={triggerRef}>
          <SelectValue />
        </SelectTrigger>
      </Select>
      
      {isOpen && portalRef.current && createPortal(
        <div
          className="bg-popover border rounded-md shadow-md"
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            width: position.width,
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          <div className="p-1">
            {items.map((item) => (
              <div
                key={item.value}
                className="px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm"
                onClick={() => handleItemClick(item.value)}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>,
        portalRef.current
      )}
    </>
  );
}