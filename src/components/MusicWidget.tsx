import { Play, SkipBack, SkipForward, Music, Disc } from 'lucide-react';
import { motion } from 'motion/react';
import { Tape } from './Tape';
import { getContrastText, getContrastBorder } from '../lib/utils';

interface MusicWidgetProps {
  song: string;
  artist: string;
  albumArt?: string;
  rotation?: number;
  design?: 'standard' | 'minimal' | 'cassette' | 'vinyl';
  color?: 'primary' | 'secondary' | 'tertiary' | 'yellow';
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
}

export function MusicWidget({ song, artist, albumArt, rotation = 2, design = 'standard', color = 'tertiary', bgColor, fontFamily, borderStyle }: MusicWidgetProps) {
  const isCassette = design === 'cassette';
  const isVinyl = design === 'vinyl';
  const isMinimal = design === 'minimal';
  
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
      className={`
        relative w-full max-w-xs transition-all mb-4 group ${fontClass}
        ${isCassette ? 'bg-paper-ink text-white p-4 rounded-sm border-2 border-paper-outline analog-shadow' : ''}
        ${isVinyl ? 'bg-[#111] text-white p-6 rounded-full aspect-square flex flex-col items-center justify-center border-4 border-[#222] shadow-[4px_4px_15px_rgba(0,0,0,0.3)]' : ''}
        ${isMinimal ? `bg-transparent border-l-2 ${borderClass} ${borderColor} p-2 ${textColor}` : ''}
        ${design === 'standard' ? `border-2 ${borderClass} ${borderColor} p-md analog-shadow ${textColor}` : ''}
      `}
      style={{ backgroundColor: design === 'standard' ? (bgColor || '#fdfcf8') : undefined }}
    >
      {!isVinyl && !isMinimal && (
        <Tape color={color} rotation={0} className="-top-3 left-1/2 -translate-x-1/2 w-12 h-5 opacity-80" />
      )}
      
      {!isVinyl && !isMinimal && (
        <div className={`flex items-center justify-between border-b border-dashed ${borderColor} pb-sm mb-sm opacity-60`}>
          <span className="font-bold text-[10px] uppercase">Now Playing</span>
          <Music size={14} />
        </div>
      )}

      <div className={`flex items-center gap-md ${isVinyl ? 'flex-col text-center' : ''}`}>
        <div className={`
          shrink-0 flex items-center justify-center
          ${isVinyl ? 'w-32 h-32 rounded-full border-4 border-[#333] bg-[#000] relative' : `w-16 h-16 bg-white border ${borderColor}`}
          ${isCassette ? 'grayscale contrast-125' : ''}
        `}>
          {isVinyl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
               <div className="w-full h-full rounded-full border border-white/10" />
               <div className="absolute w-24 h-24 rounded-full border border-white/5" />
               <div className="absolute w-16 h-16 rounded-full border border-white/5" />
            </div>
          )}
          {albumArt ? (
            <img src={albumArt} alt={song} className={`object-cover ${isVinyl ? 'w-12 h-12 rounded-full z-10' : 'w-full h-full'}`} />
          ) : (
            <div className={`
              flex items-center justify-center
              ${isVinyl ? 'w-10 h-10 border-2 border-white/30 rounded-full z-10' : `w-10 h-10 border-2 ${borderColor} rounded-full`}
            `}>
               <div className={`w-2 h-2 rounded-full ${isVinyl ? 'bg-white/30' : borderColor.replace('border-', 'bg-').replace('/30', '')}`} />
            </div>
          )}
        </div>
        
        <div className={`flex flex-col overflow-hidden ${isMinimal ? 'pl-2' : ''}`}>
          <span className={`font-bold truncate ${isMinimal ? 'text-md' : 'text-sm'}`}>{song}</span>
          <span className={`italic truncate ${isMinimal ? 'text-[10px]' : 'text-[12px] opacity-70'}`}>{artist}</span>
        </div>
      </div>

      {!isMinimal && (
        <div className={`flex justify-center gap-md mt-md ${isCassette || isVinyl ? 'text-white/80' : textColor}`}>
          <button className="hover:scale-110 transition-transform"><SkipBack size={isVinyl ? 24 : 18} /></button>
          <button className={`border rounded-full p-1 hover:opacity-80 transition-all ${isCassette || isVinyl ? 'border-white/20' : borderColor}`}>
            <Play size={isVinyl ? 24 : 18} fill="currentColor" />
          </button>
          <button className="hover:scale-110 transition-transform"><SkipForward size={isVinyl ? 24 : 18} /></button>
        </div>
      )}
      
      {isVinyl && (
        <Disc size={16} className="absolute bottom-4 right-4 animate-spin-slow opacity-20" />
      )}
    </motion.article>
  );
}
