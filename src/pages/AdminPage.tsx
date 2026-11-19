import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  Clock,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
  XCircle,
} from 'lucide-react';
import { useMenu } from '../context/MenuContext.tsx';
import {
  formatRupiah,
  IMAGE_PRESETS,
  resolveProductImage,
} from '../data/seedMenu.ts';
import { supabase } from '../lib/supabase.ts';
import type {
  MenuCategory,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  Profile,
} from '../types.ts';

type AdminTab = 'orders' | 'menu' | 'users';
type OrderFilter = 'Semua' | OrderStatus;

const ORDER_STATUSES: OrderStatus[] = [
  'Menunggu Konfirmasi',
  'Dimasak',
  'Selesai',
  'Dibatalkan',
];

function statusStyle(status: OrderStatus) {
  switch (status) {
    case 'Menunggu Konfirmasi':
      return {
        icon: Clock,
        className: 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]',
      };
    case 'Dimasak':
      return {
        icon: ChefHat,
        className: 'bg-[#FEF2F2] border-[#FECACA] text-[#C82319]',
      };
    case 'Selesai':
      return {
        icon: CheckCircle2,
        className: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#15803D]',
      };
    case 'Dibatalkan':
      return {
        icon: XCircle,
        className: 'bg-[#F5F1EC] border-[#E2D8CC] text-[#6E5E55]',
      };
  }
}

export function AdminPage() {
  const {
    products,
    isSeededInDb,
    seedInitialMenu,
    refreshMenu,
    getProductRatingStats,
    openRatingModal,
  } = useMenu();
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('Semua');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Users state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Menu CRUD Modal state
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [namaProduk, setNamaProduk] = useState('');
  const [kategori, setKategori] = useState<MenuCategory>('Makanan');
  const [harga, setHarga] = useState('15000');
  const [deskripsi, setDeskripsi] = useState('');
  const [gambarUrl, setGambarUrl] = useState(IMAGE_PRESETS[0].url);
  const [tersedia, setTersedia] = useState(true);
  const [savingMenu, setSavingMenu] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [adminError, setAdminError] = useState('');

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(
        'id, user_id, nama_penerima, alamat_pengiriman, no_hp, total_harga, status_pesanan, catatan, created_at, order_items(id, order_id, product_id, nama_produk, jumlah, harga_satuan)',
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal memuat daftar pesanan:', error.message);
      setOrdersLoading(false);
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
    setOrdersLoading(false);
  }, []);

  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nama_lengkap, email, no_hp, alamat, role')
      .order('nama_lengkap', { ascending: true });

    if (error) {
      console.error('Gagal memuat daftar pengguna:', error.message);
      setUsersLoading(false);
      return;
    }

    setProfiles((data ?? []) as Profile[]);
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    void fetchOrders();
    void fetchProfiles();

    const channel = supabase
      .channel('dapur-aziz-admin-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          void fetchOrders();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          void fetchProfiles();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchOrders, fetchProfiles]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === 'Semua') return orders;
    return orders.filter((o) => o.status_pesanan === orderFilter);
  }, [orders, orderFilter]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.nama_lengkap.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.no_hp || '').toLowerCase().includes(q),
    );
  }, [profiles, userSearch]);

  const activeOrderCount = orders.filter(
    (o) =>
      o.status_pesanan === 'Menunggu Konfirmasi' ||
      o.status_pesanan === 'Dimasak',
  ).length;

  const availableMenuCount = products.filter((p) => p.tersedia).length;

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    setUpdatingOrderId(orderId);
    setAdminError('');
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status_pesanan: newStatus,
        })
        .eq('id', orderId);

      if (error) throw new Error(error.message);
      await fetchOrders();
    } catch (err) {
      setAdminError(
        err instanceof Error ? err.message : 'Gagal memperbarui status pesanan.',
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const toggleOrderItems = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (!orderItemsMap[orderId]) {
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

  const openAddMenuModal = () => {
    setEditingProduct(null);
    setNamaProduk('');
    setKategori('Makanan');
    setHarga('15000');
    setDeskripsi('');
    setGambarUrl(IMAGE_PRESETS[0].url);
    setTersedia(true);
    setMenuModalOpen(true);
  };

  const openEditMenuModal = (product: Product) => {
    setEditingProduct(product);
    setNamaProduk(product.nama_produk);
    setKategori(product.kategori);
    setHarga(String(product.harga));
    setDeskripsi(product.deskripsi || '');
    setGambarUrl(resolveProductImage(product) || '');
    setTersedia(product.tersedia);
    setMenuModalOpen(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericPrice = Number(harga);
    if (!namaProduk.trim() || Number.isNaN(numericPrice) || numericPrice < 0) {
      return;
    }

    setSavingMenu(true);
    setAdminError('');
    try {
      const cleanedImage = gambarUrl.trim().slice(0, 500) || null;
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            nama_produk: namaProduk.trim().slice(0, 120),
            kategori,
            harga: numericPrice,
            deskripsi: deskripsi.trim().slice(0, 400),
            gambar_url: cleanedImage,
            tersedia,
          })
          .eq('id', editingProduct.id);

        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('products').insert({
          nama_produk: namaProduk.trim().slice(0, 120),
          kategori,
          harga: numericPrice,
          deskripsi: deskripsi.trim().slice(0, 400),
          gambar_url: cleanedImage,
          tersedia,
        });

        if (error) throw new Error(error.message);
      }
      await refreshMenu();
      setMenuModalOpen(false);
    } catch (err) {
      setAdminError(
        err instanceof Error ? err.message : 'Gagal menyimpan menu.',
      );
    } finally {
      setSavingMenu(false);
    }
  };

  const handleToggleStock = async (product: Product) => {
    setAdminError('');
    const { error } = await supabase
      .from('products')
      .update({
        tersedia: !product.tersedia,
      })
      .eq('id', product.id);

    if (error) {
      setAdminError(error.message);
    } else {
      await refreshMenu();
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    setAdminError('');
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      setAdminError(error.message);
    } else {
      await refreshMenu();
    }
  };

  const handleSeedMenu = async () => {
    setSeeding(true);
    setAdminError('');
    try {
      await seedInitialMenu();
    } catch (err) {
      setAdminError(
        err instanceof Error ? err.message : 'Gagal menyinkronkan menu awal.',
      );
    } finally {
      setSeeding(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#1C1613]">
            Dashboard Admin Dapur Aziz
          </h1>
          <p className="text-sm text-[#6E5E55] mt-1">
            Kelola pesanan masuk, katalog menu makanan &amp; minuman, serta daftar pelanggan.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddMenuModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[42px] rounded-xl bg-[#C82319] hover:bg-[#A61B13] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {adminError && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{adminError}</span>
        </div>
      )}

      {/* 4-column KPI Strip */}
      <section aria-label="Ringkasan Operasional" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#EAE3DA] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#6E5E55]">Pesanan Perlu Diproses</p>
          <p className="tabular-nums text-3xl font-bold text-[#C82319] mt-1.5">
            {activeOrderCount}
          </p>
        </div>
        <div className="bg-white border border-[#EAE3DA] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#6E5E55]">Total Semua Pesanan</p>
          <p className="tabular-nums text-3xl font-bold text-[#1C1613] mt-1.5">
            {orders.length}
          </p>
        </div>
        <div className="bg-white border border-[#EAE3DA] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#6E5E55]">Menu Tersedia</p>
          <p className="tabular-nums text-3xl font-bold text-[#1C1613] mt-1.5">
            {availableMenuCount}
            <span className="text-base font-normal text-[#8A796E]">
              /{products.length}
            </span>
          </p>
        </div>
        <div className="bg-white border border-[#EAE3DA] rounded-2xl p-5">
          <p className="text-xs font-medium text-[#6E5E55]">Pengguna Terdaftar</p>
          <p className="tabular-nums text-3xl font-bold text-[#1C1613] mt-1.5">
            {profiles.length}
          </p>
        </div>
      </section>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE3DA] pb-3">
        <div
          role="tablist"
          aria-label="Bagian Dashboard Admin"
          className="inline-flex items-center p-1 bg-[#EFE8DF] rounded-xl"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-white text-[#1C1613] shadow-xs'
                : 'text-[#6E5E55] hover:text-[#1C1613]'
            }`}
          >
            Pesanan Masuk ({orders.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'menu'}
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-white text-[#1C1613] shadow-xs'
                : 'text-[#6E5E55] hover:text-[#1C1613]'
            }`}
          >
            Kelola Menu ({products.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-[#1C1613] shadow-xs'
                : 'text-[#6E5E55] hover:text-[#1C1613]'
            }`}
          >
            Pelanggan ({profiles.length})
          </button>
        </div>

        {activeTab === 'menu' && (
          <button
            type="button"
            disabled={seeding}
            onClick={() => void handleSeedMenu()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#DDD2C5] bg-white hover:border-[#C82319] text-xs font-semibold text-[#1C1613] cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>
              {isSeededInDb ? 'Lengkapi Menu Bawaan' : 'Sinkronkan Menu Bawaan'}
            </span>
          </button>
        )}
      </div>

      {/* TAB 1: PESANAN MASUK */}
      {activeTab === 'orders' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['Semua', ...ORDER_STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setOrderFilter(status)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  orderFilter === status
                    ? 'bg-[#1C1613] border-[#1C1613] text-white'
                    : 'bg-white border-[#DDD2C5] text-[#574941] hover:border-[#1C1613]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {ordersLoading ? (
            <div className="p-10 text-center text-sm text-[#6E5E55]">
              Memuat pesanan masuk...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white border border-[#EAE3DA] rounded-2xl p-10 text-center space-y-2">
              <p className="text-base font-semibold text-[#1C1613]">
                Belum ada pesanan pada kategori ini
              </p>
              <p className="text-sm text-[#6E5E55]">
                Pesanan pelanggan yang baru masuk akan tampil otomatis di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const st = statusStyle(order.status_pesanan);
                const StatusIcon = st.icon;
                const dateStr = order.created_at
                  ? new Date(order.created_at).toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : 'Baru saja';
                const isExpanded = expandedOrderId === order.id;
                const itemsForSummary =
                  orderItemsMap[order.id] ?? order.order_items;
                const summaryText =
                  itemsForSummary && itemsForSummary.length > 0
                    ? itemsForSummary
                        .map((item) => `${item.jumlah}x ${item.nama_produk}`)
                        .join(', ')
                    : `Pesanan atas nama ${order.nama_penerima}`;

                return (
                  <article
                    key={order.id}
                    className="bg-white border border-[#EAE3DA] rounded-2xl p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E5E55]">
                          <span className="font-mono">{order.id}</span>
                          <span aria-hidden="true">·</span>
                          <span>{dateStr}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#1C1613]">
                            {order.nama_penerima} ({order.no_hp})
                          </span>
                        </div>
                        <p className="text-base font-bold text-[#1C1613]">
                          {summaryText}
                        </p>
                        <p className="text-xs text-[#574941]">
                          Alamat: {order.alamat_pengiriman}
                        </p>
                        {order.catatan && (
                          <p className="text-xs text-[#B91C1C] font-medium">
                            Catatan: {order.catatan}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${st.className}`}
                        >
                          <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{order.status_pesanan}</span>
                        </div>

                        <p className="tabular-nums text-lg font-bold text-[#1C1613]">
                          {formatRupiah(order.total_harga)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#F1EBE3] flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => void toggleOrderItems(order.id)}
                        className="text-xs font-semibold text-[#C82319] hover:underline cursor-pointer"
                      >
                        {isExpanded ? 'Sembunyikan Rincian Item' : 'Lihat Rincian Item'}
                      </button>

                      <div className="flex flex-wrap items-center gap-2">
                        {order.status_pesanan === 'Menunggu Konfirmasi' && (
                          <button
                            type="button"
                            disabled={updatingOrderId === order.id}
                            onClick={() =>
                              void handleUpdateOrderStatus(order.id, 'Dimasak')
                            }
                            className="px-3.5 py-2 rounded-lg bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                          >
                            Terima &amp; Masak
                          </button>
                        )}
                        {order.status_pesanan === 'Dimasak' && (
                          <button
                            type="button"
                            disabled={updatingOrderId === order.id}
                            onClick={() =>
                              void handleUpdateOrderStatus(order.id, 'Selesai')
                            }
                            className="px-3.5 py-2 rounded-lg bg-[#15803D] hover:bg-[#166534] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                          >
                            Tandai Selesai
                          </button>
                        )}

                        <select
                          aria-label={`Ubah status pesanan ${order.id}`}
                          value={order.status_pesanan}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) =>
                            void handleUpdateOrderStatus(
                              order.id,
                              e.target.value as OrderStatus,
                            )
                          }
                          className="px-3 py-2 rounded-lg border border-[#DDD2C5] bg-white text-xs font-semibold text-[#1C1613] focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                        >
                          {ORDER_STATUSES.map((stOpt) => (
                            <option key={stOpt} value={stOpt}>
                              {stOpt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-[#FCFAF7] border border-[#EAE3DA] rounded-xl p-4">
                        {!orderItemsMap[order.id] ? (
                          <p className="text-xs text-[#6E5E55]">Memuat item...</p>
                        ) : (
                          <ul className="divide-y divide-[#EAE3DA] text-xs">
                            {orderItemsMap[order.id].map((item) => (
                              <li
                                key={item.id}
                                className="py-2 flex items-center justify-between"
                              >
                                <span>
                                  <strong>{item.jumlah}x</strong> {item.nama_produk} (
                                  {formatRupiah(item.harga_satuan)})
                                </span>
                                <span className="tabular-nums font-bold">
                                  {formatRupiah(item.harga_satuan * item.jumlah)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: KELOLA MENU */}
      {activeTab === 'menu' && (
        <section className="bg-white border border-[#EAE3DA] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE3DA] bg-[#FCFAF7] text-xs font-semibold text-[#6E5E55]">
                  <th className="py-3.5 px-5">Menu</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Harga</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Stok</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EBE3] text-sm">
                {products.map((product) => {
                  const ratingStats = getProductRatingStats(product.id);
                  const thumbSrc = resolveProductImage(product);
                  return (
                    <tr key={product.id} className="hover:bg-[#FCFAF7]/70">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-9 rounded-lg overflow-hidden bg-[#F5EFE8] shrink-0 flex items-center justify-center">
                            {thumbSrc ? (
                              <img
                                src={thumbSrc}
                                alt={product.nama_produk}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UtensilsCrossed className="w-4 h-4 text-[#8A796E]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1C1613] truncate">
                              {product.nama_produk}
                            </p>
                            <p className="text-xs text-[#6E5E55] truncate max-w-xs">
                              {product.deskripsi}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#574941]">
                        {product.kategori}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums font-semibold text-[#1C1613]">
                        {formatRupiah(product.harga)}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => openRatingModal(product)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#574941] hover:text-[#C82319] cursor-pointer whitespace-nowrap"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              ratingStats.count > 0
                                ? 'fill-[#F59E0B] text-[#F59E0B]'
                                : 'text-[#D5C9BC]'
                            }`}
                          />
                          <span className="tabular-nums">
                            {ratingStats.count > 0
                              ? `${ratingStats.average.toFixed(1)} (${ratingStats.count})`
                              : '0 (0)'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => void handleToggleStock(product)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors whitespace-nowrap ${
                            product.tersedia
                              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#15803D] hover:bg-[#D1FAE5]'
                              : 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C] hover:bg-[#FEE2E2]'
                          }`}
                        >
                          {product.tersedia ? 'Tersedia' : 'Habis'}
                        </button>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditMenuModal(product)}
                            aria-label={`Edit ${product.nama_produk}`}
                            className="p-2 rounded-lg text-[#574941] hover:text-[#1C1613] hover:bg-[#F5EFE8] cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteProduct(product)}
                            aria-label={`Hapus ${product.nama_produk}`}
                            className="p-2 rounded-lg text-[#8A796E] hover:text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: PELANGGAN TERDAFTAR */}
      {activeTab === 'users' && (
        <section className="space-y-4">
          <div className="relative max-w-sm">
            <Search
              className="w-4 h-4 text-[#8A796E] absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Cari nama, email, atau no. HP..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#DDD2C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C82319]"
            />
          </div>

          <div className="bg-white border border-[#EAE3DA] rounded-2xl overflow-hidden">
            {usersLoading ? (
              <div className="p-10 text-center text-sm text-[#6E5E55]">
                Memuat daftar pengguna...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Users className="w-8 h-8 mx-auto text-[#8A796E]" />
                <p className="text-sm text-[#6E5E55]">
                  Belum ada data pengguna yang cocok.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#EAE3DA] bg-[#FCFAF7] text-xs font-semibold text-[#6E5E55]">
                      <th className="py-3.5 px-5">Nama Lengkap</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">No. HP</th>
                      <th className="py-3.5 px-4">Alamat</th>
                      <th className="py-3.5 px-5">Peran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1EBE3] text-sm">
                    {filteredUsers.map((prof) => (
                      <tr key={prof.id} className="hover:bg-[#FCFAF7]/70">
                        <td className="py-3.5 px-5 font-semibold text-[#1C1613]">
                          {prof.nama_lengkap}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#574941]">
                          {prof.email}
                        </td>
                        <td className="py-3.5 px-4 tabular-nums text-xs text-[#574941]">
                          {prof.no_hp || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#6E5E55] max-w-xs truncate">
                          {prof.alamat || '-'}
                        </td>
                        <td className="py-3.5 px-5 text-xs font-semibold">
                          <span
                            className={
                              prof.role === 'admin'
                                ? 'text-[#B91C1C]'
                                : 'text-[#574941]'
                            }
                          >
                            {prof.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ADD / EDIT MENU MODAL */}
      {menuModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-modal-title"
        >
          <div className="bg-white border border-[#EAE3DA] rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1EBE3]">
              <h2
                id="menu-modal-title"
                className="font-display text-xl font-bold text-[#1C1613]"
              >
                {editingProduct ? 'Edit Menu' : 'Tambah Menu Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setMenuModalOpen(false)}
                aria-label="Tutup modal menu"
                className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#6E5E55] hover:bg-[#FCFAF7] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveMenu(e)} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="menu-name"
                  className="block text-xs font-semibold text-[#3E332D] mb-1"
                >
                  Nama Menu
                </label>
                <input
                  id="menu-name"
                  type="text"
                  value={namaProduk}
                  onChange={(e) => setNamaProduk(e.target.value)}
                  placeholder="Contoh: Lalapan Nila Bakar"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="menu-category"
                    className="block text-xs font-semibold text-[#3E332D] mb-1"
                  >
                    Kategori
                  </label>
                  <select
                    id="menu-category"
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as MenuCategory)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="menu-price"
                    className="block text-xs font-semibold text-[#3E332D] mb-1"
                  >
                    Harga (Rp)
                  </label>
                  <input
                    id="menu-price"
                    type="number"
                    min={0}
                    step={500}
                    value={harga}
                    onChange={(e) => setHarga(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="menu-desc"
                  className="block text-xs font-semibold text-[#3E332D] mb-1"
                >
                  Deskripsi Singkat
                </label>
                <textarea
                  id="menu-desc"
                  rows={2}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan bahan, rasa, dan pelengkapnya"
                  className="w-full px-3.5 py-2 rounded-lg border border-[#DDD2C5] text-sm focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                />
              </div>

              <div>
                <label
                  htmlFor="menu-image-preset"
                  className="block text-xs font-semibold text-[#3E332D] mb-1"
                >
                  Pilih Foto Studio atau Masukkan URL Gambar
                </label>
                <select
                  id="menu-image-preset"
                  value={
                    IMAGE_PRESETS.some((p) => p.url === gambarUrl)
                      ? gambarUrl
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) setGambarUrl(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#DDD2C5] text-sm bg-white mb-2 focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                >
                  <option value="">-- Pilih Foto Studio Dapur Aziz --</option>
                  {IMAGE_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.url}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={gambarUrl}
                  onChange={(e) => setGambarUrl(e.target.value)}
                  placeholder="/src/assets/images/..."
                  className="w-full px-3.5 py-2 rounded-lg border border-[#DDD2C5] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#C82319]"
                />
              </div>

              <label className="flex items-center gap-2.5 text-sm font-medium text-[#1C1613] cursor-pointer">
                <input
                  type="checkbox"
                  checked={tersedia}
                  onChange={(e) => setTersedia(e.target.checked)}
                  className="w-4 h-4 accent-[#C82319]"
                />
                <span>Menu tersedia untuk dipesan</span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMenuModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#DDD2C5] text-sm font-semibold text-[#574941] hover:bg-[#FCFAF7] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingMenu}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C82319] hover:bg-[#A61B13] text-white text-sm font-semibold cursor-pointer disabled:opacity-60"
                >
                  {savingMenu && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingProduct ? 'Simpan Perubahan' : 'Simpan Menu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
