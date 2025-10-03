'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  Phone,
  Video,
  FileText,
  Download,
  ChevronRight,
  Star,
  Users,
  Zap,
  Shield,
  Globe,
  Droplets,
  BarChart3,
  MapPin,
  TrendingUp,
  Database,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    id: 'getting-started',
    category: 'Getting Started',
    question: 'How do I start analyzing water quality data?',
    answer: 'To start analyzing water quality data, navigate to the "Data Input" section and either upload a CSV file with your sample data or enter measurements manually. Once your data is loaded, the system will automatically calculate Heavy Metal Pollution Indices (HPI, HEI, CD, NPI) and display results in the dashboard.',
    icon: <Droplets className="h-5 w-5" />
  },
  {
    id: 'csv-format',
    category: 'Getting Started',
    question: 'What is the correct CSV format for data upload?',
    answer: 'Your CSV file should include the following columns: SampleID, Location, Latitude, Longitude, As (Arsenic), Cd (Cadmium), Cr (Chromium), Pb (Lead), Hg (Mercury), Ni (Nickel), Cu (Copper), Zn (Zinc). All concentration values should be in mg/L. Coordinates should be in decimal degrees format.',
    icon: <FileText className="h-5 w-5" />
  },
  {
    id: 'hpi-meaning',
    category: 'Understanding Results',
    question: 'What does HPI (Heavy Metal Pollution Index) indicate?',
    answer: 'HPI is a comprehensive index that evaluates overall heavy metal contamination in water. HPI < 100 indicates clean water, 100-200 suggests moderate contamination, and >200 indicates severe contamination. It considers multiple heavy metals and their relative toxicity weights.',
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    id: 'hei-cd-npi',
    category: 'Understanding Results',
    question: 'What are HEI, CD, and NPI indices?',
    answer: 'HEI (Heavy Metal Evaluation Index) assesses overall metal contamination levels. CD (Contamination Degree) evaluates the extent of contamination relative to background values. NPI (Nemerow Pollution Index) provides an integrated assessment of multiple pollutants. Each index uses different calculation methods to give you a comprehensive view of water quality.',
    icon: <TrendingUp className="h-5 w-5" />
  },
  {
    id: 'who-standards',
    category: 'Understanding Results',
    question: 'What WHO standards are used for comparison?',
    answer: 'The system uses WHO drinking water guidelines: As (0.01 mg/L), Cd (0.003 mg/L), Cr (0.05 mg/L), Pb (0.01 mg/L), Hg (0.001 mg/L), Ni (0.07 mg/L), Cu (2.0 mg/L), Zn (3.0 mg/L). These values are used to determine if water samples meet safe drinking water standards.',
    icon: <Shield className="h-5 w-5" />
  },
  {
    id: 'map-usage',
    category: 'Features',
    question: 'How do I use the interactive map feature?',
    answer: 'The interactive map displays your sample locations with color-coded pollution levels. You can zoom in/out, pan around the map, and click on markers to see detailed information about each sample. Use the filter options to show specific pollution categories or time periods.',
    icon: <MapPin className="h-5 w-5" />
  },
  {
    id: 'export-data',
    category: 'Features',
    question: 'How can I export my analysis results?',
    answer: 'Navigate to the "Export" section to download your results in multiple formats. You can export as PDF reports, Excel spreadsheets, or CSV files. The PDF includes comprehensive analysis with charts and recommendations, while Excel/CSV provide raw data for further analysis.',
    icon: <Download className="h-5 w-5" />
  },
  {
    id: 'data-visualization',
    category: 'Features',
    question: 'What types of charts and visualizations are available?',
    answer: 'The system offers various visualizations including pollution level distribution charts, metal concentration comparisons, temporal trend analysis, geographic heat maps, and correlation matrices. These help identify patterns and trends in your water quality data.',
    icon: <BarChart3 className="h-5 w-5" />
  },
  {
    id: 'sample-recommendations',
    category: 'Recommendations',
    question: 'What kind of recommendations does the system provide?',
    answer: 'Based on your analysis results, the system provides specific recommendations for water treatment methods, suggests appropriate filtration technologies, recommends monitoring frequencies, and offers health safety guidelines for contaminated water sources.',
    icon: <CheckCircle className="h-5 w-5" />
  },
  {
    id: 'troubleshooting-upload',
    category: 'Troubleshooting',
    question: 'Why is my CSV file not uploading correctly?',
    answer: 'Common issues include: incorrect column headers, missing required columns, invalid coordinate formats, non-numeric concentration values, or file encoding problems. Ensure your CSV follows the exact format specified in the template and all concentration values are positive numbers.',
    icon: <AlertTriangle className="h-5 w-5" />
  },
  {
    id: 'calculation-errors',
    category: 'Troubleshooting',
    question: 'Why are some pollution indices showing as N/A?',
    answer: 'Indices may show as N/A if: required concentration data is missing, values are below detection limits, or there are calculation errors due to invalid data. Check your input data for completeness and validity, then try reprocessing the samples.',
    icon: <Settings className="h-5 w-5" />
  },
  {
    id: 'mobile-usage',
    category: 'Troubleshooting',
    question: 'How well does the system work on mobile devices?',
    answer: 'The system is fully responsive and works on all devices. On mobile, use the hamburger menu to navigate between sections. Tables can be scrolled horizontally, and charts adapt to screen size. For best experience, use landscape orientation when viewing detailed charts.',
    icon: <Globe className="h-5 w-5" />
  }
];

const categories = ['All', 'Getting Started', 'Understanding Results', 'Features', 'Recommendations', 'Troubleshooting'];

const quickActions = [
  { 
    title: 'Video Tutorial', 
    description: 'Watch our comprehensive video guide',
    icon: <Video className="h-6 w-6" />,
    href: '#',
    color: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  { 
    title: 'Download Template', 
    description: 'Get the CSV template for data upload',
    icon: <Download className="h-6 w-6" />,
    href: '#',
    color: 'bg-green-50 text-green-600 border-green-200'
  },
  { 
    title: 'User Manual', 
    description: 'Detailed documentation for all features',
    icon: <BookOpen className="h-6 w-6" />,
    href: '#',
    color: 'bg-purple-50 text-purple-600 border-purple-200'
  },
  { 
    title: 'Contact Support', 
    description: 'Get help from our support team',
    icon: <MessageCircle className="h-6 w-6" />,
    href: '#',
    color: 'bg-orange-50 text-orange-600 border-orange-200'
  }
];

const contactOptions = [
  {
    icon: <Mail className="h-5 w-5" />,
    label: 'Email Support',
    value: 'support@waterquality.com',
    description: 'Get response within 24 hours'
  },
  {
    icon: <Phone className="h-5 w-5" />,
    label: 'Phone Support',
    value: '+1 (555) 123-4567',
    description: 'Mon-Fri, 9AM-6PM EST'
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    label: 'Live Chat',
    value: 'Available 24/7',
    description: 'Instant help with common issues'
  }
];

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleQuickAction = (action: typeof quickActions[0]) => {
    // Handle different quick actions
    switch (action.title) {
      case 'Download Template':
        // Create and download CSV template
        const csvContent = 'SampleID,Location,Latitude,Longitude,As,Cd,Cr,Pb,Hg,Ni,Cu,Zn\nSAMPLE001,New York,40.7128,-74.0060,0.005,0.001,0.02,0.005,0.0005,0.03,0.5,1.0';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'water_quality_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        break;
      case 'Contact Support':
        // Open email client or redirect to contact form
        window.location.href = 'mailto:support@waterquality.com';
        break;
      default:
        console.log(`Action clicked: ${action.title}`);
    }
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Back Navigation */}
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-xs sm:text-sm">
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 rotate-180" />
              <span className="hidden xs:inline">Back to Dashboard</span>
              <span className="xs:hidden">Back</span>
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 bg-primary/10 rounded-full">
              <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">Help Center</h1>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2 sm:px-4">
            Find answers to common questions, learn about features, and get support for your water quality analysis needs.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer hover:shadow-md transition-all duration-200 border-2 ${action.color} hover:scale-105`}
              onClick={() => handleQuickAction(action)}
            >
              <CardContent className="p-3 sm:p-4 lg:p-6 text-center">
                <div className="flex justify-center mb-2 sm:mb-3">
                  <div className="scale-75 sm:scale-90 lg:scale-100">
                    {action.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-xs sm:text-sm lg:text-base mb-1 sm:mb-2 leading-tight">{action.title}</h3>
                <p className="text-xs opacity-80 hidden lg:block">{action.description}</p>
                <p className="text-xs opacity-80 hidden sm:block lg:hidden">
                  {action.description.length > 30 ? action.description.substring(0, 30) + '...' : action.description}
                </p>
                <p className="text-xs opacity-80 sm:hidden">
                  {action.title.split(' ')[0]}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Search help topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 text-sm sm:text-base h-9 sm:h-10"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
                  >
                    <span className="truncate max-w-20 sm:max-w-none">{category}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 lg:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Frequently Asked Questions</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm lg:text-base">
              Find quick answers to common questions about water quality analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-3 sm:px-4 lg:px-6">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <HelpCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">No results found for your search.</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                  Try different keywords or browse all categories.
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                {filteredFAQs.map((faq) => (
                  <Card key={faq.id} className="border-l-4 border-l-primary/20">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                          <div className="scale-75 sm:scale-100">
                            {faq.icon}
                          </div>
                        </div>
                        <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="font-semibold text-xs sm:text-sm lg:text-base leading-tight pr-2">{faq.question}</h3>
                            <Badge variant="secondary" className="text-xs w-fit shrink-0">
                              {faq.category}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 lg:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
              Still Need Help?
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm lg:text-base">
              Our support team is here to assist you with any questions or issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 px-3 sm:px-4 lg:px-6">
            <div className="grid gap-2 sm:gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-3">
              {contactOptions.map((option, index) => (
                <Card key={index} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                        <div className="scale-75 sm:scale-100">
                          {option.icon}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-xs sm:text-sm">{option.label}</h4>
                        <p className="text-xs sm:text-sm font-medium truncate">{option.value}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight">{option.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 lg:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
              <Star className="h-4 w-4 sm:h-5 sm:w-5" />
              Additional Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-3 sm:px-4 lg:px-6">
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">Learning Resources</h4>
                <div className="space-y-1.5 sm:space-y-2">
                  <Link href="#" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-primary hover:underline">
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Water Quality Testing Guidelines</span>
                  </Link>
                  <Link href="#" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-primary hover:underline">
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Understanding Heavy Metal Contamination</span>
                  </Link>
                  <Link href="#" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-primary hover:underline">
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">WHO Standards Documentation</span>
                  </Link>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h4 className="font-semibold text-sm sm:text-base">Technical Resources</h4>
                <div className="space-y-1.5 sm:space-y-2">
                  <Link href="#" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-primary hover:underline">
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">API Documentation</span>
                  </Link>
                  <Link href="#" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-primary hover:underline">
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Integration Guide</span>
                  </Link>
                  <Link href="#" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-primary hover:underline">
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">Best Practices Guide</span>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}