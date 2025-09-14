import React from 'react';
import { NavLink } from 'react-router-dom';
// FIX: Import `Variants` type from framer-motion.
import { motion, Variants } from 'framer-motion';
import { Mic, Music, ArrowRight } from 'lucide-react';

// FIX: Explicitly type `cardVariants` as `Variants`. This allows TypeScript
// to correctly infer the types of nested properties like `transition.type`,
// resolving the "Type 'string' is not assignable to type 'AnimationGeneratorType'" error.
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  hover: { scale: 1.05, boxShadow: '0px 10px 30px rgba(168, 85, 247, 0.4)' },
};

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white">Dashboard</h1>
        <p className="text-lg text-gray-400 mt-2">Choose your area of exploration.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <NavLink to="/chatbot?category=Vocals" className="flex flex-col p-8 bg-gray-800/50 backdrop-blur-md rounded-2xl border border-gray-700 transition-all duration-300 h-full">
            <div className="flex items-center text-purple-400 mb-4">
              <Mic size={40} />
              <h2 className="text-3xl font-bold ml-4 text-white">Vocal Coach</h2>
            </div>
            <p className="text-gray-300 mb-6 flex-grow">
              Chat with a voice-powered AI Guru. Explore techniques, get feedback, and start guided lyric practice sessions.
            </p>
            <span className="font-semibold text-purple-400 flex items-center">
              Start Vocal Session <ArrowRight className="ml-2" size={20} />
            </span>
          </NavLink>
        </motion.div>
        
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <NavLink to="/chatbot?category=Instruments" className="flex flex-col p-8 bg-gray-800/50 backdrop-blur-md rounded-2xl border border-gray-700 transition-all duration-300 h-full">
            <div className="flex items-center text-indigo-400 mb-4">
              <Music size={40} />
              <h2 className="text-3xl font-bold ml-4 text-white">Instrument Guru</h2>
            </div>
            <p className="text-gray-300 mb-6 flex-grow">
              Discuss instruments with your AI assistant or enter the 3D Playground to jam with Swaralaya in a virtual space.
            </p>
            <span className="font-semibold text-indigo-400 flex items-center">
              Start Instrument Session <ArrowRight className="ml-2" size={20} />
            </span>
          </NavLink>
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;