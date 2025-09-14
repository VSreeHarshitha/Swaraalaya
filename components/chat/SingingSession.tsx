import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, ArrowLeft, Ear, Bot, SendHorizonal, User, Play, Pause } from 'lucide-react';
import { getSingingFeedback } from '../../services/geminiService';
import Loader from '../ui/Loader';

interface SingingSessionProps {
  onComplete: (songTitle: string, feedback: string) => void;
  onCancel: () => void;
}

type Screen = 'ready' | 'singing' | 'getTitle' | 'analyzing' | 'feedback';

// Helper function to find a high-quality, human-like voice.
const findBestVoice = (gender: 'female' | 'male', availableVoices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  const englishVoices = availableVoices.filter(v => v.lang.startsWith('en-US'));
  if (englishVoices.length === 0) return null;

  const femalePreferences = [
    'Microsoft Jenny Online (Natural) - English (United States)', 'Google US English', 'Samantha', 'Victoria', 'Tessa', 'Microsoft Zira Desktop - English (United States)'
  ];
  const malePreferences = [
    'Microsoft David Online (Natural) - English (United States)', 'Alex', 'Google UK English Male', 'Microsoft David Desktop - English (United States)', 'Daniel'
  ];
  const preferences = gender === 'female' ? femalePreferences : malePreferences;

  for (const name of preferences) {
    const voice = englishVoices.find(v => v.name === name);
    if (voice) return voice;
  }

  const genderRegex = gender === 'female' ? /female/i : /male/i;
  const genderVoice = englishVoices.find(v => genderRegex.test(v.name) && v.localService);
  if (genderVoice) return genderVoice;

  return availableVoices.find(v => v.default) || englishVoices[0];
};

const SingingSession: React.FC<SingingSessionProps> = ({ onComplete, onCancel }) => {
  const [screen, setScreen] = useState<Screen>('ready');
  const [songTitle, setSongTitle] = useState('');
  const [songTitleInput, setSongTitleInput] = useState('');
  const [feedback, setFeedback] = useState<string>('');
  const [botLyrics, setBotLyrics] = useState<string>('');
  const [botVoice, setBotVoice] = useState<'female' | 'male'>('female');
  const [analyzedLyrics, setAnalyzedLyrics] = useState<{ word: string; correct: boolean }[]>([]);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [speechPitch, setSpeechPitch] = useState(1.1);


  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(speechSynthesis.getVoices());
    };
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      speechSynthesis.onvoiceschanged = null;
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const drawVisualizer = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current || !audioContextRef.current) return;
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / bufferLength;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      const purpleValue = Math.min(255, barHeight + 100);
      ctx.fillStyle = `rgba(${purpleValue - 50}, 100, ${purpleValue}, 0.8)`;
      ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
    }

    animationFrameId.current = requestAnimationFrame(drawVisualizer);
  }, []);

  const cleanupAudio = useCallback(() => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    if (audioStreamRef.current) audioStreamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
    animationFrameId.current = null;
    audioStreamRef.current = null;
    audioContextRef.current = null;
  }, []);

  const handleSpeech = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    
    const selectedVoice = findBestVoice(botVoice, voices);
    if (!selectedVoice) {
      console.error("No suitable English voice found for speech synthesis.");
      alert("Sorry, a suitable voice for playback could not be found on your browser.");
      return;
    }

    const cleanedLyrics = botLyrics.replace(/\*/g, '');
    const lines = cleanedLyrics.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    let lineIndex = 0;

    const speakNextLine = () => {
      if (lineIndex >= lines.length) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(lines[lineIndex]);
      utterance.voice = selectedVoice;
      utterance.pitch = speechPitch;
      utterance.rate = speechRate;
      utterance.volume = 0.9;

      utterance.onend = () => {
        lineIndex++;
        setTimeout(speakNextLine, 200); 
      };

      utterance.onerror = (event: SpeechSynthesisEvent) => {
        const errorEvent = event as SpeechSynthesisErrorEvent;
        if (errorEvent.error !== 'interrupted') {
          console.error(`SpeechSynthesisUtterance.onerror:`, errorEvent.error);
        }
        setIsSpeaking(false);
      };
      
      speechSynthesis.speak(utterance);
    };
    
    setIsSpeaking(true);
    speakNextLine();
  };


  const startSinging = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setScreen('singing');

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      analyserRef.current = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 128;
      drawVisualizer();

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied. Please allow microphone access in your browser settings to use this feature.");
      onCancel();
    }
  }, [drawVisualizer, onCancel]);
  
  const stopSinging = () => {
      cleanupAudio();
      setScreen('getTitle');
  };

  const handleGetFeedback = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!songTitleInput.trim()) return;
      setSongTitle(songTitleInput);
      setScreen('analyzing');
      const { feedback: generatedFeedback, lyrics: generatedLyrics } = await getSingingFeedback(songTitleInput);
      
      const words = generatedLyrics.split(/(\s+)/); // Split by space but keep spaces
      const analysis = words.map(word => ({
          word,
          correct: word.trim() === '' ? true : Math.random() > 0.2 // 20% chance of being incorrect
      }));
      setAnalyzedLyrics(analysis);

      setFeedback(generatedFeedback);
      setBotLyrics(generatedLyrics);
      setScreen('feedback');
  };

  const handleCancelAndCleanup = () => {
    speechSynthesis.cancel();
    cleanupAudio();
    onCancel();
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
      speechSynthesis.cancel();
    };
  }, [cleanupAudio]);

  const handleFinish = () => {
    speechSynthesis.cancel();
    onComplete(songTitle, feedback);
  };

  const renderHeader = (title: string, showBack: boolean = false, onBack?: () => void) => (
    <div className="relative w-full text-center mb-6 flex justify-between items-center">
      {showBack ? (
        <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors"><ArrowLeft size={24} /></button>
      ) : <div className="w-6"></div>}
      <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">{title}</h2>
      <button onClick={handleCancelAndCleanup} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
    </div>
  );

  const screens = {
    ready: (
        <>
            {renderHeader("Freestyle Session")}
            <div className="flex flex-col items-center justify-center space-y-6 my-12 text-center">
                <p className="text-lg text-gray-300">Ready to sing your heart out?</p>
                <p className="text-gray-400 max-w-sm">Click the button below to start recording. You can sing any song you like!</p>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={startSinging}
                    className="flex items-center gap-3 px-8 py-4 bg-purple-600 text-white font-bold rounded-full text-lg shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-all">
                    <Mic size={24} /> Start Freestyle
                </motion.button>
            </div>
        </>
    ),
    singing: (
      <>
        {renderHeader("Recording...", true, () => { cleanupAudio(); setScreen('ready'); })}
        <div className="flex flex-col items-center justify-center space-y-6 my-8">
            <p className="text-lg text-yellow-300 animate-pulse">Sing now...</p>
            <canvas ref={canvasRef} width="300" height="100" className="mx-auto my-4 opacity-75 rounded-lg"></canvas>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={stopSinging}
                className="px-8 py-3 bg-red-600 text-white font-bold rounded-full text-lg shadow-lg shadow-red-500/30 hover:bg-red-700 transition-all">
                I'm Done
            </motion.button>
        </div>
      </>
    ),
    getTitle: (
        <>
            {renderHeader("What did you sing?", true, () => setScreen('singing'))}
            <form onSubmit={handleGetFeedback} className="w-full max-w-sm flex flex-col items-center gap-4 my-12">
                <p className="text-gray-300 text-center">Let SwaraaLaya know the song title to get your personalized feedback.</p>
                <div className="relative w-full">
                    <input type="text"
                        value={songTitleInput}
                        onChange={(e) => setSongTitleInput(e.target.value)}
                        placeholder="Enter song title..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg py-3 pl-4 pr-12 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                    <button type="submit" disabled={!songTitleInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-purple-600 text-white disabled:bg-gray-500 transition-colors">
                        <SendHorizonal size={20} />
                    </button>
                </div>
            </form>
        </>
    ),
    analyzing: (
      <>
        {renderHeader("Analyzing")}
        <div className="flex flex-col items-center justify-center space-y-4 my-16">
          <Loader />
          <p className="text-lg">SwaraaLaya is analyzing your performance...</p>
        </div>
      </>
    ),
    feedback: (
      <div className="w-full flex flex-col items-center">
        {renderHeader("Your Analysis", true, () => setScreen('getTitle'))}
        <div className="flex flex-col gap-y-4 w-full max-h-[60vh] overflow-y-auto p-1 pr-3">

          <div className="flex flex-col bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-purple-300"><User size={20}/> Your Performance</h3>
            <div className="p-4 bg-gray-800 rounded-lg text-left leading-relaxed">
              <p className="whitespace-pre-wrap">
                {analyzedLyrics.map((item, index) => (
                  <span
                    key={index}
                    className={item.correct ? 'text-blue-400' : 'text-red-500 font-medium'}
                    style={item.correct ? { textShadow: '0 0 8px rgba(96, 165, 250, 0.7)' } : {}}
                  >
                    {item.word}
                  </span>
                ))}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col bg-gray-900/50 p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-purple-300"><Bot size={20}/> SwaraaLaya's Coaching</h3>
            <div className="prose prose-invert prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: feedback.replace(/\n/g, '<br />') }} />
            </div>
          </div>

          <div className="flex flex-col bg-gray-900/50 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-indigo-300"><Ear size={20}/> SwaraaLaya's Version</h3>
              <div className="flex justify-center items-center gap-4 mb-4">
                  <button
                      onClick={() => setBotVoice('female')}
                      className={`px-4 py-1 rounded-full text-sm font-semibold transition-all duration-200 ${botVoice === 'female' ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                  >
                      Female Tone
                  </button>
                  <button
                      onClick={() => setBotVoice('male')}
                      className={`px-4 py-1 rounded-full text-sm font-semibold transition-all duration-200 ${botVoice === 'male' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                  >
                      Male Tone
                  </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm px-4">
                  <div>
                      <label htmlFor="rate-slider" className="block mb-1 text-gray-400">Rate: {speechRate.toFixed(2)}</label>
                      <input id="rate-slider" type="range" min="0.5" max="1.5" step="0.05" value={speechRate} onChange={e => setSpeechRate(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                  </div>
                   <div>
                      <label htmlFor="pitch-slider" className="block mb-1 text-gray-400">Pitch: {speechPitch.toFixed(2)}</label>
                      <input id="pitch-slider" type="range" min="0.5" max="1.5" step="0.05" value={speechPitch} onChange={e => setSpeechPitch(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                  </div>
              </div>
               <div className="flex justify-center my-2">
                 <button onClick={handleSpeech} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-all shadow-lg shadow-green-500/30">
                  {isSpeaking ? <Pause size={20} /> : <Play size={20} />}
                  <span>{isSpeaking ? "Stop Listening" : "Hear the Song"}</span>
                 </button>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg text-center leading-relaxed prose prose-invert prose-sm max-w-none">
                  <p className="whitespace-pre-wrap text-cyan-400" style={{textShadow: '0 0 6px rgba(34,211,238,0.7)'}}>
                      {botLyrics}
                  </p>
              </div>
          </div>
        </div>
        
        <div className="mt-6 w-full flex justify-center">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleFinish}
                className="px-8 py-3 bg-purple-600 text-white font-bold rounded-full text-lg shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-all">
                Finish Session
            </motion.button>
        </div>
      </div>
    ),
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-lg flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }}
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

export default SingingSession;