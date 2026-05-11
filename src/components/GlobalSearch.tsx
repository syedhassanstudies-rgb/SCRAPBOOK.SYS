import { useState, useEffect, useRef } from 'react';
import { collectionGroup, getDocs, limit, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Search, MapPin, X } from 'lucide-react';
import { ScrapbookPieceData } from '../types';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<{ userId: string; piece: ScrapbookPieceData; textPreview: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      // Query collectionGroup pieces. Note: full text search isn't native, so we'll fetch recently created/all up to 100 
      // and do a naive local filter for prototype purposes, or we could just fetch all if it's a small app.
      // To bypass index errors since we don't have indexes for ordering, we just fetch limit(200) unstructured
      const piecesQuery = query(collectionGroup(db, 'pieces'), limit(200));
      const snapshot = await getDocs(piecesQuery);
      
      const searchLower = q.toLowerCase();
      const matched = snapshot.docs.map(doc => {
        const piece = doc.data() as ScrapbookPieceData;
        const refPath = doc.ref.path; // e.g. "users/userId/pieces/pieceId"
        const userId = refPath.split('/')[1]; 
        
        let textToSearch = '';
        if (piece.type === 'note') textToSearch = `${piece.data.title || ''} ${(piece.data.items || []).join(' ')}`;
        if (piece.type === 'music') textToSearch = `${piece.data.song || ''} ${piece.data.artist || ''}`;
        if (piece.type === 'movie') textToSearch = `${piece.data.title || ''} ${piece.data.year || ''}`;
        if (piece.type === 'top-movies' || piece.type === 'top-songs') textToSearch = `${piece.data.title || ''} ${(piece.data.items || []).join(' ')}`;
        if (piece.type === 'polaroid') textToSearch = `${piece.data.caption || ''}`;
        if (piece.type === 'decoration') textToSearch = `${piece.data.text || ''}`;
        if (piece.type === 'guestbook') textToSearch = 'Guestbook';
        
        return {
          userId,
          piece,
          textPreview: textToSearch
        };
      }).filter(item => item.textPreview.toLowerCase().includes(searchLower))
      .slice(0, 10);
      
      setResults(matched);
    } catch (e: any) {
      console.error(e);
      // Ignore index errors or permission errors gracefully
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 400);
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  return (
    <div className="relative">
      <div className={`flex items-center transition-all ${isOpen ? 'w-64 border-b border-paper-outline' : 'w-8 border-b border-transparent'}`}>
         <button onClick={() => setIsOpen(!isOpen)} className="p-1 hover:text-paper-secondary transition-colors">
            {isOpen ? <X size={16} /> : <Search size={16} />}
         </button>
         {isOpen && (
           <input 
             type="text"
             autoFocus
             placeholder="Search pieces..."
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
             className="bg-transparent border-none outline-none text-xs p-1 w-full"
           />
         )}
      </div>

      {isOpen && searchQuery.length >= 2 && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-[#fffffb] border border-paper-outline analog-shadow-lg p-2 flex flex-col gap-2 z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
             <div className="text-xs text-paper-outline p-2 animate-pulse">Searching archives...</div>
          ) : results.length > 0 ? (
            results.map((result, i) => (
              <a 
                key={i} 
                href={`/p/${result.userId}`}
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', `/p/${result.userId}`);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                  setIsOpen(false);
                }}
                className="flex flex-col gap-1 p-2 hover:bg-paper-outline/5 border border-transparent hover:border-paper-outline/20 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-paper-secondary">{result.piece.type}</span>
                </div>
                <span className="text-xs font-mono truncate">{result.textPreview}</span>
              </a>
            ))
          ) : (
            <div className="text-xs text-paper-outline p-2">No matching pieces found.</div>
          )}
        </div>
      )}
    </div>
  );
}
