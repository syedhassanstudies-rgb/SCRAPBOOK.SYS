import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Tape } from './Tape';
import { getContrastText, getContrastBorder } from '../lib/utils';

interface PolaroidProps {
  src: string;
  caption?: string;
  date?: string;
  filter?: string;
  rotation?: number;
  className?: string;
  design?: string;
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  theme?: string;
}

export function Polaroid({ src, caption, date, filter = 'default', rotation = 2, className, design, bgColor, fontFamily, borderStyle, theme = 'retro' }: PolaroidProps) {
  const isFilmFrame = design === 'film-frame';
  const isPhotobooth = design === 'photobooth';
  const isStandardDesign = !isFilmFrame && !isPhotobooth;

  // Only apply theme styling if it's the standard design
  const activeTheme = isStandardDesign ? theme : 'standard';
  
  const isBrutalist = activeTheme === 'brutalist';
  const isMinimal = activeTheme === 'minimal';
  const isY2k = activeTheme === 'y2k';
  const isGothic = activeTheme === 'gothic';
  const isMedieval = activeTheme === 'medieval';
  const isScrapbook = activeTheme === 'scrapbook';
  const isStandard = activeTheme === 'standard' && !isFilmFrame && !isPhotobooth;
  const isRetro = activeTheme === 'retro' || (!isBrutalist && !isMinimal && !isY2k && !isGothic && !isMedieval && !isScrapbook && !isStandard && !isFilmFrame && !isPhotobooth);
  
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';

  const getCustomFilterClass = (defaultFilter: string) => {
    switch (filter) {
      case 'none': return '';
      case 'sepia': return 'sepia contrast-110';
      case 'bw': return 'grayscale contrast-125';
      case 'vintage': return 'sepia-[0.4] contrast-[1.1] saturate-[1.2] brightness-95 hue-rotate-[-10deg]';
      case 'cool': return 'saturate-[0.8] contrast-[1.1] brightness-105 hue-rotate-[15deg]';
      default: return defaultFilter;
    }
  };

  if (isPhotobooth) {
    const defaultPhotoFilter = 'grayscale-[0.2] contrast-125 sepia-[0.1]';
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
              <img src={src} className={`w-full h-full object-cover ${getCustomFilterClass(defaultPhotoFilter)} mix-blend-luminosity opacity-90 transition-transform duration-500 group-hover:scale-105`} />
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-blue-500/10 mix-blend-overlay" />
           </div>
        ))}
        {caption && (
          <figcaption className="text-center font-bold text-xs uppercase tracking-[0.2em] mt-2 opacity-60 flex flex-col gap-1 items-center">
             <span>{caption}</span>
             {date && <span className="font-mono text-[8px] tracking-widest opacity-70">{date}</span>}
          </figcaption>
        )}
      </motion.figure>
    );
  }

  if (isFilmFrame) {
    const defaultFilmFilter = 'contrast-[1.2] brightness-90 grayscale-[0.5] sepia-[0.3]';
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
           <img src={src} className={`w-full h-full object-cover ${getCustomFilterClass(defaultFilmFilter)}`} />
           <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,1)]" />
        </div>
        
        {/* Details */}
        {(caption || date) && (
          <div className="absolute bottom-2 left-10 flex gap-4 text-[#ff9900] font-mono text-[8px] sm:text-[10px] tracking-widest opacity-80 uppercase">
             {caption && <span>{caption}</span>}
             {date && <span>{date}</span>}
             {!caption && !date && (
               <>
                 <span>KODAK 400</span>
                 <span>FRAME 24A</span>
               </>
             )}
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
    gothic: `p-4 border border-x-4 border-double ${borderColor} bg-black/90 shadow-[0_0_20px_rgba(0,0,0,0.9)] relative mb-4 self-start group ${className} text-red-100 ${fontClass}`,
    medieval: `p-5 bg-[#d4c3a9]/90 border-[6px] border-[#8b7355] shadow-[5px_5px_15px_rgba(0,0,0,0.5)] rounded-tl-xl rounded-br-xl relative mb-4 self-start group ${className} text-[#4a3b2c] ${fontClass}`,
    scrapbook: `p-4 pb-10 bg-white border border-gray-200 shadow-[2px_2px_10px_rgba(0,0,0,0.1)] -rotate-3 relative mb-4 self-start group ${className} text-gray-800 ${fontClass}`,
    standard: `p-4 pb-12 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-white relative mb-4 self-start group ${className} text-black ${fontClass}`
  };

  const baseImgClasses: Record<string, string> = {
    retro: `w-full h-auto object-cover transition-all duration-700 ease-out group-hover:scale-105`,
    minimal: `w-full h-auto object-cover transition-all duration-[800ms] ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.02]`,
    brutalist: `w-full h-auto object-cover transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] group-hover:-translate-x-1`,
    y2k: `w-full h-auto object-cover rounded-lg border border-purple-200 transition-all duration-500 group-hover:scale-110`,
    gothic: `w-full h-auto object-cover border border-red-900/50 transition-all duration-500 group-hover:grayscale-0 group-hover:brightness-110`,
    medieval: `w-full h-auto object-cover border-4 border-[#8b7355]/40 rounded-sm transition-all duration-700 hover:sepia-0 hover:saturate-100`,
    scrapbook: `w-full h-auto object-cover border border-gray-100 transition-all duration-300 group-hover:rotate-1`,
    standard: `w-full h-auto object-cover border border-black transition-all duration-300 group-hover:scale-[1.03]`
  };

  const defaultFilterClasses: Record<string, string> = {
    retro: `grayscale-[0.4] contrast-[1.1] sepia-[0.4] saturate-[0.8] brightness-95 group-hover:grayscale-[0.1] group-hover:contrast-125 group-hover:sepia-[0.2]`,
    minimal: ``,
    brutalist: `grayscale contrast-150 group-hover:grayscale-0 group-hover:contrast-100`,
    y2k: ``,
    gothic: `grayscale-[0.8] contrast-125 brightness-90`,
    medieval: `sepia-[0.6] contrast-[1.15] brightness-95`,
    scrapbook: `contrast-[1.05] saturate-[1.1] brightness-105`,
    standard: ``
  };

  const getTypeStyleClass = () => themeClasses[activeTheme] || themeClasses['retro'];
  const getImgStyleClass = () => `${baseImgClasses[activeTheme] || baseImgClasses['retro']} ${getCustomFilterClass(defaultFilterClasses[activeTheme] || '')}`;

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
      {(caption || date) && (
        <figcaption className={`mt-4 text-center ${isRetro ? 'font-mono text-xs italic tracking-tight opacity-80' : isStandard ? 'text-[13px] text-black font-semibold' : 'text-xs text-paper-ink/70'} ${isBrutalist ? 'uppercase font-bold tracking-wider text-black' : ''} ${textColor} flex flex-col gap-1 items-center`}>
          {caption && <span>{caption}</span>}
          {date && <span className={`text-[10px] ${isRetro ? 'opacity-60' : 'opacity-50'} font-mono uppercase tracking-widest`}>{date}</span>}
        </figcaption>
      )}
    </motion.figure>
  );
}
