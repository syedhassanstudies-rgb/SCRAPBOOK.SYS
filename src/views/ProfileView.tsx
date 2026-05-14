import { useState, useEffect, useRef } from 'react';
import { doc, getDoc, collection, query, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Polaroid } from '../components/Polaroid';
import { MusicWidget } from '../components/MusicWidget';
import { NoteWidget } from '../components/NoteWidget';
import { MovieWidget } from '../components/MovieWidget';
import { Guestbook } from '../components/Guestbook';
import { Tape } from '../components/Tape';
import { Decoration } from '../components/Decoration';
import { TopListWidget } from '../components/TopListWidget';
import { UserProfile, ScrapbookPieceData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { getContrastText, getContrastBorder, sanitizeData } from '../lib/utils';

interface ProfileViewProps {
  userId: string;
  isOwner?: boolean;
}

export function ProfileView({ userId, isOwner }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pieces, setPieces] = useState<ScrapbookPieceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      }
    };

    const q = query(
      collection(db, 'users', userId, 'pieces'),
      orderBy('style.y', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPieces(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScrapbookPieceData)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}/pieces`));

    fetchProfile();
    return () => unsubscribe();
  }, [userId]);

  const handleDragEnd = async (pieceId: string, info: any) => {
    if (!isOwner) return;
    const piece = pieces.find(p => p.id === pieceId);
    if (!piece) return;

    const maxZ = Math.max(...pieces.map(p => p.style.zIndex || 0), 10);
    try {
      await updateDoc(doc(db, 'users', userId, 'pieces', pieceId), sanitizeData({
        'style.offsetX': (piece.style.offsetX || 0) + info.offset.x,
        'style.offsetY': (piece.style.offsetY || 0) + info.offset.y,
        'style.zIndex': maxZ + 1
      }));
    } catch (error) {
      console.error("Error updating piece position:", error);
    }
  };

  if (loading) return null;

  if (!profile) {
    return <div className="text-center py-20 italic">Archive deleted or never existed...</div>;
  }

  const renderDraggablePiece = (piece: ScrapbookPieceData) => {
    const scaleClasses = {
      sm: 'scale-90 origin-center',
      md: 'scale-100',
      lg: 'scale-105 origin-center'
    };
    const scaleClass = scaleClasses[(piece.style.size as 'sm'|'md'|'lg') || 'md'];

    const alignClasses = {
      left: 'self-start justify-self-start',
      center: 'self-center justify-self-center',
      right: 'self-end justify-self-end'
    };
    const alignClass = alignClasses[(piece.style.align as 'left'|'center'|'right') || 'center'];

    return (
      <motion.div
        key={piece.id}
        drag={isOwner}
        dragConstraints={boundsRef}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={(_, info) => handleDragEnd(piece.id, info)}
        whileDrag={{ scale: 1.02, zIndex: 500 }}
        className={`${isOwner ? 'cursor-grab active:cursor-grabbing' : ''} relative z-10 w-fit shrink-0 max-w-[100vw] ${scaleClass} ${alignClass} flex justify-center`}
        style={{
          x: piece.style.offsetX || 0,
          y: piece.style.offsetY || 0,
          zIndex: piece.style.zIndex || 1
        }}
      >
        {renderPiece(piece, userId, theme)}
      </motion.div>
    );
  };

  const headerBgColor = profile.headerBackgroundColor || '#fffff8';
  const headerTextColor = getContrastText(headerBgColor);
  const headerBorderColor = getContrastBorder(headerBgColor);
  
  const theme = profile.theme || 'retro';
  
  const themeClasses: Record<string, string> = {
    retro: `border ${headerBorderColor} analog-shadow-lg paper-edge -rotate-1`,
    minimal: `rounded-3xl border border-opacity-20 shadow-2xl backdrop-blur-md rotate-0`,
    brutalist: `border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] uppercase tracking-wider rotate-0 rounded-none`,
    y2k: `rounded-[2rem] border-2 border-pink-300 shadow-[0_0_20px_rgba(255,105,180,0.3)] bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-lg rotate-0`,
    gothic: `border-y-4 ${headerBorderColor} border-double shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md rounded-sm rotate-0`,
    medieval: `border-8 ${headerBorderColor} shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md rotate-0 bg-opacity-90`,
    scrapbook: `border-0 shadow-xl rotate-2 paper-edge p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAiLz4KPHBhdGggZD0iTTAgMEg0VjRIMEoiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPgo8L3N2Zz4=')]`
  };
  
  const avatarThemeClasses: Record<string, string> = {
    retro: `p-2 pb-8 border ${headerBorderColor} analog-shadow inline-block relative rotate-[-2deg]`,
    minimal: `p-1 rounded-full border-4 border-white shadow-xl rotate-0`,
    brutalist: `border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] rotate-0 rounded-none`,
    y2k: `rounded-full border-4 border-purple-300 p-1 bg-gradient-to-tr from-pink-300 to-purple-300 rotate-0`,
    gothic: `p-1 border-2 border-double ${headerBorderColor} rounded-full rotate-0 shadow-[0_0_15px_rgba(0,0,0,0.5)]`,
    medieval: `p-2 border-4 ${headerBorderColor} shadow-xl rotate-0 rounded-tl-xl rounded-br-xl rounded-tr-md rounded-bl-md`,
    scrapbook: `p-3 pb-6 bg-white border border-gray-200 shadow-md rotate-[-4deg]`
  };
  
  const avatarImgClasses: Record<string, string> = {
    retro: `w-32 h-32 md:w-40 md:h-40 object-cover grayscale contrast-125 sepia-[.2] transition-colors duration-700 hover:grayscale-0 hover:contrast-100 hover:sepia-0`,
    minimal: `w-32 h-32 md:w-40 md:h-40 object-cover rounded-full`,
    brutalist: `w-32 h-32 md:w-40 md:h-40 object-cover grayscale contrast-150`,
    y2k: `w-32 h-32 md:w-40 md:h-40 object-cover rounded-full`,
    gothic: `w-32 h-32 md:w-40 md:h-40 object-cover rounded-full grayscale-[0.8] contrast-125`,
    medieval: `w-32 h-32 md:w-40 md:h-40 object-cover rounded-tl-lg rounded-br-lg rounded-tr-sm rounded-bl-sm sepia-[0.5] contrast-110`,
    scrapbook: `w-32 h-32 md:w-40 md:h-40 object-cover`
  };

  const patternColor = headerTextColor === 'text-paper-ink' ? '%23000000' : '%23ffffff';
  const patternOpacity = '0.08';
  const getPatternUrl = (pattern?: string) => {
    switch(pattern) {
      case 'dots': return `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='${patternColor}' fill-opacity='${patternOpacity}' fill-rule='evenodd'%3E%3Ccircle cx='2' cy='2' r='2'/%3E%3C/g%3E%3C/svg%3E")`;
      case 'grid': return `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='${patternColor}' fill-opacity='${patternOpacity}' fill-rule='evenodd'/%3E%3C/svg%3E")`;
      case 'lines': return `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v1H0z' fill='${patternColor}' fill-opacity='${patternOpacity}' fill-rule='evenodd'/%3E%3C/svg%3E")`;
      case 'diagonal': return `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20L20 0H18L0 18V20ZM20 20V18L18 20H20ZM0 0V2L2 0H0Z' fill='${patternColor}' fill-opacity='${patternOpacity}' fill-rule='evenodd'/%3E%3C/svg%3E")`;
      case 'cross': return `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 9h2v2H9V9z' fill='${patternColor}' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`;
      case 'checkerboard': return `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h10v10H0V0zm10 10h10v10H10V10z' fill='${patternColor}' fill-opacity='0.04' fill-rule='evenodd'/%3E%3C/svg%3E")`;
      default: return 'none';
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 min-h-screen z-[-1] transition-colors duration-1000"
        style={{ 
          backgroundColor: profile.backgroundColor || 'transparent',
          backgroundImage: getPatternUrl(profile.backgroundPattern)
        }}
      />
      
      {/* Hidden bounds for drag constraints without expanding page scroll */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
        <div ref={boundsRef} className="absolute top-[-20px] left-[-20px] right-[-20px] h-[20000px] md:top-[-50px] md:left-[-50px] md:right-[-50px]" />
      </div>

      <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-xl flex flex-col gap-xl relative z-10 w-full min-h-screen">
        
      {/* Hero Section */}
      <section 
        className={`relative self-center w-full max-w-3xl p-xl md:p-2xl mt-xl mb-2xl z-20 transition-all duration-500 ${headerTextColor} ${themeClasses[theme]}`}
        style={{ backgroundColor: theme === 'y2k' ? undefined : headerBgColor }}
      >
        {theme === 'retro' && (
          <>
            <Tape color="secondary" rotation={-6} className="-top-3 -left-4 w-20 h-6 opacity-90" />
            <Tape color="tertiary" rotation={3} className="-bottom-3 -right-4 w-16 h-5 opacity-80" />
          </>
        )}

        {theme === 'y2k' && (
          <>
            <div className="absolute top-2 right-4 text-purple-400 animate-pulse drop-shadow-[0_0_8px_rgba(255,105,180,0.8)]"><Sparkles size={32} /></div>
            <div className="absolute top-1/2 -left-6 text-pink-400 animate-pulse delay-75 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)]"><Sparkles size={24} /></div>
            <div className="absolute bottom-4 right-1/4 text-fuchsia-400 animate-pulse delay-150 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)]"><Sparkles size={28} /></div>
          </>
        )}
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-lg text-center md:text-left">
          <div className="flex-shrink-0 rotate-3 transition-transform duration-500 group">
            <div className={`${avatarThemeClasses[theme]} transition-transform duration-500 group-hover:rotate-0`} style={{ backgroundColor: theme === 'retro' ? headerBgColor : undefined }}>
               {theme === 'retro' && <Tape color="primary" rotation={-5} className="-top-3 left-1/2 -translate-x-1/2 w-12 h-4 opacity-70" />}
              <img 
                src={profile.avatarUrl || 'https://via.placeholder.com/150'} 
                className={avatarImgClasses[theme]} 
                alt="" 
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-md flex-grow">
            <div>
              <h1 className={`${profile.titleFontFamily === 'sans' ? 'font-sans' : profile.titleFontFamily === 'mono' ? 'font-mono' : 'font-serif'} ${profile.titleFontSize === 'sm' ? 'text-2xl' : profile.titleFontSize === 'md' ? 'text-4xl' : profile.titleFontSize === 'xl' ? 'text-6xl md:text-8xl' : 'text-3xl md:text-5xl'} ${theme === 'brutalist' ? 'uppercase font-bold' : ''}`}>@{profile.username}</h1>
              <p className={`${profile.fontFamily === 'serif' ? 'font-serif' : profile.fontFamily === 'sans' ? 'font-sans' : 'font-mono'} ${profile.fontSize === 'sm' ? 'text-sm' : profile.fontSize === 'lg' ? 'text-xl' : 'text-lg'} italic opacity-60 ${headerTextColor}`}>{profile.subtitle}</p>
            </div>
            <p className={`text-sm max-w-md ${profile.fontFamily === 'serif' ? 'font-serif' : profile.fontFamily === 'sans' ? 'font-sans' : 'font-mono'}`}>
              {profile.bio}
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-sm">
              {isOwner ? (
                <>
                  <button onClick={() => { window.history.pushState({}, '', '/editor'); window.dispatchEvent(new PopStateEvent('popstate')); }} className={`${headerTextColor === 'text-paper-base' ? 'bg-white text-paper-ink border-white' : 'bg-paper-ink text-white border-paper-ink'} font-bold uppercase text-[12px] px-8 py-2 border hover:-translate-y-1 hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] transition-all flex items-center gap-2`}>
                    Enter Studio
                  </button>
                  <button onClick={() => { 
                    navigator.clipboard.writeText(`${window.location.origin}/p/${userId}`); 
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }} className={`bg-transparent ${headerTextColor} font-bold uppercase text-[12px] px-6 py-2 border ${headerBorderColor} border-dashed hover:opacity-80 hover:rotate-1 transition-all flex items-center justify-center min-w-[120px]`}>
                    {isCopied ? 'Copied!' : 'Share Link'}
                  </button>
                </>
              ) : (
                <>
                  <button className={`${headerTextColor === 'text-paper-base' ? 'bg-white text-paper-ink border-white' : 'bg-paper-ink text-white border-paper-ink'} font-bold uppercase text-[12px] px-8 py-2 border hover:-translate-y-1 hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] transition-all flex items-center gap-2`}>
                    Follow
                  </button>
                  <button className={`bg-transparent ${headerTextColor} font-bold uppercase text-[12px] px-6 py-2 border ${headerBorderColor} border-dashed hover:opacity-80 hover:rotate-1 transition-all`}>
                    Message
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Grid of pieces */}
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-12 gap-xl relative">
        <div className="col-span-1 md:col-span-5 flex flex-col gap-xl z-10">
          {pieces.filter(p => p.style.column === 'left' || (!p.style.column && p.type !== 'guestbook' && pieces.indexOf(p) % 2 === 0)).map(piece => renderDraggablePiece(piece))}
          {/* Default items if empty */}
          {pieces.length === 0 && (
             <div className="flex flex-col gap-xl">
               <MusicWidget song="Fade Into You" artist="Mazzy Star" />
               <TopListWidget title="Top 5 Movies" items={['Chungking Express', 'Before Sunrise', 'Lost in Translation', 'Perfect Days', 'In the Mood for Love']} type="movies" />
             </div>
          )}
        </div>
        
        <div className="col-span-1 md:col-span-7 flex flex-col gap-lg relative mt-xl md:mt-0 z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
            {pieces.filter(p => p.style.column === 'right' || (!p.style.column && p.type !== 'guestbook' && pieces.indexOf(p) % 2 !== 0)).map(piece => renderDraggablePiece(piece))}
          </div>
          
          {/* Full width items */}
          <div className="flex flex-col gap-lg">
            {pieces.filter(p => p.style.column === 'full' || (!p.style.column && p.type === 'guestbook')).map(piece => renderDraggablePiece(piece))}
          </div>
          
          {/* Default items if empty */}
          {pieces.length === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
                <Polaroid src="https://images.unsplash.com/photo-1514525253361-bee873859030?q=80&w=800" caption="basement show, '23" rotation={2} />
                <TopListWidget title="Current Rotation" items={['Mazzy Star', 'Portishead', 'Slowdive', 'Cocteau Twins']} type="songs" color="tertiary" />
              </div>
              <Guestbook targetUserId={userId} />
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

function renderPiece(piece: ScrapbookPieceData, userId: string, profileTheme: string) {
  const pieceTheme = piece.data.theme || profileTheme;
  switch (piece.type) {
    case 'music':
      return <MusicWidget key={piece.id} id={piece.id} userId={userId} {...piece.data} rotation={piece.style.rotate} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={pieceTheme as any} />;
    case 'note':
      return <NoteWidget key={piece.id} id={piece.id} userId={userId} {...piece.data} rotation={piece.style.rotate} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={pieceTheme as any} />;
    case 'movie':
      return <MovieWidget key={piece.id} id={piece.id} userId={userId} {...piece.data} rotation={piece.style.rotate} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={pieceTheme as any} />;
    case 'top-movies':
      return <TopListWidget key={piece.id} id={piece.id} userId={userId} {...piece.data} type="movies" rotation={piece.style.rotate} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={pieceTheme as any} />;
    case 'top-songs':
      return <TopListWidget key={piece.id} id={piece.id} userId={userId} {...piece.data} type="songs" rotation={piece.style.rotate} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={pieceTheme as any} />;
    case 'polaroid':
      return <Polaroid key={piece.id} id={piece.id} userId={userId} {...piece.data} rotation={piece.style.rotate} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={pieceTheme as any} />;
    case 'decoration':
      return <Decoration key={piece.id} id={piece.id} userId={userId} {...piece.data} rotation={piece.style.rotate} color={piece.style.color as any} theme={pieceTheme as any} />;
    case 'guestbook':
      return <Guestbook key={piece.id} targetUserId={userId} rotation={piece.style.rotate} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={pieceTheme as any} />;
    default:
      return null;
  }
}
