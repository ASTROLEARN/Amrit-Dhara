'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function DropdownPortal({ children, isOpen, onClose }: DropdownPortalProps) {
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Create portal container if it doesn't exist
    if (!portalRef.current) {
      portalRef.current = document.createElement('div');
      portalRef.current.id = 'dropdown-portal';
      portalRef.current.style.position = 'fixed';
      portalRef.current.style.top = '0';
      portalRef.current.style.left = '0';
      portalRef.current.style.zIndex = '9999';
      portalRef.current.style.pointerEvents = 'none';
      document.body.appendChild(portalRef.current);
    }

    return () => {
      if (portalRef.current && portalRef.current.parentNode) {
        portalRef.current.parentNode.removeChild(portalRef.current);
        portalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !portalRef.current) {
    return null;
  }

  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>
      {children}
    </div>,
    portalRef.current
  );
}