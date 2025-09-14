import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Play, Pause, RefreshCw } from 'lucide-react';
import { getDictionFeedback } from '../../services/geminiService';
import Loader from '../ui/Loader';
import { PracticeSong } from '../../data/practiceSongs';

interface PracticeSessionProps {
  song: PracticeSong;
  onComplete: () => void;
  autoPlay?: boolean;
}

type Screen = 'ready' | 'recording' | 'analyzing' | 'feedback';

// Helper function to find a high-quality, human-like voice for a given language.
const findBestVoice = (lang: string, gender: 'female' | 'male', availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  const languageVoices = availableVoices.filter(v => v.lang.startsWith(lang.split('-')[0]));
  if (languageVoices.length === 0) return null;
  const genderRegex = gender === 'female' ? /female/i : /male/i;
  const genderVoice = languageVoices.find(v => genderRegex.test(v.name));
  if (genderVoice) return genderVoice;
  return languageVoices.find(v => v.default) || languageVoices[0];
};

const PracticeSession: React.FC<PracticeSessionProps> = ({ song, onComplete, autoPlay = false }) => {
  const [screen, setScreen] = useState<Screen>('ready');
  const [feedback, setFeedback] = useState<string>('');
  const [botVoice, setBotVoice] = useState<'female' | 'male'>('female');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);

  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const isMounted = useRef(true);

  const words = useMemo(() => song.lyrics.split(/(\s+)/), [song.lyrics]);

  useEffect(() => {
    isMounted.current = true;
    const loadVoices = () => {
      if (isMounted.current) setVoices(speechSynthesis.getVoices());
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      isMounted.current = false;
      speechSynthesis.onvoiceschanged = null;
      if (speechSynthesis.speaking) speechSynthesis.cancel();
    };
  }, []);
  
  const cleanupEverything = useCallback(() => {
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    audioStreamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close().catch(console.error);
    animationFrameId.current = null;
    audioStreamRef.current = null;
    audioContextRef.current = null;
  }, []);

  useEffect(() => {
    return cleanupEverything;
  }, [cleanupEverything]);

  const handleSpeech = useCallback(() => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      if(isMounted.current) {
        setIsSpeaking(false);
        // FIX: The decrement operator cannot be used on a literal. Changed to set the value to -1 directly.
        setCurrentWordIndex(-1);
      }
      return;
    }
    
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    
    const language = song.lang || 'en-US';
    const selectedVoice = findBestVoice(language, botVoice, voices);
    
    if (!selectedVoice) {
      alert(`No suitable voice for language '${language}' found for playback.`);
      return;
    }
    
    let wordIndex = 0;
    
    const speakNextWord = () => {
      if (wordIndex >= words.length || !isMounted.current) {
        if (isMounted.current) {
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
        }
        return;
      }
      
      const word = words[wordIndex];
      const trimmedWord = word.trim();
      if (isMounted.current) setCurrentWordIndex(wordIndex);
      
      if (trimmedWord.length === 0) {
        wordIndex++;
        const delay = word.includes('\n') ? 400 : 150;
        setTimeout(speakNextWord, delay);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(trimmedWord);
      utterance.voice = selectedVoice;
      utterance.lang = language;
      utterance.pitch = 1.0;
      utterance.rate = 0.9; 
      
      utterance.onend = () => {
        let delay = 50; // Rhythmic pause between words
        if (/[.,;?!—]/.test(trimmedWord)) {
          delay = 350; // Longer pause for punctuation
        }
        wordIndex++;
        setTimeout(speakNextWord, delay);
      };

      utterance.onerror = (event: SpeechSynthesisEvent) => {
        const errorEvent = event as SpeechSynthesisErrorEvent;
        if (errorEvent.error !== 'interrupted' && errorEvent.error !== 'canceled') {
          console.error(`SpeechSynthesisUtterance.onerror:`, errorEvent.error);
        }
        if (isMounted.current) {
          setIsSpeaking(false);
          setCurrentWordIndex(-1);
        }
      };
      speechSynthesis.speak(utterance);
    };
    
    if (isMounted.current) setIsSpeaking(true);
    speakNextWord();
  }, [isSpeaking, voices, botVoice, song.lang, words]);

  useEffect(() => {
    if (autoPlay && screen === 'ready' && voices.length > 0) {
      const timer = setTimeout(() => {
        if (isMounted.current) handleSpeech();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, screen, handleSpeech, voices]);

  const drawVisualizer = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / bufferLength;
    
    dataArray.forEach((item, index) => {
      const barHeight = item / 2;
      ctx.fillStyle = `rgba(50, 200, 250, ${barHeight / 150})`;
      ctx.fillRect(index * barWidth, canvas.height - barHeight, barWidth, barHeight);
    });
    
    animationFrameId.current = requestAnimationFrame(drawVisualizer);
  }, []);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setScreen('recording');
      const context = new AudioContext();
      audioContextRef.current = context;
      analyserRef.current = context.createAnalyser();
      context.createMediaStreamSource(stream).connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      drawVisualizer();
    } catch (err) {
      alert("Microphone access denied. Please allow microphone access to use this feature.");
    }
  };
  
  const stopRecordingAndAnalyze = async () => {
    cleanupEverything();
    setScreen('analyzing');
    const result = await getDictionFeedback(song.lyrics);
    setFeedback(result);
    setScreen('feedback');
  };

  const renderHeader = (title: string) => (
    <div className="relative w-full text-center mb-6 flex justify-between items-center">
      <div className="w-6"></div>
      <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-400">{title}</h2>
      <button onClick={onComplete} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
    </div>
  );

  const screens = {
    ready: (
      <>
        {renderHeader(song.title)}
        <div className="bg-gray-900/50 p-4 rounded-lg w-full max-w-2xl max-h-[40vh] overflow-y-auto mb-6">
          <p className="whitespace-pre-wrap text-lg text-gray-200 leading-relaxed text-center">
            {words.map((word, index) => (
              <motion.span
                key={index}
                animate={{
                  backgroundColor: index === currentWordIndex ? 'rgba(168, 85, 247, 0.5)' : 'rgba(168, 85, 247, 0)',
                }}
                transition={{ duration: 0.2 }}
                className="rounded-md"
              >
                {word}
              </motion.span>
            ))}
          </p>
        </div>
        {!autoPlay ? (
          <div className="flex items-center gap-4">
            <button onClick={handleSpeech} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">
              {isSpeaking ? <Pause size={20}/> : <Play size={20}/>}
              {isSpeaking ? "Stop" : "Listen"}
            </button>
            <button onClick={startRecording} className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/30">
              <Mic size={20}/> Record
            </button>
          </div>
        ) : (
           <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-6 py-3 text-gray-400">
                <Loader />
                <span>Playing exercise...</span>
            </div>
            <button onClick={startRecording} className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition-all shadow-lg shadow-purple-500/30">
              <Mic size={20}/> Practice Reciting
            </button>
          </div>
        )}
      </>
    ),
    recording: (
       <>
        {renderHeader("Recording...")}
        <p className="text-lg text-yellow-300 animate-pulse mb-4">Recite the lyrics now...</p>
        <canvas ref={canvasRef} width="300" height="100" className="mx-auto my-4 opacity-75 rounded-lg"></canvas>
        <button onClick={stopRecordingAndAnalyze} className="px-8 py-3 bg-red-600 text-white font-bold rounded-full text-lg shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all">
          I'm Done
        </button>
      </>
    ),
    analyzing: (
      <>
        {renderHeader("Analyzing")}
        <div className="flex flex-col items-center justify-center space-y-4 my-16">
          <Loader />
          <p className="text-lg">SwaraaLaya is analyzing your diction...</p>
        </div>
      </>
    ),
    feedback: (
      <>
        {renderHeader("Diction Feedback")}
        <div className="w-full max-w-2xl max-h-[50vh] overflow-y-auto p-4 bg-gray-900/50 rounded-lg">
           <div className="prose prose-invert prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: feedback.replace(/\n/g, '<br />') }} />
            </div>
        </div>
        <div className="flex items-center gap-4 mt-6">
          <button onClick={() => setScreen('ready')} className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-500 transition-all">
            <RefreshCw size={18}/> Try Again
          </button>
          <button onClick={onComplete} className="px-8 py-3 bg-purple-600 text-white font-bold rounded-full text-lg shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-all">
            Finish
          </button>
        </div>
      </>
    ),
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-lg flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
        className="w-full max-w-4xl bg-gray-800 border border-purple-500/30 rounded-2xl shadow-2xl p-6 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full flex flex-col items-center"
          >
            {screens[screen]}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default PracticeSession;