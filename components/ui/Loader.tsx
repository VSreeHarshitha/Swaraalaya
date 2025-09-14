import React from 'react';
// FIX: Import `Variants` type from framer-motion.
import { motion, Variants } from 'framer-motion';

const Loader: React.FC = () => {
  // FIX: Explicitly type `variants` as `Variants`. This allows TypeScript
  // to correctly infer the types of nested properties like `ease`,
  // resolving the "Type 'string' is not assignable to type 'Easing | Easing[]'" error.
  const variants: Variants = {
    initial: {
      y: 0,
    },
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
        <motion.span 
          className="w-2 h-2 bg-purple-400 rounded-full" 
          variants={variants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0 }}
        />
        <motion.span 
          className="w-2 h-2 bg-purple-400 rounded-full" 
          variants={variants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        />
        <motion.span 
          className="w-2 h-2 bg-purple-400 rounded-full" 
          variants={variants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4 }}
        />
    </div>
  );
};

export default Loader;