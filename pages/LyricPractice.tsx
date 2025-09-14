import React from 'react';
import { useNavigate } from 'react-router-dom';
import { practiceSongs, PracticeSong } from '../data/practiceSongs';
import PracticeSession from '../components/practice/PracticeSession';

const LyricPractice: React.FC = () => {
  const navigate = useNavigate();
  
  // Automatically select the Hindi song for the regional language experience.
  const selectedSong: PracticeSong | undefined = practiceSongs.find(song => song.lang === 'hi-IN');

  if (!selectedSong) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-8 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold text-red-400">Configuration Error</h1>
        <p className="text-gray-300 mt-2">The regional language practice exercise could not be found.</p>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="mt-6 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* 
        The PracticeSession component is rendered directly.
        The `autoPlay` prop will make it start speaking automatically.
        The `onComplete` prop defines what happens when the session is closed,
        in this case, it navigates back to the dashboard.
      */}
      <PracticeSession 
        song={selectedSong}
        onComplete={() => navigate('/dashboard')}
        autoPlay={true}
      />
    </div>
  );
};

export default LyricPractice;