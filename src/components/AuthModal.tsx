import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

function translateAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: string }).code)
      : '';
  const msg = error instanceof Error ? error.message : String(error);

  if (code === 'auth/operation-not-allowed') {
    return 'Login Email & Kata Sandi belum diaktifkan di Firebase Console. Silakan gunakan tombol "Masuk dengan Google" di atas, atau aktifkan penyedia Email/Password di Firebase Authentication Console.';
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return 'Email/username atau kata sandi tidak cocok. Periksa kembali atau masuk menggunakan Google.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Email tersebut sudah terdaftar. Silakan masuk menggunakan akun Anda.';
  }
  if (code === 'auth/weak-password') {
    return 'Kata sandi minimal 6 karakter.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Jendela masuk Google ditutup sebelum selesai.';
  }
  if (code === 'auth/invalid-email') {
    return 'Format email tidak valid.';
  }
  return msg || 'Terjadi kesalahan saat memproses autentikasi.';
}

export function AuthModal() {
  const {
    authModalOpen,
    authModalTab,
    closeAuthModal,
    loginWithGoogle,
    loginWithCredentials,
    registerWithEmail,
  } = useAuth();

  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  useEffect(() => {
    if (authModalOpen) {
      setTab(authModalTab);
      setError('');
      setInfoMessage('');
    }
  }, [authModalOpen, authModalTab]);

  if (!authModalOpen) return null;

  const handleGoogle = async () => {
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Mohon isi email/username dan kata sandi.');
      return;
    }
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      await loginWithCredentials(identifier, password);
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim() || !email.trim() || !regPassword) {
      setError('Nama lengkap, email, dan kata sandi wajib diisi.');
      return;
    }
    setError('');
    setInfoMessage('');
    setSubmitting(true);
    try {
      const res = await registerWithEmail({
        nama_lengkap: namaLengkap,
        email,
        no_hp: noHp,
        alamat,
        password: regPassword,
      });
      if (res.needsVerification) {
        setInfoMessage(
          'Pendaftaran berhasil. Silakan cek kotak masuk email Anda untuk verifikasi sebelum memesan.',
        );
      }
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-[#EAE3DA] rounded-2xl w-full max-w-md max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1EBE3]">
          <div>
            <h2
              id="auth-modal-title"
              className="font-display text-xl font-bold text-[#1C1613]"
            >
              {tab === 'login' ? 'Masuk ke Dapur Aziz' : 'Daftar Akun Pelanggan'}
            </h2>
            <p className="text-xs text-[#6E5E55] mt-0.5">
              Pesan lebih cepat dan pantau status pesanan secara langsung.
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Tutup jendela login"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#6E5E55] hover:bg-[#FCFAF7] hover:text-[#1C1613] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Primary instant Google Sign-In */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleGoogle()}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 min-h-[44px] rounded-xl border border-[#DDD2C5] bg-white hover:bg-[#FCFAF7] text-[#1C1613] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>Masuk dengan Google</span>
          </button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-[#EAE3DA]" />
            <span className="shrink-0 mx-3 text-xs text-[#8A796E]">
              atau gunakan email & kata sandi
            </span>
            <div className="flex-grow border-t border-[#EAE3DA]" />
          </div>

          {/* Segmented Tab */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F5EFE8] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-[#1C1613] shadow-xs'
                  : 'text-[#6E5E55] hover:text-[#1C1613]'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-[#1C1613] shadow-xs'
                  : 'text-[#6E5E55] hover:text-[#1C1613]'
              }`}
            >
              Daftar Baru
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs leading-relaxed">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{infoMessage}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={(e) => void handleLoginSubmit(e)} className="space-y-4">
              <div>
                <label
                  htmlFor="login-identifier"
                  className="block text-xs font-semibold text-[#3E332D] mb-1.5"
                >
                  Email atau Username
                </label>
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="nama@email.com atau Aziz"
                  className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-[#DDD2C5] text-sm text-[#1C1613] focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-[#3E332D] mb-1.5"
                >
                  Kata Sandi
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full px-3.5 py-2.5 min-h-[42px] rounded-lg border border-[#DDD2C5] text-sm text-[#1C1613] focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 min-h-[44px] rounded-xl bg-[#C82319] hover:bg-[#A61B13] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Masuk Sekarang</span>
              </button>
            </form>
          ) : (
            <form onSubmit={(e) => void handleRegisterSubmit(e)} className="space-y-3.5">
              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-xs font-semibold text-[#3E332D] mb-1"
                >
                  Nama Lengkap
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm text-[#1C1613] focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-[#3E332D] mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@email.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm text-[#1C1613] focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="reg-phone"
                    className="block text-xs font-semibold text-[#3E332D] mb-1"
                  >
                    No. HP / WhatsApp
                  </label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="0812xxxx"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm text-[#1C1613] focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="reg-address"
                  className="block text-xs font-semibold text-[#3E332D] mb-1"
                >
                  Alamat Pengiriman
                </label>
                <textarea
                  id="reg-address"
                  rows={2}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Merdeka No. 12, Patokan dekat masjid"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#DDD2C5] text-sm text-[#1C1613] focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold text-[#3E332D] mb-1"
                >
                  Kata Sandi
                </label>
                <input
                  id="reg-password"
                  type="password"
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm text-[#1C1613] focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 min-h-[44px] rounded-xl bg-[#C82319] hover:bg-[#A61B13] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Daftar Akun</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
