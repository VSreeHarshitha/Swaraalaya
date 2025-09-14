import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import { ChatRole, type ChatMessage } from '../../types';

interface MessageProps {
  message: ChatMessage;
}

const renderFormattedText = (text: string) => {
  // Regex to match lines that are primarily Sargam notation.
  // It allows for notes (SRGMPDN, case-insensitive), apostrophes for octave, commas, and whitespace.
  const sargamRegex = /^(?:[SRGMPDNsrgmpdn][']?[,.]?\s*)+$/;

  const lines = text.split('\n');
  
  return (
    <div className="text-sm leading-relaxed">
      {lines.map((line, index) => {
        // Test if the trimmed line is valid sargam notation
        if (sargamRegex.test(line.trim())) {
          return (
            <code key={index} className="block my-2 font-mono text-cyan-300 bg-gray-900 p-3 rounded-md text-base tracking-wider whitespace-pre-wrap">
              {line}
            </code>
          );
        }
        
        // Make headers bold, e.g., "Raaga:", "Lyrics:"
        if (/^[\w\s]+:$/.test(line.trim()) && line.length < 50) {
           return <strong key={index} className="block mt-4 mb-1 text-purple-300">{line}</strong>;
        }

        // Render normal text
        return (
          <p key={index} className="my-0.5">{line || '\u00A0'}</p> // Use non-breaking space for empty lines to maintain spacing
        );
      })}
    </div>
  );
};


const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === ChatRole.USER;

  const textContent = message.parts.map(part => part.text).join('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
          <Bot size={20} />
        </div>
      )}
      <div
        className={`max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl shadow-lg ${
          isUser
            ? 'bg-indigo-600 rounded-br-none'
            : 'bg-gray-800 rounded-bl-none border border-gray-700'
        }`}
      >
        {isUser ? <p className="text-sm whitespace-pre-wrap">{textContent}</p> : renderFormattedText(textContent)}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
          <User size={20} />
        </div>
      )}
    </motion.div>
  );
};

export default Message;