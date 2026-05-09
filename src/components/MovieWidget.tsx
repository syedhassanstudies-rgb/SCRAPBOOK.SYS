import { Film, Image as ImageIcon } from 'lucide-react';
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
}

export function MovieWidget({ id, userId, title, rating, year, rotation = -2, color = 'secondary', posterUrl: initialPosterUrl, bgColor, fontFamily, borderStyle }: MovieWidgetProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(initialPosterUrl || null);
  const [loading, setLoading] = useState(!initialPosterUrl);
  
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';

  useEffect(() => {
    if (!initialPosterUrl && title && title !== 'Movie Title') {
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
      className={`p-lg border-[3px] ${borderClass} ${borderColor} analog-shadow relative w-full mb-4 max-w-sm group ${textColor} ${fontClass}`}
      style={{ backgroundColor: bgColor || '#fdfbf9' }}
    >
      <Tape color={color as any} rotation={-15} className="-top-3 -left-2 w-16 h-5 opacity-90" />
      
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-24 h-36 bg-paper-outline/10 border ${borderColor} flex-shrink-0 relative overflow-hidden shadow-sm rotate-2 group-hover:rotate-0 transition-transform duration-500`}>
           <Tape color="primary" rotation={0} className="-top-2 left-1/2 -translate-x-1/2 w-8 h-3 opacity-50" />
           {loading ? (
             <div className="absolute inset-0 animate-pulse bg-paper-outline/5 flex items-center justify-center">
                <Film size={20} className="opacity-30" />
             </div>
           ) : posterUrl ? (
             <img src={posterUrl} alt={title} className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
           ) : (
             <div className="absolute inset-0 flex items-center justify-center">
                <ImageIcon size={20} className="opacity-30" />
             </div>
           )}
        </div>

        <div className="flex flex-col flex-grow">
          <div className={`flex items-center justify-between mb-2 border-b-2 ${borderColor} pb-1`}>
             <h3 className="font-serif text-xl italic tracking-tight leading-tight">{title}</h3>
          </div>
          
          <div className="flex justify-between items-end mt-auto font-mono">
             <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold opacity-60">Year</span>
                <span className="text-sm">{year || 'N/A'}</span>
             </div>
             <div className="bg-paper-ink text-paper-base px-2 py-1 -rotate-2">
                <span className="text-[10px] uppercase font-bold text-white">Rating</span>
                <span className="block text-md font-bold leading-none text-white">{rating || '—'}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Decorative perforation */}
      <div className={`absolute top-0 right-4 bottom-0 w-px border-l-2 border-dashed ${borderColor}`} />
    </motion.article>
  );
}
