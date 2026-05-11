import { Film, Image as ImageIcon, Sparkles, Disc } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Tape } from './Tape';
import { findMoviePoster } from '../services/movieService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getContrastText, getContrastBorder } from '../lib/utils';

interface MovieWidgetProps {
  id?: string;
  userId?: string;
  title: string;
  rating?: string;
  year?: string;
  rotation?: number;
  color?: 'secondary' | 'tertiary' | 'primary' | 'yellow';
  posterUrl?: string;
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  theme?: 'retro' | 'minimal' | 'brutalist' | 'y2k';
  design?: 'standard' | 'vhs' | 'dvd' | 'film-strip';
}

export function MovieWidget({ id, userId, title, rating, year, rotation = -2, color = 'secondary', posterUrl: initialPosterUrl, bgColor, fontFamily, borderStyle, theme = 'retro', design = 'standard' }: MovieWidgetProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(initialPosterUrl || null);
  const [loading, setLoading] = useState(!initialPosterUrl);
  
  const isVhs = design === 'vhs';
  const isDvd = design === 'dvd';
  const isFilmStrip = design === 'film-strip';
  const effectiveBg = isVhs ? '#111111' : isDvd ? '#e2e8f0' : (bgColor || '#fdfbf9');

  const textColor = getContrastText(effectiveBg);
  const borderColor = getContrastBorder(effectiveBg);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';

  const themeClasses = {
    retro: `p-lg border-[3px] ${borderClass} ${borderColor} analog-shadow relative w-full mb-4 max-w-sm group ${textColor} ${fontClass}`,
    minimal: `p-6 rounded-2xl border ${borderClass} border-opacity-20 shadow-xl relative w-full mb-4 max-w-sm group ${textColor} ${fontClass}`,
    brutalist: `p-6 border-[4px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative w-full mb-4 max-w-sm group uppercase font-bold ${textColor} ${fontClass}`,
    y2k: `p-6 rounded-[1rem] border-2 border-pink-300 shadow-[0_0_15px_rgba(255,105,180,0.3)] bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-md relative w-full mb-4 max-w-sm group ${textColor} ${fontClass}`
  };

  const getContainerClasses = () => {
    if (isVhs) return `p-6 rounded-sm border-y-8 border-[#333] shadow-[8px_8px_0_rgba(0,0,0,0.5)] bg-[#111] w-full mb-4 max-w-sm group text-white ${fontClass} relative`;
    if (isDvd) return `p-4 rounded-full aspect-square border-8 border-gray-300 bg-gradient-to-tr from-gray-100 to-gray-400 shadow-[2px_10px_20px_rgba(0,0,0,0.2)] w-full mb-4 max-w-sm group flex flex-col items-center justify-center text-gray-900 ${fontClass} relative`;
    if (isFilmStrip) return `p-2 px-6 border-y-[12px] border-dashed border-[#111] shadow-lg bg-white w-full mb-4 max-w-sm group text-black ${fontClass} relative`;
    return themeClasses[theme];
  };

  useEffect(() => {
    if (initialPosterUrl) {
      setPosterUrl(initialPosterUrl);
      setLoading(false);
    } else if (title && title !== 'Movie Title') {
      setLoading(true);
      findMoviePoster(title, year).then(async (url) => {
        setPosterUrl(url);
        setLoading(false);
        // Save back to Firestore if we have IDs
        if (url && id && userId) {
          try {
            await updateDoc(doc(db, 'users', userId, 'pieces', id), {
              'data.posterUrl': url
            });
          } catch (e) {
            console.error("Error updates movie poster", e);
          }
        }
      });
    }
  }, [title, year, initialPosterUrl, id, userId]);

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
      className={getContainerClasses()}
      style={{ backgroundColor: (isVhs || isDvd || theme === 'y2k') ? undefined : (bgColor || '#fdfbf9') }}
    >
      {isVhs && (
         <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3/4 h-8 border-b-4 border-[#222] rounded-t-lg bg-[#0a0a0a]" />
      )}
      
      {!isDvd && !isVhs && !isFilmStrip && theme === 'retro' && <Tape color={color as any} rotation={-15} className="-top-3 -left-2 w-16 h-5 opacity-90" />}
      
      {!isDvd && !isVhs && !isFilmStrip && theme === 'y2k' && (
        <div className="absolute -top-3 -right-3 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse">
           <Sparkles size={24} fill="currentColor" />
        </div>
      )}

      {isDvd && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full border-2 border-gray-400 bg-transparent flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full border border-gray-300 bg-white" />
          </div>
        </div>
      )}

      <div className={`flex items-start gap-4 ${isVhs ? 'bg-white p-2 mt-4 ml-2 mr-6 text-black rounded-sm relative z-10 analog-shadow' : 'mb-4'} ${isDvd ? 'hidden' : ''}`}>
        <div className={`w-24 h-36 ${theme === 'y2k' ? 'bg-fuchsia-500/10 border-fuchsia-300 rounded-lg shadow-inner' : isVhs ? 'bg-[#111] border-[#333]' : `bg-paper-outline/10 border ${borderColor}`} flex-shrink-0 relative overflow-hidden shadow-sm ${theme === 'retro' ? 'rotate-2' : ''} group-hover:rotate-0 transition-transform duration-500`}>
           {!isVhs && !isFilmStrip && theme === 'retro' && <Tape color="primary" rotation={0} className="-top-2 left-1/2 -translate-x-1/2 w-8 h-3 opacity-50" />}
           {loading ? (
             <div className="absolute inset-0 animate-pulse bg-paper-outline/5 flex items-center justify-center">
                <Film size={20} className="opacity-30" />
             </div>
           ) : posterUrl ? (
             <img src={posterUrl} alt={title} className={`w-full h-full object-cover ${theme === 'retro' ? 'grayscale contrast-125' : ''} hover:grayscale-0 transition-all duration-500`} referrerPolicy="no-referrer" />
           ) : (
             <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon size={20} className="opacity-30" />
             </div>
           )}
        </div>

        <div className="flex flex-col flex-grow">
          <div className={`flex items-center justify-between mb-2 border-b-2 ${theme === 'y2k' ? 'border-pink-300 border-dashed text-fuchsia-600' : isVhs ? 'border-black' : borderColor} pb-1`}>
             <h3 className={`${theme === 'retro' || isVhs ? 'font-serif italic tracking-tight leading-tight' : ''} text-xl ${isVhs ? 'font-bold' : ''}`}>{title}</h3>
          </div>
          
          <div className="flex justify-between items-end mt-auto font-mono">
             <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold opacity-60">Year</span>
                <span className={`text-sm ${theme === 'y2k' ? 'text-cyan-600' : ''}`}>{year || 'N/A'}</span>
             </div>
             <div className={`${theme === 'minimal' ? 'bg-gray-100 text-gray-900 rounded-md border border-gray-200' : theme === 'y2k' ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-[0_0_10px_rgba(255,105,180,0.5)] rounded-full' : isVhs ? 'bg-black text-white' : 'bg-paper-ink text-white'} px-2 py-1 ${theme === 'retro' && !isVhs ? '-rotate-2' : ''}`}>
                <span className={`text-[10px] w-full block text-center uppercase font-bold ${theme === 'minimal' ? 'text-gray-500' : 'text-white'}`}>Rating</span>
                <span className={`block text-md font-bold leading-none text-center ${theme === 'minimal' ? 'text-gray-900' : 'text-white'}`}>{rating || '—'}</span>
             </div>
          </div>
        </div>
      </div>

      {isDvd && (
        <div className="relative z-10 flex flex-col items-center justify-between h-full bg-gradient-to-tr from-gray-100/10 to-white/30 p-2 rounded-full border border-white/40 shadow-inner">
          <div className="w-20 h-[60px] rounded-t-full overflow-hidden absolute top-[10%] left-1/2 -translate-x-1/2">
            {posterUrl ? (
              <img src={posterUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-500/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-200/50" />
          </div>
          
          <div className="mt-auto mb-6 text-center z-20 max-w-[80%]">
             <h3 className="font-bold text-[11px] uppercase tracking-wide leading-tight bg-white/80 px-2 py-0.5 rounded-sm shadow-sm">{title}</h3>
          </div>
        </div>
      )}

      {/* Decorative perforation */}
      {!isVhs && !isDvd && !isFilmStrip && theme === 'retro' && <div className={`absolute top-0 right-4 bottom-0 w-px border-l-2 border-dashed ${borderColor}`} />}
    </motion.article>
  );
}
