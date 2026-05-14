import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile as Profile } from '../types';
import { sanitizeData } from './utils';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const profileRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(profileRef, (doc) => {
          if (doc.exists()) {
            setProfile(doc.data() as Profile);
          } else {
            // Initialize profile
            const newProfile: Profile = {
              uid: user.uid,
              username: (user.displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') || `user_${user.uid.slice(0, 5)}`).slice(0, 32),
              bio: 'Documenting the mundane & the magical.',
              subtitle: 'Creative Soul',
              avatarUrl: user.photoURL?.slice(0, 1024) || '',
              isPublic: true,
            };
            setDoc(profileRef, newProfile).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`));
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          setLoading(false);
        });
        return unsubscribe;
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
  }, []);

  const signIn = async () => {
    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const signOut = () => auth.signOut();

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    try {
      await setDoc(profileRef, sanitizeData({ ...profile, ...data }), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
