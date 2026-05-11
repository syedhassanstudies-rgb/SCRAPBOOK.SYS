import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { ScrapbookPieceData } from '../types';
import { Plus, Trash2, Save, Move, Upload, Search } from 'lucide-react';
import { MusicWidget } from '../components/MusicWidget';
import { NoteWidget } from '../components/NoteWidget';
import { MovieWidget } from '../components/MovieWidget';
import { Polaroid } from '../components/Polaroid';
import { Decoration } from '../components/Decoration';
import { TopListWidget } from '../components/TopListWidget';
import { Guestbook } from '../components/Guestbook';
import { searchMovieDetails } from '../services/movieService';
import { searchSpotifyTrack } from '../services/spotifyService';

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
    await updateProfile(headerState);
    setEditingHeader(false);
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
      await addDoc(collection(db, 'users', user.uid, 'pieces'), {
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
      });
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
      await updateDoc(doc(db, 'users', user.uid, 'pieces', pieceId), {
        data: { ...piece.data, ...newData }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/pieces/${pieceId}`);
    }
  };

  const updatePieceStyle = async (pieceId: string, newStyle: any) => {
    if (!user) return;
    const piece = pieces.find(p => p.id === pieceId);
    if (!piece) return;
    try {
      await updateDoc(doc(db, 'users', user.uid, 'pieces', pieceId), {
        style: { ...piece.style, ...newStyle }
      });
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
        updateDoc(doc(db, 'users', user!.uid, 'pieces', piece.id), {
          'style.y': i * 10
        })
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
      await Promise.all(newPieces.map(p => addDoc(piecesCollection, p)));
    } catch (e) {
      console.error(e);
      alert("Failed to apply template.");
    } finally {
      setApplyingTemplate(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 min-h-screen z-[-1] transition-colors duration-1000"
        style={{ 
          backgroundColor: headerState.backgroundColor || 'transparent',
          backgroundImage: headerState.backgroundPattern === 'dots' ? 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'2\'/%3E%3C/g%3E%3C/svg%3E")' :
                           headerState.backgroundPattern === 'grid' ? 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z\' fill=\'%23000000\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' :
                           headerState.backgroundPattern === 'lines' ? 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v1H0z\' fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' :
                           'none'
        }}
      />
      <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-xl relative z-10 min-h-screen">
        <div className="flex justify-between items-center mb-xl">
        <h1 className="font-serif text-4xl italic">Page Editor</h1>
        <div className="flex gap-4">
           <button 
             onClick={() => setIsAdding(true)}
             className="bg-paper-tertiary text-white px-4 py-2 flex items-center gap-2 hover:bg-paper-tertiary/90 hover:-translate-y-0.5 hover:shadow-md transition-all uppercase text-[12px] font-bold"
           >
             <Plus size={16} /> Add Piece
           </button>
        </div>
      </div>

      {/* Header Editor */}
      <section className="bg-[#fffffb] p-lg border border-paper-outline mb-xl relative analog-shadow paper-edge">
        <div className="flex justify-between items-center mb-4 border-b-2 border-paper-outline/20 pb-4 mt-2">
          <h2 className="font-serif text-3xl italic tracking-tight">Profile & Page Settings</h2>
          {!editingHeader ? (
            <button onClick={() => setEditingHeader(true)} className="text-paper-ink border border-paper-outline px-3 py-1 hover:bg-paper-secondary hover:text-white hover:-translate-y-0.5 hover:shadow-sm transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Plus size={12} /> Edit Settings
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => setHeaderState(s => ({...s, backgroundColor: '#f4f1ee', headerBackgroundColor: '#fffff8', backgroundPattern: 'none'}))} 
                className="text-paper-ink border border-paper-outline px-3 py-1 hover:bg-paper-outline/10 hover:-translate-y-0.5 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                Reset Colors
              </button>
              <button onClick={handleSaveHeader} className="text-white bg-paper-tertiary px-3 py-1 hover:bg-paper-ink hover:-translate-y-0.5 hover:shadow-sm transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm">
                <Save size={12} /> Save Changes
              </button>
            </div>
          )}
        </div>

        {editingHeader ? (
          <div className="space-y-6 bg-paper-outline/5 p-4 border border-dashed border-paper-outline/30 mt-2">
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
                    </select>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 items-center bg-paper-outline/5 p-4 border border-dashed border-paper-outline/30 mt-2">
            <div className="p-1 border bg-white border-paper-outline shadow-sm rotate-2">
               <img src={profile?.avatarUrl} className="w-20 h-20 grayscale contrast-125 sepia-[.2] object-cover" alt="" />
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
        <div className="bg-paper-outline/5 p-lg border border-dashed border-paper-outline text-center mb-xl">
          <h2 className="font-serif text-3xl italic mb-4">Start with a Template</h2>
          <p className="text-paper-outline mb-8 max-w-sm mx-auto font-mono text-sm">Choose a pre-designed layout to jumpstart your scrapbook, or start from scratch.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <button 
              disabled={applyingTemplate}
              onClick={() => applyTemplate('retro-film')} 
              className="p-6 border border-paper-outline bg-[#fffffb] text-paper-ink hover:-translate-y-1 hover:shadow-lg transition-all text-center analog-shadow group disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="h-64 flex flex-col items-center justify-center gap-4 opacity-50">
          <div className="w-8 h-8 border-2 border-dashed border-paper-ink rounded-full animate-spin" />
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
            className="group relative bg-[#fffffb] border border-paper-outline p-4 flex flex-col gap-4 analog-shadow transition-all hover:-translate-y-1 cursor-move"
          >
            <div className="absolute top-2 right-2 z-50 flex gap-2">
               <button 
                 onClick={() => removePiece(piece.id)}
                 className="p-1.5 bg-paper-base border border-paper-outline text-paper-ink hover:bg-paper-secondary hover:text-white hover:border-paper-secondary transition-colors"
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
                      albumArt: data.albumArt || undefined
                    });
                  }} />
                  <EditorInput label="Song" value={piece.data.song} onChange={v => updatePieceData(piece.id, {song: v})} />
                  <EditorInput label="Artist" value={piece.data.artist} onChange={v => updatePieceData(piece.id, {artist: v})} />
                  <EditorInput label="Album Art URL (Optional)" value={piece.data.albumArt || ''} onChange={v => updatePieceData(piece.id, {albumArt: v})} />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">Design Style</label>
                    <select 
                      value={piece.data.design || 'standard'}
                      onChange={e => updatePieceData(piece.id, {design: e.target.value})}
                      className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                    >
                      <option value="standard">Standard</option>
                      <option value="cassette">Tape Cassette</option>
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
                      posterUrl: data.posterUrl
                    });
                  }} />
                  <EditorInput label="Title" value={piece.data.title} onChange={v => updatePieceData(piece.id, {title: v})} />
                  <div className="grid grid-cols-2 gap-2">
                    <EditorInput label="Year" value={piece.data.year} onChange={v => updatePieceData(piece.id, {year: v})} />
                    <EditorInput label="Rating" value={piece.data.rating} onChange={v => updatePieceData(piece.id, {rating: v})} />
                  </div>
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
                <div className="flex flex-col gap-1 col-span-full">
                   <label className="text-[10px] font-bold uppercase">Column placement</label>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => updatePieceStyle(piece.id, {column: 'left'})}
                        className={`flex-grow py-1 text-[10px] border ${piece.style.column === 'left' ? 'bg-paper-secondary text-white border-paper-secondary' : 'bg-white text-paper-ink border-paper-outline'}`}
                      >
                        Left
                      </button>
                      <button 
                        onClick={() => updatePieceStyle(piece.id, {column: 'right'})}
                        className={`flex-grow py-1 text-[10px] border ${piece.style.column === 'right' ? 'bg-paper-secondary text-white border-paper-secondary' : 'bg-white text-paper-ink border-paper-outline'}`}
                      >
                        Right
                      </button>
                      <button 
                        onClick={() => updatePieceStyle(piece.id, {column: 'full'})}
                        className={`flex-grow py-1 text-[10px] border ${piece.style.column === 'full' ? 'bg-paper-secondary text-white border-paper-secondary' : 'bg-white text-paper-ink border-paper-outline'}`}
                      >
                        Full
                      </button>
                   </div>
                </div>

                <div className="flex flex-col gap-1 col-span-full">
                   <label className="text-[10px] font-bold uppercase">Alignment</label>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => updatePieceStyle(piece.id, {align: 'left'})}
                        className={`flex-grow py-1 text-[10px] border ${(piece.style.align || 'center') === 'left' ? 'bg-paper-primary text-white border-paper-primary' : 'bg-white text-paper-ink border-paper-outline'}`}
                      >
                        Left
                      </button>
                      <button 
                        onClick={() => updatePieceStyle(piece.id, {align: 'center'})}
                        className={`flex-grow py-1 text-[10px] border ${(piece.style.align || 'center') === 'center' ? 'bg-paper-primary text-white border-paper-primary' : 'bg-white text-paper-ink border-paper-outline'}`}
                      >
                        Center
                      </button>
                      <button 
                        onClick={() => updatePieceStyle(piece.id, {align: 'right'})}
                        className={`flex-grow py-1 text-[10px] border ${(piece.style.align || 'center') === 'right' ? 'bg-paper-primary text-white border-paper-primary' : 'bg-white text-paper-ink border-paper-outline'}`}
                      >
                        Right
                      </button>
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
          <div className="bg-paper-base border-2 border-paper-outline p-xl max-w-2xl w-full shadow-xl rotate-1 max-h-[80vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-lg border-b border-paper-outline pb-2">
               <h2 className="font-serif text-3xl italic">Add New Piece</h2>
               <button onClick={() => setIsAdding(false)} className="text-paper-outline hover:text-paper-ink transition-colors">✕</button>
             </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                   className="p-4 border border-paper-outline hover:bg-paper-secondary hover:text-white transition-all text-left flex items-start gap-4 group"
                 >
                   <div className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</div>
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
          className="bg-paper-base border border-paper-outline p-2 text-sm focus:outline-none min-h-[80px]"
        />
      ) : (
        <div className="flex gap-2 items-center">
          {type === 'color' && (
            <div 
              className="w-8 h-8 rounded-full border border-paper-outline shadow-sm flex-shrink-0 cursor-pointer overflow-hidden relative"
              style={{ backgroundColor: value }}
            >
              <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            </div>
          )}
          <input 
            type={type === 'color' ? 'text' : type} 
            value={value} 
            onChange={e => onChange(e.target.value)}
            className="bg-paper-base border border-paper-outline p-2 text-sm focus:outline-none flex-grow"
          />
        </div>
      )}
    </div>
  );
}

function MovieSearchInput({ onResult }: { onResult: (data: { title: string; year: string; rating: string; posterUrl: string | null }) => void }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    try {
      const details = await searchMovieDetails(query);
      if (details) {
        onResult(details);
        setQuery('');
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
    <div className="flex flex-col gap-1 pb-4 mb-4 border-b border-paper-outline/30">
      <label className="text-[10px] uppercase font-bold text-paper-outline">Search Movie (Auto-populate)</label>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="bg-paper-base border border-paper-outline p-2 text-sm focus:outline-none flex-grow"
          placeholder="e.g. Inception 2010"
        />
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-paper-ink text-white px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-paper-ink/80 transition-colors disabled:opacity-50"
        >
          <Search size={14} />
          {isSearching ? '...' : 'Search'}
        </button>
      </div>
    </div>
  );
}

function MusicSearchInput({ onResult }: { onResult: (data: { song: string; artist: string; albumArt: string | null }) => void }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    try {
      const details = await searchSpotifyTrack(query);
      if (details) {
        onResult(details);
        setQuery('');
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
    <div className="flex flex-col gap-1 pb-4 mb-4 border-b border-paper-outline/30">
      <label className="text-[10px] uppercase font-bold text-paper-outline">Search Spotify (Auto-populate)</label>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="bg-paper-base border border-paper-outline p-2 text-sm focus:outline-none flex-grow"
          placeholder="e.g. Pink Pony Club"
        />
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="bg-paper-ink text-white px-3 py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-paper-ink/80 transition-colors disabled:opacity-50"
        >
          <Search size={14} />
          {isSearching ? '...' : 'Search'}
        </button>
      </div>
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
          className="bg-paper-base border border-paper-outline p-2 text-sm focus:outline-none flex-grow"
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
            className="w-full bg-paper-tertiary/10 text-paper-ink border border-paper-outline border-dashed p-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-paper-tertiary/20 transition-colors"
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
