'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Menu, 
  X, 
  Upload, 
  BarChart3, 
  MapPin, 
  TrendingUp, 
  Database, 
  BookOpen, 
  Droplets,
  Settings,
  HelpCircle,
  Smartphone,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ activeTab, onTabChange, onCollapsedChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device and reset states appropriately
  useEffect(() => {
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 1024;
      setIsMobile(newIsMobile);
      
      // Reset collapsed state on mobile and close mobile menu
      if (newIsMobile) {
        setIsDesktopCollapsed(false);
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ensure mobile menu is always properly labeled
  useEffect(() => {
    if (isMobile && isDesktopCollapsed) {
      setIsDesktopCollapsed(false);
    }
  }, [isMobile, isDesktopCollapsed]);

  // Notify parent when collapsed state changes
  useEffect(() => {
    if (onCollapsedChange && !isMobile) {
      onCollapsedChange(isDesktopCollapsed);
    }
  }, [isDesktopCollapsed, onCollapsedChange, isMobile]);

  // Add escape key handler to close mobile menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const menuItems = [
    { id: 'upload', label: 'Data Input', icon: Upload },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'map', label: 'Map View', icon: MapPin },
    { id: 'visualization', label: 'Charts', icon: TrendingUp },
    { id: 'export', label: 'Export', icon: Database },
  ];

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsOpen(false);
  };

  const MenuContent = () => (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Only contains collapse/expand button for desktop */}
      {!isMobile && (
        <div className={`flex items-center justify-between border-b border-border ${
          isDesktopCollapsed ? 'p-1' : 'p-6'
        }`}>
          {/* Title - Only show when expanded */}
          {!isDesktopCollapsed && (
            <h2 className="text-lg font-semibold text-foreground">Amrit Dhara</h2>
          )}
          <div className="flex items-center gap-2">
            {/* Desktop Collapse/Expand Button - Only show on desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
              className="hidden lg:flex hover:bg-accent transition-colors"
              title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isDesktopCollapsed ? (
                <Menu className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 ${
        !isMobile && isDesktopCollapsed ? 'p-1' : 'p-4'
      }`}>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isCollapsed = !isMobile && isDesktopCollapsed;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  isCollapsed ? 'h-8 w-10 justify-center px-1' : 'h-12'
                } ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
                onClick={() => handleTabChange(item.id)}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`${
                  isCollapsed ? 'h-4 w-4' : 'h-5 w-5'
                }`} />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className={`border-t border-border space-y-1 ${
        !isMobile && isDesktopCollapsed ? 'p-1' : 'p-4'
      }`}>
        {/* Theme Toggle - Desktop Only (Mobile has it in footer) */}
        <div className={`flex items-center ${
          isDesktopCollapsed ? 'justify-center' : 'justify-between'
        }`}>
          {isDesktopCollapsed ? (
            <ThemeToggle />
          ) : (
            <>
              <span className="text-sm font-medium text-muted-foreground">Theme</span>
              <ThemeToggle />
            </>
          )}
        </div>
        
        <Link href="/standards">
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3 text-muted-foreground hover:text-foreground ${
              !isMobile && isDesktopCollapsed ? 'h-8 w-10 justify-center px-1' : 'h-10'
            }`}
            title={!isMobile && isDesktopCollapsed ? "Standards" : undefined}
          >
            <BookOpen className={`${
              !isMobile && isDesktopCollapsed ? 'h-4 w-4' : 'h-4 w-4'
            }`} />
            {(!isMobile && !isDesktopCollapsed) || isMobile ? <span>Standards</span> : null}
          </Button>
        </Link>
        
        <Link href="/help">
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3 text-muted-foreground hover:text-foreground ${
              !isMobile && isDesktopCollapsed ? 'h-8 w-10 justify-center px-1' : 'h-10'
            }`}
            title={!isMobile && isDesktopCollapsed ? "Help" : undefined}
          >
            <HelpCircle className={`${
              !isMobile && isDesktopCollapsed ? 'h-4 w-4' : 'h-4 w-4'
            }`} />
            {(!isMobile && !isDesktopCollapsed) || isMobile ? <span>Help</span> : null}
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border-border hover:bg-accent"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <div className="relative">
            {/* Mobile Header with Title */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Amrit Dhara</h2>
            </div>
            <MenuContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar - Only show on desktop */}
      <div className={`hidden lg:flex fixed left-0 top-0 h-full bg-background border-r border-border transition-all duration-300 ease-in-out ${
        !isMobile && isDesktopCollapsed ? 'w-12' : 'w-80'
      }`}
      style={{ zIndex: 35 }}>
        <MenuContent />
      </div>
    </>
  );
}