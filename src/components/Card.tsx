import React from 'react';
import { motion } from 'framer-motion';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'selected' | 'correct' | 'incorrect';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  variant = 'default',
}) => {
  return (
    <motion.div
      className={`card card-${variant} ${className}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { scale: 1.02 } : {}}
    >
      {children}
    </motion.div>
  );
};

