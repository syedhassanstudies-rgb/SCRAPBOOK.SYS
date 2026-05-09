import { motion } from 'motion/react';

interface DecorationProps {
  text?: string;
  rotation?: number;
  color?: 'secondary' | 'tertiary' | 'primary' | 'yellow';
}

export function Decoration({ text, rotation = -12, color = 'tertiary' }: DecorationProps) {
  const colorClasses = {
    secondary: 'bg-paper-secondary/20 border-paper-secondary/30',
    tertiary: 'bg-paper-tertiary/20 border-paper-tertiary/30',
    primary: 'bg-paper-outline/10 border-paper-outline/20',
    yellow: 'bg-tape-yellow/30 border-tape-yellow/40',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.7, scale: 1, rotate: rotation }}
      className={`w-32 h-24 border border-dashed flex items-center justify-center p-2 z-0 pointer-events-none ${colorClasses[color]}`}
    >
      <span className="font-mono text-[10px] text-center opacity-80">{text || 'cut from an old magazine'}</span>
    </motion.div>
  );
}
