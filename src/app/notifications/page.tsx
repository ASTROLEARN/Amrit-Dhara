'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Calendar,
  Clock,
  ArrowLeft,
  Filter,
  RefreshCw,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import jsPDF from 'jspdf';
import { notificationManager, AppNotification } from '@/lib/notifications';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to notification manager
  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const markAsRead = (id: string) => {
    notificationManager.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationManager.markAllAsRead();
    toast({
      title: "All notifications marked as read",
      description: "All notifications have been marked as read.",
    });
  };

  const deleteNotification = (id: string) => {
    notificationManager.deleteNotification(id);
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    });
  };

  const clearAllNotifications = () => {
    notificationManager.clearAll();
    toast({
      title: "All notifications cleared",
      description: "All notifications have been removed.",
    });
  };

  const openPDF = (pdfName: string) => {
    // Try to regenerate the PDF on the fly for opening
    if (pdfName === 'who-standards-heavy-metals.pdf') {
      generateWHOStandardsPDF();
    } else if (pdfName === 'pollution-indices-categories.pdf') {
      generatePollutionIndicesPDF();
    } else {
      toast({
        title: "PDF not found",
        description: "The PDF file could not be found. Try regenerating it.",
        variant: "destructive",
      });
    }
  };

  const generateWHOStandardsPDF = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('WHO Standards for Heavy Metals', pageWidth / 2, 20, { align: 'center' });
      
      // Add subtitle
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('World Health Organization permissible limits for heavy metals in drinking water', pageWidth / 2, 30, { align: 'center' });
      
      // Table headers
      const headers = ['Heavy Metal', 'Symbol', 'Allowed (mg/L)', 'Background (mg/L)'];
      const data = [
        ['Arsenic (As)', 'As', '0.01', '0.001'],
        ['Cadmium (Cd)', 'Cd', '0.003', '0.0005'],
        ['Chromium (Cr)', 'Cr', '0.05', '0.001'],
        ['Lead (Pb)', 'Pb', '0.01', '0.01'],
        ['Mercury (Hg)', 'Hg', '0.001', '0.0001'],
        ['Nickel (Ni)', 'Ni', '0.07', '0.002'],
        ['Copper (Cu)', 'Cu', '2.0', '0.001'],
        ['Zinc (Zn)', 'Zn', '3.0', '0.01']
      ];
      
      // Add table
      let yPosition = 50;
      const cellHeight = 10;
      const cellWidth = (pageWidth - 40) / 4;
      
      // Draw headers
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      headers.forEach((header, index) => {
        const x = 20 + (index * cellWidth);
        pdf.rect(x, yPosition, cellWidth, cellHeight);
        pdf.text(header, x + 2, yPosition + 7);
      });
      
      // Draw data
      pdf.setFont('helvetica', 'normal');
      data.forEach((row) => {
        yPosition += cellHeight;
        row.forEach((cell, cellIndex) => {
          const x = 20 + (cellIndex * cellWidth);
          pdf.rect(x, yPosition, cellWidth, cellHeight);
          pdf.text(cell, x + 2, yPosition + 7);
        });
      });
      
      // Add footer note
      yPosition += cellHeight + 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      const noteText = 'These standards are based on WHO guidelines for drinking water quality. Background values represent typical natural concentrations in uncontaminated water sources.';
      const lines = pdf.splitTextToSize(noteText, pageWidth - 40);
      lines.forEach((line: string, index: number) => {
        pdf.text(line, 20, yPosition + (index * 5));
      });

      // Open the PDF in a new window
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(pdfUrl, '_blank');
      
      if (newWindow) {
        newWindow.onload = () => {
          URL.revokeObjectURL(pdfUrl);
        };
      } else {
        // Fallback: download the file
        pdf.save('who-standards-heavy-metals.pdf');
      }
      
      toast({
        title: "PDF Opened",
        description: "WHO Standards PDF has been opened in a new tab.",
      });
    } catch (error) {
      toast({
        title: "Failed to Open PDF",
        description: "Could not generate the PDF file.",
        variant: "destructive",
      });
    }
  };

  const generatePollutionIndicesPDF = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pollution Index Categories', pageWidth / 2, 20, { align: 'center' });
      
      // Add subtitle
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Classification categories for different water quality pollution indices', pageWidth / 2, 30, { align: 'center' });
      
      let yPosition = 50;
      
      // Add pollution indices
      const indices = [
        {
          name: 'Heavy Metal Pollution Index (HPI)',
          description: 'Comprehensive index for overall heavy metal contamination',
          categories: [
            { range: '< 100', level: 'Clean' },
            { range: '100-200', level: 'Moderate' },
            { range: '> 200', level: 'High' }
          ]
        },
        {
          name: 'Heavy Metal Evaluation Index (HEI)',
          description: 'Evaluation index for heavy metal toxicity assessment',
          categories: [
            { range: '< 10', level: 'Clean' },
            { range: '10-20', level: 'Moderate' },
            { range: '> 20', level: 'High' }
          ]
        },
        {
          name: 'Contamination Degree (CD)',
          description: 'Degree of contamination from multiple heavy metals',
          categories: [
            { range: '< 1', level: 'Low' },
            { range: '1-3', level: 'Medium' },
            { range: '> 3', level: 'High' }
          ]
        },
        {
          name: 'Nemerow Pollution Index (NPI)',
          description: 'Comprehensive pollution index considering maximum and average pollution',
          categories: [
            { range: '< 0.7', level: 'Clean' },
            { range: '0.7-1.0', level: 'Slight' },
            { range: '1.0-2.0', level: 'Moderate' },
            { range: '> 2.0', level: 'Severe' }
          ]
        }
      ];
      
      indices.forEach((index) => {
        // Add index name
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(index.name, 20, yPosition);
        yPosition += 10;
        
        // Add description
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(index.description, pageWidth - 40);
        descLines.forEach((line: string) => {
          pdf.text(line, 20, yPosition);
          yPosition += 5;
        });
        
        yPosition += 5;
        
        // Add categories title
        pdf.setFont('helvetica', 'bold');
        pdf.text('Categories:', 20, yPosition);
        yPosition += 8;
        
        // Add categories
        pdf.setFont('helvetica', 'normal');
        index.categories.forEach((category) => {
          const categoryText = `${category.range}: ${category.level}`;
          pdf.text(`• ${categoryText}`, 25, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
      });
      
      // Open the PDF in a new window
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(pdfUrl, '_blank');
      
      if (newWindow) {
        newWindow.onload = () => {
          URL.revokeObjectURL(pdfUrl);
        };
      } else {
        // Fallback: download the file
        pdf.save('pollution-indices-categories.pdf');
      }
      
      toast({
        title: "PDF Opened",
        description: "Pollution Indices PDF has been opened in a new tab.",
      });
    } catch (error) {
      toast({
        title: "Failed to Open PDF",
        description: "Could not generate the PDF file.",
        variant: "destructive",
      });
    }
  };

  const regeneratePDF = async (type: string) => {
    setIsLoading(true);
    
    try {
      if (type === 'WHO Standards') {
        generateWHOStandardsPDF();
      } else if (type === 'Pollution Indices') {
        generatePollutionIndicesPDF();
      }
      
      toast({
        title: "PDF Regenerated",
        description: `${type} PDF has been regenerated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Regeneration Failed",
        description: `Failed to regenerate ${type} PDF.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'alert':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950';
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

  const filteredNotifications = notifications.filter(notification => {
    const categoryMatch = selectedTab === 'all' || notification.category === selectedTab;
    const typeMatch = filter === 'all' || notification.type === filter;
    return categoryMatch && typeMatch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Bell className="h-6 w-6 sm:h-7 sm:w-7" />
                  Notifications
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs sm:text-sm"
              >
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Mark All Read</span>
                <span className="sm:hidden">All Read</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllNotifications}
                className="text-xs sm:text-sm"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Clear All</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full sm:w-auto">
              <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:grid-cols-4 h-9 sm:h-10">
                <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">All</TabsTrigger>
                <TabsTrigger value="water_quality" className="text-xs sm:text-sm px-2 sm:px-3">Water Quality</TabsTrigger>
                <TabsTrigger value="pdf_export" className="text-xs sm:text-sm px-2 sm:px-3">PDF Exports</TabsTrigger>
                <TabsTrigger value="data_analysis" className="text-xs sm:text-sm px-2 sm:px-3">Data Analysis</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="text-xs sm:text-sm border rounded px-2 py-1 bg-background"
              >
                <option value="all">All Types</option>
                <option value="alert">Alerts</option>
                <option value="warning">Warnings</option>
                <option value="success">Success</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3 sm:space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {selectedTab === 'all' && filter === 'all' 
                    ? 'You have no notifications at this time.'
                    : 'No notifications match the current filters.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`${getTypeColor(notification.type)} ${!notification.read ? 'border-l-4 border-l-current' : ''} transition-all hover:shadow-md`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm sm:text-base truncate">
                          {notification.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {notification.category.replace('_', ' ')}
                          </Badge>
                          {!notification.read && (
                            <Badge variant="default" className="text-xs bg-blue-500">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      {/* Metadata display */}
                      {notification.metadata && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {notification.metadata.location && (
                            <Badge variant="outline" className="text-xs">
                              Location: {notification.metadata.location}
                            </Badge>
                          )}
                          {notification.metadata.hpiValue && (
                            <Badge variant="outline" className="text-xs">
                              HPI: {notification.metadata.hpiValue}
                            </Badge>
                          )}
                          {notification.metadata.exportType && (
                            <Badge variant="outline" className="text-xs">
                              Type: {notification.metadata.exportType}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(notification.timestamp)}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs h-7 px-2"
                            >
                              Mark as read
                            </Button>
                          )}
                          
                          {notification.category === 'pdf_export' && notification.metadata?.pdfName && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openPDF(notification.metadata!.pdfName!)}
                                className="text-xs h-7 px-2"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Open PDF
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => regeneratePDF(notification.metadata!.exportType!)}
                                disabled={isLoading}
                                className="text-xs h-7 px-2"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Regenerate
                              </Button>
                            </>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteNotification(notification.id)}
                            className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {notifications.length > 0 && (
          <Card className="mt-6 sm:mt-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {notifications.filter(n => n.type === 'alert' || n.type === 'warning').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Alerts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {notifications.filter(n => n.category === 'pdf_export').length}
                  </div>
                  <div className="text-xs text-muted-foreground">PDF Exports</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{unreadCount}</div>
                  <div className="text-xs text-muted-foreground">Unread</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}