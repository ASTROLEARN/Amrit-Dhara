'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import ReactMarkdown from 'react-markdown';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Droplets, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  X,
  Maximize2,
  Minimize2,
  MapPin,
  TrendingUp,
  Leaf,
  Waves,
  Trash2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'data' | 'suggestion';
  data?: any;
}

interface DataCard {
  title: string;
  value: string | number;
  unit?: string;
  status: 'clean' | 'moderate' | 'high';
  icon?: React.ReactNode;
}

interface ChatBotProps {
  samples?: any[];
  isOpen?: boolean;
  onToggle?: () => void;
}

export function EnhancedAIChatBot({ samples = [], isOpen = false, onToggle }: ChatBotProps) {
  // Generate unique device session ID
  const getDeviceSessionId = () => {
    if (typeof window === 'undefined') return 'default';
    
    let sessionId = sessionStorage.getItem('chatbot_device_session');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('chatbot_device_session', sessionId);
      console.log('🆔 New device session created:', sessionId);
    } else {
      console.log('🔄 Existing device session loaded:', sessionId);
    }
    return sessionId;
  };

  const deviceSessionId = getDeviceSessionId();
  const storageKey = `chatbot_messages_${deviceSessionId}`;
  
  // Load messages from device-specific storage
  const loadMessages = (): Message[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        console.log('📂 Loading messages from storage:', storageKey);
        const parsed = JSON.parse(stored);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } else {
        console.log('📝 No stored messages found, using default');
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
    
    // Return enhanced welcome message
    return [{
      id: '1',
      role: 'assistant',
      content: `👋 Hello! I'm Amrit Dhara, your Water Quality AI Assistant. I can help you with:`,
      type: 'text',
      timestamp: new Date()
    }];
  };

  const [messages, setMessages] = useState<Message[]>(loadMessages());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

  // Save messages to device-specific storage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
        console.log('💾 Messages saved to storage:', storageKey, `(${messages.length} messages)`);
      } catch (error) {
        console.error('❌ Error saving messages:', error);
      }
    }
  }, [messages, storageKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Get pollution level color
  const getPollutionColor = (level: string) => {
    switch (level) {
      case 'clean': return '#0D9488'; // Mint Teal
      case 'moderate': return '#F59E0B'; // Amber
      case 'high': return '#DC2626'; // Crimson
      default: return '#6B7280'; // Gray
    }
  };

  // Create data cards for pollution levels
  const createDataCard = (title: string, value: number, status: 'clean' | 'moderate' | 'high', unit = ''): DataCard => ({
    title,
    value,
    unit,
    status,
    icon: <Droplets className="h-4 w-4" style={{ color: getPollutionColor(status) }} />
  });

  // Parse markdown content for bold text and emoji support
  const parseMessageContent = (content: string) => {
    // Convert markdown bold (**text**) to HTML <strong>
    let parsedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert markdown italics (*text*) to HTML <em>
    parsedContent = parsedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert markdown headers to bold
    parsedContent = parsedContent.replace(/^### (.*$)/gim, '<strong>$1</strong>');
    parsedContent = parsedContent.replace(/^## (.*$)/gim, '<strong>$1</strong>');
    parsedContent = parsedContent.replace(/^# (.*$)/gim, '<strong>$1</strong>');
    
    // Convert bullet points to better formatting
    parsedContent = parsedContent.replace(/^• (.*$)/gim, '• $1');
    parsedContent = parsedContent.replace(/^- (.*$)/gim, '• $1');
    
    return parsedContent;
  };

  // Enhanced contextual info with data cards
  const getContextualInfo = () => {
    if (samples.length === 0) return '';
    
    const contaminatedSamples = samples.filter(sample => 
      sample.hpiCategory === 'High' || sample.heiCategory === 'High' || sample.npiCategory === 'Severe'
    );

    if (contaminatedSamples.length === 0) {
      return 'The user has analyzed water samples and all results show safe contamination levels.';
    }

    const metalIssues: string[] = [];
    const whoStandards: { [key: string]: number } = {
      arsenic: 0.01,
      cadmium: 0.003,
      chromium: 0.05,
      lead: 0.01,
      mercury: 0.001,
      nickel: 0.07,
      copper: 2.0,
      zinc: 3.0
    };

    contaminatedSamples.forEach(sample => {
      Object.entries(whoStandards).forEach(([metal, standard]) => {
        const concentration = sample[metal as keyof typeof sample] as number;
        if (concentration > standard) {
          const ratio = (concentration / standard).toFixed(1);
          metalIssues.push(`${metal.charAt(0).toUpperCase() + metal.slice(1)}: ${concentration} mg/L (${ratio}x WHO standard)`);
        }
      });
    });

    return `The user has ${contaminatedSamples.length} contaminated water sample(s) with the following issues: ${metalIssues.join(', ')}. HPI/HEI/NPI indices show high contamination levels.`;
  };

  const getFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // API key setup response
    if (lowerMessage.includes('api') || lowerMessage.includes('key') || lowerMessage.includes('setup')) {
      return `🔧 **Setting up AI Assistant**

To enable full AI functionality, you'll need a Gemini API key:

**Steps:**
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Add it to your \`.env.local\` file:
   \`\`\`
   NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   \`\`\`
6. Restart your development server

The API key is free for personal use and provides generous limits!`;
    }

    // Health risks
    if (lowerMessage.includes('health') || lowerMessage.includes('risk') || lowerMessage.includes('danger')) {
      return `⚠️ **Health Risks of Heavy Metals**

**Lead (Pb):**
• Developmental issues in children
• Kidney damage and cardiovascular problems
• WHO limit: 0.01 mg/L

**Arsenic (As):**
• Cancer risk (skin, bladder, lung)
• Skin lesions and developmental effects
• WHO limit: 0.01 mg/L

**Mercury (Hg):**
• Neurological damage and developmental issues
• Kidney damage and immune system effects
• WHO limit: 0.001 mg/L

**Cadmium (Cd):**
• Kidney damage and bone fragility
• Cancer risk
• WHO limit: 0.003 mg/L

Always consult healthcare professionals for health concerns!`;
    }

    // Treatment methods
    if (lowerMessage.includes('treatment') || lowerMessage.includes('filter') || lowerMessage.includes('remove')) {
      return `🔧 **Water Treatment Methods**

**Reverse Osmosis (RO):**
• Effectiveness: 95-99% for most heavy metals
• Cost: Medium-High
• Best for: Point-of-use treatment

**Activated Carbon:**
• Effectiveness: 60-90% for organic mercury, lead
• Cost: Low-Medium
• Best for: General filtration

**Ion Exchange:**
• Effectiveness: 90-99% for specific metals
• Cost: Medium
• Best for: Cadmium, nickel, copper

**Distillation:**
• Effectiveness: 99%+ for all contaminants
• Cost: Low (energy intensive)
• Best for: Emergency treatment

Choose based on your specific contaminants and budget!`;
    }

    // WHO standards
    if (lowerMessage.includes('who') || lowerMessage.includes('standard') || lowerMessage.includes('limit')) {
      return `📊 **WHO Drinking Water Standards**

**Heavy Metal Limits (mg/L):**
• Arsenic (As): 0.01
• Lead (Pb): 0.01
• Mercury (Hg): 0.001
• Cadmium (Cd): 0.003
• Chromium (Cr): 0.05
• Nickel (Ni): 0.07
• Copper (Cu): 2.0
• Zinc (Zn): 3.0

**Contamination Indices:**
• HPI < 100: Clean
• HEI < 10: Low contamination
• NPI < 2: No pollution

These standards are based on lifetime consumption assumptions!`;
    }

    // Testing
    if (lowerMessage.includes('test') || lowerMessage.includes('sample') || lowerMessage.includes('measure')) {
      return `🧪 **Water Testing Guidelines**

**When to Test:**
• Annually for private wells
• After heavy rainfall or flooding
• When taste/odor changes
• Near industrial areas

**Testing Methods:**
• Laboratory analysis (most accurate)
• Test kits (screening only)
• Portable meters (real-time monitoring)

**What to Test For:**
• Heavy metals (Pb, As, Hg, Cd, Cr)
• pH and turbidity
• Bacterial contamination
• Nitrates and other chemicals

Always use certified laboratories for regulatory compliance!`;
    }

    // Default response
    return `💧 **Water Quality Assistant**

I can help you with information about:

🔬 **Water Analysis**
• Interpreting test results
• Understanding contamination levels
• Comparing to WHO standards

🛡️ **Health & Safety**
• Health risks of contaminants
• Safety guidelines
• When to seek professional help

🔧 **Treatment Solutions**
• Filtration technologies
• Cost-effective options
• Implementation guidance

📊 **General Guidance**
• Testing recommendations
• Monitoring strategies
• Regulatory standards

**To enable AI responses:** Get a free Gemini API key from https://makersuite.google.com/app/apikey and add it to your environment variables.

What specific water quality topic would you like to know more about?`;
  };

  const generateResponse = async (userMessage: string) => {
    try {
      // Check if API key is configured
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY === 'your_gemini_api_key_here') {
        return getFallbackResponse(userMessage);
      }

      const systemPrompt = `You are a water quality expert AI assistant specializing in heavy metal contamination analysis. Your role is to:

1. Provide accurate, science-based information about water quality
2. Reference WHO standards and health guidelines
3. Explain complex concepts in simple, accessible language
4. Recommend practical solutions and safety measures
5. Emphasize when professional help is needed

Current context: ${getContextualInfo()}

Guidelines:
- Always prioritize health and safety
- Provide specific, actionable advice
- Mention WHO standards when relevant
- Recommend professional consultation for serious contamination
- Be supportive and informative
- Keep responses concise but comprehensive

User message: ${userMessage}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: systemPrompt,
      });

      return response.text || 'I apologize, but I encountered an error processing your request.';
    } catch (error) {
      console.error('Error generating AI response:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again or contact a water quality professional for immediate assistance.';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const messageText = input.trim();
    setInput(''); // Clear input immediately
    setShowSuggestions(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const aiResponse = await generateResponse(messageText);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact a water quality professional for immediate assistance.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSend();
    }
  };

  // Handle quick question clicks
  const handleQuickQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  // Clear chat history for current device only
  const clearChatHistory = () => {
    console.log('🗑️ Clearing chat history for device:', deviceSessionId);
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `👋 Hello! I'm Amrit Dhara, your Water Quality AI Assistant. I can help you with:`,
      type: 'text',
      timestamp: new Date()
    }]);
    setShowSuggestions(true);
    setShowClearDialog(false); // Close the dialog after clearing
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
      console.log('✅ Chat history cleared from storage:', storageKey);
    }
  };

  const quickQuestions = [
    "What are the health risks of lead in water?",
    "How effective is reverse osmosis for arsenic removal?",
    "When should I test my water again?",
    "What are WHO standards for drinking water?"
  ];

  // Export conversation functionality
  const exportConversation = () => {
    const conversationText = messages.map(msg => {
      const timestamp = msg.timestamp.toLocaleString();
      const role = msg.role === 'user' ? 'You' : 'Amrit Dhara';
      return `[${timestamp}] ${role}:\n${msg.content}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquachat-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Add success message
    const exportMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '✅ Conversation exported successfully! The file has been downloaded to your device.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, exportMessage]);
  };

  const smartSuggestions = [
    { text: "Analyze this sample", icon: <TrendingUp className="h-3 w-3" /> },
    { text: "Explain HPI calculation", icon: <Shield className="h-3 w-3" /> },
    { text: "Export this conversation", icon: <Leaf className="h-3 w-3" />, action: 'export' }
  ];

  if (!isOpen) {
    return null; // Don't show any button when closed - let FloatingEnhancedChatBot handle it
  }

  return (
    <>
      {/* Enhanced Chat Window - Bottom Right with Mobile Responsiveness */}
      <Card className={`fixed bottom-0 right-0 z-50 shadow-2xl transition-all duration-300 ${
        isMaximized ? 'top-0 left-0 right-0 bottom-0 w-full h-full' : 'h-[85vh] w-80 sm:w-96'
      }`}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
        {/* Enhanced Header - Mobile Responsive */}
        <CardHeader className="p-3 sm:p-4 border-b border-border" style={{ background: 'var(--muted)' }}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              <span className="hidden xs:inline">Amrit Dhara - Water Quality Assistant</span>
              <span className="xs:hidden">💧 Amrit Dhara</span>
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs bg-green-500/20 text-green-400 border-green-500/30">
                Online
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2">
              <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:bg-accent p-1 h-6 w-6 transition-all duration-200"
                  title="Clear chat history"
                  type="button"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all messages in your current conversation. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearChatHistory} className="bg-red-600 hover:bg-red-700">
                    Clear Chat
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
              <Button
                  variant="ghost"
                  size="sm"
                  className="text-foreground hover:bg-accent p-1 h-6 w-6 transition-all duration-200"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMaximized(!isMaximized);
                  }}
                  title={isMaximized ? "Restore Size" : "Maximize"}
                  type="button"
                >
                  {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground hover:bg-accent p-1 h-6 w-6 transition-all duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle?.();
                }}
                title="Close"
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <>

            {/* Messages Area - Mobile Responsive */}
            <CardContent className={`flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 ${isMaximized ? 'max-h-[calc(100vh-180px)]' : 'max-h-[60vh]'}`} style={{ 
              minHeight: isMaximized ? 'calc(100vh-180px)' : '350px',
              background: 'rgba(255, 255, 255, 0.02)',
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.01) 35px, rgba(255,255,255,.01) 70px)'
            }}>
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                  style={{
                    animation: `slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s both`
                  }}
                >
                  <div className={`flex items-start gap-2 ${isMaximized ? 'max-w-[70%]' : 'max-w-[85%] sm:max-w-[80%]'} ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar - Mobile Responsive */}
                    <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white/10 text-blue-400 border border-blue-400/30'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <Droplets className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </div>
                    
                    {/* Message Bubble - Enhanced with Bold Text and Emoji Support */}
                    <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-sm shadow-lg'
                        : 'bg-white text-gray-800 rounded-bl-sm shadow-md border border-gray-200'
                    }`}
                    style={{
                      padding: '12px 14px',
                      fontSize: '14px sm:15px',
                      fontFamily: 'Inter, sans-serif',
                      lineHeight: 1.5
                    }}>
                      <div 
                        className="whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{ 
                          __html: parseMessageContent(message.content) 
                        }}
                        style={{
                          // Enhanced styling for bold text and emojis
                          '& strong': {
                            fontWeight: 700,
                            color: message.role === 'user' ? '#ffffff' : '#1f2937'
                          },
                          '& em': {
                            fontStyle: 'italic',
                            color: message.role === 'user' ? '#e0e7ff' : '#4b5563'
                          }
                        }}
                      />
                      <div className={`text-xs mt-2 opacity-70 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading Indicator - Mobile Responsive */}
              {isLoading && (
                <div className="flex justify-start animate-slide-up">
                  <div className="flex items-start gap-2 max-w-[85%] sm:max-w-[80%]">
                    <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 text-blue-400 border border-blue-400/30 flex items-center justify-center">
                      <Droplets className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-md border border-gray-200 px-3 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        <span className="ml-2 text-xs sm:text-sm text-gray-600">🤔 Analyzing...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Suggestions - Mobile Responsive */}
              {showSuggestions && messages.length === 1 && (
                <div className="space-y-3 animate-slide-up">
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                    <Waves className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">💡 Suggested Questions:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {quickQuestions.map((question, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="justify-start h-auto p-2 sm:p-3 text-left bg-muted hover:bg-accent text-foreground border border-border transition-all duration-200 hover:translate-x-1"
                        onClick={() => handleQuickQuestion(question)}
                        style={{
                          fontSize: '13px sm:14px',
                          fontFamily: 'Inter, sans-serif',
                          animationDelay: `${(index + 1) * 0.1}s`
                        }}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Smart Suggestions */}
            {messages.length > 1 && !showSuggestions && (
              <div className="px-4 py-2 border-t border-white/10">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {smartSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 rounded-full text-xs whitespace-nowrap transition-all duration-200 hover:scale-105"
                      onClick={() => {
                        if (suggestion.action === 'export') {
                          exportConversation();
                        } else {
                          handleQuickQuestion(suggestion.text);
                        }
                      }}
                    >
                      {suggestion.icon}
                      {suggestion.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Input Area */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about water quality..."
                  className="flex-1 bg-background border-border text-foreground placeholder-muted-foreground focus:bg-accent focus:border-primary focus:ring-primary/20 transition-all duration-200"
                  style={{
                    fontSize: '15px',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="sm"
                >
                  <Send className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
                </Button>
              </div>
            </div>
        </>
      </Card>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
    </>
  );
}