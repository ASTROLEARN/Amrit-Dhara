'use client';

import { useState, useEffect, useRef, TouchEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Home,
  Database,
  BookOpen,
  Upload,
  BarChart3,
  Settings,
  Bell,
  User,
  Search,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const tabs: TabItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" />, href: '/' },
  { id: 'data', label: 'Data Input', icon: <Database className="h-4 w-4" />, href: '/data' },
  { id: 'standards', label: 'Standards', icon: <BookOpen className="h-4 w-4" />, href: '/standards' },
  { id: 'upload', label: 'Upload', icon: <Upload className="h-4 w-4" />, href: '/upload' },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" />, href: '/notifications' },
];

export function ResponsiveLayout({ children, activeTab, onTabChange }: ResponsiveLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Swipe gesture handling
  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    
    if (isRightSwipe && !isSidebarOpen && isMobile) {
      setIsSidebarOpen(true);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarOpen(!isSidebarOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Water Quality</h2>
          <p className="text-sm text-muted-foreground">Analysis System</p>
        </div>
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-12 touch-manipulation",
              activeTab === tab.id && "bg-primary text-primary-foreground"
            )}
            onClick={() => {
              onTabChange(tab.id);
              if (isMobile) {
                setIsSidebarOpen(false);
              }
            }}
          >
            {tab.icon}
            <span className="font-medium">{tab.label}</span>
          </Button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3 h-12 touch-manipulation">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 h-12 touch-manipulation">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className="flex h-screen overflow-hidden bg-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "lg:w-64" : "lg:w-16"
      )}>
        <div className="flex flex-col h-full bg-background border-r">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="touch-manipulation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Water Quality</h1>
              <p className="text-xs text-muted-foreground">Heavy Metal Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="touch-manipulation">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="touch-manipulation">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="touch-manipulation relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
            </Button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="touch-manipulation"
            >
              {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Heavy Metal Pollution Analysis</h1>
              <p className="text-sm text-muted-foreground">Groundwater Quality Assessment System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="touch-manipulation">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" size="sm" className="touch-manipulation">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="ghost" size="sm" className="touch-manipulation relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
            </Button>
            <Button variant="ghost" size="sm" className="touch-manipulation">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t">
          <div className="grid grid-cols-6 gap-1 p-2">
            {tabs.slice(0, 6).map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex flex-col items-center gap-1 h-16 touch-manipulation",
                  activeTab === tab.id && "bg-primary text-primary-foreground"
                )}
                onClick={() => onTabChange(tab.id)}
              >
                {tab.icon}
                <span className="text-xs">{tab.label}</span>
              </Button>
            ))}
          </div>
        </nav>
      </div>

      {/* Swipe Indicator */}
      {isMobile && !isSidebarOpen && (
        <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-30 pointer-events-none">
          <div className="bg-black/10 text-black/60 px-2 py-1 rounded-r-md text-xs">
            Swipe right →
          </div>
        </div>
      )}
    </div>
  );
}