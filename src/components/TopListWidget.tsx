import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Tape } from './Tape';
import { Music, Film, Star, Sparkles } from 'lucide-react';
import { findMoviePoster } from '../services/movieService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getContrastText, getContrastBorder } from '../lib/utils';

interface TopListWidgetProps {
  id?: string;
  userId?: string;
  title: string;
  items: string[];
  posters?: string[];
  type: 'songs' | 'movies' | 'generic';
  rotation?: number;
  color?: 'primary' | 'secondary' | 'tertiary' | 'yellow';
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  theme?: 'retro' | 'minimal' | 'brutalist' | 'y2k';
}

function TopListItem({ item, i, type, id, userId, posters = [], textColor, borderColor, theme = 'retro' }: { item: string, i: number, type: string, id?: string, userId?: string, posters?: string[], textColor: string, borderColor: string, theme?: string }) {
  const [poster, setPoster] = useState<string | null>(posters[i] || null);

  useEffect(() => {
    if (type === 'movies' && !poster && item) {
      findMoviePoster(item).then(url => {
        if (url) {
          setPoster(url);
          if (id && userId) {
            const newPosters = [...posters];
            newPosters[i] = url;
            updateDoc(doc(db, 'users', userId, 'pieces', id), {
              'data.posters': newPosters
            }).catch(console.error);
          }
        }
      });
    }
  }, [item, type, poster, id, userId, i]);

  return (
    <li className="flex gap-4 items-center group/item transition-all hover:translate-x-1">
      <span className={`font-mono text-[10px] w-4 font-bold flex-shrink-0 text-right ${theme === 'y2k' ? 'text-pink-500' : `${textColor} opacity-40`}`}>
        {(i + 1).toString().padStart(2, '0')}
      </span>
      {type === 'movies' && (
        <div className={`w-8 h-10 border flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm relative ${theme === 'y2k' ? 'bg-fuchsia-500/20 border-fuchsia-300 rounded' : `bg-paper-outline/10 ${borderColor}`}`}>
           {poster ? (
             <img src={poster} alt="" className={`w-full h-full object-cover ${theme === 'retro' ? 'grayscale contrast-125 sepia-[.2] group-hover/item:grayscale-[0.2]' : ''} transition-colors`} referrerPolicy="no-referrer" />
           ) : (
             <Film size={12} className={theme === 'y2k' ? 'text-fuchsia-400 opacity-60' : 'opacity-30'} />
           )}
        </div>
      )}
      <div className={`flex-grow border-b ${theme === 'y2k' ? 'border-dashed border-pink-300' : `border-dashed ${borderColor}`} pb-1`}>
         <span className={`text-sm font-medium tracking-tight ${textColor}`}>{item}</span>
      </div>
    </li>
  );
}

export function TopListWidget({ id, userId, title, items, posters = [], type, rotation = 0, color = 'yellow', bgColor, fontFamily, borderStyle, theme = 'retro' }: TopListWidgetProps) {
  const Icon = type === 'songs' ? Music : type === 'movies' ? Film : Star;
  
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';
  
  const themeClasses = {
    retro: `p-6 border-[3px] ${borderClass} ${borderColor} analog-shadow paper-edge relative mb-4 min-w-[280px] max-w-md group ${textColor} ${fontClass}`,
    minimal: `p-6 rounded-3xl border ${borderClass} border-opacity-20 shadow-xl relative mb-4 min-w-[280px] max-w-md group ${textColor} ${fontClass}`,
    brutalist: `p-6 border-[4px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative mb-4 min-w-[280px] max-w-md group uppercase font-bold ${textColor} ${fontClass}`,
    y2k: `p-6 rounded-[2rem] border-2 border-pink-300 shadow-[0_0_20px_rgba(255,105,180,0.3)] bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-lg relative mb-4 min-w-[280px] max-w-md group ${textColor} ${fontClass}`
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20, rotate: rotation }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
      className={themeClasses[theme]}
      style={{ backgroundColor: theme === 'y2k' ? undefined : (bgColor || '#faf9f6') }}
    >
      {theme === 'retro' && <Tape color={color} rotation={-5} className="-top-3 left-1/4 w-20 h-6 opacity-90" />}
      
      {theme === 'y2k' && (
        <div className="absolute -top-3 -right-3 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)] animate-pulse">
           <Sparkles size={24} fill="currentColor" />
        </div>
      )}

      <div className={`flex items-center gap-3 border-b-2 ${theme === 'y2k' ? 'border-dashed border-pink-300 text-fuchsia-600' : borderColor} pb-3 mb-4`}>
        <div className={`p-2 rounded-full ${theme === 'y2k' ? 'bg-gradient-to-tr from-fuchsia-400 to-pink-400 text-white shadow-md border-none' : theme === 'brutalist' ? 'bg-black text-white border-2 border-black rounded-none' : theme === 'minimal' ? 'bg-gray-100 text-gray-900 border-none rounded-lg' : `${type === 'songs' ? 'bg-paper-secondary/10 text-paper-secondary' : 'bg-paper-tertiary/10 text-paper-tertiary'} border ${borderColor}`}`}>
          <Icon size={20} />
        </div>
        <h3 className={`${theme === 'retro' ? 'font-serif italic leading-none' : 'leading-tight'} text-2xl tracking-tight`}>{title}</h3>
      </div>
      
      <ol className="space-y-3">
        {items.slice(0, 10).map((item, i) => (
          <TopListItem key={i} item={item} i={i} type={type} id={id} userId={userId} posters={posters} textColor={textColor} borderColor={borderColor} theme={theme} />
        ))}
      </ol>
      
      <div className={`mt-6 pt-2 border-t ${theme === 'y2k' ? 'border-pink-300' : borderColor} flex justify-between items-center ${theme === 'y2k' ? 'opacity-70 text-pink-500' : 'opacity-30'}`}>
        <span className="font-mono text-[8px] uppercase tracking-widest">{theme === 'y2k' ? '~* ARCHIVE *~' : 'ARCHIVE // 2024'}</span>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => <div key={i} className={`w-1 h-1 ${theme === 'brutalist' ? 'rounded-none' : 'rounded-full'} bg-current ${textColor}`} />)}
        </div>
      </div>
    </motion.article>
  );
}
