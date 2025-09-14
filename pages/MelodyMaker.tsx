import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wand2, Music, Loader2 } from 'lucide-react';
import { generateMelody } from '../services/geminiService';

const MelodyMaker: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ description: string; notes: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const suggestions = ["A happy, upbeat pop melody", "A calm, relaxing piano tune", "An epic, heroic fantasy theme", "A groovy, funk bassline"];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await generateMelody(prompt);
      if (response.notes === "" && response.description.includes("Oops")) {
        setError(response.description);
      } else {
        setResult(response);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="flex items-center mb-8">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-gray-700 transition-colors mr-4" aria-label="Back to dashboard">
            <ArrowLeft size={24} />
          </button>
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-blue-400">
              Melody Maker
            </h1>
            <p className="text-gray-400 mt-1">Craft a tune with your AI music partner.</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the melody you want to create..."
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <div className="flex flex-wrap gap-2 mt-4">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded-full text-gray-200 transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-bold rounded-full text-lg shadow-lg shadow-green-500/30 hover:bg-green-700 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                <span>{isLoading ? 'Generating...' : 'Generate Melody'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center text-red-400 bg-red-900/50 p-4 rounded-lg">
            {error}
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 bg-gray-800/50 p-6 rounded-2xl border border-gray-700"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-green-300">
              <Music /> Your Melody
            </h2>
            <div className="bg-gray-900 p-4 rounded-lg mb-4">
              <p className="text-gray-300 italic">{result.description}</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-400 mb-3">Notes:</h3>
              <div className="flex flex-wrap gap-2">
                {result.notes.split(' ').map((note, index) => (
                  <motion.div
                    key={`${note}-${index}`}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-3 py-1 bg-blue-500 text-white font-mono rounded-md shadow-md"
                  >
                    {note}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MelodyMaker;
