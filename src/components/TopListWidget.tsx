import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Tape } from './Tape';
import { Music, Film, Star, Sparkles, Disc, Play, Type } from 'lucide-react';
import { findMoviePoster } from '../services/movieService';
import { searchSpotifyTrack } from '../services/spotifyService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getContrastText, getContrastBorder, sanitizeData } from '../lib/utils';

interface TopListWidgetProps {
  id?: string;
  userId?: string;
  title: string;
  items: string[];
  posters?: string[]; // we will repurpose this for both posters and album arts
  type: 'songs' | 'movies' | 'generic';
  rotation?: number;
  color?: 'primary' | 'secondary' | 'tertiary' | 'yellow';
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  theme?: 'retro' | 'minimal' | 'brutalist' | 'y2k' | 'vhs' | 'dvd' | 'filmstrip' | 'cassette' | 'cd' | 'vinyl' | 'standard';
}

function TopListItem({ item, i, type, id, userId, posters = [], textColor, borderColor, theme = 'standard' }: any) {
  const [media, setMedia] = useState<string | null>(posters[i] || null);

  useEffect(() => {
    if (!media && item) {
      if (type === 'movies') {
        findMoviePoster(item).then(url => {
          if (url) {
            setMedia(url);
            saveMedia(url);
          }
        });
      } else if (type === 'songs') {
        searchSpotifyTrack(item).then(data => {
          if (data && data.albumArt) {
            setMedia(data.albumArt);
            saveMedia(data.albumArt);
          }
        });
      }
    }
  }, [item, type, media, i]);

  const saveMedia = (url: string) => {
    if (id && userId) {
      const newPosters = [...posters];
      newPosters[i] = url;
      updateDoc(doc(db, 'users', userId, 'pieces', id), sanitizeData({
        'data.posters': newPosters
      })).catch(console.error);
    }
  };

  // Cassette J-Card List Item
  if (theme === 'cassette') {
    const isSideB = i >= 5;
    return (
      <div className="flex items-center gap-2 mb-1.5 border-b border-[#0033cc]/20 pb-0.5">
         <span className="font-mono text-[8px] font-bold text-[#0033cc]/60 w-3">{i % 5 + 1}</span>
         <span className="font-sans text-[10px] uppercase font-bold text-[#111] truncate">{item}</span>
      </div>
    );
  }

  // CD Back Cover Item
  if (theme === 'cd') {
    return (
      <div className="flex gap-2 items-center mb-1 group/item">
         <span className="font-mono text-[9px] font-bold text-gray-400 w-4 text-right">{(i + 1).toString().padStart(2, '0')}</span>
         <span className="font-sans text-[11px] font-medium text-black truncate tracking-tight flex-1">{item}</span>
         <span className="font-mono text-[9px] text-gray-400">3:{(Math.random() * 40 + 10).toFixed(0)}</span>
      </div>
    );
  }

  // Vinyl Sleeve Item
  if (theme === 'vinyl') {
    return (
      <div className="flex gap-2 items-baseline mb-1">
         <span className="font-bold text-[#cc0000] text-[10px] w-4 text-right">{i + 1}.</span>
         <span className="font-serif italic font-bold text-[13px] text-[#222] truncate">{item}</span>
      </div>
    );
  }

  // VHS Back Slipcase Item
  if (theme === 'vhs') {
    return (
      <div className="flex gap-3 items-center group/item hover:bg-[#222] p-1 -mx-1 rounded transition-colors">
         <div className="w-5 text-right font-mono text-[10px] font-bold text-gray-500">{String(i+1).padStart(2,'0')}</div>
         <div className="flex-1 font-bold text-xs text-gray-200 uppercase tracking-tight truncate">{item}</div>
         <div className="w-3 border-b-2 border-dashed border-gray-700" />
         <div className="font-mono text-[8px] text-gray-500">CH {i + 1}</div>
      </div>
    );
  }

  // DVD Back Cover Item
  if (theme === 'dvd') {
    return (
      <div className="flex gap-2 items-center mb-1.5 bg-black/5 p-1 rounded-sm border border-black/10">
         <div className="w-10 h-6 bg-black flex-shrink-0 relative overflow-hidden border border-gray-400">
           {media ? <img src={media} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Film size={10} className="text-white/30" /></div>}
         </div>
         <span className="font-sans text-[9px] font-bold uppercase text-black truncate">{i + 1}. {item}</span>
      </div>
    );
  }

  // Filmstrip Item
  if (theme === 'filmstrip') {
    return (
      <div className="w-[120px] h-[80px] shrink-0 bg-white p-1 pb-4 flex flex-col justify-between shadow-[0_0_10px_rgba(0,0,0,0.8)] relative z-10 transition-transform hover:scale-105 border border-black">
         <div className="flex-1 bg-black relative border border-black overflow-hidden group/poster">
              {media ? <img src={media} className="w-full h-full object-cover grayscale sepia-[0.3] contrast-125 group-hover/poster:grayscale-0 transition-all duration-300" /> : <div className="w-full h-full flex items-center justify-center"><Film size={16} className="text-white/20" /></div>}
         </div>
         <div className="mt-1 flex flex-col items-center justify-center whitespace-nowrap overflow-hidden">
             <span className="text-black font-bold uppercase text-[7px] truncate max-w-full leading-none">{item}</span>
             <span className="text-[#cc0000] font-mono text-[6px] font-bold">FRAME {String(i + 1).padStart(2, '0')}</span>
         </div>
      </div>
    );
  }

  // Standard/Retro/Minimal/Brutalist/Y2K Default Item
  return (
    <li className="flex gap-4 items-center group/item transition-all hover:-translate-y-0.5">
      <span className={`font-mono text-[10px] w-4 font-bold flex-shrink-0 text-right ${theme === 'y2k' ? 'text-pink-500' : `${textColor} opacity-40`}`}>
        {(i + 1).toString().padStart(2, '0')}
      </span>
      {(type === 'movies' || type === 'songs') && (
        <div className={`w-8 h-10 border flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm relative ${theme === 'y2k' ? 'bg-fuchsia-500/20 border-fuchsia-300 rounded' : `bg-paper-outline/10 ${borderColor}`}`}>
           {media ? (
             <img src={media} alt="" className={`w-full h-full object-cover ${theme === 'retro' ? 'grayscale contrast-125 sepia-[.2] group-hover/item:grayscale-[0.2]' : ''} transition-colors`} referrerPolicy="no-referrer" />
           ) : (
             type === 'movies' ? <Film size={12} className={theme === 'y2k' ? 'text-fuchsia-400 opacity-60' : 'opacity-30'} /> : <Music size={12} className={theme === 'y2k' ? 'text-fuchsia-400 opacity-60' : 'opacity-30'} />
           )}
        </div>
      )}
      <div className={`flex-grow border-b ${theme === 'y2k' ? 'border-dashed border-pink-300' : `border-dashed ${borderColor}`} pb-1 overflow-hidden`}>
         <span className={`text-sm font-medium tracking-tight truncate block ${textColor}`}>{item}</span>
      </div>
    </li>
  );
}

export function TopListWidget({ id, userId, title, items, posters = [], type, rotation = 0, color = 'yellow', bgColor, fontFamily, borderStyle, theme = 'standard' }: TopListWidgetProps) {
  const activeTheme = theme || 'retro';

  // VHS Theme (Movies)
  if (activeTheme === 'vhs' && type === 'movies') {
    return (
      <motion.article initial={{ opacity: 0, scale: 0.95, rotate: rotation }} animate={{ opacity: 1, scale: 1, rotate: rotation }} whileHover={{ scale: 1.02, zIndex: 50 }} className="w-full max-w-[340px] mb-6 relative group font-sans">
        <div className="bg-[#111] border-[4px] border-[#333] rounded-[4px] p-5 shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative overflow-hidden flex flex-col min-h-[460px]">
          {/* Top Bar */}
          <div className="flex justify-between items-end border-b-2 border-red-600 pb-2 mb-4 relative z-10">
             <div className="text-white min-w-0 pr-2">
                <div className="text-[10px] font-mono text-gray-400 tracking-widest uppercase truncate">Index / Chapters</div>
                <h3 className="text-xl font-bold italic tracking-tighter uppercase line-clamp-1">{title}</h3>
             </div>
             <div className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 shadow-[2px_2px_0_0_rgba(255,255,255,0.2)] shrink-0">VHS</div>
          </div>
          <div className="flex flex-col gap-1.5 flex-grow relative z-10 overflow-y-auto scrollbar-thin max-h-[300px] pr-2">
             {items.map((item, i) => (
                <TopListItem key={i} item={item} i={i} type={type} id={id} userId={userId} posters={posters} theme="vhs" />
             ))}
          </div>
          {/* Bottom Bar */}
          <div className="mt-4 pt-3 border-t-2 border-[#333] flex justify-between items-center relative z-10">
             <div className="flex gap-1">
                 <div className="w-6 h-3 bg-red-600 border border-black shadow-[1px_1px_0_0_rgba(255,255,255,0.2)]" />
                 <div className="w-6 h-3 bg-green-600 border border-black shadow-[1px_1px_0_0_rgba(255,255,255,0.2)]" />
                 <div className="w-6 h-3 bg-blue-600 border border-black shadow-[1px_1px_0_0_rgba(255,255,255,0.2)]" />
             </div>
             <div className="flex gap-2 items-center">
                <div className="text-[8px] font-mono text-gray-500 uppercase font-bold tracking-widest">Hi-Fi Stereo</div>
                <div className="px-1.5 py-0.5 border border-gray-600 text-gray-500 text-[6px] font-black uppercase tracking-wider">Dolby B NR</div>
             </div>
          </div>
          {/* Texture Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0.5)_100%)] pointer-events-none" />
        </div>
      </motion.article>
    );
  }

  // DVD Theme (Movies)
  if (activeTheme === 'dvd' && type === 'movies') {
    return (
      <motion.article initial={{ opacity: 0, scale: 0.95, rotate: rotation }} animate={{ opacity: 1, scale: 1, rotate: rotation }} whileHover={{ scale: 1.02, zIndex: 50 }} className="w-full max-w-[340px] mb-6 relative group font-sans">
        <div className="bg-[#f0f0f0] border-2 border-gray-400 rounded-sm shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative flex flex-col p-1.5 h-[500px]">
           <div className="flex-1 bg-gradient-to-br from-[#0a192f] to-[#0d0d0d] border border-black p-4 relative overflow-hidden flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              
              {/* Header */}
              <div className="text-center mb-4 pb-2 border-b border-white/20">
                 <h3 className="text-white font-black uppercase text-xl tracking-tighter leading-none mb-1 shadow-black drop-shadow-md">{title}</h3>
                 <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Scene Selection</div>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 flex-grow overflow-y-auto scrollbar-thin content-start max-h-[320px] pr-2">
                 {items.map((item, i) => (
                    <TopListItem key={i} item={item} i={i} type={type} id={id} userId={userId} posters={posters} theme="dvd" />
                 ))}
              </div>

              {/* DVD Footer */}
              <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-white/20">
                  <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <div className="border border-white/40 px-1 py-0.5 flex items-center justify-center bg-black/50">
                           <span className="text-[6px] font-bold text-white uppercase">Widescreen</span>
                        </div>
                        <div className="border border-white/40 px-1 py-0.5 flex items-center justify-center bg-black/50">
                           <span className="text-[6px] font-bold text-white uppercase">NTSC 1</span>
                        </div>
                      </div>
                      <Disc size={20} className="text-white/80" />
                  </div>
                  <div className="text-[5px] text-white/50 text-justify leading-tight uppercase font-sans">
                     PROGRAM CONTENT AND PACKAGE ARTWORK © 2024. THIS DISC IS COMPATIBLE WITH ALL DVD PLAYERS DISPLAYING THESE SYMBOLS. AUTHORIZED USE ONLY.
                  </div>
              </div>
           </div>
        </div>
      </motion.article>
    );
  }

  // Filmstrip Theme (Movies)
  if (activeTheme === 'filmstrip' && type === 'movies') {
    return (
      <motion.article initial={{ opacity: 0, scale: 0.95, rotate: rotation }} animate={{ opacity: 1, scale: 1, rotate: rotation }} whileHover={{ scale: 1.02, zIndex: 50 }} className="w-full max-w-[480px] mb-6 relative group font-sans">
        <div className="bg-[#111] p-3 border-r-[8px] border-b-[8px] border-black shadow-[8px_8px_0_0_#cc0000] relative overflow-hidden flex flex-col">
           {/* Perforations Top */}
           <div className="flex justify-between px-1 py-2 border-b border-white/10 mb-2">
              {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-[14px] h-[18px] bg-[#d1d5db] border border-black/40 rounded-[1px] shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)]" />
              ))}
           </div>
           
           <div className="text-white px-2 mb-2 flex items-center gap-2">
              <span className="bg-[#cc0000] text-white text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest shadow-[1px_1px_0_#000]">TOP 10</span>
              <h3 className="font-bold text-lg uppercase truncate tracking-tighter italic">{title}</h3>
           </div>

           {/* Horizontal Scroll of Film Frames */}
           <div className="flex gap-3 px-2 pb-2 overflow-x-auto scrollbar-thin">
              {items.map((item, i) => (
                  <TopListItem key={i} item={item} i={i} type={type} id={id} userId={userId} posters={posters} theme="filmstrip" />
              ))}
              {/* Extra buffer on right */}
              <div className="w-4 shrink-0" />
           </div>

           {/* Perforations Bottom */}
           <div className="flex justify-between px-1 py-2 border-t border-white/10 mt-2">
              {[...Array(12)].map((_, i) => (
                  <div key={i} className="w-[14px] h-[18px] bg-[#d1d5db] border border-black/40 rounded-[1px] shadow-[inset_0_2px_5px_rgba(0,0,0,0.6)]" />
              ))}
           </div>
        </div>
      </motion.article>
    );
  }

  // Cassette Theme (Songs)
  if (activeTheme === 'cassette' && type === 'songs') {
    return (
      <motion.article initial={{ opacity: 0, scale: 0.95, rotate: rotation }} animate={{ opacity: 1, scale: 1, rotate: rotation }} whileHover={{ scale: 1.02, zIndex: 50 }} className="w-full max-w-[320px] mb-6 relative group font-sans">
        <div className="bg-[#f0f0f0] border border-black shadow-[6px_6px_0_0_#111] p-0 relative overflow-hidden flex h-[400px]">
           {/* Cassette Spine Area */}
           <div className="w-[45px] border-r-2 border-[#111] bg-white flex flex-col relative shadow-[2px_0_4px_rgba(0,0,0,0.1)] shrink-0 z-10 p-2">
              <div className="w-full h-8 border-2 border-black flex items-center justify-center bg-[#cc0000] shadow-inner mb-4">
                  <span className="text-white font-bold text-[10px] transform -rotate-90">10s</span>
              </div>
              <div className="flex-1 border-x border-[#0033cc]/30 mx-auto w-3 flex flex-col justify-center items-center">
                 <h3 className="font-bold text-black uppercase tracking-widest text-[12px] truncate origin-center transform rotate-180" style={{ writingMode: 'vertical-rl' }}>{title}</h3>
              </div>
           </div>

           {/* Front Grid lines */}
           <div className="flex-1 bg-white relative p-4 flex flex-col shadow-[inset_0_2px_8px_rgba(0,0,0,0.05)] overflow-hidden">
               {/* Background Grid */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(0,51,204,0.1)_1px,transparent_1px)] bg-[size:100%_20px]" />
               
               <div className="relative z-10 flex flex-col h-full">
                 <div className="mb-4 bg-white/80 p-2 border-2 border-black inline-block shadow-[2px_2px_0_#000] rotate-[-2deg]">
                   <h3 className="text-xl font-black uppercase text-black italic tracking-tighter leading-none">{title}</h3>
                   <div className="text-[10px] uppercase font-bold text-[#cc0000]">MIXTAPE / {(items.length).toString().padStart(2, '0')} TRACKS</div>
                 </div>

                 <div className="flex gap-4 flex-1 mt-2 overflow-y-auto scrollbar-thin max-h-[220px] pr-2">
                    <div className="flex-1">
                       <span className="bg-black text-white text-[8px] font-black px-1 py-0.5 inline-block mb-2 shadow-[1px_1px_0_#cc0000]">SIDE A</span>
                       {items.slice(0, Math.ceil(items.length / 2)).map((item, i) => (
                          <TopListItem key={i} item={item} i={i} type={type} id={id} userId={userId} posters={posters} theme="cassette" />
                       ))}
                    </div>
                    <div className="flex-1">
                       <span className="bg-black text-white text-[8px] font-black px-1 py-0.5 inline-block mb-2 shadow-[1px_1px_0_#cc0000]">SIDE B</span>
                       {items.slice(Math.ceil(items.length / 2)).map((item, i) => (
                          <TopListItem key={i+Math.ceil(items.length / 2)} item={item} i={i+Math.ceil(items.length / 2)} type={type} id={id} userId={userId} posters={posters} theme="cassette" />
                       ))}
                    </div>
                 </div>

                 {/* Cassette bottom details */}
                 <div className="mt-2 border-t-2 border-black pt-1 flex justify-between">
                    <span className="font-mono text-[8px] font-bold text-gray-400">STEREO</span>
                    <span className="font-mono text-[8px] font-bold text-gray-400">NORM EQ</span>
                 </div>
               </div>
           </div>
        </div>
      </motion.article>
    );
  }

  // CD Theme (Songs)
  if (activeTheme === 'cd' && type === 'songs') {
    return (
      <motion.article initial={{ opacity: 0, scale: 0.95, rotate: rotation }} animate={{ opacity: 1, scale: 1, rotate: rotation }} whileHover={{ scale: 1.02, zIndex: 50 }} className="w-full max-w-[340px] mb-6 relative group font-sans">
        <div className="bg-[#e4e4e4] border-l-[12px] border-[#222] rounded-sm p-4 shadow-[8px_8px_0_rgba(0,0,0,1)] relative flex flex-col min-h-[380px] overflow-hidden border-y border-r border-[#bebebe]">
           {/* Hinge detail */}
           <div className="absolute top-[30px] left-[-12px] w-[12px] h-[30px] bg-[#111] border-y border-gray-600" />
           <div className="absolute bottom-[30px] left-[-12px] w-[12px] h-[30px] bg-[#111] border-y border-gray-600" />

           <div className="bg-white flex-1 p-4 shadow-sm border border-gray-300 relative flex flex-col">
              <div className="flex justify-between items-start border-b border-gray-300 pb-2 mb-3">
                 <div className="flex-1 w-[80%] pr-4">
                    <h3 className="font-sans font-black text-[22px] tracking-tight uppercase leading-none mb-1 text-black truncate overflow-hidden whitespace-nowrap">{title}</h3>
                    <p className="font-serif italic text-gray-500 text-[11px]">The Definitive Collection</p>
                 </div>
                 <Disc size={28} className="text-gray-300 shrink-0" />
              </div>

              <div className="flex flex-col flex-1 pl-1 overflow-y-auto scrollbar-thin max-h-[250px] pr-2">
                 {items.map((item, i) => (
                    <TopListItem key={i} item={item} i={i} type={type} id={id} userId={userId} posters={posters} theme="cd" />
                 ))}
              </div>

              <div className="mt-4 pt-2 border-t border-gray-300 flex justify-between items-end">
                 <div className="flex flex-col gap-1 w-[100px]">
                    <div className="h-6 bg-white w-full border border-gray-800 flex" style={{backgroundImage: 'repeating-linear-gradient(90deg, #111, #111 2px, transparent 2px, transparent 4px)', backgroundSize: '100% 100%'}} />
                    <span className="font-mono text-[6px] text-center text-gray-500">8 45930 21943 1</span>
                 </div>
                 <div className="text-[7px] text-right font-sans font-bold text-gray-400 uppercase leading-none max-w-[120px]">
                    A Digital Audio Production. Warning: All rights reserved.
                 </div>
              </div>
           </div>
        </div>
      </motion.article>
    );
  }

  // Vinyl Theme (Songs)
  if (activeTheme === 'vinyl' && type === 'songs') {
    return (
      <motion.article initial={{ opacity: 0, scale: 0.95, rotate: rotation }} animate={{ opacity: 1, scale: 1, rotate: rotation }} whileHover={{ scale: 1.02, zIndex: 50 }} className="w-full max-w-[340px] mb-6 relative group font-sans">
         <div className="relative">
            {/* The Record Peeking Out */}
            <div className="absolute right-[-20px] top-[10%] w-[90%] h-[80%] bg-[#111] rounded-full border border-gray-800 shadow-xl group-hover:right-[-40px] transition-all duration-500 flex items-center justify-center z-0 overflow-hidden">
                <div className="w-[30%] h-[30%] rounded-full bg-[#cc0000] border-2 border-black flex items-center justify-center">
                   <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                {/* Grooves */}
                <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none" />
                <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none" />
                <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none" />
            </div>

            {/* The Sleeve */}
            <div className="bg-[#e8dec7] border-2 border-[#111] p-5 shadow-[4px_4px_0_0_#111] relative z-10 h-[340px] flex flex-col relative overflow-hidden" 
                 style={{ backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.05) 0%, transparent 10%, transparent 90%, rgba(0,0,0,0.1) 100%)' }}>
               
               {/* Edge wear texture */}
               <div className="absolute inset-0 border-[6px] border-black/5 pointer-events-none rounded-sm mix-blend-multiply" />
               
               <div className="border border-black/30 p-4 h-full flex flex-col relative">
                  <div className="flex justify-between items-start mb-6">
                     <div className="bg-[#cc0000] px-2 py-0.5 text-white font-bold tracking-widest uppercase text-[10px] shadow-[1px_1px_0_#000]">33 ⅓ RPM</div>
                     <span className="font-serif italic font-bold text-[#111] text-xs">STEREO</span>
                  </div>

                  <h3 className="font-sans font-black text-3xl uppercase tracking-tighter text-[#111] leading-none mb-4">{title}</h3>
                  
                  <div className="flex-1 flex flex-col justify-start min-h-[140px] max-h-[200px] overflow-y-auto scrollbar-thin pr-2">
                     {items.map((item, i) => (
                        <TopListItem key={i} item={item} i={i} type={type} id={id} userId={userId} posters={posters} theme="vinyl" />
                     ))}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-black/20 flex justify-between items-end">
                     <div className="font-mono text-[7px] font-bold text-black/40 uppercase">LP-{Math.floor(Math.random() * 10000)}</div>
                     <div className="font-serif italic text-[9px] font-bold text-black/60">A High Fidelity Recording</div>
                  </div>
               </div>
            </div>
         </div>
      </motion.article>
    );
  }

  // Standard Themes (Retro, Minimal, Brutalist, Y2K)
  const Icon = type === 'songs' ? Music : type === 'movies' ? Film : Star;
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';
  
  const themeClasses: Record<string, string> = {
    retro: `p-5 border-[3px] ${borderClass} ${borderColor} analog-shadow relative mb-4 w-full max-w-[340px] group ${textColor} ${fontClass} bg-paper-base`,
    minimal: `p-5 rounded-3xl border ${borderClass} border-[#999] shadow-xl relative mb-4 w-full max-w-[340px] group ${textColor} ${fontClass} bg-white`,
    brutalist: `p-5 border-[4px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative mb-4 w-full max-w-[340px] group uppercase font-bold text-black ${fontClass} bg-white`,
    y2k: `p-5 rounded-[2rem] border-2 border-pink-300 shadow-[0_0_20px_rgba(255,105,180,0.3)] bg-gradient-to-br from-fuchsia-50 to-pink-100 relative mb-4 w-full max-w-[340px] group text-pink-900 ${fontClass}`,
    standard: `p-5 border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative mb-4 w-full max-w-[340px] group ${textColor} ${fontClass} bg-white font-sans`,
  };

  const currentThemeClass = themeClasses[activeTheme] || themeClasses['standard'];

  return (
    <motion.article
      initial={{ opacity: 0, y: 20, rotate: rotation }}
      animate={{ opacity: 1, y: 0, rotate: rotation }}
      whileHover={{ scale: 1.02, rotate: 0, zIndex: 50 }}
      className={currentThemeClass}
      style={{ backgroundColor: ['minimal', 'brutalist', 'y2k', 'standard'].includes(activeTheme) ? undefined : (bgColor || '#faf9f6') }}
    >
      {activeTheme === 'retro' && <Tape color={color} rotation={-5} className="-top-3 left-1/4 w-20 h-6 opacity-90" />}
      
      {activeTheme === 'y2k' && (
        <div className="absolute -top-3 -right-3 text-fuchsia-400 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)] animate-pulse">
           <Sparkles size={24} fill="currentColor" />
        </div>
      )}

      <div className={`flex items-center gap-3 border-b-2 ${activeTheme === 'y2k' ? 'border-dashed border-pink-300 text-fuchsia-600' : borderColor} pb-3 mb-4`}>
        <div className={`p-2 rounded-full ${activeTheme === 'y2k' ? 'bg-gradient-to-tr from-fuchsia-400 to-pink-400 text-white shadow-md border-none' : activeTheme === 'brutalist' || activeTheme === 'standard' ? 'bg-black text-white border-2 border-black rounded-none' : activeTheme === 'minimal' ? 'bg-gray-100 text-gray-900 border-none rounded-lg' : `${type === 'songs' ? 'bg-paper-secondary/10 text-paper-secondary' : 'bg-paper-tertiary/10 text-paper-tertiary'} border ${borderColor}`}`}>
          <Icon size={20} />
        </div>
        <h3 className={`${activeTheme === 'retro' ? 'font-serif italic leading-none' : 'leading-tight uppercase font-black'} text-2xl tracking-tight truncate`}>{title}</h3>
      </div>
      
      <ol className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-thin pr-2">
        {items.map((item, i) => (
          <TopListItem key={i} item={item} i={i} type={type} id={id} userId={userId} posters={posters} textColor={textColor} borderColor={borderColor} theme={activeTheme} />
        ))}
      </ol>
      
      <div className={`mt-5 pt-2 border-t flex justify-between items-center ${activeTheme === 'brutalist' ? 'border-black' : activeTheme === 'y2k' ? 'border-pink-300 opacity-70 text-pink-500' : `${borderColor} opacity-40`} `}>
        <span className="font-mono text-[8px] uppercase tracking-widest">{activeTheme === 'y2k' ? '~* ARCHIVE *~' : 'TOP TEN OVERVIEW'}</span>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => <div key={i} className={`w-1 h-1 ${activeTheme === 'brutalist' ? 'rounded-none bg-black' : 'rounded-full bg-current'}`} />)}
        </div>
      </div>
    </motion.article>
  );
}
