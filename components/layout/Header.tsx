import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { motion } from 'framer-motion';
import { LogOut, User, UserCircle } from 'lucide-react';

const HeaderLogo = () => (
    <svg
      width="32"
      height="32"
      viewBox="0 -10 80 100"
      className="h-8 w-8"
    >
      <defs>
        <linearGradient id="header-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Main Treble Clef */}
      <path
        d="M 40,80 C 20,90 20,60 40,50 C 60,40 80,60 60,80 C 40,100 40,120 60,110 C 80,100 80,80 60,70 C 40,60 40,40 60,30 C 80,20 80,0 60,10 L 60,110"
        transform="scale(0.7) translate(-10, -10)"
        fill="transparent"
        stroke="url(#header-logo-gradient)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      
      {/* Swirling Staff Lines */}
       <path
        d="M 75,55 A 40 40 0 1 1 10 35"
        fill="transparent"
        stroke="url(#header-logo-gradient)"
        strokeWidth="1.5"
      />
       <path
        d="M 80,60 A 45 45 0 1 1 5 40"
        fill="transparent"
        stroke="url(#header-logo-gradient)"
        strokeWidth="1.5"
      />

      {/* Notes */}
      <circle cx="75" cy="57" r="3" fill="url(#header-logo-gradient)" />
      <circle cx="12" cy="37" r="3" fill="url(#header-logo-gradient)" />
      <circle cx="15" cy="80" r="3" fill="url(#header-logo-gradient)" />
      <circle cx="65" cy="15" r="3" fill="url(#header-logo-gradient)" />
    </svg>
);


const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
      isActive
        ? 'bg-purple-600 text-white shadow-lg'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-black/30 backdrop-blur-lg border-b border-gray-800"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <NavLink to="/" className="flex items-center space-x-2 text-xl font-bold text-white">
            <HeaderLogo />
            <span>SwaraaLaya</span>
          </NavLink>
          <div className="flex items-center space-x-4">
            <NavLink to="/" className={navLinkClasses}>Home</NavLink>
            {isAuthenticated && <NavLink to="/dashboard" className={navLinkClasses}>Dashboard</NavLink>}
            <NavLink to="/about" className={navLinkClasses}>About</NavLink>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <NavLink 
                  to="/profile" 
                  className="p-2 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-300"
                  title="Profile"
                  aria-label="View Profile"
                >
                  <User size={20} />
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 transition-colors duration-300"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 transition-colors duration-300"
              >
                <UserCircle size={18} />
                <span>Login</span>
              </NavLink>
            )}
          </div>
        </div>
      </nav>
    </motion.header>
  );
};

export default Header;