import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
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
  theme?: 'retro' | 'minimal' | 'brutalist' | 'y2k';
}

export function Polaroid({ src, caption, rotation = 2, className, bgColor, fontFamily, borderStyle, theme = 'retro' }: PolaroidProps) {
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';

  const themeClasses = {
    retro: `p-3 pb-10 border-[3px] ${borderClass} ${borderColor} analog-shadow relative mb-4 self-start group ${className} ${textColor} ${fontClass}`,
    minimal: `p-2 rounded-2xl border ${borderClass} border-opacity-20 shadow-xl relative mb-4 self-start group ${className} ${textColor} ${fontClass}`,
    brutalist: `p-4 border-[4px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative mb-4 self-start group uppercase font-bold ${className} ${textColor} ${fontClass}`,
    y2k: `p-3 rounded-[1rem] border-2 border-pink-300 shadow-[0_0_15px_rgba(255,105,180,0.3)] bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-md relative mb-4 self-start group ${className} ${textColor} ${fontClass}`
  };

  const imgClasses = {
    retro: `w-full h-auto object-cover grayscale contrast-125 sepia-[.2] transition-all duration-700 group-hover:grayscale-[0.2] group-hover:contrast-110 group-hover:sepia-[.1] group-hover:scale-105`,
    minimal: `w-full h-auto object-cover rounded-xl transition-all duration-500 group-hover:scale-105`,
    brutalist: `w-full h-auto object-cover grayscale contrast-150 transition-all duration-300 group-hover:grayscale-0 group-hover:contrast-100 group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] group-hover:-translate-x-1`,
    y2k: `w-full h-auto object-cover rounded-lg border border-purple-200 transition-all duration-500 group-hover:scale-110`
  };

  return (
    <motion.figure
      initial={{ opacity: 0, y: 20, rotate: rotation }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      whileHover={{ scale: 1.05, rotate: 0, zIndex: 50, transition: { duration: 0.4 } }}
      className={themeClasses[theme]}
      style={{ backgroundColor: theme === 'y2k' ? undefined : (bgColor || '#fffffb') }}
    >
      {theme === 'retro' && (
        <Tape color="primary" rotation={-3} className="-top-3 left-1/2 -translate-x-1/2 w-14 h-5 opacity-80" />
      )}
      
      {theme === 'y2k' && (
        <div className="absolute -top-3 -left-3 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)] z-10 animate-pulse">
           <Sparkles size={24} fill="currentColor" />
        </div>
      )}

      {theme === 'y2k' && (
        <div className="absolute -bottom-2 -right-2 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] z-10 animate-pulse delay-150">
           <Sparkles size={20} fill="currentColor" />
        </div>
      )}

      <div className={`relative overflow-hidden ${theme === 'minimal' ? '' : `border ${borderColor}`}`}>
        <img
          src={src}
          alt={caption || 'Polaroid'}
          className={imgClasses[theme]}
        />
        {theme === 'retro' && <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none mix-blend-overlay" />}
      </div>
      {caption && (
        <figcaption className={`mt-4 text-center ${theme === 'retro' ? 'font-mono text-[12px] italic tracking-tight' : 'text-sm'} ${theme === 'brutalist' ? 'uppercase font-bold tracking-wider' : ''} ${textColor}`}>
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}
