import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { ScrapbookPieceData } from '../types';
import { sanitizeData, cn, getContrastText } from '../lib/utils';
import { Plus, Trash2, Save, Move, Upload, Search } from 'lucide-react';
import { MusicWidget } from '../components/MusicWidget';
import { NoteWidget } from '../components/NoteWidget';
import { MovieWidget } from '../components/MovieWidget';
import { Polaroid } from '../components/Polaroid';
import { Decoration } from '../components/Decoration';
import { TopListWidget } from '../components/TopListWidget';
import { Guestbook } from '../components/Guestbook';
import { searchMovieDetails, searchMovieResults } from '../services/movieService';
import { searchSpotifyTrack, searchSpotifyResults } from '../services/spotifyService';

export function EditorView() {
  const { user, profile, updateProfile } = useAuth();
  const [pieces, setPieces] = useState<ScrapbookPieceData[]>([]);
  const [piecesLoading, setPiecesLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  
  // Header state
  const [headerState, setHeaderState] = useState({
    username: profile?.username || '',
    subtitle: profile?.subtitle || '',
    bio: profile?.bio || '',
    avatarUrl: profile?.avatarUrl || '',
    backgroundColor: profile?.backgroundColor || '#f4f1ee',
    backgroundPattern: profile?.backgroundPattern || 'none',
    headerBackgroundColor: profile?.headerBackgroundColor || '#fffff8',
    theme: profile?.theme || 'retro',
    titleFontFamily: profile?.titleFontFamily || 'serif',
    titleFontSize: profile?.titleFontSize || 'lg',
    fontFamily: profile?.fontFamily || 'mono',
    fontSize: profile?.fontSize || 'md',
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'pieces'), orderBy('style.y', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setPieces(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScrapbookPieceData)));
      setPiecesLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/pieces`);
      setPiecesLoading(false);
    });
  }, [user]);

  const handleSaveHeader = async () => {
    try {
      await updateProfile(headerState);
      setEditingHeader(false);
    } catch (e) {
      console.error(e);
      alert('Failed to save profile. Please try again.');
    }
  };

  const addPiece = async (type: ScrapbookPieceData['type']) => {
    if (!user) return;
    const defaultData = {
      music: { song: 'Song Name', artist: 'Artist' },
      note: { title: 'New List', items: ['Item 1', 'Item 2'] },
      movie: { title: 'Movie Title', year: '2024', rating: '8.5' },
      polaroid: { src: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800', caption: 'New Memory' },
      guestbook: {},
      decoration: { text: 'Decoration' },
      'top-movies': { title: 'Top 10 Movies', items: ['Inception', 'Pulp Fiction', 'The Godfather'] },
      'top-songs': { title: 'Top 10 Songs', items: ['Starboy', 'Blinding Lights', 'The Hills'] }
    };

    try {
      await addDoc(collection(db, 'users', user.uid, 'pieces'), sanitizeData({
        type,
        data: defaultData[type],
        style: {
          x: pieces.length % 2 === 0 ? 0 : 60,
          y: pieces.length * 10,
          rotate: Math.random() * 6 - 3,
          zIndex: pieces.length,
          color: 'secondary',
          column: type === 'guestbook' ? 'full' : (pieces.length % 2 === 0 ? 'left' : 'right')
        }
      }));
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/pieces`);
    }
  };

  const removePiece = async (pieceId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'pieces', pieceId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/pieces/${pieceId}`);
    }
  };

  const updatePieceData = async (pieceId: string, newData: any) => {
    if (!user) return;
    const piece = pieces.find(p => p.id === pieceId);
    if (!piece) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'pieces', pieceId), sanitizeData({
        data: { ...piece.data, ...newData }
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/pieces/${pieceId}`);
    }
  };

  const updatePieceStyle = async (pieceId: string, newStyle: any) => {
    if (!user) return;
    const piece = pieces.find(p => p.id === pieceId);
    if (!piece) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'pieces', pieceId), sanitizeData({
        style: { ...piece.style, ...newStyle }
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/pieces/${pieceId}`);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId === targetId) return;

    if (!user) return;
    const sourceIndex = pieces.findIndex(p => p.id === sourceId);
    const targetIndex = pieces.findIndex(p => p.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newPieces = [...pieces];
    const [moved] = newPieces.splice(sourceIndex, 1);
    newPieces.splice(targetIndex, 0, moved);
    
    try {
      await Promise.all(newPieces.map((piece, i) => 
        updateDoc(doc(db, 'users', user!.uid, 'pieces', piece.id), sanitizeData({
          'style.y': i * 10
        }))
      ));
    } catch (error) {
       console.error("Error updating positions:", error);
    }
  };

  const applyTemplate = async (templateName: string) => {
    if (!user || applyingTemplate) return;
    setApplyingTemplate(true);
    try {
      let newHeaderState = { ...headerState };
      let newPieces: any[] = [];

      if (templateName === 'y2k-cyber') {
        newHeaderState = {
          ...newHeaderState,
          theme: 'y2k',
          backgroundColor: '#fcd5ce',
          backgroundPattern: 'grid',
          titleFontFamily: 'sans',
          fontFamily: 'mono',
          headerBackgroundColor: '#fae1dd'
        };
        newPieces = [
          { type: 'music', data: { song: 'Pink Pony Club', artist: 'Chappell Roan', design: 'y2k', theme: 'y2k' }, style: { x: 0, y: 0, rotate: 2, zIndex: 1, column: 'left', size: 'lg' } },
          { type: 'polaroid', data: { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800', caption: 'Vibes', theme: 'y2k' }, style: { x: 0, y: 10, rotate: -4, zIndex: 2, column: 'right', size: 'lg' } },
          { type: 'top-songs', data: { title: 'On Repeat', items: ['Cruel Summer', 'Good Luck, Babe!', 'Espresso'], theme: 'y2k' }, style: { x: 0, y: 20, rotate: 1, zIndex: 3, column: 'full', size: 'md' } },
        ];
      } else if (templateName === 'brutalist-dev') {
        newHeaderState = {
          ...newHeaderState,
          theme: 'brutalist',
          backgroundColor: '#ffffff',
          backgroundPattern: 'none',
          titleFontFamily: 'mono',
          fontFamily: 'mono',
          headerBackgroundColor: '#ffffff'
        };
        newPieces = [
          { type: 'note', data: { title: 'TODO', items: ['Ship features', 'Fix bugs', 'Drink coffee'], design: 'list', theme: 'brutalist' }, style: { x: 0, y: 0, rotate: 0, zIndex: 1, column: 'left', size: 'md' } },
          { type: 'decoration', data: { text: 'DO NOT DEPLOY ON FRIDAY', theme: 'brutalist', color: 'primary' }, style: { x: 0, y: 10, rotate: 0, zIndex: 2, column: 'right', size: 'lg' } },
        ];
      } else if (templateName === 'retro-film') {
        newHeaderState = {
          ...newHeaderState,
          theme: 'retro',
          backgroundColor: '#f4f1ee',
          backgroundPattern: 'dots',
          titleFontFamily: 'serif',
          fontFamily: 'serif',
          headerBackgroundColor: '#fffff8'
        };
        newPieces = [
          { type: 'movie', data: { title: 'In the Mood for Love', year: '2000', rating: '8.1', posterUrl: null, theme: 'retro' }, style: { x: 0, y: 0, rotate: -2, zIndex: 1, column: 'left', size: 'lg' } },
          { type: 'polaroid', data: { src: 'https://images.unsplash.com/photo-1478265409131-1f65c88f965c?q=80&w=800', caption: '35mm', theme: 'retro' }, style: { x: 0, y: 10, rotate: 3, zIndex: 2, column: 'right', size: 'md' } },
        ];
      }

      await updateProfile(newHeaderState);
      setHeaderState(newHeaderState);
      
      const piecesCollection = collection(db, 'users', user.uid, 'pieces');
      await Promise.all(newPieces.map(p => addDoc(piecesCollection, sanitizeData(p))));
    } catch (e) {
      console.error(e);
      alert("Failed to apply template.");
    } finally {
      setApplyingTemplate(false);
    }
  };

  const patternColor = getContrastText(headerState.backgroundColor) === 'text-paper-ink' ? '%23000000' : '%23ffffff';
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
          backgroundColor: headerState.backgroundColor || 'transparent',
          backgroundImage: getPatternUrl(headerState.backgroundPattern)
        }}
      />
      <div className={cn("max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-12 relative z-10 min-h-screen transition-colors duration-1000", getContrastText(headerState.backgroundColor))}>
        <div className="flex justify-between items-center mb-xl">
        <h1 className="font-serif text-4xl italic transition-colors duration-1000">Page Editor</h1>
        <div className="flex gap-4">
           <button 
             onClick={() => setIsAdding(true)}
             className="bg-paper-ink text-white rounded-full px-5 py-2 flex items-center gap-2 hover:bg-black hover:-translate-y-0.5 shadow-sm transition-all uppercase text-xs font-bold"
           >
             <Plus size={16} /> Add Piece
           </button>
        </div>
      </div>

      {/* Header Editor */}
      <section className="bg-white text-paper-ink rounded-2xl p-8 border border-paper-outline/20 mb-xl relative shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex justify-between items-center mb-4 border-b border-paper-outline/20 pb-4 mt-2">
          <h2 className="font-serif text-3xl italic tracking-tight">Profile & Page Settings</h2>
          {!editingHeader ? (
            <button onClick={() => setEditingHeader(true)} className="text-paper-ink border border-paper-outline/30 px-3 py-1.5 rounded-full hover:bg-black hover:text-white hover:-translate-y-0.5 shadow-sm transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Plus size={12} /> Edit Settings
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => setHeaderState(s => ({...s, backgroundColor: '#f4f1ee', headerBackgroundColor: '#fffff8', backgroundPattern: 'none'}))} 
                className="text-paper-ink border border-paper-outline/30 px-3 py-1.5 rounded-full hover:bg-black/5 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                Reset Colors
              </button>
              <button onClick={handleSaveHeader} className="text-white bg-paper-ink px-4 py-1.5 rounded-full hover:bg-black hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Save size={12} /> Save Changes
              </button>
            </div>
          )}
        </div>

        {editingHeader ? (
          <div className="space-y-6 bg-black/[0.02] p-6 rounded-xl border border-black/5 mt-4">
            <div>
              <h3 className="font-serif text-xl border-b border-paper-outline/20 pb-2 mb-4">Profile Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditorInput label="Username" value={headerState.username} onChange={v => setHeaderState(s => ({...s, username: v}))} />
                <EditorInput label="Subtitle" value={headerState.subtitle} onChange={v => setHeaderState(s => ({...s, subtitle: v}))} />
                <ImageUploadInput label="Avatar URL / Upload" value={headerState.avatarUrl} onChange={v => setHeaderState(s => ({...s, avatarUrl: v}))} />
                <div className="col-span-full">
                  <EditorInput label="Bio" value={headerState.bio} onChange={v => setHeaderState(s => ({...s, bio: v}))} isTextArea />
                </div>
              </div>
            </div>

            <div>
               <h3 className="font-serif text-xl border-b border-paper-outline/20 pb-2 mb-4">Page Style</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-paper-outline">Username Font</label>
                    <select value={headerState.titleFontFamily} onChange={e => setHeaderState(s => ({...s, titleFontFamily: e.target.value as any}))} className="bg-paper-base border border-paper-outline text-xs p-2 focus:outline-none">
                      <option value="sans">Sans-serif</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Monospace</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-paper-outline">Username Size</label>
                    <select value={headerState.titleFontSize} onChange={e => setHeaderState(s => ({...s, titleFontSize: e.target.value as any}))} className="bg-paper-base border border-paper-outline text-xs p-2 focus:outline-none">
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                      <option value="xl">Extra Large</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-paper-outline">Subtitle/Bio Font</label>
                    <select value={headerState.fontFamily} onChange={e => setHeaderState(s => ({...s, fontFamily: e.target.value as any}))} className="bg-paper-base border border-paper-outline text-xs p-2 focus:outline-none">
                      <option value="sans">Sans-serif</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Monospace</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-paper-outline">Subtitle Size</label>
                    <select value={headerState.fontSize} onChange={e => setHeaderState(s => ({...s, fontSize: e.target.value as any}))} className="bg-paper-base border border-paper-outline text-xs p-2 focus:outline-none">
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                    </select>
                  </div>

                  <div className="flex gap-4 col-span-full">
                    <div className="flex-1">
                      <EditorInput label="Page BG Color" value={headerState.backgroundColor} onChange={v => setHeaderState(s => ({...s, backgroundColor: v}))} type="color" />
                    </div>
                    <div className="flex-1">
                      <EditorInput label="Header BG Color" value={headerState.headerBackgroundColor} onChange={v => setHeaderState(s => ({...s, headerBackgroundColor: v}))} type="color" />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 col-span-full">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-paper-outline flex items-center justify-between">
                      Page Background Pattern
                    </label>
                    <select
                      value={headerState.backgroundPattern}
                      onChange={e => setHeaderState(s => ({...s, backgroundPattern: e.target.value as any}))}
                      className="w-full bg-transparent border-b-2 border-paper-outline pb-1 font-serif text-lg italic tracking-tight focus:outline-none focus:border-paper-ink transition-colors"
                    >
                      <option value="none">None</option>
                      <option value="dots">Dots</option>
                      <option value="grid">Grid</option>
                      <option value="lines">Lines</option>
                      <option value="diagonal">Diagonal Lines</option>
                      <option value="cross">Crosses</option>
                      <option value="checkerboard">Checkerboard</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 col-span-full">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-paper-outline flex items-center justify-between">
                      Profile Aesthetic Theme
                    </label>
                    <select
                      value={headerState.theme}
                      onChange={e => setHeaderState(s => ({...s, theme: e.target.value as any}))}
                      className="w-full bg-transparent border-b-2 border-paper-outline pb-1 font-serif text-lg italic tracking-tight focus:outline-none focus:border-paper-ink transition-colors"
                    >
                      <option value="retro">Retro Polaroid</option>
                      <option value="minimal">Minimal Modern</option>
                      <option value="brutalist">Brutalist</option>
                      <option value="y2k">Y2K Cyber</option>
                      <option value="gothic">Gothic / Vampire</option>
                      <option value="medieval">Medieval / Fantasy</option>
                      <option value="scrapbook">Paper Scrapbook</option>
                      <option value="standard">Standard Default</option>
                    </select>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 items-center bg-black/[0.02] rounded-xl p-6 border border-black/5 mt-4">
            <div className="p-1 border bg-white border-paper-outline/30 rounded-lg shadow-sm rotate-2">
               <img src={profile?.avatarUrl} className="w-20 h-20 rounded-md grayscale contrast-125 sepia-[.2] object-cover" alt="" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-serif text-2xl italic tracking-tight leading-none">@{profile?.username}</p>
              <p className="text-sm text-paper-outline font-mono">[{profile?.subtitle}]</p>
            </div>
          </div>
        )}
      </section>

      {/* Pieces List */}
      {!piecesLoading && pieces.length === 0 && (
        <div className={cn("p-12 rounded-2xl border text-center mb-xl transition-colors duration-1000", getContrastText(headerState.backgroundColor) === 'text-paper-ink' ? 'bg-black/[0.02] border-black/5' : 'bg-white/[0.05] border-white/10')}>
          <h2 className={cn("font-serif text-3xl italic mb-4 transition-colors duration-1000", getContrastText(headerState.backgroundColor))}>Start with a Template</h2>
          <p className={cn("mb-8 max-w-sm mx-auto font-mono text-sm transition-colors duration-1000", getContrastText(headerState.backgroundColor) === 'text-paper-ink' ? 'text-paper-outline' : 'text-white/60')}>Choose a pre-designed layout to jumpstart your scrapbook, or start from scratch.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <button 
              disabled={applyingTemplate}
              onClick={() => applyTemplate('retro-film')} 
              className="p-6 rounded-xl border border-paper-outline/20 bg-white text-paper-ink hover:-translate-y-1 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-[#f4f1ee] border-2 border-paper-outline rotate-2 group-hover:rotate-6 transition-transform flex items-center justify-center">📷</div>
              <h3 className="font-serif text-xl italic mb-2 tracking-tight">{applyingTemplate ? 'Working...' : 'Retro Film'}</h3>
              <p className="text-xs text-paper-outline font-mono">Polaroids, classic movies, and old-school vibes.</p>
            </button>
            <button 
              disabled={applyingTemplate}
              onClick={() => applyTemplate('y2k-cyber')} 
              className="p-6 border-2 border-pink-300 bg-gradient-to-br from-white to-pink-50 text-pink-900 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,105,180,0.4)] transition-all text-center rounded-3xl group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-pink-100 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">✨</div>
              <h3 className="font-sans font-bold text-xl mb-2 text-pink-600 uppercase tracking-tighter">{applyingTemplate ? 'Working...' : 'Y2K Cyber'}</h3>
              <p className="text-xs text-pink-800/60 font-mono">Bubblegum colors, pop music, and internet nostalgia.</p>
            </button>
            <button 
              disabled={applyingTemplate}
              onClick={() => applyTemplate('brutalist-dev')} 
              className="p-6 border-4 border-black bg-white text-black hover:-translate-y-1 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all text-center uppercase font-bold group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-black flex items-center justify-center text-2xl group-hover:-rotate-12 transition-transform">⌨️</div>
              <h3 className="font-mono text-xl mb-2 tracking-tighter">{applyingTemplate ? 'Working...' : 'Brutalist Dev'}</h3>
              <p className="text-xs text-black/60 font-mono">Monospace fonts, stark contrast, and raw elements.</p>
            </button>
          </div>
        </div>
      )}

      {piecesLoading && (
        <div className={cn("h-64 flex flex-col items-center justify-center gap-4 opacity-50 transition-colors duration-1000", getContrastText(headerState.backgroundColor))}>
          <div className={cn("w-8 h-8 border-2 border-dashed rounded-full animate-spin transition-colors duration-1000", getContrastText(headerState.backgroundColor) === 'text-paper-ink' ? 'border-paper-ink' : 'border-paper-base')} />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Loading Archive...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
        {pieces.map(piece => (
          <div 
            key={piece.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, piece.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, piece.id)}
            className="group relative bg-white text-paper-ink border border-paper-outline/30 rounded-2xl p-5 flex flex-col gap-4 shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.08)] cursor-move"
          >
            <div className="absolute top-2 right-2 z-50 flex gap-2">
               <button 
                 onClick={() => removePiece(piece.id)}
                 className="p-1.5 bg-paper-base border border-paper-outline/30 rounded-md text-paper-ink hover:bg-paper-secondary hover:text-white transition-colors"
                 title="Delete Piece"
               >
                 <Trash2 size={16} />
               </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <span className="font-bold text-[10px] uppercase tracking-widest text-paper-secondary border-b border-paper-outline pb-1 mb-2">{piece.type} Settings</span>
              
              {piece.type === 'music' && (
                <>
                  <MusicSearchInput onResult={(data) => {
                    updatePieceData(piece.id, {
                      song: data.song,
                      artist: data.artist,
                      genre: data.genre || undefined,
                      albumArt: data.albumArt || undefined,
                      previewUrl: data.previewUrl || undefined,
                      trackId: data.trackId || undefined
                    });
                  }} />
                  <EditorInput label="Song" value={piece.data.song} onChange={v => updatePieceData(piece.id, {song: v})} />
                  <EditorInput label="Artist" value={piece.data.artist} onChange={v => updatePieceData(piece.id, {artist: v})} />
                  <EditorInput label="Genre (Optional)" value={piece.data.genre || ''} onChange={v => updatePieceData(piece.id, {genre: v})} />
                  <EditorInput label="Album Art URL (Optional)" value={piece.data.albumArt || ''} onChange={v => updatePieceData(piece.id, {albumArt: v})} />
                  <EditorInput label="Spotify Preview URL (Optional)" value={piece.data.previewUrl || ''} onChange={v => updatePieceData(piece.id, {previewUrl: v})} />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">Design Style</label>
                    <select 
                      value={piece.data.design || 'standard'}
                      onChange={e => updatePieceData(piece.id, {design: e.target.value})}
                      className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                    >
                      <option value="standard">Standard</option>
                      <option value="cassette">Tape Cassette</option>
                      <option value="vhs">VHS Tape</option>
                      <option value="vinyl">Vinyl Record</option>
                      <option value="cd">CD</option>
                      <option value="mini-disc">Mini Disc</option>
                    </select>
                  </div>
                </>
              )}
              {piece.type === 'movie' && (
                <>
                  <MovieSearchInput onResult={(data) => {
                    updatePieceData(piece.id, {
                      title: data.title,
                      year: data.year,
                      rating: data.rating,
                      genre: data.genre,
                      posterUrl: data.posterUrl
                    });
                  }} />
                  <EditorInput label="Title" value={piece.data.title} onChange={v => updatePieceData(piece.id, {title: v})} />
                  <div className="grid grid-cols-2 gap-2">
                    <EditorInput label="Year" value={piece.data.year} onChange={v => updatePieceData(piece.id, {year: v})} />
                    <EditorInput label="Rating" value={piece.data.rating} onChange={v => updatePieceData(piece.id, {rating: v})} />
                  </div>
                  <EditorInput label="Genre" value={piece.data.genre || ''} onChange={v => updatePieceData(piece.id, {genre: v})} />
                  <EditorInput label="Poster URL (Optional)" value={piece.data.posterUrl || ''} onChange={v => updatePieceData(piece.id, {posterUrl: v})} />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">Design Style</label>
                    <select 
                      value={piece.data.design || 'standard'}
                      onChange={e => updatePieceData(piece.id, {design: e.target.value})}
                      className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                    >
                      <option value="standard">Standard Cover</option>
                      <option value="vhs">VHS Cassette</option>
                      <option value="dvd">DVD Disc</option>
                      <option value="film-strip">Film Strip</option>
                    </select>
                  </div>
                </>
              )}
              {piece.type === 'note' && (
                <>
                  <EditorInput label="Title" value={piece.data.title} onChange={v => updatePieceData(piece.id, {title: v})} />
                  <EditorInput label="Items (comma separated)" value={(piece.data.items || []).join(', ')} onChange={v => updatePieceData(piece.id, {items: v.split(',').map(s => s.trim())})} />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">Design Style</label>
                    <select 
                      value={piece.data.design || 'list'}
                      onChange={e => updatePieceData(piece.id, {design: e.target.value})}
                      className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                    >
                      <option value="list">Standard List</option>
                      <option value="checklist">Checklist</option>
                      <option value="notebook">Notebook</option>
                      <option value="tape-top">Taped Top</option>
                      <option value="ink">Blue Ink</option>
                    </select>
                  </div>
                </>
              )}
              {piece.type === 'polaroid' && (
                <>
                  <ImageUploadInput label="Image URL / Upload" value={piece.data.src} onChange={v => updatePieceData(piece.id, {src: v})} />
                  <EditorInput label="Caption" value={piece.data.caption} onChange={v => updatePieceData(piece.id, {caption: v})} />
                  <EditorInput label="Date" type="date" value={piece.data.date} onChange={v => updatePieceData(piece.id, {date: v})} />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">Image Filter</label>
                    <select 
                      value={piece.data.filter || 'default'}
                      onChange={e => updatePieceData(piece.id, {filter: e.target.value})}
                      className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                    >
                      <option value="default">Theme Default</option>
                      <option value="none">No Filter</option>
                      <option value="sepia">Sepia</option>
                      <option value="bw">Black & White</option>
                      <option value="vintage">Vintage Warm</option>
                      <option value="cool">Cool Tone</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">Design Variant</label>
                    <select 
                      value={piece.data.design || 'standard'}
                      onChange={e => updatePieceData(piece.id, {design: e.target.value})}
                      className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                    >
                      <option value="standard">Standard Polaroid</option>
                      <option value="film-frame">Film Negative</option>
                      <option value="photobooth">Photobooth Strip</option>
                    </select>
                  </div>
                </>
              )}
              {piece.type === 'decoration' && (
                <>
                  <EditorInput label="Text" value={piece.data.text} onChange={v => updatePieceData(piece.id, {text: v})} />
                </>
              )}
              {(piece.type === 'top-movies' || piece.type === 'top-songs') && (
                <>
                   <EditorInput label="Title" value={piece.data.title} onChange={v => updatePieceData(piece.id, {title: v})} />
                   <EditorInput label="Items (comma separated)" value={(piece.data.items || []).join(', ')} onChange={v => updatePieceData(piece.id, {items: v.split(',').map(s => s.trim())})} />
                   <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">Design Style</label>
                    <select 
                      value={piece.data.theme || 'standard'}
                      onChange={e => updatePieceData(piece.id, {theme: e.target.value})}
                      className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                    >
                      <option value="standard">Standard</option>
                      {piece.type === 'top-movies' && (
                        <>
                          <option value="vhs">VHS Slipcase</option>
                          <option value="dvd">DVD Back Cover</option>
                          <option value="filmstrip">Filmstrip</option>
                        </>
                      )}
                      {piece.type === 'top-songs' && (
                        <>
                          <option value="cassette">Cassette J-Card</option>
                          <option value="cd">CD Jewel Case</option>
                          <option value="vinyl">Vinyl Sleeve</option>
                        </>
                      )}
                    </select>
                   </div>
                </>
              )}
              {piece.type === 'guestbook' && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">Design Style</label>
                    <select 
                      value={piece.data.design || 'standard'}
                      onChange={e => updatePieceData(piece.id, {design: e.target.value})}
                      className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                    >
                      <option value="standard">Standard Default</option>
                      <option value="retro">Retro Scrapbook</option>
                      <option value="minimal">Minimal Modern</option>
                      <option value="brutalist">Brutalist Form</option>
                      <option value="y2k">Y2K Sparkle</option>
                      <option value="terminal">Green Terminal</option>
                      <option value="chat">iMessage Chat</option>
                    </select>
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold uppercase">Rotate ({piece.style.rotate}°)</label>
                   <input 
                     type="range" min="-15" max="15" step="1" 
                     value={piece.style.rotate} 
                     onChange={e => updatePieceStyle(piece.id, {rotate: parseInt(e.target.value)})}
                     className="accent-paper-secondary"
                   />
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold uppercase">Accent Color</label>
                   <select 
                     value={piece.style.color || 'secondary'}
                     onChange={e => updatePieceStyle(piece.id, {color: e.target.value})}
                     className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                   >
                     <option value="secondary">Rose</option>
                     <option value="tertiary">Sage</option>
                     <option value="primary">Grey</option>
                     <option value="yellow">Yellow</option>
                   </select>
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold uppercase">Background</label>
                   <div 
                     className="w-full h-7 border border-paper-outline flex-shrink-0 cursor-pointer overflow-hidden relative"
                     style={{ backgroundColor: piece.style.bgColor || '#fffffb' }}
                   >
                     <input type="color" value={piece.style.bgColor || '#fffffb'} onChange={e => updatePieceStyle(piece.id, {bgColor: e.target.value})} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                   </div>
                </div>
                

                

                <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold uppercase">Size</label>
                   <select 
                     value={piece.style.size || 'md'}
                     onChange={e => updatePieceStyle(piece.id, {size: e.target.value as any})}
                     className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                   >
                     <option value="sm">Small</option>
                     <option value="md">Medium</option>
                     <option value="lg">Large</option>
                   </select>
                </div>

                <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold uppercase">Font</label>
                   <select 
                     value={piece.style.fontFamily || 'sans'}
                     onChange={e => updatePieceStyle(piece.id, {fontFamily: e.target.value as any})}
                     className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                   >
                     <option value="sans">Sans-serif</option>
                     <option value="serif">Serif</option>
                     <option value="mono">Monospace</option>
                   </select>
                </div>

                <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-bold uppercase">Border Style</label>
                   <select 
                     value={piece.style.borderStyle || 'solid'}
                     onChange={e => updatePieceStyle(piece.id, {borderStyle: e.target.value as any})}
                     className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                   >
                     <option value="solid">Solid</option>
                     <option value="dashed">Dashed</option>
                     <option value="dotted">Dotted</option>
                   </select>
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                   <label className="text-[10px] font-bold uppercase">Widget Theme (Overrides Profile)</label>
                   <select 
                     value={piece.data.theme || ''}
                     onChange={e => updatePieceData(piece.id, {theme: e.target.value as any})}
                     className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                   >
                     <option value="">Default (Use Profile Theme)</option>
                     <option value="retro">Retro Polaroid</option>
                     <option value="minimal">Minimal Modern</option>
                     <option value="brutalist">Brutalist</option>
                     <option value="y2k">Y2K Cyber</option>
                     <option value="gothic">Gothic / Vampire</option>
                     <option value="medieval">Medieval / Fantasy</option>
                     <option value="scrapbook">Paper Scrapbook</option>
                     <option value="standard">Standard Default</option>
                   </select>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-dashed border-paper-outline/30">
               <p className="text-[10px] italic text-paper-outline mb-2">Preview:</p>
                <div className="scale-75 origin-top-left -mb-20 pointer-events-none">
                  {piece.type === 'music' && <MusicWidget id={piece.id} userId={user?.uid} {...piece.data} rotation={0} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={piece.data.theme || headerState.theme as any} />}
                  {piece.type === 'movie' && <MovieWidget id={piece.id} userId={user?.uid} {...piece.data} rotation={0} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={piece.data.theme || headerState.theme as any} />}
                  {piece.type === 'top-movies' && <TopListWidget id={piece.id} userId={user?.uid} {...piece.data} type="movies" rotation={0} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={piece.data.theme || headerState.theme as any} />}
                  {piece.type === 'top-songs' && <TopListWidget id={piece.id} userId={user?.uid} {...piece.data} type="songs" rotation={0} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={piece.data.theme || headerState.theme as any} />}
                  {piece.type === 'note' && <NoteWidget {...piece.data} rotation={0} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={piece.data.theme || headerState.theme as any} />}
                  {piece.type === 'polaroid' && <Polaroid {...piece.data} rotation={0} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={piece.data.theme || headerState.theme as any} />}
                  {piece.type === 'decoration' && <Decoration {...piece.data} rotation={0} color={piece.style.color as any} theme={piece.data.theme || headerState.theme as any} />}
                  {piece.type === 'guestbook' && <Guestbook targetUserId={user?.uid!} rotation={0} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} theme={piece.data.theme || headerState.theme as any} />}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Piece Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-paper-ink/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setIsAdding(false);
        }}>
          <div className="bg-white border text-paper-ink border-paper-outline/30 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] max-w-4xl w-full max-h-[90vh] overflow-y-auto relative p-6 mt-4">
             <div className="flex justify-between items-center mb-6 border-b border-paper-outline/20 pb-4">
               <h2 className="font-serif text-3xl italic tracking-tight">Add New Piece</h2>
               <button onClick={() => setIsAdding(false)} className="text-paper-outline hover:text-paper-ink transition-colors">✕</button>
             </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {[
                 { type: 'music', icon: '🎧', title: 'Music Track', desc: 'A single song or album you are listening to' },
                 { type: 'top-songs', icon: '🎵', title: 'Top Songs', desc: 'List your favorite tracks of the moment' },
                 { type: 'movie', icon: '🎬', title: 'Movie Review', desc: 'Rate and review a recent watch' },
                 { type: 'top-movies', icon: '🍿', title: 'Top Movies', desc: 'Curated list of cinema favorites' },
                 { type: 'note', icon: '📝', title: 'Sticky Note', desc: 'Jot down thoughts, to-dos, or links' },
                 { type: 'polaroid', icon: '📷', title: 'Polaroid', desc: 'A photo memory with an optional caption' },
                 { type: 'guestbook', icon: '📖', title: 'Guestbook', desc: 'Let visitors leave a note on your page' },
                 { type: 'decoration', icon: '✨', title: 'Decoration', desc: 'Sparkles, stickers, and little details' },
               ].map(item => (
                 <button 
                   key={item.type}
                   onClick={() => {
                     addPiece(item.type as any);
                     setIsAdding(false);
                   }}
                   className="p-6 border border-paper-outline/20 rounded-xl hover:bg-paper-ink hover:text-white transition-all text-center flex flex-col items-center gap-4 group cursor-pointer"
                 >
                   <div className="text-4xl group-hover:scale-110 transition-transform">{item.icon}</div>
                   <div>
                     <h3 className="font-bold uppercase text-[12px] tracking-widest mb-1 group-hover:text-white">{item.title}</h3>
                     <p className="text-xs text-paper-outline group-hover:text-white/80">{item.desc}</p>
                   </div>
                 </button>
               ))}
              </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function EditorInput({ label, value, onChange, isTextArea, type = "text" }: { label: string; value: string; onChange: (v: string) => void; isTextArea?: boolean, type?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase font-bold text-paper-outline">{label}</label>
      {isTextArea ? (
        <textarea 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="bg-white border-2 border-paper-outline/30 rounded-md p-2.5 text-sm focus:outline-none focus:border-paper-ink focus:shadow-[2px_2px_0_0_rgba(27,28,28,1)] transition-all min-h-[80px]"
        />
      ) : (
        <div className="flex gap-2 items-center">
          {type === 'color' && (
            <div 
              className="w-10 h-10 rounded-lg border-2 border-paper-outline/30 shadow-sm flex-shrink-0 cursor-pointer overflow-hidden relative"
              style={{ backgroundColor: value }}
            >
              <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            </div>
          )}
          <input 
            type={type === 'color' ? 'text' : type} 
            value={value} 
            onChange={e => onChange(e.target.value)}
            className="bg-white border-2 border-paper-outline/30 rounded-md p-2.5 text-sm focus:outline-none focus:border-paper-ink focus:shadow-[2px_2px_0_0_rgba(27,28,28,1)] transition-all flex-grow"
          />
        </div>
      )}
    </div>
  );
}

function MovieSearchInput({ onResult }: { onResult: (data: { title: string; year: string; rating: string; posterUrl: string | null; genre: string }) => void }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ title: string; year: string; rating: string; posterUrl: string | null; genre: string }[]>([]);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    setResults([]);
    try {
      const searchRes = await searchMovieResults(query);
      if (searchRes && searchRes.length > 0) {
        setResults(searchRes);
      } else {
        alert("Movie not found");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error searching movie");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 pb-4 mb-4 border-b border-paper-outline/30 relative z-50">
      <label className="text-[10px] uppercase font-bold text-paper-outline">Search Movie (Auto-populate)</label>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="bg-white border-2 border-paper-outline/30 rounded-md p-2 text-sm focus:outline-none focus:border-paper-ink focus:shadow-[2px_2px_0_0_rgba(27,28,28,1)] transition-all flex-grow"
          placeholder="e.g. Inception 2010"
        />
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-paper-ink text-white rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-black transition-colors disabled:opacity-50"
        >
          <Search size={14} />
          {isSearching ? '...' : 'Search'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-paper-outline/30 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {results.map((res, i) => (
            <div 
              key={i} 
              className="p-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              onClick={() => {
                onResult(res);
                setQuery('');
                setResults([]);
              }}
            >
              {res.posterUrl && <img src={res.posterUrl} className="w-8 h-12 object-cover shrink-0" />}
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-bold truncate">{res.title}</div>
                <div className="text-xs text-gray-500">{res.year} • {res.genre}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MusicSearchInput({ onResult }: { onResult: (data: { song: string; artist: string; albumArt: string | null; previewUrl?: string | null; trackId?: string | null; genre?: string }) => void }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ song: string; artist: string; albumArt: string | null; previewUrl?: string | null; trackId?: string | null; genre?: string }[]>([]);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    setResults([]);
    try {
      const searchRes = await searchSpotifyResults(query);
      if (searchRes && searchRes.length > 0) {
        setResults(searchRes);
      } else {
        alert("Track not found or API not configured.");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error searching track");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 pb-4 mb-4 border-b border-paper-outline/30 relative z-50">
      <label className="text-[10px] uppercase font-bold text-paper-outline">Search Spotify (Auto-populate)</label>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="bg-white border-2 border-paper-outline/30 rounded-md p-2 text-sm focus:outline-none focus:border-paper-ink focus:shadow-[2px_2px_0_0_rgba(27,28,28,1)] transition-all flex-grow"
          placeholder="e.g. Pink Pony Club"
        />
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-paper-ink text-white rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-black transition-colors disabled:opacity-50"
        >
          <Search size={14} />
          {isSearching ? '...' : 'Search'}
        </button>
      </div>
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-paper-outline/30 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {results.map((res, i) => (
            <div 
              key={i} 
              className="p-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
              onClick={() => {
                onResult(res);
                setQuery('');
                setResults([]);
              }}
            >
              {res.albumArt && <img src={res.albumArt} className="w-10 h-10 object-cover shrink-0" />}
              <div className="flex flex-col min-w-0">
                <div className="text-sm font-bold truncate">{res.song}</div>
                <div className="text-xs text-gray-500 truncate">{res.artist} {res.genre && `• ${res.genre}`}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageUploadInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        }, 
        (error) => {
          console.error("Upload error:", error);
          setIsUploading(false);
          alert("Failed to upload image. " + error.message);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onChange(downloadURL);
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase font-bold text-paper-outline">{label}</label>
      <div className="flex flex-col gap-2">
        <input 
          type="text" 
          value={value} 
          onChange={e => onChange(e.target.value)}
          className="bg-white border-2 border-paper-outline/30 rounded-md p-2 text-sm focus:outline-none focus:border-paper-ink focus:shadow-[2px_2px_0_0_rgba(27,28,28,1)] transition-all flex-grow"
          placeholder="Enter image URL..."
        />
        <div className="relative">
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            disabled={isUploading}
          />
          <button 
            type="button" 
            className="w-full bg-paper-base text-paper-ink border-2 border-paper-outline/50 border-dashed rounded-md p-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-paper-outline/10 transition-colors"
            disabled={isUploading}
          >
            <Upload size={14} />
            {isUploading ? `Uploading ${Math.round(progress)}%` : 'Upload Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
