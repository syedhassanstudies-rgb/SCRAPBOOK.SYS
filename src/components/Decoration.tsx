import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface DecorationProps {
  text?: string;
  rotation?: number;
  color?: 'secondary' | 'tertiary' | 'primary' | 'yellow';
  theme?: 'retro' | 'minimal' | 'brutalist' | 'y2k' | 'gothic' | 'medieval' | 'scrapbook' | string;
}

export function Decoration({ text, rotation = -12, color = 'tertiary', theme = 'retro' }: DecorationProps) {
  const colorClasses = {
    secondary: 'bg-paper-secondary/20 border-paper-secondary/30',
    tertiary: 'bg-paper-tertiary/20 border-paper-tertiary/30',
    primary: 'bg-paper-outline/10 border-paper-outline/20',
    yellow: 'bg-tape-yellow/30 border-tape-yellow/40',
  };

  const themeClasses: Record<string, string> = {
    retro: `w-32 h-24 border border-dashed flex items-center justify-center p-2 z-0 pointer-events-none ${colorClasses[color]} opacity-70`,
    minimal: `w-32 h-24 border border-opacity-10 border-black rounded-3xl flex items-center justify-center p-2 z-0 pointer-events-none opacity-50 bg-gray-50`,
    brutalist: `w-32 h-24 border-4 border-black flex items-center justify-center p-2 z-0 pointer-events-none opacity-100 bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] uppercase font-bold`,
    y2k: `w-32 h-24 border-2 border-dashed border-pink-400 rounded-full flex items-center justify-center p-2 z-0 pointer-events-none opacity-90 bg-fuchsia-500/20 shadow-[0_0_10px_rgba(255,105,180,0.5)]`,
    gothic: `w-32 h-24 border-y-2 border-double border-red-900 flex items-center justify-center p-2 z-0 pointer-events-none opacity-90 bg-black shadow-[0_0_10px_rgba(0,0,0,0.8)] text-red-700`,
    medieval: `w-32 h-24 border-4 border-[#8b7355] rounded-bl-xl rounded-tr-xl flex items-center justify-center p-2 z-0 pointer-events-none opacity-90 bg-[#d4c3a9] shadow-md text-[#4a3b2c]`,
    scrapbook: `w-32 h-24 border border-gray-300 flex items-center justify-center p-2 z-0 pointer-events-none opacity-90 bg-white shadow-sm -rotate-2 scale-110`
  };

  const currentThemeClass = themeClasses[theme] || themeClasses['retro'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, rotate: rotation }}
      className={`relative ${currentThemeClass}`}
    >
      <span className={`${theme === 'retro' ? 'font-mono text-[10px]' : theme === 'y2k' ? 'font-mono text-xs text-pink-600' : theme === 'gothic' ? 'font-serif text-sm' : theme === 'medieval' ? 'font-serif italic text-sm' : theme === 'scrapbook' ? 'font-sans text-xs text-gray-700' : 'text-xs text-black'} text-center ${theme === 'retro' ? 'opacity-80' : ''}`}>{text || 'cut from an old magazine'}</span>
      
      {theme === 'y2k' && (
        <Sparkles size={16} className="absolute -top-2 -right-2 text-pink-400" />
      )}
    </motion.div>
  );
}
