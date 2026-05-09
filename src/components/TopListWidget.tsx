import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Tape } from './Tape';
import { Music, Film, Star } from 'lucide-react';
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
}

function TopListItem({ item, i, type, id, userId, posters = [], textColor, borderColor }: { item: string, i: number, type: string, id?: string, userId?: string, posters?: string[], textColor: string, borderColor: string }) {
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
      <span className={`font-mono text-[10px] w-4 font-bold flex-shrink-0 text-right opacity-40 ${textColor}`}>
        {(i + 1).toString().padStart(2, '0')}
      </span>
      {type === 'movies' && (
        <div className={`w-8 h-10 border ${borderColor} flex-shrink-0 bg-paper-outline/10 flex items-center justify-center overflow-hidden shadow-sm relative`}>
           {poster ? (
             <img src={poster} alt="" className="w-full h-full object-cover grayscale contrast-125 sepia-[.2] group-hover/item:grayscale-[0.2] transition-colors" referrerPolicy="no-referrer" />
           ) : (
             <Film size={12} className="opacity-30" />
           )}
        </div>
      )}
      <div className={`flex-grow border-b border-dashed ${borderColor} pb-1`}>
         <span className={`text-sm font-medium tracking-tight ${textColor}`}>{item}</span>
      </div>
    </li>
  );
}

export function TopListWidget({ id, userId, title, items, posters = [], type, rotation = 0, color = 'yellow', bgColor, fontFamily, borderStyle }: TopListWidgetProps) {
  const Icon = type === 'songs' ? Music : type === 'movies' ? Film : Star;
  
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';
  
  return (
    <motion.article
      initial={{ opacity: 0, y: 20, rotate: rotation }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
      className={`p-6 border-[3px] ${borderClass} ${borderColor} analog-shadow paper-edge relative mb-4 min-w-[280px] max-w-md group ${textColor} ${fontClass}`}
      style={{ backgroundColor: bgColor || '#faf9f6' }}
    >
      <Tape color={color} rotation={-5} className="-top-3 left-1/4 w-20 h-6 opacity-90" />
      
      <div className={`flex items-center gap-3 border-b-2 ${borderColor} pb-3 mb-4`}>
        <div className={`p-2 rounded-full ${type === 'songs' ? 'bg-paper-secondary/10 text-paper-secondary' : 'bg-paper-tertiary/10 text-paper-tertiary'} border ${borderColor}`}>
          <Icon size={20} />
        </div>
        <h3 className="font-serif text-2xl italic tracking-tight leading-none">{title}</h3>
      </div>
      
      <ol className="space-y-3">
        {items.slice(0, 10).map((item, i) => (
          <TopListItem key={i} item={item} i={i} type={type} id={id} userId={userId} posters={posters} textColor={textColor} borderColor={borderColor} />
        ))}
      </ol>
      
      <div className={`mt-6 pt-2 border-t ${borderColor} flex justify-between items-center opacity-30`}>
        <span className="font-mono text-[8px] uppercase tracking-widest">ARCHIVE // 2024</span>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => <div key={i} className={`w-1 h-1 rounded-full bg-current ${textColor}`} />)}
        </div>
      </div>
    </motion.article>
  );
}
