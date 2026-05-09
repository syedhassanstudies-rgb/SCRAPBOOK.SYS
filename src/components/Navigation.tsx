import { useAuth } from '../lib/AuthContext';
import { Home, Compass, User, Settings, LogOut, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export function Navigation() {
  const { user, profile, signIn, signOut } = useAuth();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <>
      <header className="w-full top-0 sticky z-50 bg-[#fffffb]/90 backdrop-blur-md border-b-2 border-paper-outline/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] hidden md:block">
        <div className="flex justify-between items-center px-margin-desktop py-4 max-w-7xl mx-auto">
          <div 
            onClick={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }}
            className="font-serif text-3xl font-bold tracking-tighter italic hover:rotate-2 hover:scale-105 transition-transform cursor-pointer relative group"
          >
            SCRAPBOOK.SYS
            <div className="absolute -bottom-1 left-0 w-full h-[2px] bg-paper-secondary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </div>
          
          <nav className="flex gap-10 text-[12px] font-bold uppercase tracking-widest pl-10 border-l border-paper-outline/20">
            <NavLink onClick={(e) => handleClick(e, '/')} active={window.location.pathname === '/'} icon={<Compass size={16} />}>Directory</NavLink>
            <NavLink onClick={(e) => handleClick(e, '/my-page')} active={window.location.pathname === '/my-page'} icon={<User size={16} />}>My Archive</NavLink>
            <NavLink onClick={(e) => handleClick(e, '/editor')} active={window.location.pathname === '/editor'} icon={<Settings size={16} />}>Studio</NavLink>
          </nav>

          <div className="flex gap-4 ml-auto">
            {user ? (
               <button onClick={signOut} className="flex gap-2 items-center px-4 py-2 hover:bg-paper-outline/10 transition-colors uppercase font-bold text-[10px] tracking-widest border border-transparent hover:border-paper-outline/20">
                  <LogOut size={16} /> Sign Out
               </button>
            ) : (
               <button onClick={signIn} className="flex gap-2 items-center px-4 py-2 bg-paper-ink text-white hover:bg-paper-secondary transition-colors uppercase font-bold text-[10px] tracking-widest analog-shadow hover:-translate-y-0.5">
                  <LogIn size={16} /> Join Directory
               </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full md:hidden z-50 bg-[#fffffb]/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-paper-outline/20 pb-safe">
        <div className="flex justify-around items-center py-3">
          <MobileNavLink onClick={() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} icon={<Compass size={24} />} label="Directory" active={window.location.pathname === '/'} />
          <MobileNavLink onClick={() => { window.history.pushState({}, '', '/editor'); window.dispatchEvent(new PopStateEvent('popstate')); }} icon={<Settings size={24} />} label="Studio" active={window.location.pathname === '/editor'} />
          <MobileNavLink onClick={() => { window.history.pushState({}, '', '/my-page'); window.dispatchEvent(new PopStateEvent('popstate')); }} icon={<User size={24} />} label="Archive" active={window.location.pathname === '/my-page'} />
        </div>
      </nav>
    </>
  );
}

function NavLink({ children, active, icon, onClick }: { children: React.ReactNode; active?: boolean; icon?: React.ReactNode; onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <a 
      href="#"
      onClick={onClick}
      className={`flex items-center gap-1 pb-1 transition-all hover:rotate-1 ${active ? 'text-paper-secondary border-b-2 border-paper-secondary -rotate-1' : 'text-paper-outline hover:text-paper-ink'}`}
    >
      {icon} {children}
    </a>
  );
}

function MobileNavLink({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 transition-transform ${active ? 'text-paper-secondary scale-110 -translate-y-2' : 'text-paper-outline'}`}>
      {icon}
      <span className="text-[10px] uppercase font-bold">{label}</span>
    </button>
  );
}
