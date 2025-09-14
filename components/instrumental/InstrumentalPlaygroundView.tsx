import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import PlaygroundScene from './PlaygroundScene';
import ControlPanel from './ControlPanel';
import { getInstrumentAccompaniment, getInstrumentTransformation } from '../../services/geminiService';

interface InstrumentalPlaygroundViewProps {
  onExit: () => void;
}

const InstrumentalPlaygroundView: React.FC<InstrumentalPlaygroundViewProps> = ({ onExit }) => {
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [interactionType, setInteractionType] = useState<'jam' | 'transform' | null>(null);

  const handleSelectInstrument = (instrument: string | null) => {
    if (selectedInstrument === instrument) {
      // Deselect if clicking the same instrument
      setSelectedInstrument(null);
      setAiResponse('');
      setInteractionType(null);
    } else {
      setSelectedInstrument(instrument);
      setAiResponse('');
      setInteractionType(null);
    }
  };

  const handleJam = async () => {
    if (!selectedInstrument) return;
    setIsLoading(true);
    setAiResponse('');
    setInteractionType('jam');
    const response = await getInstrumentAccompaniment(selectedInstrument);
    setAiResponse(response);
    setIsLoading(false);
  };

  const handleTransform = async () => {
    if (!selectedInstrument) return;
    setIsLoading(true);
    setAiResponse('');
    setInteractionType('transform');
    const response = await getInstrumentTransformation(selectedInstrument);
    setAiResponse(response);
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
        <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><p>Loading 3D Scene...</p></div>}>
            <PlaygroundScene 
                onSelectInstrument={handleSelectInstrument}
                selectedInstrument={selectedInstrument}
            />
        </Suspense>

      <div className="absolute top-0 left-0 w-full p-4 sm:p-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <button 
            onClick={onExit} 
            className="p-2 rounded-full bg-black/30 hover:bg-gray-700/50 transition-colors mr-4"
            aria-label="Back to Session"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-sky-400">
              Instrumental Playground
            </h1>
            <p className="text-gray-300 mt-1 text-sm md:text-base">
                {selectedInstrument ? `Selected: ${selectedInstrument}` : "Select an instrument to begin"}
            </p>
          </div>
        </motion.div>
      </div>
      
      <ControlPanel 
        selectedInstrument={selectedInstrument}
        onJam={handleJam}
        onTransform={handleTransform}
        isLoading={isLoading}
        aiResponse={aiResponse}
        interactionType={interactionType}
      />
    </div>
  );
};

export default InstrumentalPlaygroundView;
