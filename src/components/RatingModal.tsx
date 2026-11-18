import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Star,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useMenu } from '../context/MenuContext.tsx';
import { formatRupiah } from '../data/seedMenu.ts';

export function RatingModal() {
  const { user, isAdmin, openAuthModal } = useAuth();
  const {
    ratingModalProduct,
    closeRatingModal,
    getProductRatingStats,
    submitRating,
    deleteRating,
    isSeededInDb,
  } = useMenu();

  const [selectedStars, setSelectedStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [ulasan, setUlasan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const stats = ratingModalProduct
    ? getProductRatingStats(ratingModalProduct.id)
    : { average: 0, count: 0, items: [] };

  const myExistingRating = user
    ? stats.items.find((r) => r.user_id === user.uid)
    : undefined;

  useEffect(() => {
    if (ratingModalProduct) {
      setError('');
      setSuccess('');
      if (myExistingRating) {
        setSelectedStars(myExistingRating.rating);
        setUlasan(myExistingRating.ulasan || '');
      } else {
        setSelectedStars(5);
        setUlasan('');
      }
    }
  }, [ratingModalProduct?.id, myExistingRating?.id]);

  if (!ratingModalProduct) return null;

  const activeStars = hoverStars || selectedStars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      closeRatingModal();
      openAuthModal('login');
      return;
    }

    if (!isSeededInDb) {
      setError(
        'Katalog menu sedang menunggu sinkronisasi awal oleh Admin sebelum ulasan dapat disimpan.',
      );
      return;
    }

    setSubmitting(true);
    try {
      await submitRating(ratingModalProduct.id, selectedStars, ulasan);
      setSuccess(
        myExistingRating
          ? 'Rating dan ulasan Anda berhasil diperbarui.'
          : 'Terima kasih! Rating Anda telah disimpan.',
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan rating.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (ratingId: string) => {
    setDeletingId(ratingId);
    setError('');
    try {
      await deleteRating(ratingId);
      if (myExistingRating?.id === ratingId) {
        setSelectedStars(5);
        setUlasan('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus ulasan.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-modal-title"
    >
      <div className="bg-white border border-[#EAE3DA] rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F1EBE3] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-9 rounded-lg overflow-hidden bg-[#F5EFE8] shrink-0 flex items-center justify-center">
              {ratingModalProduct.gambar_url ? (
                <img
                  src={ratingModalProduct.gambar_url}
                  alt={ratingModalProduct.nama_produk}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UtensilsCrossed className="w-4 h-4 text-[#8A796E]" />
              )}
            </div>
            <div className="min-w-0">
              <h2
                id="rating-modal-title"
                className="font-display text-lg font-bold text-[#1C1613] truncate"
              >
                {ratingModalProduct.nama_produk}
              </h2>
              <p className="text-xs text-[#6E5E55] tabular-nums">
                {formatRupiah(ratingModalProduct.harga)}
                <span className="mx-1.5" aria-hidden="true">·</span>
                {stats.count > 0
                  ? `${stats.average.toFixed(1)} dari 5 (${stats.count} ulasan)`
                  : 'Belum ada ulasan'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeRatingModal}
            aria-label="Tutup jendela rating"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#6E5E55] hover:bg-[#FCFAF7] cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Rating Submission Form */}
          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="p-4 sm:p-5 rounded-xl bg-[#FCFAF7] border border-[#EAE3DA] space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#1C1613]">
                {myExistingRating ? 'Ubah Rating Anda' : 'Beri Penilaian Menu'}
              </span>
              <div
                className="flex items-center gap-1"
                onMouseLeave={() => setHoverStars(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= activeStars;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverStars(star)}
                      onClick={() => setSelectedStars(star)}
                      aria-label={`Beri ${star} bintang`}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C82319] rounded"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          filled
                            ? 'fill-[#F59E0B] text-[#F59E0B]'
                            : 'text-[#D5C9BC]'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="tabular-nums text-xs font-bold text-[#1C1613] ml-1.5">
                  {selectedStars}/5
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="rating-comment"
                className="block text-xs font-semibold text-[#3E332D] mb-1.5"
              >
                Ulasan Singkat (Opsional)
              </label>
              <textarea
                id="rating-comment"
                rows={2}
                maxLength={300}
                value={ulasan}
                onChange={(e) => setUlasan(e.target.value)}
                placeholder="Bagaimana rasa sambal, porsi, atau kesegaran menunya?"
                className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#DDD2C5] text-sm text-[#1C1613] focus:outline-none focus:ring-2 focus:ring-[#C82319]"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              {user ? (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-lg bg-[#C82319] hover:bg-[#A61B13] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {myExistingRating ? 'Perbarui Rating' : 'Kirim Rating'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    closeRatingModal();
                    openAuthModal('login');
                  }}
                  className="px-4 py-2.5 min-h-[40px] rounded-lg bg-[#C82319] hover:bg-[#A61B13] text-white text-xs font-semibold cursor-pointer"
                >
                  Masuk untuk Beri Rating
                </button>
              )}
            </div>
          </form>

          {/* Reviews List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#1C1613]">
              Ulasan Pelanggan ({stats.count})
            </h3>

            {stats.items.length === 0 ? (
              <p className="text-sm text-[#6E5E55] py-4 text-center border border-dashed border-[#EAE3DA] rounded-xl">
                Jadilah pelanggan pertama yang memberi rating untuk menu ini.
              </p>
            ) : (
              <ul className="divide-y divide-[#F1EBE3]">
                {stats.items.map((item) => {
                  const canDelete = Boolean(
                    user && (user.uid === item.user_id || isAdmin),
                  );
                  const dateLabel = item.updated_at
                    ? item.updated_at.toDate().toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Baru saja';

                  return (
                    <li key={item.id} className="py-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-[#1C1613] truncate">
                            {item.nama_pengulas}
                          </span>
                          <span className="text-xs text-[#8A796E]">
                            · {dateLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div
                            className="inline-flex items-center gap-0.5"
                            aria-label={`Rating ${item.rating} dari 5`}
                          >
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= item.rating
                                    ? 'fill-[#F59E0B] text-[#F59E0B]'
                                    : 'text-[#E2D8CC]'
                                }`}
                              />
                            ))}
                          </div>

                          {canDelete && (
                            <button
                              type="button"
                              disabled={deletingId === item.id}
                              onClick={() => void handleDelete(item.id)}
                              aria-label="Hapus ulasan"
                              className="p-1 text-[#8A796E] hover:text-[#B91C1C] cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {item.ulasan && (
                        <p className="text-sm text-[#574941] leading-relaxed">
                          {item.ulasan}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
