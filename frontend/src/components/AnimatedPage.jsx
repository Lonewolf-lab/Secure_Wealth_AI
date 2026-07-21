import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.16, 1, 0.3, 1],
      when: 'beforeChildren',
      staggerChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.15,
      ease: 'easeIn',
    },
  },
};

export const childCardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } 
  },
};

const AnimatedPage = ({ children, className = "" }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`animated-page-wrapper ${className}`}
      style={{ width: '100%', overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
