import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { formatRupiah } from '../data/seedMenu.ts';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';

export function CartDrawer() {
  const { user, profile, openAuthModal, resendVerification } = useAuth();
  const {
    items,
    isOpen,
    totalItems,
    totalPrice,
    closeCart,
    updateQty,
    removeItem,
    clearCart,
  } = useCart();
  const navigate = useNavigate();

  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [noHp, setNoHp] = useState('');
  const [alamat, setAlamat] = useState('');
  const [catatan, setCatatan] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    if (profile) {
      setNamaPelanggan((prev) => prev || profile.nama_lengkap || '');
      setNoHp((prev) => prev || profile.no_hp || '');
      setAlamat((prev) => prev || profile.alamat || '');
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      closeCart();
      openAuthModal('login');
      return;
    }

    if (!user.emailVerified) {
      setError(
        'Email Anda belum terverifikasi. Silakan klik tautan verifikasi di email Anda atau gunakan Google Sign-In.',
      );
      return;
    }

    if (items.length === 0) {
      setError('Keranjang belanja masih kosong.');
      return;
    }

    if (!namaPelanggan.trim() || !noHp.trim() || !alamat.trim()) {
      setError('Mohon lengkapi nama penerima, nomor HP, dan alamat pengiriman.');
      return;
    }

    setSubmitting(true);
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const ringkasan = items
      .map((item) => `${item.qty}x ${item.product.nama_produk}`)
      .join(', ')
      .slice(0, 500);

    try {
      const batch = writeBatch(db);
      const orderRef = doc(db, 'orders', orderId);

      batch.set(orderRef, {
        id: orderId,
        user_id: user.uid,
        nama_pelanggan: namaPelanggan.trim().slice(0, 120),
        no_hp: noHp.trim().slice(0, 30),
        alamat_pengiriman: alamat.trim().slice(0, 300),
        total_harga: totalPrice,
        jumlah_item: totalItems,
        ringkasan_menu: ringkasan,
        status_pesanan: 'Menunggu Konfirmasi',
        catatan: catatan.trim().slice(0, 400),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      items.forEach((item, index) => {
        const itemId = `item_${index + 1}_${item.product.id.slice(0, 40)}`;
        const itemRef = doc(db, 'orders', orderId, 'order_items', itemId);
        batch.set(itemRef, {
          id: itemId,
          order_id: orderId,
          user_id: user.uid,
          product_id: item.product.id,
          nama_produk: item.product.nama_produk.slice(0, 120),
          harga_satuan: item.product.harga,
          qty: item.qty,
          subtotal: item.product.harga * item.qty,
        });
      });

      await batch.commit();
      clearCart();
      setCatatan('');
      setSuccessOrderId(orderId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-[#EAE3DA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#C82319]" aria-hidden="true" />
            <h2
              id="cart-drawer-title"
              className="font-display text-lg font-bold text-[#1C1613]"
            >
              Keranjang Belanja
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setSuccessOrderId(null);
              closeCart();
            }}
            aria-label="Tutup keranjang belanja"
            className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#6E5E55] hover:bg-[#FCFAF7] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {successOrderId ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#15803D]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-[#1C1613]">
                  Pesanan Diterima!
                </h3>
                <p className="text-sm text-[#6E5E55] mt-1 leading-relaxed">
                  Pesanan Anda telah masuk ke dapur kami dengan status{' '}
                  <strong className="text-[#1C1613]">Menunggu Konfirmasi</strong>.
                </p>
                <p className="font-mono text-xs text-[#8A796E] mt-2">
                  Kode Pesanan: {successOrderId}
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessOrderId(null);
                    closeCart();
                    navigate('/pesanan');
                  }}
                  className="w-full py-3 rounded-xl bg-[#C82319] hover:bg-[#A61B13] text-white text-sm font-semibold cursor-pointer"
                >
                  Pantau Status Pesanan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessOrderId(null);
                    closeCart();
                  }}
                  className="w-full py-2.5 rounded-xl border border-[#DDD2C5] text-sm font-semibold text-[#1C1613] hover:bg-[#FCFAF7] cursor-pointer"
                >
                  Kembali ke Menu
                </button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ShoppingBag
                className="w-12 h-12 mx-auto text-[#D5C9BC]"
                aria-hidden="true"
              />
              <p className="text-base font-semibold text-[#1C1613]">
                Keranjang masih kosong
              </p>
              <p className="text-sm text-[#6E5E55]">
                Pilih lalapan hangat atau minuman segar dari katalog Dapur Aziz.
              </p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <ul className="divide-y divide-[#F1EBE3]">
                {items.map((item) => (
                  <li key={item.product.id} className="py-3.5 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1C1613] truncate">
                        {item.product.nama_produk}
                      </p>
                      <p className="tabular-nums text-xs text-[#6E5E55] mt-0.5">
                        {formatRupiah(item.product.harga)} × {item.qty} ={' '}
                        <strong className="text-[#1C1613]">
                          {formatRupiah(item.product.harga * item.qty)}
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="inline-flex items-center rounded-lg border border-[#E2D8CC] bg-[#FCFAF7]">
                        <button
                          type="button"
                          onClick={() => updateQty(item.product.id, -1)}
                          aria-label={`Kurangi ${item.product.nama_produk}`}
                          className="w-8 h-8 inline-flex items-center justify-center text-[#3E332D] hover:text-[#C82319] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="tabular-nums px-2 text-xs font-bold text-[#1C1613]">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.product.id, 1)}
                          aria-label={`Tambah ${item.product.nama_produk}`}
                          className="w-8 h-8 inline-flex items-center justify-center text-[#3E332D] hover:text-[#C82319] cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        aria-label={`Hapus ${item.product.nama_produk}`}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#8A796E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Checkout Form */}
              <form
                id="checkout-form"
                onSubmit={(e) => void handleCheckout(e)}
                className="pt-4 border-t border-[#EAE3DA] space-y-3.5"
              >
                <h3 className="text-sm font-bold text-[#1C1613]">
                  Informasi Pengiriman & Catatan
                </h3>

                {!user && (
                  <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-2">
                    <p>
                      Silakan masuk terlebih dahulu agar pesanan tercatat di riwayat
                      akun Anda.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        closeCart();
                        openAuthModal('login');
                      }}
                      className="font-semibold text-[#C82319] underline cursor-pointer"
                    >
                      Masuk atau Daftar Sekarang
                    </button>
                  </div>
                )}

                {user && !user.emailVerified && (
                  <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] space-y-1.5">
                    <p>
                      Email Anda belum terverifikasi. Cek email Anda atau kirim
                      ulang tautan verifikasi.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void resendVerification().then(() =>
                          setVerificationSent(true),
                        );
                      }}
                      className="font-semibold text-[#C82319] underline cursor-pointer"
                    >
                      {verificationSent
                        ? 'Tautan verifikasi terkirim'
                        : 'Kirim Ulang Email Verifikasi'}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="checkout-name"
                    className="block text-xs font-semibold text-[#3E332D] mb-1"
                  >
                    Nama Penerima
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    value={namaPelanggan}
                    onChange={(e) => setNamaPelanggan(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="block text-xs font-semibold text-[#3E332D] mb-1"
                  >
                    No. HP / WhatsApp
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-address"
                    className="block text-xs font-semibold text-[#3E332D] mb-1"
                  >
                    Alamat Pengiriman
                  </label>
                  <textarea
                    id="checkout-address"
                    rows={2}
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    placeholder="Alamat lengkap atau nomor meja jika makan di tempat"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#DDD2C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="checkout-notes"
                    className="block text-xs font-semibold text-[#3E332D] mb-1"
                  >
                    Catatan Pesanan (Opsional)
                  </label>
                  <textarea
                    id="checkout-notes"
                    rows={2}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: Sambal dipisah / pedas sedang / tanpa timun"
                    className="w-full px-3.5 py-2 rounded-lg border border-[#DDD2C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                  />
                </div>
              </form>
            </>
          )}
        </div>

        {/* Sticky Footer Summary */}
        {items.length > 0 && !successOrderId && (
          <div className="px-6 py-4 border-t border-[#EAE3DA] bg-[#FCFAF7] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6E5E55]">
                Total ({totalItems} item)
              </span>
              <span className="tabular-nums text-lg font-bold text-[#1C1613]">
                {formatRupiah(totalPrice)}
              </span>
            </div>
            <button
              type="submit"
              form="checkout-form"
              disabled={submitting}
              className="w-full py-3 min-h-[44px] rounded-xl bg-[#C82319] hover:bg-[#A61B13] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{user ? 'Buat Pesanan Sekarang' : 'Masuk & Pesan'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
