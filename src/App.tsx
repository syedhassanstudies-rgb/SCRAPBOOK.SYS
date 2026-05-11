import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Navigation } from './components/Navigation';
import { DiscoveryView } from './views/DiscoveryView';
import { ProfileView } from './views/ProfileView';
import { EditorView } from './views/EditorView';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { loading, user } = useAuth();
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-base">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-dashed border-paper-outline rounded-full animate-spin" />
          <span className="font-mono text-sm uppercase tracking-widest text-paper-outline">Loading Archive...</span>
        </div>
      </div>
    );
  }

  const renderView = () => {
    if (path === '/editor') {
      return user ? <EditorView /> : <DiscoveryView />;
    }
    if (path === '/my-page') {
      return user ? <ProfileView userId={user.uid} isOwner /> : <DiscoveryView />;
    }
    if (path.startsWith('/p/')) {
      const userId = path.split('/')[2];
      return <ProfileView userId={userId} isOwner={user?.uid === userId} />;
    }
    return <DiscoveryView onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow">
        {renderView()}
      </main>
      
      {/* Footer / Credits */}
      <footer className="py-xl px-margin-desktop text-center opacity-30 text-[10px] uppercase tracking-widest pointer-events-none select-none">
        SCRAPBOOK.SYS — ANALOG TEXTURES IN A DIGITAL SPACE — © 2024
      </footer>
    </div>
  );
}
