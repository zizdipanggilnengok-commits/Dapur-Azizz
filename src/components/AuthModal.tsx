import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

function translateSupabaseAuthError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();

  if (lower.includes('email not confirmed')) {
    return 'Email Anda belum dikonfirmasi. Cek kotak masuk email Anda (atau nonaktifkan "Confirm email" di pengaturan Authentication Supabase).';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Email/username atau kata sandi tidak cocok.';
  }
  if (lower.includes('user already registered')) {
    return 'Email tersebut sudah terdaftar. Silakan masuk menggunakan akun Anda.';
  }
  if (lower.includes('password should be at least')) {
    return 'Kata sandi minimal 6 karakter.';
  }
  if (lower.includes('unable to validate email address')) {
    return 'Format alamat email tidak valid.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Terlalu banyak percobaan dalam waktu singkat. Coba lagi sebentar lagi.';
  }
  return msg || 'Terjadi kesalahan saat memproses autentikasi.';
}

export function AuthModal() {
  const {
    authModalOpen,
    authModalTab,
    closeAuthModal,
    loginWithCredentials,
    registerWithEmail,
    resendVerification,
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
  const [pendingEmailForResend, setPendingEmailForResend] = useState('');

  useEffect(() => {
    if (authModalOpen) {
      setTab(authModalTab);
      setError('');
      setInfoMessage('');
      setPendingEmailForResend('');
    }
  }, [authModalOpen, authModalTab]);

  if (!authModalOpen) return null;

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
      const res = await loginWithCredentials(identifier, password);
      if (res.needsVerification) {
        if (res.resolvedEmail) {
          setPendingEmailForResend(res.resolvedEmail);
        }
        setInfoMessage(
          'Akun dibuat, tetapi menunggu konfirmasi email. Silakan cek kotak masuk email Anda.',
        );
      }
    } catch (err) {
      const msg = translateSupabaseAuthError(err);
      setError(msg);
      if (msg.toLowerCase().includes('belum dikonfirmasi')) {
        const emailMatch = msg.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const fallbackEmail = identifier.includes('@')
          ? identifier.trim().toLowerCase()
          : '';
        const targetEmail = emailMatch?.[1] || fallbackEmail;
        if (targetEmail) {
          setPendingEmailForResend(targetEmail);
        }
      }
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
        setPendingEmailForResend(email.trim());
        setInfoMessage(
          'Pendaftaran berhasil! Silakan cek kotak masuk email Anda untuk konfirmasi sebelum masuk.',
        );
      }
    } catch (err) {
      setError(translateSupabaseAuthError(err));
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
          {/* Segmented Tab */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F5EFE8] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
                setInfoMessage('');
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
                setInfoMessage('');
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
            <div className="space-y-2 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs leading-relaxed">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
              {pendingEmailForResend && (
                <button
                  type="button"
                  onClick={() => {
                    void resendVerification(pendingEmailForResend).then(() =>
                      setInfoMessage('Tautan konfirmasi telah dikirim ulang ke email Anda.'),
                    );
                  }}
                  className="font-semibold underline cursor-pointer ml-6"
                >
                  Kirim Ulang Email Konfirmasi
                </button>
              )}
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
