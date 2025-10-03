'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { notificationManager, AppNotification } from '@/lib/notifications';
import { 
  FlaskConical, 
  Database, 
  Trash2, 
  BookOpen, 
  Upload, 
  Droplets, 
  Shield, 
  TrendingUp, 
  MapPin, 
  BarChart3,
  Bell,
  User,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface ModernLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDataUpdate?: () => void;
}

export function ModernLayout({ children, activeTab, onTabChange, onDataUpdate }: ModernLayoutProps) {
  const [generating, setGenerating] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { toast } = useToast();

  // Subscribe to notification manager
  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const generateSampleData = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/generate-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 10 }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate sample data');
      }

      toast({
        title: "Sample Data Generated",
        description: result.message,
      });

      // Add notification for sample data generation
      notificationManager.addNotification({
        type: 'success',
        title: 'Sample Data Generated',
        message: `Successfully generated ${result.count || 10} water quality samples`,
        category: 'data_analysis',
        metadata: {
          sampleCount: result.count || 10
        }
      });

      // Trigger dashboard update
      if (onDataUpdate) {
        onDataUpdate();
      }

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to generate sample data',
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const markAsRead = (id: string) => {
    notificationManager.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationManager.markAllAsRead();
  };

  const clearNotification = (id: string) => {
    notificationManager.deleteNotification(id);
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }
  };

  

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        onCollapsedChange={setIsSidebarCollapsed}
      />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out relative ${
        isSidebarCollapsed ? 'lg:ml-12' : 'lg:ml-80'
      }`}>
        {/* Top Bar */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border" style={{ zIndex: 40 }}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="hidden lg:block" style={{ paddingLeft: isSidebarCollapsed ? '1rem' : '0' }}>
                <h1 className="text-xl font-bold font-heading">Heavy Metal Pollution Analysis</h1>
                <p className="text-sm text-muted-foreground">Groundwater Quality Assessment System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Quick Actions */}
              <Button
                onClick={generateSampleData}
                disabled={generating}
                size="sm"
                className="hidden md:flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4" />
                    Generate Sample
                  </>
                )}
              </Button>
              
              <Link href="/standards">
                <Button variant="outline" size="sm" className="hidden md:flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Standards
                </Button>
              </Link>
              
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={markAllAsRead}
                        className="text-xs h-auto p-1"
                      >
                        Mark all read
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-64">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <Droplets className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                        <p className="text-xs">System is running normally</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className="flex items-start gap-3 p-3 cursor-pointer"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-medium truncate ${
                                !notification.read ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {notification.title}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearNotification(notification.id);
                                }}
                                className="h-auto p-0 opacity-50 hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </ScrollArea>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center text-xs text-muted-foreground cursor-pointer">
                    <Link href="/notifications" className="w-full">
                      View all notifications →
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* User Menu */}
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}