import { motion } from 'motion/react';
import { Tape } from './Tape';
import { getContrastText, getContrastBorder } from '../lib/utils';
import { Sparkles, CheckSquare, Square, Pin } from 'lucide-react';

interface NoteWidgetProps {
  title: string;
  items: string[];
  rotation?: number;
  design?: string;
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  theme?: string;
}

export function NoteWidget({ title, items, rotation = -3, design, bgColor, fontFamily, borderStyle, theme = 'retro' }: NoteWidgetProps) {
  const activeTheme = design || theme;
  
  const isTapeTop = activeTheme === 'tape-top';
  const isNotebook = activeTheme === 'notebook';
  const isChecklist = activeTheme === 'checklist';
  const isInk = activeTheme === 'ink';
  const isPostIt = activeTheme === 'post-it';
  
  const isBrutalist = activeTheme === 'brutalist';
  const isMinimal = activeTheme === 'minimal';
  const isY2k = activeTheme === 'y2k';
  const isStandard = activeTheme === 'standard';
  const isRetro = activeTheme === 'retro' || (!isTapeTop && !isNotebook && !isChecklist && !isInk && !isPostIt && !isBrutalist && !isMinimal && !isY2k && !isStandard);
  
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';
  
  if (isPostIt) {
    return (
      <motion.article
        initial={{ opacity: 0, x: -20, rotate: rotation }}
        animate={{ opacity: 1, x: 0, rotate: rotation }}
        whileHover={{ scale: 1.05, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
        className={`p-6 shadow-[2px_10px_20px_rgba(0,0,0,0.15)] relative w-full max-w-[280px] mb-4 group text-gray-800 ${fontClass}`}
        style={{ 
           backgroundColor: bgColor || '#feff9c',
           borderBottomRightRadius: '15% 5%',
           borderBottomLeftRadius: '5% 15%'
        }}
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 drop-shadow-md">
           <Pin size={24} className="text-red-500 fill-red-500" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/5 pointer-events-none" />
        <h3 className="font-bold text-xl mb-3 mt-2 border-b border-black/10 pb-1 rotate-1 relative z-10">{title}</h3>
        <ul className="space-y-3 relative z-10 text-sm">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2 items-start leading-tight">
               <span className="opacity-50 mt-1 shrink-0">-</span>
               <span>{item}</span>
            </li>
          ))}
        </ul>
      </motion.article>
    );
  }

  const themeClasses: Record<string, string> = {
    retro: `${isNotebook ? `border-l-8 border-l-paper-secondary ${borderColor}` : `${borderColor} analog-shadow paper-edge`} p-lg border ${borderClass} relative w-full max-w-sm mb-4 group ${textColor} ${fontClass}`,
    minimal: `p-6 rounded-2xl border ${borderClass} border-opacity-20 shadow-xl relative w-full max-w-sm mb-4 group ${textColor} ${fontClass}`,
    brutalist: `p-6 border-[4px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative w-full max-w-sm mb-4 group uppercase font-bold text-black ${fontClass} bg-white`,
    y2k: `p-6 rounded-[1rem] border-2 border-pink-300 shadow-[0_0_15px_rgba(255,105,180,0.3)] bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-md relative w-full max-w-sm mb-4 group ${textColor} ${fontClass}`,
    standard: `p-6 border-2 border-black rounded shadow-[4px_4px_0_0_rgba(0,0,0,1)] relative w-full max-w-sm mb-4 group text-black font-sans bg-white`
  };

  const getStyleClass = () => {
     if (isNotebook || isTapeTop || isChecklist || isInk) return themeClasses['retro'];
     return themeClasses[activeTheme] || themeClasses['retro'];
  };

  return (
    <motion.article
      initial={{ opacity: 0, x: -20, rotate: rotation }}
      animate={{ opacity: 1, x: 0, rotate: rotation }}
      whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
      className={getStyleClass()}
      style={{ backgroundColor: (isY2k || isBrutalist || isStandard || isMinimal) ? undefined : (bgColor || (isNotebook ? '#fff' : '#fdfcf8')) }}
    >
      {isRetro && (
        isTapeTop ? (
           <Tape color="yellow" rotation={2} className="-top-3 left-1/2 -translate-x-1/2 w-16 h-5 opacity-80" />
        ) : (
           <Tape color="secondary" rotation={12} className="-top-2 -right-3 w-16 h-5 opacity-70" />
        )
      )}

      {isY2k && (
        <div className="absolute -top-3 -right-3 text-pink-400 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)] animate-pulse">
           <Sparkles size={24} fill="currentColor" />
        </div>
      )}
      
      <h3 className={`${isNotebook ? `font-mono uppercase text-sm tracking-tighter text-paper-secondary` : 'font-bold text-xl'} border-b ${isY2k ? 'border-pink-300 border-dashed text-fuchsia-600' : isStandard ? 'border-black' : `${borderClass} ${borderColor}`} pb-1 mb-md ${isInk ? 'text-blue-800' : ''}`}>{title}</h3>
      
      <ul className={`space-y-2 ${isInk ? 'text-blue-900' : ''}`}>
        {items.map((item, i) => (
          <li key={i} className={`flex gap-2 items-start text-sm ${isChecklist ? `border-b ${isY2k ? 'border-pink-300' : isStandard ? 'border-black/20' : `${borderClass} ${borderColor}`} pb-1` : ''}`}>
             <span className={`${isChecklist ? `mt-0.5 shrink-0` : isStandard ? 'text-black opacity-40 font-bold' : 'text-paper-secondary font-bold'}`}>
               {isChecklist ? <Square size={14} className={isStandard ? "text-black" : ""} /> : '-'}
             </span>
             {isStandard && isChecklist ? (
               <span className="italic opacity-80">{item}</span>
             ) : (
               <span className={isChecklist ? 'italic' : ''}>{item}</span>
             )}
          </li>
        ))}
      </ul>
      
      {isNotebook && isRetro && (
        <div className="absolute top-0 bottom-0 left-0 w-2 flex flex-col justify-around py-4 opacity-20">
           {[...Array(10)].map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full bg-current`} />)}
        </div>
      )}
    </motion.article>
  );
}
