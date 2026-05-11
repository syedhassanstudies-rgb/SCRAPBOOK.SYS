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
    retro: `p-4 pb-12 border ${borderClass} ${borderColor} shadow-[2px_4px_16px_rgba(0,0,0,0.15)] relative mb-4 self-start group ${className} ${textColor} ${fontClass}`,
    minimal: `p-2 bg-white/80 backdrop-blur-sm border border-black/5 shadow-sm relative mb-4 self-start group ${className} ${textColor} ${fontClass}`,
    brutalist: `p-4 border-[4px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative mb-4 self-start group uppercase font-bold ${className} ${textColor} ${fontClass}`,
    y2k: `p-3 rounded-[1rem] border-2 border-pink-300 shadow-[0_0_15px_rgba(255,105,180,0.3)] bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-md relative mb-4 self-start group ${className} ${textColor} ${fontClass}`
  };

  const imgClasses = {
    retro: `w-full h-auto object-cover grayscale-[0.4] contrast-[1.1] sepia-[0.4] saturate-[0.8] brightness-95 transition-all duration-700 ease-out group-hover:grayscale-[0.1] group-hover:contrast-125 group-hover:sepia-[0.2] group-hover:scale-105`,
    minimal: `w-full h-auto object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.02]`,
    brutalist: `w-full h-auto object-cover grayscale contrast-150 transition-all duration-300 group-hover:grayscale-0 group-hover:contrast-100 group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] group-hover:-translate-x-1`,
    y2k: `w-full h-auto object-cover rounded-lg border border-purple-200 transition-all duration-500 group-hover:scale-110`
  };

  return (
    <motion.figure
      initial={{ opacity: 0, y: 20, rotate: rotation }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      whileHover={theme === 'minimal' ? { scale: 1.01, rotate: 0, zIndex: 50, transition: { duration: 0.6, ease: "easeOut" } } : { scale: 1.05, rotate: 0, zIndex: 50, transition: { duration: 0.4 } }}
      className={themeClasses[theme]}
      style={{ 
        backgroundColor: theme === 'y2k' ? undefined : (bgColor || '#fffffb'),
        backgroundImage: theme === 'retro' ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")` : undefined
      }}
    >
      {theme === 'retro' && (
        <Tape color="primary" rotation={-3} className="-top-3 left-1/2 -translate-x-1/2 w-14 h-5 opacity-70 mix-blend-multiply" />
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

      <div className={`relative overflow-hidden ${theme === 'minimal' ? 'rounded-[2px]' : `border ${borderColor}`}`}>
        <img
          src={src}
          alt={caption || 'Polaroid'}
          className={imgClasses[theme]}
        />
        {theme === 'retro' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-tr from-[#994a00]/20 via-transparent to-[#0033cc]/10 pointer-events-none mix-blend-overlay" />
            <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.3)] pointer-events-none" />
          </>
        )}
      </div>
      {caption && (
        <figcaption className={`mt-4 text-center ${theme === 'retro' ? 'font-mono text-xs italic tracking-tight opacity-80' : 'text-xs text-paper-ink/70'} ${theme === 'brutalist' ? 'uppercase font-bold tracking-wider' : ''} ${textColor}`}>
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}
