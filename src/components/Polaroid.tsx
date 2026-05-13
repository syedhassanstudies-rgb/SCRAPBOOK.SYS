import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Tape } from './Tape';
import { getContrastText, getContrastBorder } from '../lib/utils';

interface PolaroidProps {
  src: string;
  caption?: string;
  rotation?: number;
  className?: string;
  design?: string;
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  theme?: string;
}

export function Polaroid({ src, caption, rotation = 2, className, design, bgColor, fontFamily, borderStyle, theme = 'retro' }: PolaroidProps) {
  const activeTheme = design || theme;
  
  const isBrutalist = activeTheme === 'brutalist';
  const isMinimal = activeTheme === 'minimal';
  const isY2k = activeTheme === 'y2k';
  const isStandard = activeTheme === 'standard';
  const isFilmFrame = activeTheme === 'film-frame';
  const isPhotobooth = activeTheme === 'photobooth';
  const isRetro = activeTheme === 'retro' || (!isBrutalist && !isMinimal && !isY2k && !isStandard && !isFilmFrame && !isPhotobooth);
  
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';

  if (isPhotobooth) {
    return (
      <motion.figure
        initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
        animate={{ opacity: 1, scale: 1, rotate: rotation }}
        whileHover={{ scale: 1.05, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
        className={`p-3 pb-6 bg-white shadow-xl border border-gray-200 relative mb-4 self-start flex flex-col gap-3 group ${className} ${textColor} ${fontClass}`}
        style={{ backgroundColor: bgColor || '#fff' }}
      >
        <div className="absolute top-0 bottom-0 left-0 w-full shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] pointer-events-none z-10" />
        {[1, 2, 3].map((num) => (
           <div key={num} className="w-[180px] sm:w-[220px] aspect-[4/5] bg-black overflow-hidden relative">
              <img src={src} className={`w-full h-full object-cover grayscale-[0.2] contrast-125 sepia-[0.1] mix-blend-luminosity opacity-90 transition-transform duration-500 group-hover:scale-105`} />
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-blue-500/10 mix-blend-overlay" />
           </div>
        ))}
        {caption && (
          <figcaption className="text-center font-bold text-xs uppercase tracking-[0.2em] mt-2 opacity-60">
             {caption}
          </figcaption>
        )}
      </motion.figure>
    );
  }

  if (isFilmFrame) {
    return (
      <motion.figure
        initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
        animate={{ opacity: 1, scale: 1, rotate: rotation }}
        whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
        className={`p-8 bg-[#111] shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative mb-4 self-start group ${className} ${fontClass} border border-black/50`}
      >
        {/* Film sprockets (holes) */}
        <div className="absolute top-0 bottom-0 left-2 w-3 flex flex-col justify-between py-2">
            {[...Array(12)].map((_, i) => <div key={i} className="w-full h-4 bg-white/10 rounded-[1px] border border-black/40" />)}
        </div>
        <div className="absolute top-0 bottom-0 right-2 w-3 flex flex-col justify-between py-2">
            {[...Array(12)].map((_, i) => <div key={i} className="w-full h-4 bg-white/10 rounded-[1px] border border-black/40" />)}
        </div>
        
        {/* Content */}
        <div className="w-[240px] sm:w-[320px] aspect-[3/2] bg-black relative border border-white/5 overflow-hidden">
           <img src={src} className="w-full h-full object-cover contrast-[1.2] brightness-90 grayscale-[0.5] sepia-[0.3]" />
           <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,1)]" />
        </div>
        
        {/* Details */}
        {caption && (
          <div className="absolute bottom-2 left-10 flex gap-4 text-[#ff9900] font-mono text-[8px] sm:text-[10px] tracking-widest opacity-80 uppercase">
             <span>{caption}</span>
             <span>KODAK 400</span>
             <span>FRAME 24A</span>
          </div>
        )}
      </motion.figure>
    );
  }

  const themeClasses: Record<string, string> = {
    retro: `p-4 pb-12 border ${borderClass} ${borderColor} shadow-[2px_4px_16px_rgba(0,0,0,0.15)] relative mb-4 self-start group ${className} ${textColor} ${fontClass}`,
    minimal: `p-2 bg-white/80 backdrop-blur-sm border border-black/5 shadow-sm relative mb-4 self-start group ${className} ${textColor} ${fontClass}`,
    brutalist: `p-4 border-[4px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative mb-4 self-start group uppercase font-bold ${className} text-black ${fontClass} bg-white`,
    y2k: `p-3 rounded-[1rem] border-2 border-pink-300 shadow-[0_0_15px_rgba(255,105,180,0.3)] bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-md relative mb-4 self-start group ${className} ${textColor} ${fontClass}`,
    standard: `p-4 pb-12 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-white relative mb-4 self-start group ${className} text-black ${fontClass}`
  };

  const imgClasses: Record<string, string> = {
    retro: `w-full h-auto object-cover grayscale-[0.4] contrast-[1.1] sepia-[0.4] saturate-[0.8] brightness-95 transition-all duration-700 ease-out group-hover:grayscale-[0.1] group-hover:contrast-125 group-hover:sepia-[0.2] group-hover:scale-105`,
    minimal: `w-full h-auto object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.02]`,
    brutalist: `w-full h-auto object-cover grayscale contrast-150 transition-all duration-300 group-hover:grayscale-0 group-hover:contrast-100 group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] group-hover:-translate-x-1`,
    y2k: `w-full h-auto object-cover rounded-lg border border-purple-200 transition-all duration-500 group-hover:scale-110`,
    standard: `w-full h-auto object-cover border border-black transition-all duration-300 group-hover:scale-[1.03]`
  };

  const getTypeStyleClass = () => themeClasses[activeTheme] || themeClasses['retro'];
  const getImgStyleClass = () => imgClasses[activeTheme] || imgClasses['retro'];

  return (
    <motion.figure
      initial={{ opacity: 0, y: 20, rotate: rotation }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      whileHover={isMinimal ? { scale: 1.01, rotate: 0, zIndex: 50, transition: { duration: 0.6, ease: "easeOut" } } : { scale: 1.05, rotate: 0, zIndex: 50, transition: { duration: 0.4 } }}
      className={getTypeStyleClass()}
      style={{ 
        backgroundColor: (isY2k || isBrutalist || isStandard) ? undefined : (bgColor || '#fffffb'),
        backgroundImage: isRetro ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")` : undefined
      }}
    >
      {isRetro && (
        <Tape color="primary" rotation={-3} className="-top-3 left-1/2 -translate-x-1/2 w-14 h-5 opacity-70 mix-blend-multiply" />
      )}
      
      {isY2k && (
        <div className="absolute -top-3 -left-3 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)] z-10 animate-pulse">
           <Sparkles size={24} fill="currentColor" />
        </div>
      )}

      {isY2k && (
        <div className="absolute -bottom-2 -right-2 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] z-10 animate-pulse delay-150">
           <Sparkles size={20} fill="currentColor" />
        </div>
      )}

      <div className={`relative overflow-hidden ${isMinimal ? 'rounded-[2px]' : isStandard || isBrutalist ? '' : `border ${borderColor}`}`}>
        <img
          src={src}
          alt={caption || 'Polaroid'}
          className={getImgStyleClass()}
        />
        {isRetro && (
          <>
            <div className="absolute inset-0 bg-gradient-to-tr from-[#994a00]/20 via-transparent to-[#0033cc]/10 pointer-events-none mix-blend-overlay" />
            <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.3)] pointer-events-none" />
          </>
        )}
      </div>
      {caption && (
        <figcaption className={`mt-4 text-center ${isRetro ? 'font-mono text-xs italic tracking-tight opacity-80' : isStandard ? 'text-[13px] text-black font-semibold' : 'text-xs text-paper-ink/70'} ${isBrutalist ? 'uppercase font-bold tracking-wider text-black' : ''} ${textColor}`}>
          {caption}
        </figcaption>
      )}
    </motion.figure>
  );
}
