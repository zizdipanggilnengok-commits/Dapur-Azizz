import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAP_ADMIN_EMAILS,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase.ts';
import type { Profile, UserRole } from '../types.ts';

interface RegisterPayload {
  nama_lengkap: string;
  email: string;
  no_hp: string;
  alamat: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithCredentials: (identifier: string, password: string) => Promise<void>;
  registerWithEmail: (payload: RegisterPayload) => Promise<{ needsVerification: boolean }>;
  logout: () => Promise<void>;
  updateMyProfile: (data: {
    nama_lengkap: string;
    no_hp: string;
    alamat: string;
  }) => Promise<void>;
  resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PENDING_REG_KEY = 'dapur_aziz_pending_profile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const emailLower = (firebaseUser.email || '').toLowerCase();
      const isBootstrapAdmin = BOOTSTRAP_ADMIN_EMAILS.some(
        (adminEmail) => adminEmail.toLowerCase() === emailLower,
      );

      if (!firebaseUser.emailVerified) {
        setProfile({
          id: firebaseUser.uid,
          nama_lengkap:
            firebaseUser.displayName || emailLower.split('@')[0] || 'Pelanggan',
          email: firebaseUser.email || '',
          no_hp: '',
          alamat: '',
          role: isBootstrapAdmin ? 'admin' : 'user',
        });
        setLoading(false);
        return;
      }

      const profilePath = `profiles/${firebaseUser.uid}`;
      const profileRef = doc(db, 'profiles', firebaseUser.uid);

      try {
        const snap = await getDoc(profileRef);
        if (!snap.exists()) {
          let pending: Partial<RegisterPayload> = {};
          try {
            const raw = sessionStorage.getItem(PENDING_REG_KEY);
            if (raw) {
              pending = JSON.parse(raw) as Partial<RegisterPayload>;
              sessionStorage.removeItem(PENDING_REG_KEY);
            }
          } catch {
            // ignore storage errors
          }

          let role: UserRole = isBootstrapAdmin ? 'admin' : 'user';
          if (!isBootstrapAdmin) {
            try {
              const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
              if (adminSnap.exists()) {
                role = 'admin';
              }
            } catch {
              // ignore non-admin check failure
            }
          }

          const newProfileData = {
            id: firebaseUser.uid,
            nama_lengkap: (
              pending.nama_lengkap ||
              firebaseUser.displayName ||
              emailLower.split('@')[0] ||
              'Pelanggan Dapur Aziz'
            ).slice(0, 120),
            email: (firebaseUser.email || '').slice(0, 160),
            no_hp: (pending.no_hp || '').slice(0, 30),
            alamat: (pending.alamat || '').slice(0, 300),
            role,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          };

          await setDoc(profileRef, newProfileData);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, profilePath);
      }

      unsubscribeProfile = onSnapshot(
        profileRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as Profile);
          }
          setLoading(false);
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, profilePath);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
    setAuthModalOpen(false);
  };

  const loginWithCredentials = async (identifier: string, password: string) => {
    const trimmed = identifier.trim();
    const email =
      trimmed.toLowerCase() === 'aziz'
        ? 'admin@dapuraziz.com'
        : trimmed.toLowerCase();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthModalOpen(false);
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: string }).code)
          : '';

      if (
        email === 'admin@dapuraziz.com' &&
        password === 'Aziz1' &&
        (code === 'auth/user-not-found' || code === 'auth/invalid-credential')
      ) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: 'Aziz' });
        await sendEmailVerification(cred.user);
        setAuthModalOpen(false);
        return;
      }
      throw error;
    }
  };

  const registerWithEmail = async (payload: RegisterPayload) => {
    sessionStorage.setItem(
      PENDING_REG_KEY,
      JSON.stringify({
        nama_lengkap: payload.nama_lengkap.trim(),
        no_hp: payload.no_hp.trim(),
        alamat: payload.alamat.trim(),
      }),
    );

    const cred = await createUserWithEmailAndPassword(
      auth,
      payload.email.trim(),
      payload.password,
    );

    await updateProfile(cred.user, {
      displayName: payload.nama_lengkap.trim(),
    });

    if (!cred.user.emailVerified) {
      await sendEmailVerification(cred.user);
      setAuthModalOpen(false);
      return { needsVerification: true };
    }

    setAuthModalOpen(false);
    return { needsVerification: false };
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateMyProfile = async (data: {
    nama_lengkap: string;
    no_hp: string;
    alamat: string;
  }) => {
    if (!user) return;
    const path = `profiles/${user.uid}`;
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        nama_lengkap: data.nama_lengkap.trim().slice(0, 120),
        no_hp: data.no_hp.trim().slice(0, 30),
        alamat: data.alamat.trim().slice(0, 300),
        updated_at: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const resendVerification = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const isAdmin = Boolean(
    user &&
      user.emailVerified &&
      (profile?.role === 'admin' ||
        BOOTSTRAP_ADMIN_EMAILS.some(
          (email) => email.toLowerCase() === (user.email || '').toLowerCase(),
        )),
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginWithCredentials,
        registerWithEmail,
        logout,
        updateMyProfile,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
