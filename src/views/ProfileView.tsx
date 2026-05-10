import { useState, useEffect } from 'react';
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
import { getContrastText, getContrastBorder } from '../lib/utils';

interface ProfileViewProps {
  userId: string;
  isOwner?: boolean;
}

export function ProfileView({ userId, isOwner }: ProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pieces, setPieces] = useState<ScrapbookPieceData[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Find highest zIndex
    const maxZ = Math.max(...pieces.map(p => p.style.zIndex || 0), 10);

    try {
      await updateDoc(doc(db, 'users', userId, 'pieces', pieceId), {
        'style.x': (piece.style.x || 0) + info.offset.x,
        'style.y': (piece.style.y || 0) + info.offset.y,
        'style.zIndex': maxZ + 1
      });
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
      sm: 'scale-75 origin-top-left',
      md: 'scale-100',
      lg: 'scale-125'
    };
    const scaleClass = scaleClasses[(piece.style.size as 'sm'|'md'|'lg') || 'md'];

    return (
      <motion.div
        key={piece.id}
        drag={isOwner}
        dragMomentum={false}
        onDragEnd={(_, info) => handleDragEnd(piece.id, info)}
        whileDrag={{ scale: 1.05, zIndex: 100 }}
        className={`${isOwner ? 'cursor-grab active:cursor-grabbing' : ''} h-fit w-fit ${scaleClass}`}
        style={{
          x: piece.style.x || 0,
          y: piece.style.y || 0,
          zIndex: piece.style.zIndex || 1
        }}
      >
        {renderPiece(piece, userId)}
      </motion.div>
    );
  };

  const headerBgColor = profile.headerBackgroundColor || '#fffff8';
  const headerTextColor = getContrastText(headerBgColor);
  const headerBorderColor = getContrastBorder(headerBgColor);

  return (
    <>
      <div 
        className={`fixed inset-0 min-h-screen z-[-1] transition-colors duration-1000 ${
          profile.backgroundPattern === 'dots' ? 'bg-[url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'2\'/%3E%3C/g%3E%3C/svg%3E")]' :
          profile.backgroundPattern === 'grid' ? 'bg-[url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z\' fill=\'%23000000\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]' :
          profile.backgroundPattern === 'lines' ? 'bg-[url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v1H0z\' fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]' :
          ''
        }`}
        style={{ backgroundColor: profile.backgroundColor || 'transparent' }}
      />
      <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-xl flex flex-col gap-xl relative z-10 w-full min-h-screen">
      
      {/* Hero Section */}
      <section 
        className={`relative self-center w-full max-w-2xl p-lg md:p-xl border ${headerBorderColor} analog-shadow-lg paper-edge -rotate-1 mt-md mb-xl z-20 transition-transform duration-500 hover:rotate-0 ${headerTextColor}`}
        style={{ backgroundColor: headerBgColor }}
      >
        <Tape color="secondary" rotation={-6} className="-top-3 -left-4 w-20 h-6 opacity-90" />
        <Tape color="tertiary" rotation={3} className="-bottom-3 -right-4 w-16 h-5 opacity-80" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-lg text-center md:text-left">
          <div className="flex-shrink-0 rotate-3 transition-transform duration-500 group">
            <div className={`p-2 pb-8 border ${headerBorderColor} analog-shadow inline-block relative rotate-[-2deg] group-hover:rotate-0 transition-transform duration-500`} style={{ backgroundColor: headerBgColor }}>
               <Tape color="primary" rotation={-5} className="-top-3 left-1/2 -translate-x-1/2 w-12 h-4 opacity-70" />
              <img 
                src={profile.avatarUrl || 'https://via.placeholder.com/150'} 
                className="w-32 h-32 md:w-40 md:h-40 object-cover grayscale contrast-125 sepia-[.2] transition-colors duration-700 group-hover:grayscale-0 group-hover:contrast-100 group-hover:sepia-0" 
                alt="" 
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-md flex-grow">
            <div>
              <h1 className="font-serif text-3xl md:text-5xl">@{profile.username}</h1>
              <p className={`font-mono text-lg italic opacity-60 ${headerTextColor}`}>{profile.subtitle}</p>
            </div>
            <p className="text-sm max-w-md">
              {profile.bio}
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-sm">
              {isOwner ? (
                <>
                  <button onClick={() => { window.history.pushState({}, '', '/editor'); window.dispatchEvent(new PopStateEvent('popstate')); }} className={`${headerTextColor === 'text-white' ? 'bg-white text-paper-ink border-white' : 'bg-paper-ink text-white border-paper-ink'} font-bold uppercase text-[12px] px-8 py-2 border hover:-translate-y-1 hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] transition-all flex items-center gap-2`}>
                    Enter Studio
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/p/${userId}`); alert("Link copied to clipboard!"); }} className={`bg-transparent ${headerTextColor} font-bold uppercase text-[12px] px-6 py-2 border ${headerBorderColor} border-dashed hover:opacity-80 hover:rotate-1 transition-all`}>
                    Share Link
                  </button>
                </>
              ) : (
                <>
                  <button className={`${headerTextColor === 'text-white' ? 'bg-white text-paper-ink border-white' : 'bg-paper-ink text-white border-paper-ink'} font-bold uppercase text-[12px] px-8 py-2 border hover:-translate-y-1 hover:shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] transition-all flex items-center gap-2`}>
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-xl relative">
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

function renderPiece(piece: ScrapbookPieceData, userId: string) {
  switch (piece.type) {
    case 'music':
      return <MusicWidget key={piece.id} {...piece.data} rotation={piece.style.rotate} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />;
    case 'note':
      return <NoteWidget key={piece.id} {...piece.data} rotation={piece.style.rotate} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />;
    case 'movie':
      return <MovieWidget key={piece.id} id={piece.id} userId={userId} {...piece.data} rotation={piece.style.rotate} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />;
    case 'top-movies':
      return <TopListWidget key={piece.id} id={piece.id} userId={userId} {...piece.data} type="movies" rotation={piece.style.rotate} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />;
    case 'top-songs':
      return <TopListWidget key={piece.id} id={piece.id} userId={userId} {...piece.data} type="songs" rotation={piece.style.rotate} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />;
    case 'polaroid':
      return <Polaroid key={piece.id} {...piece.data} rotation={piece.style.rotate} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />;
    case 'decoration':
      return <Decoration key={piece.id} {...piece.data} rotation={piece.style.rotate} color={piece.style.color as any} />;
    case 'guestbook':
      return <Guestbook key={piece.id} targetUserId={userId} rotation={piece.style.rotate} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />;
    default:
      return null;
  }
}
