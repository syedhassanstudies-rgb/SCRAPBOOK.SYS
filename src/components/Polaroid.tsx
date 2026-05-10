import { motion } from 'motion/react';
import { Tape } from './Tape';
import { getContrastText, getContrastBorder } from '../lib/utils';

interface PolaroidProps {
  src: string;
  caption?: string;
  rotation?: number;
  className?: string;
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
}

export function Polaroid({ src, caption, rotation = 2, className, bgColor, fontFamily, borderStyle }: PolaroidProps) {
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';

  return (
    <motion.figure
      initial={{ opacity: 0, y: 20, rotate: rotation }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      whileHover={{ scale: 1.05, rotate: 0, zIndex: 50, transition: { duration: 0.4 } }}
      className={`p-3 pb-10 border-[3px] ${borderClass} ${borderColor} analog-shadow relative mb-4 self-start group ${className} ${textColor} ${fontClass}`}
      style={{ backgroundColor: bgColor || '#fffffb' }}
    >
      <Tape color="primary" rotation={-3} className="-top-3 left-1/2 -translate-x-1/2 w-14 h-5 opacity-80" />
      <div className={`relative overflow-hidden border ${borderColor}`}>
        <img
          src={src}
          alt={caption || 'Polaroid'}
          className="w-full h-auto object-cover grayscale contrast-125 sepia-[.2] transition-all duration-700 group-hover:grayscale-[0.2] group-hover:contrast-110 group-hover:sepia-[.1] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none mix-blend-overlay" />
      </div>
      {caption && (
        <figcaption className={`font-mono text-[12px] mt-4 text-center italic tracking-tight ${textColor}`}>
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}
