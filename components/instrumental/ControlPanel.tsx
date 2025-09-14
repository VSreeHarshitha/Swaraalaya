import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Wand2, Bot } from 'lucide-react';
import Loader from '../ui/Loader';

interface ControlPanelProps {
    selectedInstrument: string | null;
    onJam: () => void;
    onTransform: () => void;
    isLoading: boolean;
    aiResponse: string;
    interactionType: 'jam' | 'transform' | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    selectedInstrument, 
    onJam, 
    onTransform, 
    isLoading, 
    aiResponse,
    interactionType
}) => {
  return (
    <div className="absolute bottom-0 left-0 w-full flex justify-center p-4 sm:p-8 z-20 pointer-events-none">
        <AnimatePresence>
        {selectedInstrument && (
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="w-full max-w-2xl p-6 bg-gray-900/60 backdrop-blur-lg border border-cyan-500/20 rounded-2xl shadow-2xl shadow-cyan-500/20 pointer-events-auto"
            >
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-shrink-0 flex flex-col items-center gap-4">
                    <button 
                        onClick={onJam}
                        disabled={isLoading}
                        className="flex items-center justify-center w-full md:w-auto gap-2 px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all shadow-md shadow-purple-500/20 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <Music size={20}/> Jam with AI
                    </button>
                    <button 
                        onClick={onTransform}
                        disabled={isLoading}
                        className="flex items-center justify-center w-full md:w-auto gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <Wand2 size={20}/> Transform Sound
                    </button>
                </div>
                <div className="w-full min-h-[80px] p-4 bg-gray-800/50 rounded-lg flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {isLoading && (
                             <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-2 text-sm text-gray-400"
                            >
                                <Loader />
                                <p>SwaraaLaya is tuning up...</p>
                            </motion.div>
                        )}
                        {aiResponse && !isLoading && (
                             <motion.div
                                key="response"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-start gap-3 text-sm text-gray-200"
                            >
                               <Bot size={28} className={`flex-shrink-0 mt-1 ${interactionType === 'jam' ? 'text-purple-400' : 'text-indigo-400'}`} />
                               <p>{aiResponse}</p>
                            </motion.div>
                        )}
                        {!isLoading && !aiResponse && (
                             <motion.div
                                key="prompt"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center text-sm text-gray-400"
                            >
                                <p>Choose an action for the {selectedInstrument}.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            </motion.div>
        )}
        </AnimatePresence>
    </div>
  );
};

export default ControlPanel;