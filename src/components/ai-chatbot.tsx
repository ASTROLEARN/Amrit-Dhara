'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Minimize2,
  Maximize2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBotProps {
  samples?: any[];
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AIChatBot({ samples = [], isOpen = false, onToggle }: ChatBotProps) {
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
    
    // Return default welcome message
    return [{
      id: '1',
      role: 'assistant',
      content: `👋 Hello! I'm your Water Quality AI Assistant. I can help you with:

💧 **Water Quality Analysis**
- Interpret your test results and contamination levels
- Explain health implications of detected metals
- Compare results against WHO standards

🔬 **Technical Guidance**
- Recommend treatment solutions for specific contaminants
- Explain filtration technologies and their effectiveness
- Provide implementation guidance and cost estimates

📊 **Data Insights**
- Analyze trends in your water quality data
- Identify potential contamination sources
- Suggest monitoring strategies

🛡️ **Health & Safety**
- Explain health risks of heavy metals
- Provide safety precautions and guidelines
- Recommend when to seek professional help

Feel free to ask me anything about your water quality results or share specific concerns!`,
      timestamp: new Date()
    }];
  };

  const [messages, setMessages] = useState<Message[]>(loadMessages());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  // Clear chat history for current device only
  const clearChatHistory = () => {
    console.log('🗑️ Clearing chat history for device:', deviceSessionId);
    setMessages([{
      id: '1',
      role: 'assistant',
      content: `👋 Hello! I'm your Water Quality AI Assistant. I can help you with:

💧 **Water Quality Analysis**
- Interpret your test results and contamination levels
- Explain health implications of detected metals
- Compare results against WHO standards

🔬 **Technical Guidance**
- Recommend treatment solutions for specific contaminants
- Explain filtration technologies and their effectiveness
- Provide implementation guidance and cost estimates

📊 **Data Insights**
- Analyze trends in your water quality data
- Identify potential contamination sources
- Suggest monitoring strategies

🛡️ **Health & Safety**
- Explain health risks of heavy metals
- Provide safety precautions and guidelines
- Recommend when to seek professional help

Feel free to ask me anything about your water quality results or share specific concerns!`,
      timestamp: new Date()
    }]);
    
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

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg sm:hidden"
        size="lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <>
      {/* Chat Window */}
      <Card className={`fixed bottom-0 right-0 left-0 z-50 shadow-2xl border-blue-200 transition-all duration-300 sm:relative sm:bottom-auto sm:right-auto sm:left-auto sm:z-auto sm:shadow-none sm:border-transparent ${
        isMinimized ? 'h-auto' : 'h-[85vh]'
      } ${
        isMinimized ? 'w-full' : 'w-full'
      } sm:w-96 sm:max-h-[80vh] sm:h-auto`}>
        {/* Header */}
        <CardHeader className="bg-blue-600 text-white p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Water Quality AI Assistant</span>
              <span className="sm:hidden">AI Assistant</span>
            </CardTitle>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-700 p-1 h-5 w-5 sm:h-6 sm:w-6"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearChatHistory();
                }}
                title="Clear chat history"
                type="button"
              >
                <AlertTriangle className="h-2 w-2 sm:h-3 sm:w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-700 p-1 h-5 w-5 sm:h-6 sm:w-6"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                type="button"
              >
                {isMinimized ? <Maximize2 className="h-2 w-2 sm:h-3 sm:w-3" /> : <Minimize2 className="h-2 w-2 sm:h-3 sm:w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-700 p-1 h-5 w-5 sm:h-6 sm:w-6"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle();
                }}
                type="button"
              >
                <X className="h-2 w-2 sm:h-3 sm:w-3" />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
              <CheckCircle className="h-2 w-2 mr-1" />
              <span className="hidden xs:inline">Online</span>
              <span className="xs:hidden">●</span>
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              <Droplets className="h-2 w-2 mr-1" />
              <span className="hidden sm:inline">Water Expert</span>
              <span className="sm:hidden">Expert</span>
            </Badge>
            <Badge variant="outline" className="text-xs opacity-60" title={`Device Session: ${deviceSessionId}`}>
              <Shield className="h-2 w-2 mr-1" />
              <span className="hidden md:inline">Session Active</span>
              <span className="md:hidden">🔒</span>
            </Badge>
          </div>
        </CardHeader>

        {/* Content */}
        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[85vh] sm:h-[60vh] sm:max-h-[60vh]">
            <div className="flex-1 overflow-y-auto p-3 sm:p-4" style={{ maxHeight: 'calc(100% - 140px)' }}>
              <div className="space-y-3 sm:space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 sm:gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 sm:gap-3 justify-start">
                    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t bg-white flex-shrink-0">
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                {quickQuestions.slice(0, isMinimized ? 1 : 2).map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 sm:h-7 px-2 sm:px-3 whitespace-normal text-left leading-tight"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setInput(question);
                    }}
                    type="button"
                  >
                    <span className="hidden sm:inline">
                      {question.length > 25 ? question.substring(0, 25) + '...' : question}
                    </span>
                    <span className="sm:hidden">
                      {question.length > 15 ? question.substring(0, 15) + '...' : question}
                    </span>
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about water quality..."
                  className="flex-1 text-xs sm:text-sm"
                  disabled={isLoading}
                  autoComplete="off"
                  type="text"
                />
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSend();
                  }}
                  disabled={!input.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 px-2 sm:px-3"
                  type="button"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </>
  );
}