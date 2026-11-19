import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export function ProfilePage() {
  const { user, profile, loading, openAuthModal, updateMyProfile } = useAuth();
  const [namaLengkap, setNamaLengkap] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setNamaLengkap(profile.nama_lengkap || '');
      setNoHp(profile.no_hp || '');
      setAlamat(profile.alamat || '');
    }
  }, [profile]);

  if (!loading && !user) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <UserIcon className="w-12 h-12 mx-auto text-[#C82319]" />
        <h1 className="font-display text-3xl font-bold text-[#1C1613]">
          Profil Saya
        </h1>
        <p className="text-sm text-[#6E5E55]">
          Masuk untuk mengelola informasi nama, nomor WhatsApp, dan alamat pengantaran Anda.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-xl bg-[#C82319] text-white text-sm font-semibold cursor-pointer"
        >
          Masuk Sekarang
        </button>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await updateMyProfile({
        nama_lengkap: namaLengkap,
        no_hp: noHp,
        alamat,
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memperbarui profil.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-[#1C1613]">
          Profil Akun
        </h1>
        <p className="text-sm text-[#6E5E55] mt-1">
          Simpan nomor WhatsApp dan alamat agar proses checkout Dapur Aziz lebih cepat.
        </p>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="bg-white border border-[#EAE3DA] rounded-2xl p-6 sm:p-8 space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#F1EBE3]">
          <div>
            <p className="text-xs text-[#6E5E55]">Email Terdaftar</p>
            <p className="text-sm font-semibold text-[#1C1613]">
              {profile?.email || user?.email}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#6E5E55]">Peran Akses</p>
            <p className="text-sm font-semibold text-[#B91C1C]">
              {profile?.role === 'admin' ? 'Administrator' : 'Pelanggan'}
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="prof-name"
            className="block text-xs font-semibold text-[#3E332D] mb-1.5"
          >
            Nama Lengkap
          </label>
          <input
            id="prof-name"
            type="text"
            value={namaLengkap}
            onChange={(e) => setNamaLengkap(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C82319]"
            required
          />
        </div>

        <div>
          <label
            htmlFor="prof-phone"
            className="block text-xs font-semibold text-[#3E332D] mb-1.5"
          >
            No. HP / WhatsApp
          </label>
          <input
            id="prof-phone"
            type="tel"
            value={noHp}
            onChange={(e) => setNoHp(e.target.value)}
            placeholder="0812xxxxxxxx"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C82319]"
          />
        </div>

        <div>
          <label
            htmlFor="prof-address"
            className="block text-xs font-semibold text-[#3E332D] mb-1.5"
          >
            Alamat Pengiriman Utama
          </label>
          <textarea
            id="prof-address"
            rows={3}
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            placeholder="Masukkan alamat lengkap Anda"
            className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C82319]"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profil berhasil disimpan.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C82319] hover:bg-[#A61B13] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Simpan Perubahan</span>
        </button>
      </form>
    </main>
  );
}
