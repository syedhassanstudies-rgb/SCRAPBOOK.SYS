import { useState, useEffect } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Polaroid } from '../components/Polaroid';
import { UserProfile } from '../types';

export function DiscoveryView({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const q = query(collection(db, 'users'), where('isPublic', '==', true), limit(20));
        const snapshot = await getDocs(q);
        setProfiles(snapshot.docs.map(doc => doc.data() as UserProfile));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const handleProfileClick = (uid: string) => {
    if (onNavigate) {
      onNavigate(`/p/${uid}`);
    } else {
      window.history.pushState({}, '', `/p/${uid}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-xl">
      <div className="mb-xl text-center md:text-left relative">
        <h1 className="font-serif text-5xl md:text-7xl italic mb-4 tracking-tighter">Discovery</h1>
        <p className="text-paper-outline text-sm md:text-md max-w-md">Peek into the archives of creative souls. A directory of digital scrapbooks.</p>
        <div className="hidden md:block absolute top-0 right-10 opacity-30 font-mono text-[10px] text-right">
           <p>SYSTEM.INDEX // {new Date().getFullYear()}</p>
           <p>PUBLIC DIRECTORY</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-lg">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-paper-outline/10 animate-pulse border border-paper-outline" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-lg">
          {profiles.map((profile, i) => (
            <div 
              key={profile.uid} 
              className="cursor-pointer group"
              onClick={() => handleProfileClick(profile.uid)}
            >
              <Polaroid 
                src={profile.avatarUrl || 'https://via.placeholder.com/300x400'} 
                caption={`@${profile.username}`}
                rotation={i % 2 === 0 ? 2 : -2}
              />
            </div>
          ))}
        </div>
      )}

      {profiles.length === 0 && !loading && (
        <div className="text-center py-20 border-2 border-dashed border-paper-outline/20">
          <p className="font-mono text-paper-outline italic">No archives found yet. Start yours!</p>
        </div>
      )}
    </div>
  );
}
