'use client';

import { toast } from '@/hooks/use-toast';

export interface AppNotification {
  id: string;
  type: 'alert' | 'success' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'water_quality' | 'pdf_export' | 'csv_export' | 'system' | 'data_analysis' | 'data_upload';
  metadata?: {
    location?: string;
    hpiValue?: number;
    pdfName?: string;
    pdfData?: string;
    exportType?: string;
    sampleCount?: number;
    fileName?: string;
  };
}

class NotificationManager {
  private listeners: ((notifications: AppNotification[]) => void)[] = [];
  private notifications: AppNotification[] = [];
  private storageKey = 'water-quality-notifications';

  constructor() {
    this.loadFromStorage();
    
    // Add some initial test notifications if none exist
    if (this.notifications.length === 0) {
      this.addInitialTestNotifications();
    }
  }

  private addInitialTestNotifications() {
    const testNotifications = [
      {
        type: 'warning' as const,
        title: 'High HPI Detected',
        message: 'Location LOC003 shows HPI value of 245, indicating severe contamination',
        category: 'water_quality' as const,
        metadata: {
          location: 'LOC003',
          hpiValue: 245
        }
      },
      {
        type: 'info' as const,
        title: 'System Ready',
        message: 'Heavy Metal Pollution Analysis System is now online',
        category: 'system' as const
      }
    ];

    testNotifications.forEach((notification, index) => {
      const testNotification: AppNotification = {
        ...notification,
        id: `test-${index}`,
        timestamp: new Date(Date.now() - (index + 1) * 1000 * 60 * 30), // 30, 60 minutes ago
        read: index > 0 // First one is unread
      };
      this.notifications.push(testNotification);
    });
    
    this.saveToStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  subscribe(listener: (notifications: AppNotification[]) => void) {
    this.listeners.push(listener);
    listener([...this.notifications]);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: AppNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    this.saveToStorage();
    this.notifyListeners();

    // Also show toast for immediate feedback
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'alert' || notification.type === 'warning' ? 'destructive' : 'default',
    });
  }

  addPDFExportNotification(fileName: string, sampleCount: number, includeCharts: boolean) {
    this.addNotification({
      type: 'success',
      title: 'PDF Exported Successfully',
      message: `${includeCharts ? 'Comprehensive report with charts' : 'Data summary'} for ${sampleCount} sample${sampleCount === 1 ? '' : 's'} has been exported`,
      category: 'pdf_export',
      metadata: {
        pdfName: fileName,
        exportType: includeCharts ? 'PDF with Charts' : 'PDF Data Only',
        sampleCount
      }
    });
  }

  addCSVExportNotification(fileName: string, sampleCount: number) {
    this.addNotification({
      type: 'success',
      title: 'CSV Exported Successfully',
      message: `Raw data for ${sampleCount} sample${sampleCount === 1 ? '' : 's'} has been exported`,
      category: 'csv_export',
      metadata: {
        fileName,
        sampleCount
      }
    });
  }

  addDataUploadNotification(sampleCount: number, fileName?: string) {
    this.addNotification({
      type: 'success',
      title: 'Data Uploaded Successfully',
      message: `${sampleCount} water quality sample${sampleCount === 1 ? '' : 's'} ${fileName ? `from ${fileName}` : ''} have been added to the database`,
      category: 'data_upload',
      metadata: {
        sampleCount,
        fileName
      }
    });
  }

  markAsRead(id: string) {
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.saveToStorage();
    this.notifyListeners();
  }

  markAllAsRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.saveToStorage();
    this.notifyListeners();
  }

  deleteNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
    this.notifyListeners();
  }

  clearAll() {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}

// Global instance
export const notificationManager = new NotificationManager();

// Make it available globally for components that don't import directly
if (typeof window !== 'undefined') {
  (window as any).notificationManager = notificationManager;
}