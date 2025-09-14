import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedIconProps {
  // FIX: Use a more specific type for the icon component that accepts a className.
  // React.ElementType is too broad, causing TypeScript to be unable to verify if the component accepts a className prop.
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}

const AnimatedIcon: React.FC<AnimatedIconProps> = ({ icon: Icon, className }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.2, rotate: 15 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      <Icon className={className} />
    </motion.div>
  );
};

export default AnimatedIcon;