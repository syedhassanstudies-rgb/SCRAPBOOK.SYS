import { Play, SkipBack, SkipForward, Music, Disc, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Tape } from './Tape';
import { getContrastText, getContrastBorder } from '../lib/utils';
import { findSpotifyAlbumArt } from '../services/spotifyService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MusicWidgetProps {
  id?: string;
  userId?: string;
  song: string;
  artist: string;
  albumArt?: string;
  rotation?: number;
  design?: 'standard' | 'minimal' | 'cassette' | 'vinyl' | 'y2k' | 'cd' | 'mini-disc';
  color?: 'primary' | 'secondary' | 'tertiary' | 'yellow';
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  theme?: 'retro' | 'minimal' | 'brutalist' | 'y2k';
}

export function MusicWidget({ id, userId, song, artist, albumArt: initialAlbumArt, rotation = 2, design = 'standard', color = 'tertiary', bgColor, fontFamily, borderStyle, theme = 'retro' }: MusicWidgetProps) {
  const [albumArt, setAlbumArt] = useState<string | null>(initialAlbumArt || null);
  const [loading, setLoading] = useState(!initialAlbumArt && song !== 'Song Title');

  useEffect(() => {
    if (initialAlbumArt) {
      setAlbumArt(initialAlbumArt);
      setLoading(false);
    } else if (song && song !== 'Song Title') {
      setLoading(true);
      findSpotifyAlbumArt(song, artist).then(async (url) => {
        setAlbumArt(url);
        setLoading(false);
        if (url && id && userId) {
          try {
            await updateDoc(doc(db, 'users', userId, 'pieces', id), {
              'data.albumArt': url
            });
          } catch (e) {
            console.error("Error updates music albumart", e);
          }
        }
      });
    }
  }, [initialAlbumArt, song, artist, id, userId]);

  const isCassette = design === 'cassette';
  const isVinyl = design === 'vinyl';
  const isCd = design === 'cd';
  const isMiniDisc = design === 'mini-disc';
  const isStandard = design === 'standard';
  
  // Custom design overrides theme
  const isStructuralDesign = isCassette || isVinyl || isCd || isMiniDisc;
  
  // Otherwise use the theme
  const activeStyle = isStructuralDesign ? design : theme;
  
  const isMinimal = activeStyle === 'minimal' || design === 'minimal';
  const isY2K = activeStyle === 'y2k' || design === 'y2k';
  const isBrutalist = activeStyle === 'brutalist';
  const isRetro = activeStyle === 'retro';
  
  const cassetteBg = bgColor || '#2a2a2a';
  const vinylLabelBg = bgColor || '#ff4444';
  const cdBg = bgColor || '#e2e8f0';
  
  const effectiveBg = isCassette ? cassetteBg : isVinyl ? '#111111' : (isCd || isMiniDisc) ? cdBg : bgColor;
  const textColor = getContrastText(effectiveBg);
  const borderColor = getContrastBorder(effectiveBg);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
      className={`
        relative w-full max-w-xs transition-all mb-4 group ${fontClass}
        ${isCassette ? `p-4 rounded-md border border-white/20 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] analog-shadow ${textColor}` : ''}
        ${isVinyl ? 'bg-[#111] text-white p-6 rounded-full aspect-square flex flex-col items-center justify-center border-4 border-[#222] shadow-[4px_4px_15px_rgba(0,0,0,0.3)]' : ''}
        ${isCd ? `bg-gradient-to-tr from-gray-100 to-gray-300 text-gray-900 p-6 rounded-sm border border-gray-400 border-r-8 shadow-md` : ''}
        ${isMiniDisc ? `bg-gradient-to-bl from-blue-100 to-gray-200 text-slate-800 p-4 rounded-xl border-4 border-gray-300 shadow-lg` : ''}
        ${isMinimal ? `bg-transparent border-l-2 ${borderClass} ${borderColor} p-2 ${textColor}` : ''}
        ${isY2K ? `p-md rounded-2xl border-2 border-fuchsia-400 bg-gradient-to-tr from-purple-500/20 to-pink-400/20 backdrop-blur-md shadow-[0_0_15px_rgba(232,121,249,0.3)] text-fuchsia-900 border-dashed` : ''}
        ${isBrutalist ? `border-4 border-black p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)] uppercase font-bold text-black` : ''}
        ${isRetro && !isStructuralDesign ? `border-2 ${borderClass} ${borderColor} p-md analog-shadow ${textColor}` : ''}
      `}
      style={{ backgroundColor: isCassette ? cassetteBg : (!isStructuralDesign && (isRetro || isBrutalist || isMinimal)) ? (bgColor || (isBrutalist ? '#fff' : '#fdfcf8')) : undefined }}
    >
      {isCassette && (
         <>
           <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3/4 h-6 border-b border-white/10 rounded-t-lg bg-black/20 overflow-hidden">
             <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4">
               <div className="w-16 h-16 rounded-full border-4 border-white/5 opacity-50" />
               <div className="w-16 h-16 rounded-full border-4 border-white/5 opacity-50" />
             </div>
           </div>
         </>
      )}
      {!isVinyl && !isCd && !isMiniDisc && !isMinimal && !isY2K && (
        <Tape color={color} rotation={0} className="-top-3 left-1/2 -translate-x-1/2 w-12 h-5 opacity-80" />
      )}
      
      {isY2K && (
        <div className="absolute -top-3 -right-3 text-pink-400 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)] animate-pulse">
           <Sparkles size={24} fill="currentColor" />
        </div>
      )}

      {isY2K && (
        <div className={`flex items-center justify-between border-b border-dashed border-fuchsia-300 pb-sm mb-sm opacity-80`}>
          <span className="font-bold text-[10px] uppercase font-mono tracking-widest text-fuchsia-600">~* Now Playing *~</span>
          <Music size={14} className="text-pink-500" />
        </div>
      )}

      {!isVinyl && !isCd && !isMiniDisc && !isMinimal && !isY2K && (
        <div className={`flex items-center justify-between border-b border-dashed ${borderColor} pb-sm mb-sm opacity-60`}>
          <span className="font-bold text-[10px] uppercase">Now Playing</span>
          <Music size={14} />
        </div>
      )}

      {isCd && (
         <div className="flex items-center justify-between border-b border-solid border-gray-400 pb-sm mb-sm">
           <span className="font-bold text-[10px] uppercase tracking-widest text-gray-500">Compact Disc Digital Audio</span>
           <Disc size={14} className="text-gray-400" />
         </div>
      )}

      {isMiniDisc && (
         <div className="flex items-center justify-between border-b-2 border-solid border-gray-300 pb-sm mb-sm">
           <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500">MD</span>
           <div className="flex gap-1">
             <div className="w-2 h-2 rounded-full bg-red-400" />
             <div className="w-2 h-2 rounded-full bg-blue-400" />
           </div>
         </div>
      )}

      <div className={`flex items-center gap-md ${isVinyl || isCd ? 'flex-col text-center' : ''} ${isMiniDisc ? 'flex-row-reverse' : ''}`}>
        <div className={`
          shrink-0 flex items-center justify-center
          ${isVinyl ? 'w-32 h-32 rounded-full border-4 border-[#333] bg-[#000] relative' : ''}
          ${isCd ? 'w-24 h-24 rounded-full border-8 border-gray-100 bg-gradient-to-tr from-cyan-100 to-purple-100 relative shadow-inner overflow-hidden' : ''}
          ${isMiniDisc ? 'w-16 h-16 rounded-md border-2 border-blue-200 bg-blue-50 relative overflow-hidden' : ''}
          ${!isVinyl && !isCd && !isMiniDisc ? `w-16 h-16 bg-white border ${isY2K ? 'border-pink-300 rounded-lg shadow-inner' : borderColor}` : ''}
          ${isCassette ? 'grayscale contrast-125' : ''}
        `}>
          {isVinyl && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
               <div className="w-full h-full rounded-full border border-white/10" />
               <div className="absolute w-24 h-24 rounded-full border border-white/5" />
               <div className="absolute w-16 h-16 rounded-full border border-white/5" />
            </div>
          )}
          {isCd && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-12 h-12 rounded-full border border-white/40" />
              <div className="w-4 h-4 rounded-full bg-gray-100 border border-gray-300 z-20 shadow-sm" />
            </div>
          )}
          {loading ? (
             <div className={`
               flex items-center justify-center animate-pulse
               ${(isVinyl || isCd) ? 'w-12 h-12 rounded-full z-10 shadow-sm' : isMiniDisc ? 'w-8 h-8 rounded-full' : `w-10 h-10 border-2 ${borderColor} rounded-full`}
             `}
             style={{ backgroundColor: isVinyl ? vinylLabelBg : isCd ? '#fff' : undefined }}>
               <Disc size={20} className="opacity-30" />
             </div>
          ) : albumArt ? (
            <div className={`relative ${isVinyl ? 'w-12 h-12 rounded-full z-10 overflow-hidden' : isCd ? 'w-full h-full opacity-60 mix-blend-multiply rounded-full' : 'w-full h-full'}`}>
              <img src={albumArt} alt={song} className={`object-cover w-full h-full ${isMiniDisc ? 'rounded-md' : ''}`} />
              {isVinyl && (
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-2 h-2 rounded-full bg-[#111] z-20 shadow-sm" />
                   <div className="absolute inset-1 rounded-full border border-white/20" />
                 </div>
              )}
            </div>
          ) : (
            <div 
              className={`
                flex items-center justify-center relative
                ${isVinyl ? 'w-12 h-12 rounded-full z-10 shadow-sm' : `w-10 h-10 border-2 ${borderColor} rounded-full`}
              `}
              style={{ backgroundColor: isVinyl ? vinylLabelBg : undefined }}
            >
               <div className={`w-2 h-2 rounded-full ${isVinyl ? 'bg-[#111] z-20' : borderColor.replace('border-', 'bg-').replace('/30', '')}`} />
               {isVinyl && (
                 <div className="absolute inset-1 rounded-full border border-white/20" />
               )}
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
