import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Code, Music } from 'lucide-react';

const teamMembers = [
  {
    name: 'AI Architect',
    role: 'Frontend & Gemini API',
    avatar: `https://picsum.photos/seed/architect/200`,
    social: {
      github: '#',
      linkedin: '#',
    },
  },
  {
    name: 'UX Maestro',
    role: 'UI/UX & 3D Design',
    avatar: `https://picsum.photos/seed/maestro/200`,
    social: {
      github: '#',
      linkedin: '#',
    },
  },
];

const About: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-8">
      <div className="max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-4">
            About SwaraaLaya
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            SwaraaLaya is a hackathon project designed to create an immersive and intelligent platform for music enthusiasts. We leverage the power of Google's Gemini API to provide expert-level conversations about vocals and instruments, wrapped in a futuristic and visually stunning user interface.
          </p>
        </motion.div>

        <motion.div 
            className="flex justify-center items-center space-x-8 my-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
        >
            <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col items-center">
                <Code size={40} className="text-purple-400 mb-2" />
                <h3 className="text-xl font-bold">Powered by React & Gemini</h3>
                <p className="text-gray-400">Modern tech for a seamless experience.</p>
            </div>
             <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col items-center">
                <Music size={40} className="text-indigo-400 mb-2" />
                <h3 className="text-xl font-bold">For Music Lovers</h3>
                <p className="text-gray-400">Built by enthusiasts, for enthusiasts.</p>
            </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-4xl font-bold mt-16 mb-8">Meet the Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                className="bg-gray-800 p-6 rounded-2xl border border-gray-700 text-center"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.2 }}
                whileHover={{ scale: 1.05, borderColor: '#a855f7' }}
              >
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-purple-500"
                />
                <h3 className="text-2xl font-bold">{member.name}</h3>
                <p className="text-purple-400">{member.role}</p>
                <div className="flex justify-center space-x-4 mt-4">
                  <a href={member.social.github} className="text-gray-400 hover:text-white transition-colors"><Github /></a>
                  <a href={member.social.linkedin} className="text-gray-400 hover:text-white transition-colors"><Linkedin /></a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;