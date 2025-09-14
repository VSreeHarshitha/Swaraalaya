import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizonal, Mic, StopCircle } from 'lucide-react';
import { ChatCategory } from '../../types';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  onToggleRecording: () => void;
  isRecording: boolean;
  category: ChatCategory | null;
  isSpeaking: boolean;
  onStopSpeaking: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  isLoading, 
  onToggleRecording, 
  isRecording, 
  category,
  isSpeaking,
  onStopSpeaking
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const showVoiceButton = category === ChatCategory.VOCALS;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };
  
  const getTextAreaPadding = () => {
    let pr = 16; // for send button
    if (showVoiceButton) pr += 12; // base for mic
    if (isSpeaking) pr += 12; // for stop button
    return `pr-${pr}`; // Tailwind needs pr-28, pr-40 etc.
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700">
      <div className="relative max-w-4xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about vocals or instruments..."
          rows={1}
          className={`w-full bg-gray-800 border border-gray-600 rounded-2xl py-3 pl-4 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 shadow-inner ${showVoiceButton ? (isSpeaking ? 'pr-40' : 'pr-28') : 'pr-16'}`}
          disabled={isLoading}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          {showVoiceButton && (
            <AnimatePresence>
               {isSpeaking && (
                <motion.button
                  key="stop-speaking"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  type="button"
                  onClick={onStopSpeaking}
                  className="p-2.5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
                  aria-label="Stop speaking"
                >
                  <StopCircle size={20} />
                </motion.button>
              )}
            </AnimatePresence>
          )}
          {showVoiceButton && (
             <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={onToggleRecording}
              disabled={isLoading || isSpeaking}
              className={`p-2.5 rounded-full text-white disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                isRecording
                  ? 'bg-red-600 animate-pulse ring-red-500'
                  : 'bg-indigo-600 hover:bg-indigo-700 ring-indigo-500'
              }`}
              aria-label={isRecording ? 'Stop recording' : 'Start voice chat'}
            >
              <Mic size={20} />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 rounded-full bg-purple-600 text-white disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
            aria-label="Send message"
          >
            <SendHorizonal size={20} />
          </motion.button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;