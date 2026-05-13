import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Send, MessageSquare, Trash2, Sparkles, Terminal } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Tape } from './Tape';
import { useAuth } from '../lib/AuthContext';
import { GuestbookEntry } from '../types';
import { getContrastText, getContrastBorder } from '../lib/utils';

interface GuestbookProps {
  targetUserId: string;
  rotation?: number;
  design?: string | null;
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  theme?: string;
}

export function Guestbook({ targetUserId, rotation = 1, design, bgColor, fontFamily, borderStyle, theme = 'retro' }: GuestbookProps) {
  const { user, profile } = useAuth();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';

  const activeTheme = design || theme;

  const isTerminal = activeTheme === 'terminal';
  const isChat = activeTheme === 'chat';
  const isBrutalist = activeTheme === 'brutalist';
  const isY2k = activeTheme === 'y2k';
  const isMinimal = activeTheme === 'minimal';
  const isStandard = activeTheme === 'standard';
  const isRetro = activeTheme === 'retro' || (!isTerminal && !isChat && !isBrutalist && !isY2k && !isMinimal && !isStandard);

  useEffect(() => {
    const q = query(
      collection(db, 'users', targetUserId, 'guestbook'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuestbookEntry)));
      // Auto-scroll terminal to bottom
      if (isTerminal && containerRef.current) {
         setTimeout(() => {
           if (containerRef.current) {
             containerRef.current.scrollTop = containerRef.current.scrollHeight;
           }
         }, 100);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${targetUserId}/guestbook`));
  }, [targetUserId, isTerminal]);

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

  if (isTerminal) {
    return (
      <motion.article 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, rotate: rotation }}
        className="bg-black border-2 border-green-500/50 p-4 font-mono text-green-500 w-full max-w-md shadow-[0_0_20px_rgba(34,197,94,0.2)] rounded-sm min-h-[300px] flex flex-col relative"
      >
        <div className="flex border-b border-green-500/30 pb-2 mb-4 items-center justify-between">
           <div className="flex items-center gap-2">
              <Terminal size={16} />
              <span className="uppercase text-xs tracking-widest font-bold">sys_guestbook.exe</span>
           </div>
           <div className="flex gap-1">
             <div className="w-2 h-2 rounded-full bg-green-500/50" />
             <div className="w-2 h-2 rounded-full bg-green-500/50" />
             <div className="w-2 h-2 rounded-full bg-green-500/50" />
           </div>
        </div>

        <div ref={containerRef} className="flex flex-col gap-1 flex-grow max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
           <AnimatePresence>
             {entries.slice().reverse().map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs group relative flex gap-2"
                >
                   <span className="text-green-500/50 shrink-0">guest@{entry.authorUsername}:~$</span>
                   <span className="break-words text-green-400">{entry.message}</span>
                   {(user?.uid === targetUserId || user?.uid === entry.authorId) && (
                     <button onClick={() => deleteEntry(entry.id!)} className="opacity-0 group-hover:opacity-100 text-red-500 ml-auto shrink-0 flex items-center justify-center">
                        [DEL]
                     </button>
                   )}
                </motion.div>
             ))}
           </AnimatePresence>
        </div>

        <div className="mt-4 pt-2 border-t border-green-500/30">
          {!isWriting ? (
             <button onClick={() => setIsWriting(true)} className="text-green-400 hover:text-green-300 text-xs w-full text-left uppercase flex items-center gap-2">
                <span className="animate-pulse">_</span> write access
             </button>
          ) : (
             <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-500/50 text-xs shrink-0">{profile?.username || 'user'}:~$</span>
                  <input
                    autoFocus
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="bg-transparent border-none outline-none text-green-400 text-xs flex-grow w-full focus:ring-0 p-0"
                    placeholder="..." 
                  />
                </div>
                <div className="flex justify-end gap-2 mt-1">
                   <button type="button" onClick={() => setIsWriting(false)} className="text-[10px] text-green-500/50 hover:text-green-500 border border-green-500/30 px-2 py-0.5 uppercase">abort</button>
                   <button type="submit" className="text-[10px] text-black bg-green-500 hover:bg-green-400 px-2 py-0.5 uppercase">execute</button>
                </div>
             </form>
          )}
        </div>
      </motion.article>
    );
  }

  if (isChat) {
    return (
      <motion.article 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, rotate: rotation }}
        className="bg-[#f0f0f0] border border-gray-400 p-0 font-sans w-full max-w-md rounded-[8px] shadow-xl min-h-[300px] flex flex-col relative overflow-hidden"
      >
        <div className="bg-gradient-to-b from-[#e8e8e8] to-[#d4d4d4] border-b border-gray-400 h-10 flex items-center justify-center relative font-bold text-[#333] text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
           <div className="absolute left-3 flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
           </div>
           To: Guestbook
        </div>

        <div className="flex flex-col gap-3 flex-grow max-h-[350px] overflow-y-auto p-4 bg-white">
           <AnimatePresence>
             {entries.slice().reverse().map((entry, i) => {
               const isOwn = user?.uid === entry.authorId;
               return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col max-w-[80%] relative group ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}
                >
                   <span className="text-[10px] text-gray-500 mb-0.5 px-1">{entry.authorUsername}</span>
                   <div className={`px-3 py-2 rounded-2xl text-sm break-words relative shadow-sm ${isOwn ? 'bg-[#007aff] text-white rounded-br-sm' : 'bg-[#e5e5ea] text-black rounded-bl-sm'}`}>
                      {entry.message}
                   </div>
                   {(user?.uid === targetUserId || user?.uid === entry.authorId) && (
                     <button onClick={() => deleteEntry(entry.id!)} className={`opacity-0 group-hover:opacity-100 text-red-500 absolute top-4 shrink-0 flex items-center justify-center p-1 bg-white/80 rounded-full shadow-sm hover:scale-110 transition-transform ${isOwn ? '-left-6' : '-right-6'}`}>
                        <Trash2 size={12} />
                     </button>
                   )}
                </motion.div>
               );
             })}
           </AnimatePresence>
        </div>

        <div className="p-2 bg-[#f9f9f9] border-t border-gray-300">
          {!isWriting ? (
             <button onClick={() => setIsWriting(true)} className="w-full text-left bg-white border border-gray-300 rounded-full px-4 py-1.5 text-sm font-sans text-gray-400 hover:border-gray-400 transition-colors cursor-text">
                iMessage...
             </button>
          ) : (
             <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <textarea
                  autoFocus
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="bg-white border text-sm border-gray-300 rounded-[18px] px-3 py-1.5 text-black flex-grow w-full focus:outline-none focus:border-blue-400 min-h-[36px] max-h-[100px] resize-none overflow-y-auto"
                />
                <button type="submit" disabled={!newMessage.trim()} className="w-8 h-8 rounded-full bg-[#007aff] text-white flex items-center justify-center shrink-0 disabled:opacity-50 disabled:bg-gray-300 transition-colors">
                   <Send size={14} className="ml-0.5" />
                </button>
                <button type="button" onClick={() => setIsWriting(false)} className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shrink-0 hover:bg-gray-300">
                   <Trash2 size={14} />
                </button>
             </form>
          )}
        </div>
      </motion.article>
    );
  }

  const themeClasses: Record<string, string> = {
    retro: `p-lg border ${borderClass} ${borderColor} analog-shadow paper-edge relative min-h-[300px] flex flex-col w-full max-w-md ${textColor} ${fontClass}`,
    minimal: `p-6 rounded-3xl border ${borderClass} border-opacity-20 shadow-2xl relative min-h-[300px] flex flex-col w-full max-w-md text-gray-900 ${fontClass} bg-white`,
    brutalist: `p-6 border-[4px] border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative min-h-[300px] flex flex-col w-full max-w-md uppercase font-bold text-black ${fontClass} bg-white`,
    y2k: `p-6 rounded-[2rem] border-2 border-pink-300 shadow-[0_0_20px_rgba(255,105,180,0.3)] bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-lg relative min-h-[300px] flex flex-col w-full max-w-md ${textColor} ${fontClass}`,
    standard: `p-6 border-2 border-black rounded-[8px] shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative min-h-[300px] flex flex-col w-full max-w-md text-black font-sans bg-white`
  };

  const currentThemeClass = themeClasses[activeTheme] || themeClasses['retro'];

  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, rotate: rotation }}
      className={currentThemeClass}
      style={{ backgroundColor: (isY2k || isBrutalist || isMinimal || isStandard) ? undefined : (bgColor || '#fcf9f2') }}
    >
      {isRetro && <Tape color="tertiary" rotation={12} className="-top-2 left-1/4 w-12 h-5 opacity-40" />}
      
      {isY2k && (
        <div className="absolute -top-3 -right-3 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse">
           <Sparkles size={24} fill="currentColor" />
        </div>
      )}

      <div className={`flex items-center justify-between border-b ${isY2k ? 'border-dashed border-pink-300 text-fuchsia-600' : isStandard ? 'border-solid border-black' : `border-dashed ${borderColor}`} pb-2 mb-4`}>
        <h3 className={`${isRetro ? 'font-serif italic' : ''} text-xl flex items-center gap-2`}>
           Guestbook
        </h3>
        <MessageSquare size={16} className={isY2k ? 'text-pink-400' : 'opacity-50'} />
      </div>

      <div className="flex flex-col gap-4 flex-grow max-h-[400px] overflow-y-auto px-1 scrollbar-thin">
        <AnimatePresence>
          {entries.map((entry, i) => (
             <motion.div
               key={entry.id}
               initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
               animate={{ opacity: 1, x: 0 }}
               className={`${isY2k ? 'bg-white/60 border-purple-200 shadow-[0_0_10px_rgba(255,105,180,0.1)] rounded-xl' : isBrutalist ? 'bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]' : isMinimal ? 'bg-gray-50 border-gray-100 rounded-lg shadow-sm' : isStandard ? 'bg-gray-50 border border-black rounded shadow-sm' : 'bg-white border-paper-outline shadow-sm'} p-3 border relative group hover:rotate-0 transition-transform ${isRetro ? (i % 2 === 0 ? '-rotate-1 self-start' : 'rotate-1 self-end w-[90%]') : 'w-full'}`}
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
                     <img src={entry.authorAvatarUrl} className={`w-6 h-6 shrink-0 ${isBrutalist ? 'border-2 border-black rounded-none' : 'rounded-full border border-paper-outline'}`} alt="" />
                   )}
                   <div className="min-w-0 flex-1">
                      <p className={`leading-tight break-words ${isBrutalist ? 'uppercase font-bold' : ''}`}>{entry.message}</p>
                      <span className={`text-[10px] ${isY2k ? 'text-purple-500' : 'text-paper-outline opacity-70'} block mt-0.5`}>— @{entry.authorUsername}</span>
                   </div>
                </div>
             </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className={`mt-6 pt-4 border-t ${isY2k ? 'border-dashed border-pink-300' : isStandard ? 'border-solid border-black' : `border-dashed ${borderColor}`}`}>
        {!isWriting ? (
          <button
            onClick={() => setIsWriting(true)}
            className={`w-full ${isY2k ? 'bg-gradient-to-r from-fuchsia-400 to-pink-400 text-white border-none shadow-md hover:shadow-lg rounded-full' : isBrutalist ? 'bg-black text-white hover:bg-gray-800 border-none' : isMinimal ? 'bg-gray-900 text-white hover:bg-gray-800 rounded-lg border-none' : isStandard ? 'bg-black text-white rounded font-bold' : 'bg-white text-paper-ink border-paper-outline border-dashed hover:-rotate-1 border'} text-[12px] uppercase py-2 transition-all flex items-center justify-center gap-2`}
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
              className={`w-full bg-white ${isY2k ? 'text-fuchsia-900 border-pink-300 rounded-lg' : isBrutalist ? 'text-black border-2 border-black' : isMinimal ? 'text-gray-900 border-gray-200 rounded-md' : isStandard ? 'text-black border border-black rounded' : 'text-paper-ink border-paper-outline'} p-2 border text-xs min-h-[60px] max-h-[120px] resize-none focus:outline-none scrollbar-thin`}
            />
            <div className="flex gap-2">
               <button
                 type="submit"
                 disabled={!newMessage.trim()}
                 className={`flex-grow ${isY2k ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white rounded-full border-none' : isBrutalist ? 'bg-black text-white border-2 border-black' : isMinimal ? 'bg-gray-900 text-white rounded-md border-none' : isStandard ? 'bg-black text-white rounded' : 'bg-paper-ink text-white border-paper-ink hover:bg-paper-outline disabled:opacity-50'} text-[10px] uppercase py-1 border transition-colors flex items-center justify-center gap-1`}
               >
                 <Send size={12} /> Post
               </button>
               <button
                 type="button"
                 onClick={() => setIsWriting(false)}
                 className={`px-4 border ${isY2k ? 'border-pink-300 text-pink-600 rounded-full bg-white hover:bg-pink-50' : isBrutalist ? 'border-2 border-black text-black bg-white hover:bg-gray-100' : isMinimal ? 'border-gray-200 text-gray-700 bg-white rounded-md hover:bg-gray-50' : isStandard ? 'border-black text-black rounded bg-gray-100 hover:bg-gray-200' : 'border-paper-outline bg-white text-paper-ink hover:bg-gray-50'} text-[10px] uppercase`}
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
