import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChefHat,
  Clock,
  ClipboardList,
  Star,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useMenu } from '../context/MenuContext.tsx';
import { formatRupiah } from '../data/seedMenu.ts';
import { supabase } from '../lib/supabase.ts';
import type { Order, OrderItem, OrderStatus } from '../types.ts';

function getStatusMeta(status: OrderStatus) {
  switch (status) {
    case 'Menunggu Konfirmasi':
      return {
        icon: Clock,
        textClass: 'text-[#B45309]',
        bgClass: 'bg-[#FFFBEB] border-[#FDE68A]',
        step: 1,
      };
    case 'Dimasak':
      return {
        icon: ChefHat,
        textClass: 'text-[#C82319]',
        bgClass: 'bg-[#FEF2F2] border-[#FECACA]',
        step: 2,
      };
    case 'Selesai':
      return {
        icon: CheckCircle2,
        textClass: 'text-[#15803D]',
        bgClass: 'bg-[#ECFDF5] border-[#A7F3D0]',
        step: 3,
      };
    case 'Dibatalkan':
      return {
        icon: XCircle,
        textClass: 'text-[#6E5E55]',
        bgClass: 'bg-[#F5F1EC] border-[#E2D8CC]',
        step: 0,
      };
  }
}

export function OrdersPage() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const { products, openRatingModal } = useMenu();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchMyOrders = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, user_id, nama_penerima, alamat_pengiriman, no_hp, total_harga, status_pesanan, catatan, created_at, order_items(id, order_id, product_id, nama_produk, jumlah, harga_satuan)',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal memuat pesanan:', error.message);
      setLoading(false);
      return;
    }

    const loadedOrders = (data ?? []) as Order[];
    setOrders(loadedOrders);

    const itemsByOrder: Record<string, OrderItem[]> = {};
    for (const ord of loadedOrders) {
      if (ord.order_items) {
        itemsByOrder[ord.id] = ord.order_items;
      }
    }
    setOrderItemsMap((prev) => ({ ...prev, ...itemsByOrder }));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    void fetchMyOrders();

    const channel = supabase
      .channel(`my-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void fetchMyOrders();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, authLoading, fetchMyOrders]);

  const toggleExpandOrder = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!orderItemsMap[orderId] && user) {
      const { data, error } = await supabase
        .from('order_items')
        .select('id, order_id, product_id, nama_produk, jumlah, harga_satuan')
        .eq('order_id', orderId);
      if (!error && data) {
        setOrderItemsMap((prev) => ({
          ...prev,
          [orderId]: data as OrderItem[],
        }));
      }
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status_pesanan: 'Dibatalkan',
        })
        .eq('id', orderId);
      if (!error) {
        await fetchMyOrders();
      }
    } finally {
      setCancellingId(null);
    }
  };

  if (!authLoading && !user) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <ClipboardList className="w-12 h-12 mx-auto text-[#C82319]" aria-hidden="true" />
        <h1 className="font-display text-3xl font-bold text-[#1C1613]">
          Pesanan Saya
        </h1>
        <p className="text-sm text-[#6E5E55]">
          Silakan masuk ke akun Anda untuk melihat riwayat dan status pesanan secara langsung.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-xl bg-[#C82319] hover:bg-[#A61B13] text-white text-sm font-semibold cursor-pointer"
        >
          Masuk Sekarang
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#1C1613]">
            Pesanan Saya
          </h1>
          <p className="text-sm text-[#6E5E55] mt-1">
            Status pesanan diperbarui secara otomatis langsung dari dapur kami.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-[#DDD2C5] bg-white hover:border-[#C82319] text-sm font-semibold text-[#1C1613] transition-colors whitespace-nowrap shrink-0"
        >
          Pesan Menu Lagi
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="bg-white border border-[#EAE3DA] rounded-2xl p-6 animate-pulse space-y-3"
            >
              <div className="h-4 w-44 bg-[#EFE8DF] rounded" />
              <div className="h-5 w-72 bg-[#F5EFE8] rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-[#EAE3DA] rounded-2xl p-12 text-center space-y-3">
          <ClipboardList className="w-10 h-10 mx-auto text-[#C82319]/60" />
          <h2 className="font-display text-xl font-bold text-[#1C1613]">
            Belum ada pesanan
          </h2>
          <p className="text-sm text-[#6E5E55]">
            Anda belum melakukan pemesanan di Dapur Aziz. Yuk pilih menu favorit Anda!
          </p>
          <Link
            to="/"
            className="inline-flex px-5 py-2.5 rounded-xl bg-[#C82319] text-white text-sm font-semibold hover:bg-[#A61B13]"
          >
            Lihat Katalog Menu
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const meta = getStatusMeta(order.status_pesanan);
            const StatusIcon = meta.icon;
            const isExpanded = expandedOrderId === order.id;
            const detailItems = orderItemsMap[order.id] ?? order.order_items;
            const summaryText =
              detailItems && detailItems.length > 0
                ? detailItems
                    .map((item) => `${item.jumlah}x ${item.nama_produk}`)
                    .join(', ')
                : `Pesanan atas nama ${order.nama_penerima}`;
            const dateStr = order.created_at
              ? new Date(order.created_at).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : 'Baru saja';

            return (
              <article
                key={order.id}
                className="bg-white border border-[#EAE3DA] rounded-2xl overflow-hidden"
              >
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#6E5E55]">
                        <span className="font-mono">{order.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{dateStr}</span>
                      </div>
                      <p className="text-base font-bold text-[#1C1613]">
                        {summaryText}
                      </p>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${meta.bgClass} ${meta.textClass}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{order.status_pesanan}</span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {order.status_pesanan !== 'Dibatalkan' && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {['Menunggu Konfirmasi', 'Dimasak', 'Selesai'].map(
                        (label, idx) => {
                          const active = meta.step >= idx + 1;
                          return (
                            <div key={label} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full ${
                                  active ? 'bg-[#C82319]' : 'bg-[#EFE8DF]'
                                }`}
                              />
                              <p
                                className={`text-[11px] font-medium ${
                                  active ? 'text-[#1C1613]' : 'text-[#9C8D82]'
                                }`}
                              >
                                {label}
                              </p>
                            </div>
                          );
                        },
                      )}
                    </div>
                  )}

                  {order.catatan && (
                    <p className="text-xs text-[#574941] bg-[#FCFAF7] border border-[#F1EBE3] rounded-lg px-3 py-2">
                      <strong>Catatan:</strong> {order.catatan}
                    </p>
                  )}

                  <div className="pt-3 border-t border-[#F1EBE3] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-[#6E5E55]">Total Bayar</span>
                      <p className="tabular-nums text-lg font-bold text-[#B91C1C]">
                        {formatRupiah(order.total_harga)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status_pesanan === 'Menunggu Konfirmasi' && (
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => void handleCancelOrder(order.id)}
                          className="px-3.5 py-2 rounded-lg border border-[#FECACA] text-xs font-semibold text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer disabled:opacity-60"
                        >
                          {cancellingId === order.id
                            ? 'Membatalkan...'
                            : 'Batalkan Pesanan'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void toggleExpandOrder(order.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#DDD2C5] text-xs font-semibold text-[#1C1613] hover:bg-[#FCFAF7] cursor-pointer"
                      >
                        <span>Detail Item</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-[#FCFAF7] border-t border-[#EAE3DA] px-5 sm:px-6 py-4 space-y-3">
                    <div className="text-xs text-[#574941] space-y-0.5">
                      <p>
                        <strong>Penerima:</strong> {order.nama_penerima} ({order.no_hp})
                      </p>
                      <p>
                        <strong>Alamat:</strong> {order.alamat_pengiriman}
                      </p>
                    </div>

                    {!detailItems ? (
                      <p className="text-xs text-[#8A796E]">Memuat rincian item...</p>
                    ) : (
                      <ul className="divide-y divide-[#EAE3DA] bg-white border border-[#EAE3DA] rounded-xl px-4">
                        {detailItems.map((item) => {
                          const matchedProduct = products.find(
                            (p) => p.id === item.product_id,
                          );
                          return (
                            <li
                              key={item.id}
                              className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                            >
                              <span className="font-medium text-[#1C1613]">
                                {item.jumlah}x {item.nama_produk}
                              </span>
                              <div className="flex items-center gap-3">
                                {order.status_pesanan === 'Selesai' &&
                                  matchedProduct && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openRatingModal(matchedProduct)
                                      }
                                      className="inline-flex items-center gap-1 font-semibold text-[#C82319] hover:underline cursor-pointer"
                                    >
                                      <Star className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                                      <span>Beri Rating</span>
                                    </button>
                                  )}
                                <span className="tabular-nums font-semibold text-[#1C1613]">
                                  {formatRupiah(item.harga_satuan * item.jumlah)}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
