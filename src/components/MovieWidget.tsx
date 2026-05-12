import { Film, Image as ImageIcon, Play, Disc } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { findMoviePoster } from '../services/movieService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeData } from '../lib/utils';

interface MovieWidgetProps {
  id?: string;
  userId?: string;
  title: string;
  rating?: string;
  year?: string;
  rotation?: number;
  posterUrl?: string;
  variant?: 'vhs' | 'filmstrip' | 'dvd' | 'standard';
  // Backwards compatibility props
  design?: string;
  theme?: string;
  color?: string;
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
}

export function MovieWidget({ 
  id, 
  userId, 
  title, 
  rating, 
  year, 
  rotation = 0, 
  posterUrl: initialPosterUrl, 
  variant,
  design,
  theme
}: MovieWidgetProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(initialPosterUrl || null);
  const [loading, setLoading] = useState(!initialPosterUrl);
  
  const isStandardDesign = !design || design === 'standard';
  
  // Only use theme for variant selection if design is standard
  const activeVariant = variant || (
    !isStandardDesign 
      ? (design === 'film-strip' || design === 'filmstrip' ? 'filmstrip' : 
         design === 'vhs' ? 'vhs' : 
         design === 'dvd' ? 'dvd' : 'standard')
      : (theme === 'retro' || theme === 'vhs' ? 'vhs' : 
         theme === 'dvd' ? 'dvd' : 
         theme === 'filmstrip' || theme === 'film-strip' ? 'filmstrip' : 'standard')
  );

  const isVhs = activeVariant === 'vhs';
  const isFilmstrip = activeVariant === 'filmstrip';
  const isDvd = activeVariant === 'dvd';
  
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
            await updateDoc(doc(db, 'users', userId, 'pieces', id), sanitizeData({
              'data.posterUrl': url
            }));
          } catch (e) {
            console.error("Error updating movie poster", e);
          }
        }
      });
    }
  }, [title, year, initialPosterUrl, id, userId]);

  if (activeVariant === 'standard') {
    return (
      <motion.article 
          initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
          animate={{ opacity: 1, scale: 1, rotate: rotation }}
          whileHover={{ scale: 1.02, zIndex: 50 }}
          className="w-full max-w-[320px] mb-6 relative group font-sans"
      >
        <div className="bg-white border-2 border-black p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)] flex gap-4 overflow-hidden relative">
           <div className="w-16 h-24 bg-gray-100 shrink-0 border border-black/10 overflow-hidden relative">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center animate-pulse">
                   <Film size={20} className="text-black/20" />
                </div>
              ) : posterUrl ? (
                <img src={posterUrl} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                   <Film size={20} className="text-black/10" />
                </div>
              )}
           </div>
           <div className="flex flex-col justify-center min-w-0">
              <h3 className="font-bold text-lg leading-tight truncate text-black mb-1">{title}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                  <span>{year}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-red-600"><Play size={10} fill="currentColor" /> {rating}/10</span>
              </div>
              <div className="mt-2 text-[10px] text-gray-400 font-mono italic">#movie-archive</div>
           </div>
        </div>
      </motion.article>
    );
  }

  if (activeVariant === 'vhs') {
    return (
      <motion.article 
          initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
          animate={{ opacity: 1, scale: 1, rotate: rotation }}
          whileHover={{ scale: 1.02, zIndex: 50 }}
          className="w-full max-w-[420px] min-w-[280px] mb-6 relative group"
      >
        <div className="bg-[#222] rounded-[4px] border border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative aspect-[1.5/1] p-4 flex flex-col justify-between overflow-hidden">
           {/* Texture/Depth */}
           <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-[#333] to-[#222] border-b border-black/40" />
           
           {/* Bottom Bar: Record/Counter */}
           <div className="absolute inset-x-8 bottom-4 h-10 bg-[#1a1a1a] border border-[#111] rounded-sm flex items-center justify-between px-4 z-10">
               <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_4px_#ef4444]" />
                   <div className="flex gap-1 ml-2">
                       <div className="w-1 h-4 bg-black/60 rounded-[1px]" />
                       <div className="w-1 h-4 bg-black/60 rounded-[1px]" />
                       <div className="w-1 h-4 bg-black/60 rounded-[1px]" />
                   </div>
               </div>
               <div className="font-mono text-[#777] text-[10px] font-bold tracking-widest">
                   {year || '2023'}:08:24
               </div>
           </div>
  
           {/* Middle Indent/Reels Area */}
           <div className="absolute inset-y-12 left-8 right-8 border-2 border-[#111] rounded-sm bg-[#1a1a1a] shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-between px-4 overflow-hidden">
               {/* Left Reel */}
               <div className="w-24 h-24 rounded-[4px] border-2 border-[#222] bg-[#111] flex items-center justify-center relative shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] -ml-4">
                    <div className="absolute w-16 h-16 rounded-full border border-white/5" />
                    <div className="w-8 h-8 rounded-full border-2 border-[#222] bg-transparent flex flex-col justify-between items-center py-1">
                        <div className="w-full h-px bg-[#222] rotate-45 transform origin-center" />
                        <div className="w-full h-px bg-[#222] -rotate-45 transform origin-center" />
                    </div>
               </div>
               
               {/* Vertical Line */}
               <div className="w-px h-full bg-[#111]/80 shadow-[1px_0_2px_rgba(0,0,0,0.5)]" />
  
               {/* Right Reel */}
               <div className="w-24 h-24 rounded-[4px] border-2 border-[#222] bg-[#111] flex items-center justify-center relative shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] -mr-4">
                    <div className="absolute w-16 h-16 rounded-full border border-white/5" />
                    <div className="w-8 h-8 rounded-full border-2 border-[#222] bg-transparent flex flex-col justify-center items-center">
                       <div className="w-full h-px bg-[#222]" />
                    </div>
               </div>
           </div>
  
           {/* Central Label added */}
           <div className="absolute top-8 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-[#f4f4f0] border-2 border-slate-300 rounded-sm shadow-md py-1 px-2 flex gap-3 z-20 rotate-[-1deg]">
               <div className="w-[54px] h-full bg-black shrink-0 relative overflow-hidden border border-gray-400">
                    {loading ? (
                      <div className="w-full h-full flex items-center justify-center animate-pulse bg-gray-200">
                         <Film size={16} className="opacity-30" />
                      </div>
                    ) : posterUrl ? (
                      <img src={posterUrl} className="w-full h-full object-cover grayscale contrast-125 sepia-[0.2]" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#333]">
                         <ImageIcon size={16} className="opacity-30" />
                      </div>
                    )}
               </div>
               <div className="flex flex-col flex-1 justify-center">
                    <div className="border-b border-red-500/30 pb-0.5 mb-1">
                       <h3 className="font-sans font-bold text-black uppercase text-xs leading-[1.1] line-clamp-2">{title || 'Unknown Film'}</h3>
                    </div>
                    <div className="flex gap-2 font-mono text-[9px] text-gray-600 font-bold uppercase">
                        <span>{year || '2023'}</span>
                        <span>•</span>
                        <span>{rating ? `${rating}/10` : 'RATED'}</span>
                    </div>
               </div>
               
               <div className="w-8 flex flex-col gap-1 mt-1 opacity-20">
                   <div className="h-0.5 w-full bg-black" />
                   <div className="h-0.5 w-full bg-black" />
                   <div className="h-0.5 w-full bg-black" />
                   <div className="h-0.5 w-full bg-black" />
               </div>
           </div>
  
           {/* Stickers */}
           <div className="absolute top-2 left-2 bg-blue-600 border border-black px-2 py-0.5 rotate-[-10deg] shadow-[2px_2px_0_rgba(0,0,0,1)] z-30">
               <span className="text-[7px] font-mono font-bold text-white uppercase block leading-tight">VIDEO RENTAL</span>
           </div>
  
           <div className="absolute bottom-16 right-2 bg-[#c1a01c] border border-black px-2 py-0.5 rotate-[5deg] shadow-[2px_2px_0_rgba(0,0,0,1)] z-30">
               <span className="text-[7px] font-mono font-bold text-[#111] uppercase tracking-wider">Staff Pick</span>
           </div>
        </div>
      </motion.article>
    );
  }


  if (activeVariant === 'filmstrip') {
    return (
      <motion.article 
          initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
          animate={{ opacity: 1, scale: 1, rotate: rotation }}
          whileHover={{ scale: 1.02, zIndex: 50 }}
          className="w-full max-w-[480px] mb-6 relative group"
      >
        <div className="bg-[#111] p-2 border-r-[6px] border-b-[6px] border-black shadow-[8px_8px_0_0_#b91c1c] relative overflow-hidden flex flex-col">
           {/* Top Perforations */}
           <div className="flex justify-between px-2 py-2">
              {[...Array(10)].map((_, i) => (
                  <div key={i} className="w-[14px] h-[18px] bg-[#d1d5db] border border-black/40 rounded-[1px] shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)]" />
              ))}
           </div>
  
           {/* Frames Container */}
           <div className="flex gap-3 px-1 my-2 overflow-hidden h-[240px]">
               {/* Left Empty Frame */}
               <div className="w-[90px] shrink-0 bg-white p-1 pb-4 flex flex-col justify-between -ml-[50px] shadow-lg">
                    <div className="flex-1 bg-gradient-to-tr from-[#222] to-[#333] border border-black relative overflow-hidden">
                       <div className="absolute inset-0 bg-black/40" />
                    </div>
                    <div className="h-6 mt-1 flex items-center justify-between">
                       <div className="h-2 w-12 bg-black" />
                    </div>
               </div>
  
               {/* Center Movie Frame */}
               <div className="flex-1 bg-white p-1.5 pb-6 flex flex-col relative shadow-[0_0_20px_rgba(0,0,0,1)] z-10 hover:scale-[1.02] transition-transform">
                    <div className="flex-1 w-full bg-black relative border-2 border-black overflow-hidden group/poster">
                         {loading ? (
                           <div className="w-full h-full flex items-center justify-center animate-pulse bg-zinc-900 border border-zinc-800">
                             <Film size={24} className="opacity-30 text-white" />
                           </div>
                         ) : posterUrl ? (
                           <img src={posterUrl} className="w-full h-full object-cover grayscale contrast-[1.1] transition-all duration-300 group-hover/poster:grayscale-0" />
                         ) : (
                           <div className="w-full h-full bg-gradient-to-tr from-cyan-900 to-red-900" />
                         )}
                    </div>
                    {/* Frame Footer Text */}
                    <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between font-mono">
                         <span className="text-black text-[10px] font-bold tracking-tighter uppercase truncate max-w-[65%]">{title}</span>
                         <span className="bg-[#cc0000] text-white text-[8px] font-bold px-1 py-0.5">{rating || 'G'} RATED</span>
                    </div>
               </div>
  
               {/* Right Empty Frame */}
               <div className="w-[90px] shrink-0 bg-white p-1 pb-4 flex flex-col justify-between -mr-[50px] shadow-lg">
                    <div className="flex-1 bg-gradient-to-tr from-[#1a1a1a] to-[#2a2a2a] border border-black relative overflow-hidden">
                       <div className="absolute inset-0 bg-black/40" />
                    </div>
                    <div className="h-6 mt-1 flex items-center justify-between">
                       <div className="h-2 w-8 bg-black" />
                       <div className="h-2 w-4 bg-blue-600" />
                    </div>
               </div>
           </div>
  
           {/* Bottom Perforations */}
           <div className="flex justify-between px-2 py-2">
              {[...Array(10)].map((_, i) => (
                  <div key={i} className="w-[14px] h-[18px] bg-[#d1d5db] border border-black/40 rounded-[1px] shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)]" />
              ))}
           </div>
           
           {/* Action Button */}
           <div className="absolute right-0 bottom-0 bg-[#b91c1c] w-8 h-8 flex items-center justify-center border-t border-l border-black hover:bg-red-600 cursor-pointer shadow-[inset_2px_2px_0_rgba(255,255,255,0.2)]">
               <span className="text-white text-sm leading-none font-black font-sans">+</span>
           </div>
        </div>
      </motion.article>
    );
  }

  // Fallback to DVD (or activeVariant === 'dvd')
  return (
    <motion.article 
        initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
        animate={{ opacity: 1, scale: 1, rotate: rotation }}
        whileHover={{ scale: 1.02, zIndex: 50 }}
        className="w-full max-w-[420px] mb-8 mt-2 relative group"
    >
      <div className="bg-[#f2f4f8] border-2 border-black rounded-sm shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6 flex relative overflow-visible">
        {/* Top Right Ribbon */}
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-[25%] -translate-y-[25%] rotate-45 bg-blue-100 border-b border-black py-1 px-8 flex items-center justify-center shadow-sm">
               <span className="text-[8px] font-mono font-bold text-blue-900 tracking-widest uppercase">FRESH</span>
            </div>
        </div>
        
        {/* Left: DVD Case & Disc (stacked) */}
        <div className="w-[150px] h-[150px] relative shrink-0 -ml-2">
            {/* The Black Square Sleeves/Case */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[130px] h-[140px] bg-[#1a1a1a] border-[1.5px] border-[#333] rounded-[4px] shadow-lg z-10 overflow-hidden">
               {/* Sleeve binding left edge */}
               <div className="absolute inset-y-0 left-0 w-2 mb-0 bg-gradient-to-r from-black via-black/80 to-transparent border-r border-[#333]" />
            </div>

            {/* The Circular Disc that sticks out to the right */}
            <div className="absolute top-1/2 -translate-y-1/2 left-6 w-[140px] h-[140px] rounded-full bg-[#dddddd] shadow-[6px_0_15px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center border-[2px] border-[#999] overflow-hidden group-hover:rotate-12 transition-transform duration-700">
                {/* Disc Poster Background */}
                <div className="absolute inset-0">
                   {loading ? (
                     <div className="w-full h-full flex items-center justify-center bg-gray-200 animate-pulse">
                        <Disc size={24} className="opacity-20" />
                     </div>
                   ) : posterUrl ? (
                     <img src={posterUrl} className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full bg-gradient-to-br from-pink-600 to-cyan-600" />
                   )}
                </div>
                {/* Holographic / Reflective gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/30 via-transparent to-cyan-500/30 mix-blend-color-dodge rounded-full border-[3px] border-black/10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.5)_0%,transparent_60%)]" />

                {/* Center Hub */}
                <div className="w-10 h-10 rounded-full border border-white/50 bg-[#e5e5e5]/80 backdrop-blur-md flex items-center justify-center z-30 shadow-[inset_0_0_10px_rgba(0,0,0,0.3)]">
                   <div className="w-4 h-4 rounded-full border border-gray-400 bg-white flex items-center justify-center">
                       <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shadow-inner" />
                   </div>
                </div>
                
                {/* Text on disc bottom */}
                <div className="absolute bottom-2 text-[4px] text-white/90 font-mono tracking-widest uppercase font-bold text-center w-full drop-shadow-md">
                    High Fidelity Motion Picture
                </div>
            </div>
        </div>

        {/* Right: Info */}
        <div className="flex-1 pl-4 flex flex-col justify-center z-20 overflow-hidden">
           <div className="flex items-center gap-1 mb-1.5">
               <span className="bg-[#cc0000] text-white text-[7px] font-black py-0.5 px-1.5 uppercase tracking-widest leading-none shadow-[2px_2px_0_#000]">
                 FEATURE FILM
               </span>
           </div>
           
           <h3 className="font-sans font-black text-xl leading-[1.05] uppercase tracking-tighter text-black mb-3 line-clamp-2">
             {title || 'Untitled Feature'}
           </h3>

           {/* Tags */}
           <div className="flex flex-wrap gap-1 mb-3 shrink-0">
               <span className="border-[1.5px] border-black bg-[#ffeb3b] text-black text-[8px] font-mono font-bold px-1.5 py-0.5 uppercase shadow-[2px_2px_0_0_#000]">
                 {rating ? `${rating}/10` : 'SCI-FI'}
               </span>
               <span className="border-[1.5px] border-black bg-white text-black text-[8px] font-mono font-bold px-1.5 py-0.5 uppercase shadow-[2px_2px_0_0_#000]">
                 {year || '2023'} HD
               </span>
               <span className="border-[1.5px] border-black bg-[#e0e7ff] text-[#1e3a8a] text-[8px] font-mono font-bold px-1.5 py-0.5 uppercase shadow-[2px_2px_0_0_#000] mt-1 break-words w-fit">
                 DIRECTOR'S CUT
               </span>
           </div>
           
           <p className="text-[9px] text-[#444] font-sans font-medium leading-relaxed line-clamp-3 mb-4 pr-1">
             A sensory overload into the deep trenches of digital isolation and rebellion. This edition features an exclusive remaster.
           </p>

           <div className="flex gap-2 font-mono">
               <button className="flex-1 bg-[#cc0000] border-[1.5px] border-black text-white text-[9px] font-bold py-1.5 shadow-[2px_2px_0_0_#000] flex items-center justify-center gap-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-red-700 transition-all">
                  <Play size={8} fill="white" /> PLAY
               </button>
               <button className="flex-1 bg-white border-[1.5px] border-black text-black text-[9px] font-bold py-1.5 shadow-[2px_2px_0_0_#000] flex items-center justify-center act gap-1 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-50 transition-all">
                  + START
               </button>
           </div>
        </div>
      </div>
    </motion.article>
  );
}

