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
import { searchMovieDetails } from '../services/movieService';

export function EditorView() {
  const { user, profile, updateProfile } = useAuth();
  const [pieces, setPieces] = useState<ScrapbookPieceData[]>([]);
  const [isAdding, setIsAdding] = useState(false);
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
  });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'pieces'), orderBy('style.y', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setPieces(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScrapbookPieceData)));
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}/pieces`));
  }, [user]);

  const handleSaveHeader = async () => {
    if (!window.confirm("Save changes to profile and page settings?")) return;
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
    if (!window.confirm("Are you sure you want to delete this piece? This action cannot be undone.")) return;
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

  return (
    <>
      <div 
        className={`fixed inset-0 min-h-screen z-[-1] transition-colors duration-1000 ${
          headerState.backgroundPattern === 'dots' ? 'bg-[url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'2\' cy=\'2\' r=\'2\'/%3E%3C/g%3E%3C/svg%3E")]' :
          headerState.backgroundPattern === 'grid' ? 'bg-[url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z\' fill=\'%23000000\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]' :
          headerState.backgroundPattern === 'lines' ? 'bg-[url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v1H0z\' fill=\'%23000000\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]' :
          ''
        }`}
        style={{ backgroundColor: headerState.backgroundColor || 'transparent' }}
      />
      <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-xl relative z-10 min-h-screen">
        <div className="flex justify-between items-center mb-xl">
        <h1 className="font-serif text-4xl italic">Page Editor</h1>
        <div className="flex gap-4">
           <button 
             onClick={() => setIsAdding(true)}
             className="bg-paper-tertiary text-white px-4 py-2 flex items-center gap-2 hover:bg-paper-tertiary/80 transition-colors uppercase text-[12px] font-bold"
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
            <button onClick={() => setEditingHeader(true)} className="text-paper-ink border border-paper-outline px-3 py-1 hover:bg-paper-secondary hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Plus size={12} /> Edit Settings
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => setHeaderState(s => ({...s, backgroundColor: '#f4f1ee', headerBackgroundColor: '#fffff8', backgroundPattern: 'none'}))} 
                className="text-paper-ink border border-paper-outline px-3 py-1 hover:bg-paper-outline/10 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                Reset Colors
              </button>
              <button onClick={handleSaveHeader} className="text-white bg-paper-tertiary px-3 py-1 hover:bg-paper-ink transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm">
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
                  <EditorInput label="Song" value={piece.data.song} onChange={v => updatePieceData(piece.id, {song: v})} />
                  <EditorInput label="Artist" value={piece.data.artist} onChange={v => updatePieceData(piece.id, {artist: v})} />
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase">Design Style</label>
                    <select 
                      value={piece.data.design || 'standard'}
                      onChange={e => updatePieceData(piece.id, {design: e.target.value})}
                      className="bg-paper-base border border-paper-outline text-xs p-1 focus:outline-none"
                    >
                      <option value="standard">Standard</option>
                      <option value="minimal">Minimal</option>
                      <option value="cassette">Tape Cassette</option>
                      <option value="vinyl">Vinyl Record</option>
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
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-dashed border-paper-outline/30">
               <p className="text-[10px] italic text-paper-outline mb-2">Preview:</p>
                <div className="scale-50 origin-top-left -mb-40 pointer-events-none">
                  {piece.type === 'music' && <MusicWidget {...piece.data} rotation={0} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />}
                  {piece.type === 'movie' && <MovieWidget id={piece.id} userId={user?.uid} {...piece.data} rotation={0} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />}
                  {piece.type === 'top-movies' && <TopListWidget id={piece.id} userId={user?.uid} {...piece.data} type="movies" rotation={0} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />}
                  {piece.type === 'top-songs' && <TopListWidget id={piece.id} userId={user?.uid} {...piece.data} type="songs" rotation={0} color={piece.style.color as any} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />}
                  {piece.type === 'note' && <NoteWidget {...piece.data} rotation={0} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />}
                  {piece.type === 'polaroid' && <Polaroid {...piece.data} rotation={0} bgColor={piece.style.bgColor} fontFamily={piece.style.fontFamily} borderStyle={piece.style.borderStyle} />}
                  {piece.type === 'decoration' && <Decoration {...piece.data} rotation={0} color={piece.style.color as any} />}
                  {piece.type === 'guestbook' && <div className="bg-paper-tertiary/10 p-4 border border-dashed border-paper-outline w-[300px]">Guestbook Active</div>}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Piece Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-paper-ink/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-paper-base border-2 border-paper-outline p-xl max-w-md w-full shadow-xl rotate-1">
             <h2 className="font-serif text-3xl mb-lg italic border-b border-paper-outline pb-2">Add New Piece</h2>
              <div className="grid grid-cols-2 gap-4">
               {['music', 'top-songs', 'movie', 'top-movies', 'note', 'polaroid', 'decoration', 'guestbook'].map(type => (
                 <button 
                   key={type}
                   onClick={() => addPiece(type as any)}
                   className="p-4 border border-paper-outline hover:bg-paper-secondary hover:text-white transition-all uppercase text-[10px] font-bold tracking-widest text-center"
                 >
                   {type.replace('-', ' ')}
                 </button>
               ))}
              </div>
             <button 
               onClick={() => setIsAdding(false)}
               className="mt-8 w-full text-center text-xs text-paper-outline hover:underline"
             >
               Nevermind
             </button>
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
      <label className="text-[10px] uppercase font-bold text-paper-outline">Search Movie (Auto-poupulate)</label>
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
