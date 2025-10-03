'use client';

import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  FileText,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Download
} from 'lucide-react';
import { useState } from 'react';

interface ActionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  metal: string;
  recommendation: string;
}

export function ActionPlanModal({ isOpen, onClose, metal, recommendation }: ActionPlanModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const actionPlans: { [key: string]: any } = {
    'Arsenic': {
      timeline: '3-6 months',
      budget: '$5,000 - $15,000',
      stakeholders: ['Community Leaders', 'Local Health Department', 'Water Treatment Specialists'],
      steps: [
        {
          title: '1. Immediate Action',
          description: 'Provide alternative drinking water sources',
          timeframe: '1-2 weeks',
          priority: 'High'
        },
        {
          title: '2. Professional Assessment',
          description: 'Conduct comprehensive water quality testing',
          timeframe: '2-4 weeks',
          priority: 'High'
        },
        {
          title: '3. Treatment System Installation',
          description: 'Install community-level arsenic removal filters',
          timeframe: '1-3 months',
          priority: 'High'
        },
        {
          title: '4. Monitoring & Maintenance',
          description: 'Regular testing and filter maintenance schedule',
          timeframe: 'Ongoing',
          priority: 'Medium'
        }
      ],
      resources: [
        { name: 'EPA Arsenic Treatment Guidelines', type: 'Document' },
        { name: 'Local Water Treatment Companies', type: 'Service' },
        { name: 'Community Grant Programs', type: 'Funding' }
      ],
      contacts: [
        { name: 'Local Health Department', phone: '555-0100', email: 'health@local.gov' },
        { name: 'Environmental Protection Agency', phone: '555-0200', email: 'epa@contact.gov' }
      ]
    },
    'Lead': {
      timeline: '2-4 months',
      budget: '$3,000 - $10,000',
      stakeholders: ['School Administrators', 'Parents Association', 'City Planners'],
      steps: [
        {
          title: '1. Water Testing',
          description: 'Test all drinking water sources for lead contamination',
          timeframe: '1-2 weeks',
          priority: 'High'
        },
        {
          title: '2. Filter Installation',
          description: 'Install certified lead removal filters',
          timeframe: '2-4 weeks',
          priority: 'High'
        },
        {
          title: '3. Pipe Inspection',
          description: 'Inspect and replace old lead pipes',
          timeframe: '1-3 months',
          priority: 'High'
        },
        {
          title: '4. Public Awareness',
          description: 'Educate community about lead risks and prevention',
          timeframe: '2-4 weeks',
          priority: 'Medium'
        }
      ],
      resources: [
        { name: 'CDC Lead Prevention Guide', type: 'Document' },
        { name: 'Certified Filter Providers', type: 'Service' },
        { name: 'Safe Drinking Water Act', type: 'Regulation' }
      ],
      contacts: [
        { name: 'Childhood Lead Prevention Program', phone: '555-0300', email: 'lead@health.gov' },
        { name: 'Water Quality Association', phone: '555-0400', email: 'info@wqa.org' }
      ]
    }
  };

  const downloadPDF = async () => {
    setIsDownloading(true);
    
    try {
      // Create a new PDF document
      const pdf = new jsPDF();
      const plan = actionPlans[metal] || actionPlans['Arsenic'];
      
      // Set font sizes and colors
      const titleFontSize = 18;
      const headingFontSize = 14;
      const normalFontSize = 11;
      const smallFontSize = 10;
      
      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 6;
      
      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };
      
      // Title
      pdf.setFontSize(titleFontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`ACTION PLAN: ${metal.toUpperCase()} CONTAMINATION`, margin, yPosition);
      yPosition += lineHeight * 2;
      
      // Subtitle
      pdf.setFontSize(normalFontSize);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Recommended Solution: ${recommendation}`, margin, yPosition);
      yPosition += lineHeight * 2;
      
      // Overview Section
      checkPageBreak(lineHeight * 4);
      pdf.setFontSize(headingFontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OVERVIEW', margin, yPosition);
      yPosition += lineHeight;
      
      pdf.setFontSize(normalFontSize);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Timeline: ${plan.timeline}`, margin + 5, yPosition);
      yPosition += lineHeight;
      pdf.text(`Budget: ${plan.budget}`, margin + 5, yPosition);
      yPosition += lineHeight;
      pdf.text(`Key Stakeholders: ${plan.stakeholders.join(', ')}`, margin + 5, yPosition);
      yPosition += lineHeight * 2;
      
      // Implementation Steps Section
      pdf.setFontSize(headingFontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.text('IMPLEMENTATION STEPS', margin, yPosition);
      yPosition += lineHeight;
      
      plan.steps.forEach((step: any, index: number) => {
        checkPageBreak(lineHeight * 4);
        
        pdf.setFontSize(normalFontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${step.title}`, margin + 5, yPosition);
        yPosition += lineHeight;
        
        pdf.setFont('helvetica', 'normal');
        const description = `Description: ${step.description}`;
        const descriptionLines = pdf.splitTextToSize(description, pdf.internal.pageSize.width - margin * 2 - 10);
        descriptionLines.forEach((line: string) => {
          pdf.text(line, margin + 10, yPosition);
          yPosition += lineHeight;
        });
        
        pdf.text(`Timeframe: ${step.timeframe}`, margin + 10, yPosition);
        yPosition += lineHeight;
        pdf.text(`Priority: ${step.priority}`, margin + 10, yPosition);
        yPosition += lineHeight * 1.5;
      });
      
      // Resources Section
      checkPageBreak(lineHeight * 4);
      pdf.setFontSize(headingFontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RESOURCES & REFERENCES', margin, yPosition);
      yPosition += lineHeight;
      
      plan.resources.forEach((resource: any, index: number) => {
        checkPageBreak(lineHeight * 2);
        pdf.setFontSize(normalFontSize);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${index + 1}. ${resource.name} (${resource.type})`, margin + 5, yPosition);
        yPosition += lineHeight;
      });
      
      // Contacts Section
      checkPageBreak(lineHeight * 4);
      pdf.setFontSize(headingFontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.text('KEY CONTACTS', margin, yPosition);
      yPosition += lineHeight;
      
      plan.contacts.forEach((contact: any, index: number) => {
        checkPageBreak(lineHeight * 3);
        pdf.setFontSize(normalFontSize);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${index + 1}. ${contact.name}`, margin + 5, yPosition);
        yPosition += lineHeight;
        pdf.setFontSize(smallFontSize);
        pdf.text(`   Phone: ${contact.phone}`, margin + 5, yPosition);
        yPosition += lineHeight;
        pdf.text(`   Email: ${contact.email}`, margin + 5, yPosition);
        yPosition += lineHeight * 1.5;
      });
      
      // Disclaimer Section
      checkPageBreak(lineHeight * 6);
      pdf.setFontSize(headingFontSize);
      pdf.setFont('helvetica', 'bold');
      pdf.text('IMPORTANT DISCLAIMER', margin, yPosition);
      yPosition += lineHeight;
      
      pdf.setFontSize(smallFontSize);
      pdf.setFont('helvetica', 'normal');
      const disclaimer = `This action plan provides general guidance. Always consult with local environmental authorities and certified water treatment professionals before implementing any remediation solutions. Site-specific conditions may require specialized approaches.`;
      const disclaimerLines = pdf.splitTextToSize(disclaimer, pdf.internal.pageSize.width - margin * 2);
      disclaimerLines.forEach((line: string) => {
        pdf.text(line, margin + 5, yPosition);
        yPosition += lineHeight;
      });
      
      // Generation date
      yPosition += lineHeight;
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin + 5, yPosition);
      
      // Save the PDF
      pdf.save(`action-plan-${metal.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Error downloading action plan:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const plan = actionPlans[metal] || actionPlans['Arsenic']; // Fallback to arsenic plan

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Action Plan: {metal} Contamination
          </DialogTitle>
          <DialogDescription>
            Comprehensive remediation plan for {recommendation}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 pr-4">
              {/* Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Timeline</span>
                  </div>
                  <p className="text-sm text-blue-700">{plan.timeline}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Budget</span>
                  </div>
                  <p className="text-sm text-green-700">{plan.budget}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-purple-800">Stakeholders</span>
                  </div>
                  <div className="text-sm text-purple-700">
                    {plan.stakeholders.length} key partners
                  </div>
                </div>
              </div>

              {/* Implementation Steps */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Implementation Steps</h3>
                <div className="space-y-3">
                  {plan.steps.map((step: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{step.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {step.timeframe}
                            </span>
                            <Badge className={getPriorityColor(step.priority)}>
                              {step.priority} Priority
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resources */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Resources & References</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.resources.map((resource: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{resource.name}</p>
                        <p className="text-xs text-muted-foreground">{resource.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contacts */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Key Contacts</h3>
                <div className="space-y-3">
                  {plan.contacts.map((contact: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{contact.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <strong>Important:</strong> This action plan provides general guidance. 
                    Always consult with local environmental authorities and certified water treatment 
                    professionals before implementing any remediation solutions. Site-specific conditions 
                    may require specialized approaches.
                  </div>
                </div>
              </div>

              {/* Action Buttons - Part of scrollable content */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                  Close
                </Button>
                <Button 
                  onClick={downloadPDF}
                  disabled={isDownloading}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download Action Plan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}