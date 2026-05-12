import { motion } from 'motion/react';
import { Tape } from './Tape';
import { getContrastText, getContrastBorder } from '../lib/utils';
import { Sparkles } from 'lucide-react';

interface NoteWidgetProps {
  title: string;
  items: string[];
  rotation?: number;
  design?: 'list' | 'checklist' | 'notebook' | 'tape-top' | 'ink';
  bgColor?: string;
  fontFamily?: string;
  borderStyle?: string;
  theme?: 'retro' | 'minimal' | 'brutalist' | 'y2k';
}

export function NoteWidget({ title, items, rotation = -3, design = 'list', bgColor, fontFamily, borderStyle, theme = 'retro' }: NoteWidgetProps) {
  const isTapeTop = design === 'tape-top';
  const isStandardDesign = !design || design === 'list';
  const effectiveTheme = isStandardDesign ? theme : 'retro';
  
  const textColor = getContrastText(bgColor);
  const borderColor = getContrastBorder(bgColor);
  
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const borderClass = borderStyle === 'dashed' ? 'border-dashed' : borderStyle === 'dotted' ? 'border-dotted' : 'border-solid';
  
  const themeClasses = {
    retro: `${design === 'notebook' ? `border-l-8 border-l-paper-secondary ${borderColor}` : `${borderColor} analog-shadow paper-edge`} p-lg border ${borderClass} relative w-full max-w-sm mb-4 group ${textColor} ${fontClass}`,
    minimal: `p-6 rounded-2xl border ${borderClass} border-opacity-20 shadow-xl relative w-full max-w-sm mb-4 group ${textColor} ${fontClass}`,
    brutalist: `p-6 border-[4px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative w-full max-w-sm mb-4 group uppercase font-bold ${textColor} ${fontClass}`,
    y2k: `p-6 rounded-[1rem] border-2 border-pink-300 shadow-[0_0_15px_rgba(255,105,180,0.3)] bg-gradient-to-br from-white/60 to-white/20 backdrop-blur-md relative w-full max-w-sm mb-4 group ${textColor} ${fontClass}`
  };

  return (
    <motion.article
      initial={{ opacity: 0, x: -20, rotate: rotation }}
      animate={{ opacity: 1, x: 0, rotate: rotation }}
      whileHover={{ scale: 1.02, rotate: 0, zIndex: 50, transition: { duration: 0.3 } }}
      className={themeClasses[effectiveTheme]}
      style={{ backgroundColor: effectiveTheme === 'y2k' ? undefined : (bgColor || (design === 'notebook' ? '#fff' : '#fdfcf8')) }}
    >
      {effectiveTheme === 'retro' && (
        isTapeTop ? (
           <Tape color="yellow" rotation={2} className="-top-3 left-1/2 -translate-x-1/2 w-16 h-5 opacity-80" />
        ) : (
           <Tape color="secondary" rotation={12} className="-top-2 -right-3 w-16 h-5 opacity-70" />
        )
      )}

      {theme === 'y2k' && (
        <div className="absolute -top-3 -right-3 text-pink-400 drop-shadow-[0_0_8px_rgba(255,105,180,0.8)] animate-pulse">
           <Sparkles size={24} fill="currentColor" />
        </div>
      )}
      
      <h3 className={`${design === 'notebook' ? `font-mono uppercase text-sm tracking-tighter text-paper-secondary` : 'font-bold text-xl'} border-b ${theme === 'y2k' ? 'border-pink-300 border-dashed text-fuchsia-600' : `${borderClass} ${borderColor}`} pb-1 mb-md ${design === 'ink' ? 'text-blue-800' : ''}`}>{title}</h3>
      
      <ul className={`space-y-2 ${design === 'ink' ? 'text-blue-900' : ''}`}>
        {items.map((item, i) => (
          <li key={i} className={`flex gap-2 items-start text-sm ${design === 'checklist' ? `border-b ${theme === 'y2k' ? 'border-pink-300' : `${borderClass} ${borderColor}`} pb-1` : ''}`}>
             <span className={`${design === 'checklist' ? `w-3 h-3 border ${theme === 'y2k' ? 'border-pink-300' : `${borderClass} ${borderColor}`} mt-1 shrink-0` : 'text-paper-secondary font-bold'}`}>
               {design === 'checklist' ? '' : '-'}
             </span>
            <span className={design === 'checklist' ? 'italic' : ''}>{item}</span>
          </li>
        ))}
      </ul>
      
      {design === 'notebook' && theme === 'retro' && (
        <div className="absolute top-0 bottom-0 left-0 w-2 flex flex-col justify-around py-4 opacity-20">
           {[...Array(10)].map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full bg-current`} />)}
        </div>
      )}
    </motion.article>
  );
}
