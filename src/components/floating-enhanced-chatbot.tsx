'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { EnhancedAIChatBot } from './enhanced-ai-chatbot';

export function FloatingEnhancedChatBot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button - Always Visible */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full w-14 h-14 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
          aria-label="Open AI Assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Enhanced Chat Bot */}
      <EnhancedAIChatBot 
        isOpen={isOpen} 
        onToggle={() => setIsOpen(!isOpen)} 
      />
    </>
  );
}