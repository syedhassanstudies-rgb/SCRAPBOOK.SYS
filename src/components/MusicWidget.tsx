import { Play, Pause, SkipBack, SkipForward, Music, Disc, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Tape } from './Tape';
import { getContrastText, getContrastBorder, sanitizeData } from '../lib/utils';
import { searchSpotifyTrack } from '../services/spotifyService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MusicWidgetProps {
  id?: string;
  userId?: string;
  song: string;
  artist: string;
  genre?: string;
  albumArt?: string;
  previewUrl?: string;
  rotation?: number;
  design?: 'standard' | 'minimal' | 'cassette' | 'vinyl' | 'y2k' | 'cd' | 'mini-disc' | 'vhs';
  color?: 'primary' | 'secondary' | 'tertiary' | 'yellow';
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  theme?: 'retro' | 'minimal' | 'brutalist' | 'y2k' | 'vhs' | 'cd' | 'cassette' | 'vinyl' | 'mini-disc' | 'standard';
}

export function MusicWidget({ id, userId, song, artist, genre, albumArt: initialAlbumArt, previewUrl: initialPreviewUrl, rotation = 2, design = 'standard', color = 'tertiary', bgColor, fontFamily, borderStyle, theme = 'retro' }: MusicWidgetProps) {
  const [albumArt, setAlbumArt] = useState<string | null>(initialAlbumArt || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
  const [loading, setLoading] = useState(!initialAlbumArt && song !== 'Song Title');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = (e?: React.MouseEvent | React.PointerEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Playback failed", err);
      });
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [previewUrl, audioRef.current]);

  useEffect(() => {
    if (initialAlbumArt) {
      setAlbumArt(initialAlbumArt);
      setLoading(false);
    }
    if (initialPreviewUrl) {
      setPreviewUrl(initialPreviewUrl);
    }
    
    if ((!initialAlbumArt || !initialPreviewUrl) && song && song !== 'Song Title') {
      setLoading(!initialAlbumArt);
      searchSpotifyTrack(`${song} ${artist}`).then(async (data) => {
        if (data) {
          if (!initialAlbumArt && data.albumArt) setAlbumArt(data.albumArt);
          if (!initialPreviewUrl && data.previewUrl) setPreviewUrl(data.previewUrl);
          
          setLoading(false);
          if (id && userId && (data.albumArt || data.previewUrl)) {
            try {
              const updateData: any = {};
              if (!initialAlbumArt && data.albumArt) updateData['data.albumArt'] = data.albumArt;
              if (!initialPreviewUrl && data.previewUrl) updateData['data.previewUrl'] = data.previewUrl;
              
              if (Object.keys(updateData).length > 0) {
                 await updateDoc(doc(db, 'users', userId, 'pieces', id), sanitizeData(updateData));
              }
            } catch (e) {
              console.error("Error updates music data", e);
            }
          }
        } else {
          setLoading(false);
        }
      });
    }
  }, [initialAlbumArt, initialPreviewUrl, song, artist, id, userId]);

  const isStandardDesign = !design || design === 'standard';
  
  // Only use theme for style selection if design is standard
  const activeStyle = !isStandardDesign 
    ? (design as any)
    : (theme === 'retro' ? 'cassette' : theme);

  const isVhs = activeStyle === 'vhs';
  const isCd = activeStyle === 'cd';
  const isMiniDisc = activeStyle === 'mini-disc';
  const isVinyl = activeStyle === 'vinyl';
  const isCassette = activeStyle === 'cassette';
  
  const isMinimal = activeStyle === 'minimal';
  const isY2K = activeStyle === 'y2k';
  const isBrutalist = activeStyle === 'brutalist';
  const isRetro = activeStyle === 'retro';
  
  const isStandard = !isVhs && !isCd && !isMiniDisc && !isVinyl && !isCassette && !isMinimal && !isY2K && !isBrutalist && !isRetro;
  
  const cassetteBg = bgColor || '#2a2a2a';
  const vinylLabelBg = bgColor || '#ff4444';
  
  // VHS Reference Implementation
  if (isVhs) {
    return (
      <motion.article
        initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
        animate={{ opacity: 1, scale: 1, rotate: rotation }}
        whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
        className="relative w-[320px] sm:w-[400px] mb-6 group font-mono"
      >
        <div className="bg-[#1a1a1a] rounded-[2px] border-l-[12px] border-[#0f0f0f] shadow-[8px_8px_0_0_rgba(0,0,0,0.8)] relative aspect-[1.8/1] overflow-hidden">
          {/* Angled Labels */}
          <div className="absolute top-2 right-2 bg-white px-2 py-0.5 border-2 border-black rotate-[45deg] translate-x-4 -translate-y-2 z-30">
            <span className="text-[8px] font-bold uppercase tracking-widest text-black">Please Rewind</span>
          </div>

          <div className="flex gap-4 h-full p-4">
            {/* Left Column (Label + Spools + Controls) */}
            <div className="flex flex-col flex-1 relative h-full">
              {/* Top Label */}
              <div className="bg-white border-2 border-black p-2 w-[90%] rotate-[-1deg] relative z-20 shadow-md h-[72px]">
                <div className="border-b-[0.5px] border-red-500/50 pb-1 mb-1 relative before:content-[''] before:absolute before:left-0 before:right-0 before:top-[12px] before:border-b-[0.5px] before:border-red-500/20">
                  <span className="text-[8px] uppercase tracking-widest text-[#555]">Title / Artist</span>
                  <div className="text-[#cc0000] font-sans font-bold italic text-sm truncate leading-tight tracking-tight mt-0.5">
                    {song} - {artist} {genre && `(${genre})`}
                  </div>
                </div>
                <div className="flex justify-between text-[8px] text-[#555] font-bold uppercase">
                  <span>T-120</span>
                  <span>Stereo / Hi-Fi</span>
                </div>
              </div>

              {/* Spools Base - Increased bottom buffer */}
              <div className="absolute top-[85px] left-0 right-10 bottom-12 flex items-center justify-between px-2 opacity-80">
                {/* Left Spool */}
                <div className="w-14 h-14 bg-[#111] border-[3px] border-[#222] rounded-[16px] flex items-center justify-center relative overflow-hidden shadow-[inset_0_4px_8px_rgba(0,0,0,0.9)] rotate-[-15deg]">
                   <div className="w-10 h-10 rounded-full border border-white/5 absolute" />
                   <div className="w-2 h-2 rounded-full bg-[#b8860b] shadow-[0_0_4px_#b8860b]" />
                </div>
                {/* Right Spool */}
                <div className="w-14 h-14 bg-[#111] border-[3px] border-[#222] rounded-[16px] flex items-center justify-center relative overflow-hidden shadow-[inset_0_4px_8px_rgba(0,0,0,0.9)] rotate-[15deg]">
                   <div className="w-10 h-10 rounded-full border border-white/5 absolute" />
                   <div className="w-2 h-2 rounded-full bg-[#1e40af] shadow-[0_0_4px_#1e40af]" />
                </div>
              </div>

              {/* Bottom Play Controls & Time */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between items-end z-20">
                <div className="flex gap-2 bg-[#111] p-1.5 border-2 border-black rounded-sm shadow-[4px_4px_0_#000]">
                  <button 
                    onClick={previewUrl ? togglePlay : undefined} 
                    onPointerDown={(e) => e.stopPropagation()}
                    className={`${previewUrl ? 'cursor-pointer hover:bg-red-700' : 'cursor-not-allowed opacity-50'} bg-[#cc0000] w-7 h-6 flex items-center justify-center border border-black shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none transition-all`}
                  >
                    {isPlaying ? <Pause size={10} fill="white" className="text-white" /> : <Play size={10} fill="white" className="text-white" />}
                  </button>
                  <div className="flex flex-col items-center justify-center text-[6px] text-white/40 font-bold px-1">
                    <span>{isPlaying ? 'PLAY' : 'REC'}</span>
                    <div className={`w-1 h-1 rounded-full ${isPlaying ? 'bg-green-500 shadow-[0_0_4px_#22c55e]' : 'bg-red-600/30'}`} />
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <div className={`flex items-center gap-1.5 ${isPlaying ? 'text-green-500' : 'text-[#cc0000] opacity-70'} text-[8px] font-bold tracking-wider`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse shadow-[0_0_4px_#22c55e]' : 'bg-[#cc0000]'}`} />
                    {isPlaying ? 'PLAYING' : 'STOPPED'}
                  </div>
                  <div className="text-white/60 font-mono text-lg tracking-widest bg-black/40 px-1 rounded-sm">
                    04:52
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Polaroid Art */}
            <div className="w-[110px] shrink-0 mt-2 relative z-10 flex flex-col items-center">
              <Tape color="tertiary" rotation={-5} className="-top-3 z-30 w-10 h-5" />
              <div className="bg-white p-2 pb-5 border border-black/10 shadow-lg rotate-[8deg] transition-transform hover:rotate-0 w-full aspect-[4/5] flex flex-col">
                <div className="bg-[#222] aspect-square w-full relative overflow-hidden">
                  {albumArt ? (
                    <img src={albumArt} alt={song} className="w-full h-full object-cover grayscale contrast-125 sepia-[0.3]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center border border-[#333]">
                      <Music size={20} className="text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/20 mix-blend-overlay" />
                </div>
                <div className="mt-auto h-4 flex items-center">
                   <div className="h-0.5 w-full bg-gray-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {previewUrl && <audio ref={audioRef} src={previewUrl} preload="none" />}
      </motion.article>
    );
  }

  // CD Reference Implementation
  if (isCd) {
    return (
      <motion.article
        initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
        animate={{ opacity: 1, scale: 1, rotate: rotation }}
        whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
        className="relative w-[260px] sm:w-[300px] mb-12 group font-mono"
      >
        <div className="relative aspect-square w-full rounded-[4px] border-[2px] border-black bg-white shadow-[12px_12px_0_0_rgba(0,0,0,1)] overflow-hidden">
          {/* Main Cover Art */}
          {albumArt ? (
            <img src={albumArt} alt={song} className="w-full h-full object-cover absolute inset-0" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-200 to-orange-200 absolute inset-0" />
          )}

          {/* Semi-transparent dark overlay for contrast */}
          <div className="absolute inset-0 bg-black/20" />

          {/* Circular Text */}
          <div className="absolute inset-4 rounded-full border border-black/10 flex items-center justify-center">
             <svg viewBox="0 0 200 200" className="w-full h-full absolute inset-0 animate-[spin_30s_linear_infinite] select-none pointer-events-none opacity-80">
               <path id={`curve-${id || song.replace(/\s+/g,'')}`} d="M 100, 100 m -80, 0 a 80,80 0 1,1 160,0 a 80,80 0 1,1 -160,0" fill="transparent" />
               <text className="text-[12px] font-bold tracking-widest uppercase" fill="#111">
                 <textPath href={`#curve-${id || song.replace(/\s+/g,'')}`} startOffset="0%">{artist} • {song} • {artist} • {song} • </textPath>
               </text>
             </svg>
          </div>

          {/* Center Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-[12px] border-2 border-black shadow-lg flex items-center justify-center z-10 transition-transform group-hover:scale-105">
            <div className="w-8 h-8 rounded-[6px] border-2 border-black/80" />
          </div>

          {/* Track 01 Badge */}
          <div className="absolute top-[25%] right-[15%] bg-[#cc0000] border-2 border-black px-2 py-0.5 rotate-[-5deg] z-20 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <span className="text-white text-[10px] font-bold uppercase tracking-widest">Track 01</span>
          </div>

          {/* Bottom Play Controls */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-end justify-center gap-2 z-30 opacity-0 group-hover:opacity-100 group-hover:-translate-y-4 transition-all duration-300">
            <button className="w-10 h-10 bg-[#0033cc] border-[3px] border-black rounded-[4px] shadow-[4px_4px_0_#000] flex items-center justify-center active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-blue-600 transition-all">
              <SkipBack size={14} fill="white" className="text-white" />
            </button>
            <button 
              onClick={previewUrl ? togglePlay : undefined}
              onPointerDown={(e) => e.stopPropagation()}
              className={`w-14 h-12 bg-[#cc0000] border-[3px] border-black rounded-[6px] shadow-[4px_4px_0_#000] flex items-center justify-center active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-red-600 transition-all mb-[-4px] ${!previewUrl && 'opacity-50 cursor-not-allowed'}`}
            >
              {isPlaying ? <Pause size={20} fill="white" className="text-white" /> : <Play size={20} fill="white" className="text-white" />}
            </button>
            <button className="w-10 h-10 bg-[#0033cc] border-[3px] border-black rounded-[4px] shadow-[4px_4px_0_#000] flex items-center justify-center active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-blue-600 transition-all">
              <SkipForward size={14} fill="white" className="text-white" />
            </button>
          </div>
        </div>
        {previewUrl && <audio ref={audioRef} src={previewUrl} preload="none" />}
      </motion.article>
    );
  }

  // MiniDisc Reference Implementation
  if (isMiniDisc) {
    return (
      <motion.article
        initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
        animate={{ opacity: 1, scale: 1, rotate: rotation }}
        whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
        className="relative w-[320px] sm:w-[400px] mb-6 group font-mono"
      >
        <div className="bg-[#e2e8fc] border-[3px] border-black rounded-[4px] p-4 shadow-[12px_12px_0_0_rgba(0,0,0,1)] relative h-[280px]">
          {/* Main Layout Grid */}
          <div className="flex gap-2 h-full relative">
            {/* Left Content Area */}
            <div className="flex-1 flex flex-col gap-4">
              {/* LCD Screen */}
              <div className="bg-[#a9b08d] border-2 border-black p-3 relative shadow-[inset_2px_4px_10px_rgba(0,0,0,0.15)] flex flex-col justify-between h-[100px]">
                <div className="flex justify-between items-center text-[8px] text-black/60 font-bold uppercase tracking-wider">
                  <span>TOC Reading...</span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-black/60 animate-pulse" />
                    <span>Play</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-black font-bold uppercase tracking-wide truncate text-lg leading-tight">{song}</span>
                  <span className="text-black/80 font-sans font-medium text-sm truncate">{artist} {genre && `• ${genre}`}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1 flex-1 bg-black/20 rounded-full overflow-hidden">
                    <div className="h-full bg-black/80 w-[40%]" />
                  </div>
                  <span className="text-[10px] text-black/80 font-bold">03:42</span>
                </div>
              </div>

              {/* Cover Art Area */}
              <div className="relative mt-2 flex flex-col">
                <Tape color="primary" rotation={-45} className="absolute -top-3 -left-3 z-20 w-10 h-4 bg-blue-500/80!" />
                <div className="w-32 h-32 border-2 border-black bg-white shrink-0 relative overflow-hidden shadow-[4px_4px_0__rgba(0,0,0,0.5)] bg-[#111]">
                  {albumArt ? (
                    <img src={albumArt} alt={song} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <Music size={24} className="text-white" />
                    </div>
                  )}
                  {/* Subtle playback overlay matching reference */}
                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-center gap-2 opacity-50 bg-black/40 rounded-full px-2 py-1 backdrop-blur-sm">
                    <SkipBack size={10} className="text-white" />
                    <button onClick={previewUrl ? togglePlay : undefined} onPointerDown={(e) => e.stopPropagation()} className={!previewUrl ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-110 transition-transform'}>
                      {isPlaying ? <Pause size={10} className="text-white" /> : <Play size={10} className="text-white" />}
                    </button>
                    <SkipForward size={10} className="text-white" />
                  </div>
                </div>
                
                {/* Indicator Lights below LCD */}
                <div className="absolute right-0 bottom-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#b8860b] border-2 border-black shadow-[inset_1px_2px_4px_rgba(255,255,255,0.4)]" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#555]">LP2 Mode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#cc0000] border-2 border-black shadow-[inset_1px_2px_4px_rgba(255,255,255,0.4)]" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#555]">Rec-Protect</span>
                  </div>
                </div>
                
                {/* Digital Record text */}
                <div className="absolute bottom-16 right-[-20px] border border-dashed border-black/50 rounded-full px-3 py-1 flex items-center justify-end w-[130px] z-0 opacity-40">
                   <span className="text-[8px] font-bold tracking-widest mr-2">DIGITAL RECORD</span>
                </div>
              </div>
            </div>

            {/* Right Metallic Shutter Area */}
            <div className="w-[100px] shrink-0 bg-[#d8dfe6] border-2 border-black relative z-10 shadow-lg ml-6 overflow-hidden flex flex-col items-center">
              {/* Vertical line pattern (shutter texture) */}
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, black 2px, black 3px)' }} />
              <div className="absolute top-8 -right-2 bg-[#cc0000] border border-black text-white px-2 py-0.5 text-[8px] font-bold rotate-[15deg]">
                74
              </div>
              <div className="w-8 h-10 border-2 border-black rounded-[8px] mt-auto mb-10 bg-[#a3b3c5] shadow-[inset_2px_4px_8px_rgba(0,0,0,0.2)]" />
            </div>
          </div>
          
          {/* Bottom Bar Details */}
          <div className="absolute bottom-[-20px] left-2 right-6 h-4 flex justify-between bg-white border-2 border-black">
             <div className="flex gap-1 items-end h-full p-0.5 w-[60%]">
               <div className="w-12 h-2 bg-[#0033cc] border border-black" />
               <div className="w-6 h-2/3 bg-black" />
               <div className="w-10 h-2 border border-black bg-[#cc0000]" />
               <div className="w-6 h-2/3 bg-black" />
               <div className="w-12 h-2 bg-[#0033cc] border border-black" />
             </div>
             <div className="flex h-full items-center justify-end pr-2 text-[6px] font-bold italic tracking-[0.2em] w-[40%] border-l border-black bg-white">
               VOLUME
               <div className="w-4 h-full border-l border-black ml-4" />
             </div>
          </div>
        </div>
        {previewUrl && <audio ref={audioRef} src={previewUrl} preload="none" />}
      </motion.article>
    );
  }

  // Vinyl Reference Implementation
  if (isVinyl) {
    return (
      <motion.article
        initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
        animate={{ opacity: 1, scale: 1, rotate: rotation }}
        whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
        className="relative w-[340px] sm:w-[420px] mb-6 group font-sans"
      >
        <div className={`bg-[#fdfbf7] border-2 border-black rounded-sm p-4 shadow-[8px_8px_0_0_#111] relative flex h-[160px] w-full items-center overflow-hidden`}>
          {/* Main Sleeve */}
          <div className="w-[124px] h-[124px] bg-white border border-black shadow-md relative z-20 flex-shrink-0 group-hover:-translate-x-1 group-hover:-rotate-2 transition-transform duration-500 origin-bottom-left">
             {albumArt ? (
               <img src={albumArt} alt={song} className="w-full h-full object-cover grayscale-[0.2] contrast-125" />
             ) : (
               <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                 <Disc size={32} className="text-orange-900/40" />
               </div>
             )}
             {/* Wear and tear flex */}
             <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.3)] pointer-events-none mix-blend-multiply border border-black/10" />
             <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/30 to-transparent pointer-events-none" />
          </div>

          {/* Vinyl Record */}
          <div className={`absolute top-1/2 -translate-y-1/2 left-[70px] w-[118px] h-[118px] rounded-full bg-[#111] z-10 shadow-[6px_0_15px_rgba(0,0,0,0.4)] flex items-center justify-center border-[3px] border-[#222] transition-all duration-[800ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] ${loading ? 'animate-pulse' : 'group-hover:translate-x-[64px] group-hover:rotate-[180deg]'}`}>
             {/* Grooves */}
             <div className="absolute inset-1 rounded-full border border-white/10" />
             <div className="absolute inset-[10px] rounded-full border border-white/5" />
             <div className="absolute inset-[20px] rounded-full border border-white/10" />
             <div className="absolute inset-[30px] rounded-full border border-[#000] border-2" />

             {/* Reflections */}
             <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 rounded-full" />
             
             {/* Center Label */}
             <div className={`w-[44px] h-[44px] rounded-full border-2 border-[#111] flex flex-col items-center justify-center relative shadow-[inset_0_0_8px_rgba(0,0,0,0.4)]`} style={{ backgroundColor: vinylLabelBg }}>
                 <div className="text-[4px] uppercase font-bold text-white text-center mb-0.5 w-[30px] line-clamp-1 opacity-90">{artist}</div>
                 {/* Center hole */}
                 <div className="w-[12px] h-[12px] rounded-full bg-black/20 flex items-center justify-center">
                   <div className="w-2.5 h-2.5 rounded-full bg-[#fdfbf7] border border-black/40 shadow-inner z-10" />
                 </div>
                 <div className="text-[3px] uppercase font-bold text-white text-center mt-1 w-[30px] line-clamp-1 truncate opacity-70 tracking-widest">{song}</div>
             </div>
          </div>

          {/* Spacer block for absolute vinyl translation space */}
          <div className="w-[48px] shrink-0" />

          {/* Text Area */}
          <div className="flex-1 flex flex-col justify-center z-30 transition-transform pl-4 relative h-full">
            <div className="bg-[#111] text-white text-[7px] font-bold px-1.5 py-0.5 uppercase tracking-widest w-fit mb-1.5 border border-black shadow-[1px_1px_0_#666]">
              33 ⅓ RPM
            </div>
            
            <h3 className="font-serif italic font-bold text-xl leading-tight text-black line-clamp-2 tracking-tight group-hover:text-[#cc0000] transition-colors">{song}</h3>
            <p className="text-[11px] font-sans font-bold text-gray-600 uppercase tracking-wider truncate mt-1 mb-3">{artist} {genre && `• ${genre}`}</p>
            
            <div className="flex gap-2 relative z-20">
              <button className="bg-white border-2 border-black w-8 h-8 flex items-center justify-center shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-gray-50 transition-all text-[#111]">
                <SkipBack size={12} fill="currentColor" strokeWidth={1} />
              </button>
              <button 
                onClick={previewUrl ? togglePlay : undefined}
                onPointerDown={(e) => e.stopPropagation()}
                className={`bg-black border-2 border-black text-white w-10 h-8 flex items-center justify-center shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-gray-800 transition-all ${!previewUrl && 'opacity-50 cursor-not-allowed'}`}
              >
                {isPlaying ? <Pause size={14} fill="white" strokeWidth={1} /> : <Play size={14} fill="white" strokeWidth={1} />}
              </button>
              <button className="bg-white border-2 border-black w-8 h-8 flex items-center justify-center shadow-[2px_2px_0_#000] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none hover:bg-gray-50 transition-all text-[#111]">
                <SkipForward size={12} fill="currentColor" strokeWidth={1} />
              </button>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  if (isCassette) {
    return (
      <motion.article 
        initial={{ opacity: 0, scale: 0.9, rotate: rotation }}
        animate={{ opacity: 1, scale: 1, rotate: rotation }}
        whileHover={{ scale: 1.02, rotate: 0, zIndex: 50 }}
        className="w-[320px] sm:w-[400px] mb-6 relative group font-sans"
      >
        <div className="bg-[#222] rounded-[8px] border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative h-[210px] p-4 flex flex-col overflow-hidden">
           {/* Texture/Depth */}
           <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-[#333] to-[#222] border-b border-black/40 z-10" />
           
           {/* Middle Indent area - Changed to be relative-positioned child of a flex-1 container to avoid overlap */}
           <div className="flex-1 my-4 relative">
             <div className="absolute inset-0 border-2 border-[#111] rounded-sm bg-[#1a1a1a] shadow-[inset_0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-between px-8">
                {/* Left Wheel */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#222] bg-[#111] flex items-center justify-center relative shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] ${loading ? '' : 'group-hover:rotate-180 transition-transform duration-1000'}`}>
                     <div className="w-8 h-8 rounded-full border-2 border-[#222] bg-transparent flex flex-col justify-between items-center py-2">
                         <div className="w-full h-px bg-[#222] rotate-45 transform origin-center" />
                         <div className="w-full h-px bg-[#222] -rotate-45 transform origin-center" />
                     </div>
                </div>
                
                {/* Center Label Area */}
                <div className="flex-1 h-full mx-2 sm:mx-4 py-2 z-10">
                    <div className="w-full h-full bg-[#f4f4f0] border-2 border-slate-300 rounded-sm shadow-md py-1 px-2 flex gap-2 rotate-[-0.5deg]">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black shrink-0 relative overflow-hidden border border-gray-400">
                             {loading ? (
                               <div className="w-full h-full flex items-center justify-center animate-pulse">
                                  <Disc size={20} className="text-gray-400 opacity-30" />
                               </div>
                             ) : albumArt ? (
                               <img src={albumArt} className="w-full h-full object-cover grayscale contrast-125 sepia-[0.2]" />
                             ) : (
                               <div className="w-full h-full bg-[#333]" />
                             )}
                        </div>
                        <div className="flex flex-col flex-1 justify-center min-w-0">
                            <div className="border-b border-red-500/30 pb-0.5 mb-1">
                               <h3 className="font-sans font-bold text-black uppercase text-[10px] leading-none truncate">{song || 'Unknown Track'}</h3>
                            </div>
                            <h4 className="font-sans font-medium text-gray-600 uppercase text-[8px] leading-none truncate">{artist || 'Unknown Artist'} {genre && `• ${genre}`}</h4>
                        </div>
                    </div>
                </div>
 
                {/* Right Wheel */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#222] bg-[#111] flex items-center justify-center relative shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] ${loading ? '' : 'group-hover:rotate-180 transition-transform duration-1000'}`}>
                     <div className="w-8 h-8 rounded-full border-2 border-[#222] bg-transparent flex flex-col justify-between items-center py-2">
                         <div className="w-full h-px bg-[#222] rotate-45 transform origin-center" />
                         <div className="w-full h-px bg-[#222] -rotate-45 transform origin-center" />
                     </div>
                </div>
             </div>
           </div>
 
           {/* Bottom Bar: SIDE A / STEREO */}
           <div className="flex justify-between items-center mt-auto h-8 px-2 z-10">
               <div className="bg-[#cc0000] text-white px-2 py-0.5 text-[10px] font-black italic shadow-[2px_2px_0_rgba(0,0,0,1)]">SIDE A</div>
               <div className="flex gap-4">
                   <div className="flex flex-col items-center">
                       <span className="text-[6px] text-gray-400 font-bold tracking-tighter uppercase">NR</span>
                       <div className="w-4 h-1.5 bg-[#111] border border-[#333]" />
                   </div>
                   <div className="flex flex-col items-center">
                       <span className="text-[6px] text-gray-400 font-bold tracking-tighter uppercase mb-0.5">PLAY</span>
                       <button 
                         onClick={previewUrl ? togglePlay : undefined}
                         onPointerDown={(e) => e.stopPropagation()}
                         className={`w-10 h-3 rounded-[2px] flex items-center justify-center border border-[#333] shadow-inner ${isPlaying ? 'bg-green-600 shadow-[0_0_8px_#22c55e]' : 'bg-[#111] hover:bg-gray-800'} transition-all ${!previewUrl && 'opacity-50 cursor-not-allowed'}`} 
                       >
                         {isPlaying ? <Pause size={8} fill="white" className="text-white" /> : <Play size={8} fill="white" className="text-white" />}
                       </button>
                   </div>
                   <div className="flex flex-col items-center">
                       <span className="text-[6px] text-gray-400 font-bold tracking-tighter uppercase">CH</span>
                       <div className="w-4 h-1.5 bg-red-800 border border-[#333]" />
                   </div>
               </div>
               <div className="font-mono text-[#555] text-[8px] font-bold tracking-widest uppercase">High Bias / 90 min</div>
           </div>
        </div>
        {previewUrl && <audio ref={audioRef} src={previewUrl} preload="none" />}
      </motion.article>
    );
  }

  const effectiveBg = 
    isCassette ? '#222' : 
    isVhs ? '#111' :
    isCd ? '#dddddd' :
    isMiniDisc ? '#1a1a1a' :
    isVinyl ? '#fdfbf7' :
    isY2K ? '#fcd5ce' :
    bgColor || (isBrutalist ? '#fff' : '#fdfcf8');

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
        ${isMinimal ? `bg-transparent border-l-2 ${borderClass} ${borderColor} p-2 ${textColor}` : ''}
        ${isY2K ? `p-md rounded-2xl border-2 border-fuchsia-400 bg-gradient-to-tr from-purple-500/20 to-pink-400/20 backdrop-blur-md shadow-[0_0_15px_rgba(232,121,249,0.3)] text-fuchsia-900 border-dashed` : ''}
        ${isBrutalist ? `border-4 border-black p-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)] uppercase font-bold text-black bg-white` : ''}
        ${isStandard ? `border-2 border-black p-md rounded-[8px] bg-white text-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]` : ''}
        ${isRetro ? `border-2 ${borderClass} ${borderColor} p-md analog-shadow ${textColor}` : ''}
      `}
      style={{ backgroundColor: (isMinimal || isY2K || isBrutalist || isStandard) ? undefined : effectiveBg }}
    >
      {isRetro && (
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

      {(isRetro || isBrutalist || isStandard || isMinimal) && (
        <div className={`flex items-center justify-between border-b ${isStandard ? 'border-solid border-black' : isBrutalist ? 'border-solid border-black' : isMinimal ? 'border-solid border-gray-200' : `border-dashed ${borderColor}`} pb-sm mb-sm opacity-60`}>
          <span className={`font-bold text-[10px] uppercase ${isStandard || isBrutalist ? 'text-black opacity-100' : ''}`}>Now Playing</span>
          <Music size={14} className={isStandard || isBrutalist ? 'text-black opacity-100' : ''} />
        </div>
      )}

      <div className={`flex items-center gap-md mt-2`}>
        <div className={`
          shrink-0 flex items-center justify-center w-16 h-16 bg-white border ${isY2K ? 'border-pink-300 rounded-lg shadow-inner' : isStandard ? 'border-black shadow-sm' : isBrutalist ? 'border-black border-2' : borderColor}
          ${isCassette ? 'grayscale contrast-125' : ''}
        `}>
          {loading ? (
             <div className={`flex items-center justify-center animate-pulse w-10 h-10 border-2 ${isStandard || isBrutalist ? 'border-black' : borderColor} rounded-full`}>
               <Disc size={20} className="opacity-30 text-black" />
             </div>
          ) : albumArt ? (
            <div className={`relative w-full h-full`}>
              <img src={albumArt} alt={song} className={`object-cover w-full h-full`} />
            </div>
          ) : (
            <div className={`flex items-center justify-center relative w-10 h-10 border-2 ${isStandard ? 'border-black' : borderColor} rounded-full`}>
               <div className={`w-2 h-2 rounded-full ${isStandard ? 'bg-black' : borderColor.replace('border-', 'bg-').replace('/30', '')}`} />
            </div>
          )}
        </div>
        
        <div className={`flex flex-col overflow-hidden ${isMinimal ? 'pl-2' : ''}`}>
          <span className={`font-bold truncate ${isMinimal ? 'text-md' : 'text-sm'}`}>{song}</span>
          <span className={`italic truncate ${isMinimal ? 'text-[10px]' : 'text-[12px] opacity-70'}`}>{artist} {genre && `• ${genre}`}</span>
        </div>
      </div>

      {!isMinimal && (
        <div className={`flex justify-center gap-md mt-md ${isCassette ? 'text-white/80' : isStandard || isBrutalist ? 'text-black' : textColor}`}>
          <button className="hover:scale-110 transition-transform"><SkipBack size={18} /></button>
          <button 
            onClick={previewUrl ? togglePlay : undefined}
            onPointerDown={(e) => e.stopPropagation()}
            className={`border rounded-full p-1 hover:opacity-80 transition-all ${isCassette ? 'border-white/20' : isStandard || isBrutalist ? 'border-black shadow-sm' : borderColor} ${!previewUrl && 'opacity-30 cursor-not-allowed'}`}
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button className="hover:scale-110 transition-transform"><SkipForward size={18} /></button>
        </div>
      )}
      {previewUrl && <audio ref={audioRef} src={previewUrl} preload="none" />}
    </motion.article>
  );
}

