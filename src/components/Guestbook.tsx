import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Send, MessageSquare, Trash2 } from 'lucide-react';
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
}

export function Guestbook({ targetUserId, rotation = 1, bgColor, fontFamily, borderStyle }: GuestbookProps) {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';

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
      className={`p-lg border ${borderClass} ${borderColor} analog-shadow paper-edge relative min-h-[300px] flex flex-col w-full max-w-md ${textColor} ${fontClass}`}
      style={{ backgroundColor: bgColor || '#fcf9f2' }}
    >
      <Tape color="tertiary" rotation={12} className="-top-2 left-1/4 w-12 h-5 opacity-40" />
      
      <div className={`flex items-center justify-between border-b border-dashed ${borderColor} pb-2 mb-4`}>
        <h3 className="font-serif text-xl italic flex items-center gap-2">
           Guestbook
        </h3>
        <MessageSquare size={16} className="opacity-50" />
      </div>

      <div className="flex flex-col gap-4 flex-grow max-h-[400px] overflow-y-auto px-1">
        <AnimatePresence>
          {entries.map((entry, i) => (
             <motion.div
               key={entry.id}
               initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
               animate={{ opacity: 1, x: 0 }}
               className={`bg-white p-3 border border-paper-outline shadow-sm relative group hover:rotate-0 transition-transform text-paper-ink ${i % 2 === 0 ? '-rotate-1 self-start' : 'rotate-1 self-end w-[90%]'}`}
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
                     <img src={entry.authorAvatarUrl} className="w-6 h-6 rounded-full border border-paper-outline" alt="" />
                   )}
                   <div>
                      <p className="leading-tight">{entry.message}</p>
                      <span className="text-[10px] text-paper-outline opacity-70">— @{entry.authorUsername}</span>
                   </div>
                </div>
             </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className={`mt-6 pt-4 border-t border-dashed ${borderColor}`}>
        {!isWriting ? (
          <button
            onClick={() => setIsWriting(true)}
            className={`w-full ${textColor === 'text-white' ? 'bg-white text-paper-ink' : 'bg-white text-paper-ink border-paper-outline'} text-[12px] uppercase py-2 border border-dashed hover:-rotate-1 transition-all flex items-center justify-center gap-2`}
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
              className="w-full bg-white text-paper-ink p-2 border border-paper-outline text-xs min-h-[60px] resize-none focus:outline-none"
            />
            <div className="flex gap-2">
               <button
                 type="submit"
                 className="flex-grow bg-paper-ink text-white text-[10px] uppercase py-1 border border-paper-ink hover:bg-paper-outline transition-colors flex items-center justify-center gap-1"
               >
                 <Send size={12} /> Post
               </button>
               <button
                 type="button"
                 onClick={() => setIsWriting(false)}
                 className={`px-4 border border-paper-outline bg-white text-paper-ink text-[10px] uppercase hover:bg-gray-50`}
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
