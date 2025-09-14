import React from 'react';
// FIX: Import `Variants` type from framer-motion to explicitly type the animation variants.
import { motion, Variants } from 'framer-motion';

const AnimatedLogo = () => {
  // FIX: Explicitly type `draw` as `Variants`. This allows TypeScript
  // to correctly infer the types of nested properties like `transition.pathLength.type`,
  // resolving the "Type 'string' is not assignable to type 'AnimationGeneratorType'" error.
  const draw: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: 1 + i * 0.5, type: "spring", duration: 2.5, bounce: 0 },
        opacity: { delay: 1 + i * 0.5, duration: 0.01 }
      }
    })
  };

  const fadeIn = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 2.5 + i * 0.1,
        duration: 0.5
      }
    })
  };

  return (
    <motion.svg
      width="200"
      height="200"
      viewBox="0 -10 80 100" // FIX: Adjusted viewBox to prevent clipping
      initial="hidden"
      animate="visible"
      className="w-48 h-48 md:w-64 md:h-64"
    >
      <defs>
        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Main Treble Clef, centered and scaled */}
      <motion.path
        d="M 40,80 C 20,90 20,60 40,50 C 60,40 80,60 60,80 C 40,100 40,120 60,110 C 80,100 80,80 60,70 C 40,60 40,40 60,30 C 80,20 80,0 60,10 L 60,110"
        transform="scale(0.7) translate(-10, -10)"
        fill="transparent"
        stroke="url(#logo-gradient)"
        strokeWidth="5"
        strokeLinecap="round"
        custom={0}
        variants={draw}
      />
      
      {/* Swirling Staff Lines */}
       <motion.path
        d="M 75,55 A 40 40 0 1 1 10 35"
        fill="transparent"
        stroke="url(#logo-gradient)"
        strokeWidth="1"
        custom={1}
        variants={draw}
      />
       <motion.path
        d="M 80,60 A 45 45 0 1 1 5 40"
        fill="transparent"
        stroke="url(#logo-gradient)"
        strokeWidth="1"
        custom={1.2}
        variants={draw}
      />

      {/* Notes */}
      <motion.circle cx="75" cy="57" r="3" fill="url(#logo-gradient)" custom={0} variants={fadeIn} />
      <motion.circle cx="12" cy="37" r="3" fill="url(#logo-gradient)" custom={1} variants={fadeIn} />
      <motion.circle cx="15" cy="80" r="3" fill="url(#logo-gradient)" custom={2} variants={fadeIn} />
      <motion.circle cx="65" cy="15" r="3" fill="url(#logo-gradient)" custom={3} variants={fadeIn} />
    </motion.svg>
  );
};
export default AnimatedLogo;