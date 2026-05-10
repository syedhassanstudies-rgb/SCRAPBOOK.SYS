import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Send, MessageSquare, Trash2, Sparkles } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Tape } from './Tape';
import { useAuth } from '../lib/AuthContext';
import { GuestbookEntry } from '../types';
import { getContrastText, getContrastBorder } from '../lib/utils';

interface GuestbookProps {
  targetUserId: string;
  rotation?: number;
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  theme?: 'retro' | 'minimal' | 'brutalist' | 'y2k';
}

export function Guestbook({ targetUserId, rotation = 1, bgColor, fontFamily, borderStyle, theme = 'retro' }: GuestbookProps) {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';

  const themeClasses = {
    retro: `p-lg border ${borderClass} ${borderColor} analog-shadow paper-edge relative min-h-[300px] flex flex-col w-full max-w-md ${textColor} ${fontClass}`,
    minimal: `p-6 rounded-3xl border ${borderClass} border-opacity-20 shadow-2xl relative min-h-[300px] flex flex-col w-full max-w-md ${textColor} ${fontClass}`,
    brutalist: `p-6 border-[4px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative min-h-[300px] flex flex-col w-full max-w-md uppercase font-bold ${textColor} ${fontClass}`,
    y2k: `p-6 rounded-[2rem] border-2 border-pink-300 shadow-[0_0_20px_rgba(255,105,180,0.3)] bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-lg relative min-h-[300px] flex flex-col w-full max-w-md ${textColor} ${fontClass}`
  };

  useEffect(() => {
    const q = query(
      collection(db, 'users', targetUserId, 'guestbook'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuestbookEntry)));
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${targetUserId}/guestbook`));
  }, [targetUserId]);

  const deleteEntry = async (entryId: string) => {
    if (!window.confirm("Are you sure you want to delete this guestbook entry?")) return;
    try {
      await deleteDoc(doc(db, 'users', targetUserId, 'guestbook', entryId));
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `users/${targetUserId}/guestbook/${entryId}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'users', targetUserId, 'guestbook'), {
        authorId: user?.uid || null,
        authorUsername: profile?.username || 'Anonymous',
        authorAvatarUrl: profile?.avatarUrl || null,
        message: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
      setIsWriting(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${targetUserId}/guestbook`);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, rotate: rotation }}
      className={themeClasses[theme]}
      style={{ backgroundColor: theme === 'y2k' ? undefined : (bgColor || '#fcf9f2') }}
    >
      {theme === 'retro' && <Tape color="tertiary" rotation={12} className="-top-2 left-1/4 w-12 h-5 opacity-40" />}
      
      {theme === 'y2k' && (
        <div className="absolute -top-3 -right-3 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse">
           <Sparkles size={24} fill="currentColor" />
        </div>
      )}

      <div className={`flex items-center justify-between border-b ${theme === 'y2k' ? 'border-dashed border-pink-300 text-fuchsia-600' : `border-dashed ${borderColor}`} pb-2 mb-4`}>
        <h3 className={`${theme === 'retro' ? 'font-serif italic' : ''} text-xl flex items-center gap-2`}>
           Guestbook
        </h3>
        <MessageSquare size={16} className={theme === 'y2k' ? 'text-pink-400' : 'opacity-50'} />
      </div>

      <div className="flex flex-col gap-4 flex-grow max-h-[400px] overflow-y-auto px-1">
        <AnimatePresence>
          {entries.map((entry, i) => (
             <motion.div
               key={entry.id}
               initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
               animate={{ opacity: 1, x: 0 }}
               className={`${theme === 'y2k' ? 'bg-white/60 border-purple-200 shadow-[0_0_10px_rgba(255,105,180,0.1)] rounded-xl' : theme === 'brutalist' ? 'bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]' : theme === 'minimal' ? 'bg-gray-50 border-gray-100 rounded-lg shadow-sm' : 'bg-white border-paper-outline shadow-sm'} p-3 border relative group hover:rotate-0 transition-transform ${textColor === 'text-paper-base' && theme !== 'retro' ? 'text-gray-900' : 'text-paper-ink'} ${theme === 'retro' ? (i % 2 === 0 ? '-rotate-1 self-start' : 'rotate-1 self-end w-[90%]') : 'w-full'}`}
             >
                {(user?.uid === targetUserId || user?.uid === entry.authorId) && (
                  <button 
                    onClick={() => deleteEntry(entry.id!)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Delete Entry"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <div className="flex gap-2 items-start text-xs">
                   {entry.authorAvatarUrl && (
                     <img src={entry.authorAvatarUrl} className={`w-6 h-6 ${theme === 'brutalist' ? 'border-2 border-black rounded-none' : 'rounded-full border border-paper-outline'}`} alt="" />
                   )}
                   <div>
                      <p className={`leading-tight ${theme === 'brutalist' ? 'uppercase font-bold' : ''}`}>{entry.message}</p>
                      <span className={`text-[10px] ${theme === 'y2k' ? 'text-purple-500' : 'text-paper-outline opacity-70'}`}>— @{entry.authorUsername}</span>
                   </div>
                </div>
             </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className={`mt-6 pt-4 border-t ${theme === 'y2k' ? 'border-dashed border-pink-300' : `border-dashed ${borderColor}`}`}>
        {!isWriting ? (
          <button
            onClick={() => setIsWriting(true)}
            className={`w-full ${theme === 'y2k' ? 'bg-gradient-to-r from-fuchsia-400 to-pink-400 text-white border-none shadow-md hover:shadow-lg rounded-full' : theme === 'brutalist' ? 'bg-black text-white hover:bg-gray-800 border-none' : theme === 'minimal' ? 'bg-gray-900 text-white hover:bg-gray-800 rounded-lg border-none' : (textColor === 'text-paper-base' ? 'bg-white text-paper-ink' : 'bg-white text-paper-ink border-paper-outline border-dashed hover:-rotate-1 border ')} text-[12px] uppercase py-2 transition-all flex items-center justify-center gap-2`}
          >
            <Edit2 size={14} />
            Leave a Note
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="What's on your mind?..."
              className={`w-full bg-white ${theme === 'y2k' ? 'text-fuchsia-900 border-pink-300 rounded-lg' : theme === 'brutalist' ? 'text-black border-2 border-black' : theme === 'minimal' ? 'text-gray-900 border-gray-200 rounded-md' : 'text-paper-ink border-paper-outline'} p-2 border text-xs min-h-[60px] resize-none focus:outline-none`}
            />
            <div className="flex gap-2">
               <button
                 type="submit"
                 className={`flex-grow ${theme === 'y2k' ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white rounded-full border-none' : theme === 'brutalist' ? 'bg-black text-white border-2 border-black' : theme === 'minimal' ? 'bg-gray-900 text-white rounded-md border-none' : 'bg-paper-ink text-white border-paper-ink hover:bg-paper-outline'} text-[10px] uppercase py-1 border transition-colors flex items-center justify-center gap-1`}
               >
                 <Send size={12} /> Post
               </button>
               <button
                 type="button"
                 onClick={() => setIsWriting(false)}
                 className={`px-4 border ${theme === 'y2k' ? 'border-pink-300 text-pink-600 rounded-full bg-white hover:bg-pink-50' : theme === 'brutalist' ? 'border-2 border-black text-black bg-white hover:bg-gray-100' : theme === 'minimal' ? 'border-gray-200 text-gray-700 bg-white rounded-md hover:bg-gray-50' : 'border-paper-outline bg-white text-paper-ink hover:bg-gray-50'} text-[10px] uppercase`}
               >
                 Cancel
               </button>
            </div>
          </form>
        )}
      </div>

    </motion.article>
  );
}
