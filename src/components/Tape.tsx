import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface TapeProps {
  className?: string;
  color?: 'secondary' | 'tertiary' | 'primary' | 'yellow';
  rotation?: number;
}

export function Tape({ className, color = 'yellow', rotation = -6 }: TapeProps) {
  const colorClasses = {
    secondary: 'bg-paper-secondary/60',
    tertiary: 'bg-paper-tertiary/60',
    primary: 'bg-paper-outline/40',
    yellow: 'bg-tape-yellow/80',
  };

  return (
    <div
      className={cn(
        "absolute mix-blend-multiply shadow-sm z-30 pointer-events-none backdrop-blur-[1px]",
        colorClasses[color],
        className
      )}
      style={{ 
        transform: `rotate(${rotation}deg)`,
        clipPath: 'polygon(0% 4%, 2% 2%, 5% 5%, 8% 1%, 11% 6%, 15% 0%, 18% 5%, 21% 1%, 25% 6%, 28% 2%, 31% 5%, 34% 1%, 38% 6%, 42% 1%, 45% 6%, 48% 0%, 52% 5%, 55% 1%, 58% 6%, 62% 2%, 65% 5%, 68% 1%, 72% 6%, 75% 2%, 78% 6%, 82% 1%, 85% 5%, 88% 2%, 91% 6%, 95% 1%, 98% 5%, 100% 2%, 100% 96%, 98% 99%, 95% 95%, 92% 98%, 88% 94%, 85% 99%, 82% 95%, 78% 98%, 75% 94%, 72% 99%, 68% 94%, 65% 98%, 62% 95%, 58% 99%, 55% 94%, 52% 98%, 48% 95%, 45% 99%, 42% 94%, 38% 98%, 35% 94%, 31% 98%, 28% 95%, 25% 99%, 21% 94%, 18% 98%, 15% 95%, 12% 99%, 8% 95%, 5% 98%, 2% 94%, 0% 98%)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
    </div>
  );
}
