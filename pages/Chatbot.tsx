import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Mic, Bot, Music, Pause, Settings, ClipboardList, Guitar } from 'lucide-react';

import { getChatResponse } from '../services/geminiService';
import { ChatCategory, ChatRole, type ChatMessage } from '../types';
import PracticeSession from '../components/practice/PracticeSession';
import { practiceSongs } from '../data/practiceSongs';
import InstrumentalPlaygroundView from '../components/instrumental/InstrumentalPlaygroundView';

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onend: () => void;
  onerror: (event: { error: string }) => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
    // FIX: Add webkitAudioContext to window type for cross-browser compatibility.
    webkitAudioContext: typeof AudioContext;
  }
}

type AppState = 'speaking' | 'listening' | 'processing' | 'idle';

const sargamMap: { [key: string]: string } = {
  'S': 'Sa', 'R': 'Re', 'G': 'Ga', 'M': 'Ma', 'P': 'Pa', 'D': 'Dha', 'N': 'Ni',
  's': 'sa', 'r': 're', 'g': 'ga', 'm': 'ma', 'p': 'pa', 'd': 'dha', 'n': 'ni',
};

const SwaralayaAvatar = ({ state, isPaused, onTogglePause }: { state: AppState, isPaused: boolean, onTogglePause: (event: React.MouseEvent) => void }) => {
    const variants: Variants = {
        idle: { scale: 1, boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' },
        speaking: { scale: 1.05, boxShadow: '0 0 30px rgba(168, 85, 247, 0.7)' },
        listening: { scale: 1.1, boxShadow: '0 0 40px rgba(99, 102, 241, 0.8)' },
        processing: { rotate: 360, transition: { duration: 1, repeat: Infinity, ease: 'linear' } },
        paused: { scale: 1, boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)' }
    };

    const iconMap: Record<AppState, React.ReactElement> = {
        speaking: <Music />,
        listening: <Mic />,
        processing: <Bot />,
        idle: <Bot />
    };

    const iconToShow = isPaused ? <Pause /> : iconMap[state];
    const statusClass = isPaused ? 'border-amber-500' : 'border-purple-500';
    const textColorClass = isPaused ? 'text-amber-300' : 'text-purple-300';
    const currentAnimation = isPaused ? 'paused' : state;

    return (
        <motion.div
            className={`w-48 h-48 md:w-64 md:h-64 bg-gray-800 rounded-full flex items-center justify-center border-4 ${statusClass} cursor-pointer transition-colors duration-300 relative z-10`}
            variants={variants}
            animate={currentAnimation}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            // The onClick event is passed directly to the onTogglePause handler.
            onClick={onTogglePause}
            title={isPaused ? 'Resume SwaraaLaya' : 'Pause SwaraaLaya'}
            aria-label={isPaused ? 'Resume SwaraaLaya' : 'Pause SwaraaLaya'}
        >
            <div className={`scale-[3] ${textColorClass} transition-colors duration-300`}>{iconToShow}</div>
        </motion.div>
    );
};


const Chatbot: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [category, setCategory] = useState<ChatCategory | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [statusText, setStatusText] = useState('Initializing SwaraaLaya...');
  const [appState, setAppState] = useState<AppState>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [speechRate, setSpeechRate] =useState(0.9);
  const [speechPitch, setSpeechPitch] = useState(1.1);
  const [isPracticeSessionActive, setIsPracticeSessionActive] = useState(false);
  const [isPlaygroundActive, setIsPlaygroundActive] = useState(false);


  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isMounted = useRef(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const appStateRef = useRef(appState);
  useEffect(() => { appStateRef.current = appState; }, [appState]);

  const isPausedRef = useRef(isPaused);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  const handleUserResponseRef = useRef<(transcript: string) => Promise<void>>();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category') as ChatCategory;
    if (cat === ChatCategory.VOCALS || cat === ChatCategory.INSTRUMENTS) {
        setCategory(cat);
    } else {
        navigate('/dashboard'); // Redirect if no valid category
    }
  }, [location.search, navigate]);

  const getVoice = useCallback((gender: 'male' | 'female'): SpeechSynthesisVoice | null => {
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    const indianVoices = voices.filter(v => v.lang === 'en-IN');
    if (indianVoices.length > 0) {
        const genderRegex = gender === 'female' ? /female/i : /male/i;
        const genderVoice = indianVoices.find(v => genderRegex.test(v.name));
        if (genderVoice) return genderVoice;
        return indianVoices[0];
    }

    const englishVoices = voices.filter(v => v.lang.startsWith('en-'));
    const genderRegex = gender === 'female' ? /female/i : /male/i;
    const genderVoice = englishVoices.find(v => genderRegex.test(v.name));
    if (genderVoice) return genderVoice;

    return voices.find(v => v.name === 'Google US English') || englishVoices[0] || null;
  }, []);

  const speak = useCallback((text: string, onEndCallback?: () => void) => {
    if (isPausedRef.current || !window.speechSynthesis) {
      onEndCallback?.();
      return;
    }
    speechSynthesis.cancel();

    // Clean the text to remove asterisks that the TTS engine would read aloud.
    // This prevents the user from hearing "asterisk" if the model censors its output.
    const cleanedText = text.replace(/\*/g, '');

    if (isMounted.current) {
        setAppState('speaking');
        setStatusText('SwaraaLaya is speaking...');
    }
    
    const sargamRegex = /^(?:[SRGMPDNsrgmpdn][']?[,.]?\s*)+$/;
    const lines = cleanedText.split('\n');
    let lineIndex = 0;

    const mainCallback = () => {
        if (isMounted.current && !isPausedRef.current) {
            setAppState('idle');
            setStatusText('Ready.');
            onEndCallback?.();
        }
    };

    const genericOnError = (e: SpeechSynthesisEvent) => {
      const errorEvent = e as SpeechSynthesisErrorEvent;
      if (errorEvent.error === 'interrupted' || errorEvent.error === 'canceled') return;
      console.error("Speech synthesis error:", errorEvent.error);
      mainCallback();
    };

    const speakNextLine = () => {
      if (isPausedRef.current) { mainCallback(); return; }
      if (lineIndex >= lines.length) {
        mainCallback();
        return;
      }

      const line = lines[lineIndex].trim();
      lineIndex++;

      if (line === '') {
        setTimeout(speakNextLine, 300);
        return;
      }

      if (sargamRegex.test(line)) {
        speakSargam(line, speakNextLine);
      } else {
        const utterance = new SpeechSynthesisUtterance(line);
        const voice = getVoice(voiceGender);
        if (voice) utterance.voice = voice;
        utterance.rate = speechRate;
        utterance.pitch = speechPitch;
        utterance.onend = () => speakNextLine();
        utterance.onerror = genericOnError;
        speechSynthesis.speak(utterance);
      }
    };

    const speakSargam = (sargamLine: string, lineCallback: () => void) => {
      const notes = sargamLine.match(/[SRGMPDNsrgmpdn][']?|[.,]/g) || [];
      let noteIndex = 0;

      const speakNextNote = () => {
        if (isPausedRef.current) { lineCallback(); return; }
        if (noteIndex >= notes.length) {
          lineCallback();
          return;
        }

        const note = notes[noteIndex];
        noteIndex++;

        if (note === ',' || note === '.') {
          setTimeout(speakNextNote, 400);
          return;
        }

        const baseNote = note.charAt(0);
        const fullNoteName = sargamMap[baseNote] || baseNote;

        const noteUtterance = new SpeechSynthesisUtterance(fullNoteName);
        const voice = getVoice(voiceGender);
        if (voice) noteUtterance.voice = voice;
        noteUtterance.rate = speechRate * 1.2;
        noteUtterance.pitch = speechPitch * 1.1;
        noteUtterance.onend = () => setTimeout(speakNextNote, 100);
        noteUtterance.onerror = (e: SpeechSynthesisEvent) => {
             const errorEvent = e as SpeechSynthesisErrorEvent;
             if (errorEvent.error === 'interrupted' || errorEvent.error === 'canceled') return;
             console.error("Sargam speech error:", errorEvent.error);
             speakNextNote();
        };
        speechSynthesis.speak(noteUtterance);
      };
      speakNextNote();
    };

    speakNextLine();
  }, [setAppState, setStatusText, getVoice, voiceGender, speechRate, speechPitch]);

  const startListening = useCallback(() => {
    if (isPausedRef.current || !recognitionRef.current) return;
    
    setAppState(currentAppState => {
      if (currentAppState === 'listening') return currentAppState;
      try {
        recognitionRef.current?.start();
        setStatusText('Listening for your response...');
        return 'listening';
      } catch (e) {
        if (e instanceof DOMException && e.name === 'InvalidStateError') {
          console.warn("Attempted to start recognition when it was already active.");
          return 'listening';
        }
        console.error("Could not start recognition: ", e);
        setStatusText('Could not start listening.');
        return 'idle';
      }
    });
  }, []);

  const handleUserResponse = useCallback(async (transcript: string) => {
    if (!category) return;
    if (!transcript.trim()) {
        speak("I didn't quite catch that. Could you please repeat?", startListening);
        return;
    }
    setAppState('processing');
    setStatusText('Thinking...');
    
    setChatHistory(prevHistory => {
      const userMessage: ChatMessage = { role: ChatRole.USER, parts: [{ text: transcript }] };
      const currentHistory = [...prevHistory, userMessage];

      (async () => {
        try {
            const responseText = await getChatResponse(category, currentHistory);
            const modelMessage: ChatMessage = { role: ChatRole.MODEL, parts: [{ text: responseText }] };
            setChatHistory(prev => [...prev, modelMessage]);
            speak(responseText, startListening);
        } catch (error) {
            console.error("Error getting AI response:", error);
            const errorText = "I'm sorry, I seem to have encountered a problem. Let's try that again.";
            speak(errorText, startListening);
        }
      })();
      
      return currentHistory;
    });
  }, [speak, startListening, category]);

  useEffect(() => {
    handleUserResponseRef.current = handleUserResponse;
  }, [handleUserResponse]);

  const togglePause = useCallback(() => {
    setIsPaused(prevIsPaused => {
        const willBePaused = !prevIsPaused;
        if (willBePaused) {
            speechSynthesis.cancel();
            recognitionRef.current?.stop();
            setAppState('idle');
            setStatusText('Paused. Click avatar to resume.');
        } else {
            setStatusText('Resuming...');
            setTimeout(() => {
              if (isMounted.current && !isPausedRef.current) startListening();
            }, 100);
        }
        return willBePaused;
    });
  }, [startListening]);

  // Setup Visualizer & Animation Loop
  useEffect(() => {
    const drawListeningVisuals = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        if (!analyserRef.current) return;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, width, height);
        const centerX = width / 2;
        const centerY = height / 2;
        
        const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;

        for (let i = 0; i < 5; i++) {
            const radius = (avg * 0.5) + (i * 30);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(168, 85, 247, ${1 - i * 0.2})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    };

    const drawSpeakingVisuals = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
        ctx.clearRect(0, 0, width, height);
        const centerX = width / 2;
        const centerY = height / 2;
        for (let i = 1; i <= 4; i++) {
            const radius = 50 + i * 20 + Math.sin(time * 0.002 + i) * 10;
            const opacity = 0.5 - i * 0.1 + Math.cos(time * 0.002 + i) * 0.1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = `rgba(99, 102, 241, ${opacity})`;
            ctx.fill();
        }
    };

    let animationId: number;
    const canvas = canvasRef.current;
    // FIX: A typo in `getContext` was causing rendering context errors. Changed 'd' to '2d'.
    const ctx = canvas?.getContext('2d');

    if (canvas && ctx) {
      const renderLoop = (time: number) => {
        if (!isMounted.current) return;
        if (appStateRef.current === 'listening' && analyserRef.current) {
          drawListeningVisuals(ctx, canvas.width, canvas.height);
        } else if (appStateRef.current === 'speaking' && !isPausedRef.current) {
          drawSpeakingVisuals(ctx, canvas.width, canvas.height, time);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        animationId = requestAnimationFrame(renderLoop);
      };
      renderLoop(0);
    }
    
    return () => {
      if(animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  // Setup Mic for Visualizer
  useEffect(() => {
    const setupAudio = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
        } catch (error) {
            console.error("Error setting up audio for visualizer:", error);
            setStatusText("Could not access microphone for visualizer.");
        }
    };
    setupAudio();

    return () => {
        audioStreamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close();
    }
  }, []);

  // Setup Speech Recognition & Initial Greeting
  useEffect(() => {
    if (!category) return;
    isMounted.current = true;
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setStatusText("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      handleUserResponseRef.current?.(transcript);
    };

    recognition.onend = () => {
        if (isMounted.current && appStateRef.current === 'listening' && !isPausedRef.current) {
            setAppState('idle');
            setStatusText('Finished listening.');
        }
    };
    
    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (isMounted.current && !isPausedRef.current) {
          let errorMessage = 'An unknown recognition error occurred.';
          if (event.error === 'network') {
            errorMessage = "I couldn't connect to the speech service. Please check your internet connection.";
          } else if (event.error === 'no-speech') {
            speak("I didn't hear anything. Let's try that again.", startListening);
            return;
          } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            errorMessage = "Microphone access is not allowed. Please enable it in your browser settings.";
          } else if (event.error === 'aborted') {
            setAppState('idle');
            setStatusText('Ready.');
            return;
          }
          
          setAppState('idle');
          setStatusText(errorMessage);
        }
    };

    recognitionRef.current = recognition;
    
    const initialGreeting = category === ChatCategory.VOCALS 
        ? "Namaste! I am your vocal coach. How can I help you with your singing today?"
        : "Greetings! I am SwaraaLaya, your guide to musical instruments. Ask me anything!";

    const initialMessage: ChatMessage = { role: ChatRole.MODEL, parts: [{ text: initialGreeting }] };
    setChatHistory([initialMessage]);
    
    const tryGreeting = () => {
        if (!isMounted.current) return;
        const startApp = () => speak(initialGreeting, startListening);
        if (speechSynthesis.getVoices().length > 0) {
            startApp();
        } else {
            speechSynthesis.onvoiceschanged = startApp;
        }
    };
    
    const initTimeout = setTimeout(tryGreeting, 100);
    
    return () => {
        isMounted.current = false;
        clearTimeout(initTimeout);
        speechSynthesis.cancel();
        if(recognitionRef.current) {
            recognitionRef.current.onresult = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.abort();
        }
    }
  }, [speak, startListening, category]);
  
  const selectedPracticeSong = practiceSongs.find(song => song.lang === 'hi-IN');
  
  if (isPlaygroundActive) {
    return <InstrumentalPlaygroundView onExit={() => setIsPlaygroundActive(false)} />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-900/70 items-center justify-center p-4 overflow-hidden">
        <div className="absolute top-4 left-4 z-20">
            <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Back to dashboard">
                <ChevronLeft size={24} />
            </button>
        </div>

        <div className="absolute top-4 right-4 z-20">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-full hover:bg-gray-700 transition-colors" aria-label="Voice settings">
                <Settings size={24} />
            </button>
             <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-12 right-0 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 space-y-4"
                    >
                        <div>
                           <label className="block text-sm font-medium text-gray-300 mb-2">Voice</label>
                           <div className="flex gap-2">
                                <button onClick={() => setVoiceGender('female')} className={`w-full py-1 text-sm rounded ${voiceGender === 'female' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Female</button>
                                <button onClick={() => setVoiceGender('male')} className={`w-full py-1 text-sm rounded ${voiceGender === 'male' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Male</button>
                           </div>
                        </div>
                        <div>
                           <label htmlFor="rate-slider" className="block text-sm font-medium text-gray-300 mb-1">Rate: {speechRate.toFixed(2)}</label>
                           <input id="rate-slider" type="range" min="0.5" max="1.5" step="0.05" value={speechRate} onChange={e => setSpeechRate(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                        </div>
                         <div>
                           <label htmlFor="pitch-slider" className="block text-sm font-medium text-gray-300 mb-1">Pitch: {speechPitch.toFixed(2)}</label>
                           <input id="pitch-slider" type="range" min="0.5" max="1.5" step="0.05" value={speechPitch} onChange={e => setSpeechPitch(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"/>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
                {category === ChatCategory.VOCALS ? "Vocal Guru Session" : "Instrumental Guru Session"}
            </h1>
        </div>

        <div className="relative flex flex-col items-center justify-center text-center">
            <canvas
              ref={canvasRef}
              width={600}
              height={600}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-75"
            />
            <SwaralayaAvatar state={appState} isPaused={isPaused} onTogglePause={togglePause} />
            <p className="mt-8 text-xl text-gray-300 font-medium h-8" aria-live="polite">
                {statusText}
            </p>
        </div>

        <div className="mt-6">
            {category === ChatCategory.VOCALS && selectedPracticeSong && (
                <motion.button 
                    onClick={() => setIsPracticeSessionActive(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 px-6 py-3 bg-teal-600 text-white font-bold rounded-full text-md shadow-lg shadow-teal-500/30 hover:bg-teal-700 transition-all"
                >
                    <ClipboardList size={20} /> Lyric Practice
                </motion.button>
            )}
            {category === ChatCategory.INSTRUMENTS && (
                <motion.button 
                    onClick={() => setIsPlaygroundActive(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 px-6 py-3 bg-cyan-600 text-white font-bold rounded-full text-md shadow-lg shadow-cyan-500/30 hover:bg-cyan-700 transition-all"
                >
                    <Guitar size={20} /> Enter Playground
                </motion.button>
            )}
        </div>

        <AnimatePresence>
            {isPracticeSessionActive && selectedPracticeSong && (
                <PracticeSession 
                    song={selectedPracticeSong} 
                    onComplete={() => setIsPracticeSessionActive(false)}
                />
            )}
        </AnimatePresence>
    </div>
  );
};

export default Chatbot;