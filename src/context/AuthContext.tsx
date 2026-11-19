import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { BOOTSTRAP_ADMIN_EMAILS, supabase } from '../lib/supabase.ts';
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
  loginWithCredentials: (
    identifier: string,
    password: string,
  ) => Promise<{ needsVerification?: boolean; resolvedEmail?: string }>;
  registerWithEmail: (
    payload: RegisterPayload,
  ) => Promise<{ needsVerification: boolean }>;
  logout: () => Promise<void>;
  updateMyProfile: (data: {
    nama_lengkap: string;
    no_hp: string;
    alamat: string;
  }) => Promise<void>;
  resendVerification: (email?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const buildFallbackProfile = (authUser: User): Profile => {
    const emailLower = (authUser.email || '').toLowerCase();
    const isBootstrapAdmin = BOOTSTRAP_ADMIN_EMAILS.some(
      (adminEmail) => adminEmail.toLowerCase() === emailLower,
    );
    const meta = (authUser.user_metadata || {}) as Record<string, string>;
    return {
      id: authUser.id,
      nama_lengkap:
        meta.nama_lengkap ||
        meta.full_name ||
        emailLower.split('@')[0] ||
        'Pelanggan Dapur Aziz',
      email: authUser.email || '',
      no_hp: meta.no_hp || '',
      alamat: meta.alamat || '',
      role: isBootstrapAdmin ? 'admin' : 'user',
    };
  };

  const loadOrCreateProfile = async (authUser: User) => {
    const emailLower = (authUser.email || '').toLowerCase();
    const isBootstrapAdmin = BOOTSTRAP_ADMIN_EMAILS.some(
      (adminEmail) => adminEmail.toLowerCase() === emailLower,
    );

    const fetchProfileOnce = () =>
      supabase
        .from('profiles')
        .select('id, nama_lengkap, email, no_hp, alamat, role')
        .eq('id', authUser.id)
        .maybeSingle();

    try {
      let { data, error } = await fetchProfileOnce();

      if (
        error &&
        /failed to fetch|networkerror|load failed/i.test(error.message)
      ) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const retryRes = await fetchProfileOnce();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        console.warn('Profil dimuat menggunakan fallback lokal:', error.message);
        setProfile(buildFallbackProfile(authUser));
        return;
      }

      const meta = (authUser.user_metadata || {}) as Record<string, string>;

      if (data) {
        const loadedProfile = data as Profile;
        const needsMetaSync =
          (!loadedProfile.no_hp && Boolean(meta.no_hp)) ||
          (!loadedProfile.alamat && Boolean(meta.alamat)) ||
          (!loadedProfile.nama_lengkap && Boolean(meta.nama_lengkap));

        if (needsMetaSync) {
          const { data: synced } = await supabase
            .from('profiles')
            .update({
              nama_lengkap: (
                loadedProfile.nama_lengkap ||
                meta.nama_lengkap ||
                emailLower.split('@')[0] ||
                'Pelanggan Dapur Aziz'
              ).slice(0, 120),
              no_hp: (loadedProfile.no_hp || meta.no_hp || '').slice(0, 30),
              alamat: (loadedProfile.alamat || meta.alamat || '').slice(0, 300),
            })
            .eq('id', authUser.id)
            .select('id, nama_lengkap, email, no_hp, alamat, role')
            .maybeSingle();

          setProfile((synced as Profile) || loadedProfile);
          return;
        }

        setProfile(loadedProfile);
        return;
      }
      const role: UserRole = isBootstrapAdmin ? 'admin' : 'user';
      const newProfile = {
        id: authUser.id,
        nama_lengkap: (
          meta.nama_lengkap ||
          emailLower.split('@')[0] ||
          'Pelanggan Dapur Aziz'
        ).slice(0, 120),
        email: (authUser.email || '').slice(0, 160),
        no_hp: (meta.no_hp || '').slice(0, 30),
        alamat: (meta.alamat || '').slice(0, 300),
        role,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select('id, nama_lengkap, email, no_hp, alamat, role')
        .single();

      if (insertError) {
        console.warn(
          'Profil awal menggunakan fallback lokal:',
          insertError.message,
        );
        setProfile(buildFallbackProfile(authUser));
        return;
      }

      setProfile(inserted as Profile);
    } catch (err) {
      console.warn(
        'Koneksi profil tertunda, menggunakan profil sesi:',
        err instanceof Error ? err.message : String(err),
      );
      setProfile(buildFallbackProfile(authUser));
    }
  };

  useEffect(() => {
    let mounted = true;
    let activeLoadKey: string | null = null;

    const syncSessionUser = (sessionUser: User | null) => {
      if (!mounted) return;
      setUser(sessionUser);
      if (!sessionUser) {
        activeLoadKey = null;
        setProfile(null);
        setLoading(false);
        return;
      }

      const loadKey = sessionUser.id;
      if (activeLoadKey === loadKey) return;
      activeLoadKey = loadKey;

      void loadOrCreateProfile(sessionUser).finally(() => {
        if (mounted) setLoading(false);
      });
    };

    supabase.auth
      .getSession()
      .then(({ data }) => {
        syncSessionUser(data.session?.user ?? null);
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        const sessionUser = session?.user ?? null;
        if (!sessionUser) {
          syncSessionUser(null);
          return;
        }
        setTimeout(() => {
          syncSessionUser(sessionUser);
        }, 0);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const loginWithCredentials = async (identifier: string, password: string) => {
    const trimmed = identifier.trim();
    const isUsernameLogin = !trimmed.includes('@');
    let email = trimmed.toLowerCase();

    if (isUsernameLogin) {
      const escapedUsername = trimmed.replace(/[%_\\]/g, '\\$&');
      const { data: matchedProfile, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .ilike('nama_lengkap', escapedUsername)
        .limit(1)
        .maybeSingle();

      if (lookupError) {
        throw new Error(`Gagal mencari username: ${lookupError.message}`);
      }

      if (!matchedProfile?.email) {
        throw new Error(
          `Username "${trimmed}" tidak ditemukan. Periksa kembali nama lengkap Anda atau masuk menggunakan email.`,
        );
      }

      email = matchedProfile.email.trim().toLowerCase();
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      setAuthModalOpen(false);
      return { resolvedEmail: email };
    }

    const msg = error?.message || '';
    if (msg.toLowerCase().includes('invalid login credentials')) {
      throw new Error(
        isUsernameLogin
          ? `Kata sandi untuk username "${trimmed}" salah.`
          : 'Email atau kata sandi tidak cocok.',
      );
    }

    if (msg.toLowerCase().includes('email not confirmed')) {
      throw new Error(
        `Email "${email}" belum dikonfirmasi. Cek kotak masuk email Anda (atau nonaktifkan "Confirm email" di pengaturan Authentication Supabase).`,
      );
    }

    throw error || new Error('Gagal masuk ke akun.');
  };

  const registerWithEmail = async (payload: RegisterPayload) => {
    const cleanEmail = payload.email.trim();
    const cleanNama = payload.nama_lengkap.trim().slice(0, 120);
    const cleanNoHp = payload.no_hp.trim().slice(0, 30);
    const cleanAlamat = payload.alamat.trim().slice(0, 300);

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: payload.password,
      options: {
        data: {
          nama_lengkap: cleanNama,
          no_hp: cleanNoHp,
          alamat: cleanAlamat,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      const emailLower = (data.user.email || cleanEmail).toLowerCase();
      const isBootstrapAdmin = BOOTSTRAP_ADMIN_EMAILS.some(
        (adminEmail) => adminEmail.toLowerCase() === emailLower,
      );
      const role: UserRole = isBootstrapAdmin ? 'admin' : 'user';

      const { data: upsertedProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: data.user.id,
            nama_lengkap: cleanNama || emailLower.split('@')[0] || 'Pelanggan Dapur Aziz',
            email: (data.user.email || cleanEmail).slice(0, 160),
            no_hp: cleanNoHp,
            alamat: cleanAlamat,
            role,
          },
          { onConflict: 'id' },
        )
        .select('id, nama_lengkap, email, no_hp, alamat, role')
        .maybeSingle();

      if (upsertError) {
        if (data.session) {
          throw new Error(
            `Akun dibuat, namun gagal menyimpan profil: ${upsertError.message}`,
          );
        }
        console.warn(
          'Profil akan disinkronkan setelah konfirmasi email:',
          upsertError.message,
        );
      } else if (upsertedProfile) {
        setProfile(upsertedProfile as Profile);
      }
    }

    if (!data.session) {
      return { needsVerification: true };
    }

    setAuthModalOpen(false);
    return { needsVerification: false };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateMyProfile = async (data: {
    nama_lengkap: string;
    no_hp: string;
    alamat: string;
  }) => {
    if (!user) return;
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        nama_lengkap: data.nama_lengkap.trim().slice(0, 120),
        no_hp: data.no_hp.trim().slice(0, 30),
        alamat: data.alamat.trim().slice(0, 300),
      })
      .eq('id', user.id)
      .select('id, nama_lengkap, email, no_hp, alamat, role')
      .single();

    if (error) {
      throw new Error(`Gagal memperbarui profil: ${error.message}`);
    }
    if (updated) {
      setProfile(updated as Profile);
    }
  };

  const resendVerification = async (email?: string) => {
    const targetEmail = email || user?.email;
    if (!targetEmail) return;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: targetEmail,
    });
    if (error) throw error;
  };

  const isAdmin = Boolean(
    user &&
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
