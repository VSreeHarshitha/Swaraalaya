import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../App';
import { motion } from 'framer-motion';
import MusicalBackground from '../components/3d/MusicalBackground';
import { Mail, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login logic
    login();
    navigate('/dashboard');
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center p-4">
      <MusicalBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-8 space-y-6 bg-gray-900/60 backdrop-blur-lg border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/20"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-gray-400">Login to continue your journey</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 text-lg font-semibold text-white bg-purple-600 rounded-lg shadow-lg shadow-purple-500/30 hover:bg-purple-700 transition-all duration-300 transform hover:scale-105"
          >
            Login
          </button>
        </form>
        <p className="text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <NavLink to="/signup" className="font-medium text-purple-400 hover:underline">
            Sign up
          </NavLink>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;