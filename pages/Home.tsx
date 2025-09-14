import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import MusicalBackground from '../components/3d/MusicalBackground';
import { ArrowRight } from 'lucide-react';
import AnimatedLogo from '../components/ui/AnimatedLogo';

const musicalWords = [
  'Adagio', 'Allegro', 'Aria', 'Cadence', 'Chord', 'Crescendo', 'Dynamics',
  'Encore', 'Forte', 'Harmony', 'Legato', 'Melody', 'Octave', 'Pitch',
  'Rhythm', 'Scale', 'Sonata', 'Staccato', 'Tempo', 'Vibrato', 'Largo'
];

interface RisingWordProps {
    word: string;
}

const RisingWord: React.FC<RisingWordProps> = ({ word }) => {
  const duration = 10 + Math.random() * 10; // 10 to 20 seconds
  const delay = Math.random() * 15; // 0 to 15 seconds delay
  const xPosition = `${-45 + Math.random() * 90}vw`; // random horizontal position
  const fontSize = `${1 + Math.random() * 1.5}rem`;
  const opacity = 0.2 + Math.random() * 0.3;

  return (
    <motion.span
      initial={{ y: '100vh', x: xPosition, opacity: 0 }}
      animate={{ y: '-10vh' }}
      transition={{ duration, delay, ease: 'linear', repeat: Infinity, repeatDelay: 2 }}
      className="absolute text-gray-400 font-light"
      style={{ fontSize, whiteSpace: 'nowrap', opacity, zIndex: 1 }}
    >
      {word}
    </motion.span>
  );
};

const Home: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-gray-900">
      <MusicalBackground />
      
      {musicalWords.map((word, index) => (
        <RisingWord key={index} word={word} />
      ))}

      <div className="relative z-10 text-center flex flex-col items-center">
        <AnimatedLogo />
        
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 3 }}
          className="text-6xl md:text-7xl font-bold mt-[-2rem] mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300"
          style={{ textShadow: '0 0 15px rgba(168, 85, 247, 0.7), 0 0 25px rgba(168, 85, 247, 0.7), 0 0 40px rgba(99, 102, 241, 0.5)' }}
        >
          SwaraaLaya
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 3.5 }}
          className="text-xl md:text-2xl text-gray-200 mb-8"
        >
          Your Personal AI Music Companion
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 4 }}
        >
          <NavLink
            to="/login"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-purple-600 rounded-full shadow-lg shadow-purple-500/40 hover:bg-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Start Your Journey <ArrowRight className="ml-2" />
          </NavLink>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;