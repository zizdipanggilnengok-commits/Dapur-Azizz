import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { SEED_MENU_ITEMS } from '../data/seedMenu.ts';
import { supabase } from '../lib/supabase.ts';
import type { Product, Rating } from '../types.ts';
import { useAuth } from './AuthContext.tsx';

export interface ProductRatingStats {
  average: number;
  count: number;
  items: Rating[];
}

interface MenuContextValue {
  products: Product[];
  ratings: Rating[];
  loading: boolean;
  isSeededInDb: boolean;
  ratingModalProduct: Product | null;
  openRatingModal: (product: Product) => void;
  closeRatingModal: () => void;
  getProductRatingStats: (productId: string) => ProductRatingStats;
  submitRating: (
    productId: string,
    stars: number,
    ulasan: string,
  ) => Promise<void>;
  deleteRating: (ratingId: string) => Promise<void>;
  seedInitialMenu: () => Promise<void>;
  refreshMenu: () => Promise<void>;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin } = useAuth();
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalProduct, setRatingModalProduct] = useState<Product | null>(
    null,
  );
  const autoSeededRef = useRef(false);

  const fetchProducts = useCallback(async () => {
    const query = () =>
      supabase
        .from('products')
        .select('id, nama_produk, kategori, harga, deskripsi, gambar_url, tersedia, created_at')
        .order('kategori', { ascending: true })
        .order('nama_produk', { ascending: true });

    let { data, error } = await query();
    if (error && /failed to fetch|networkerror|load failed/i.test(error.message)) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const retry = await query();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('Gagal memuat menu Supabase:', error.message);
      setLoading(false);
      return;
    }

    setDbProducts((data ?? []) as Product[]);
    setLoading(false);
  }, []);

  const fetchRatings = useCallback(async () => {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Gagal memuat rating Supabase:', error.message);
      return;
    }

    setRatings((data ?? []) as Rating[]);
  }, []);

  useEffect(() => {
    void fetchProducts();
    void fetchRatings();

    const channel = supabase
      .channel('dapur-aziz-public-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          void fetchProducts();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ratings' },
        () => {
          void fetchRatings();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchProducts, fetchRatings]);

  const seedInitialMenu = async () => {
    const { data: existingRows, error: fetchError } = await supabase
      .from('products')
      .select('nama_produk');

    if (fetchError) {
      throw new Error(`Gagal membaca katalog menu: ${fetchError.message}`);
    }

    const existingNames = new Set(
      (existingRows ?? []).map((row: { nama_produk: string }) =>
        row.nama_produk.trim().toLowerCase(),
      ),
    );

    const missingItems = SEED_MENU_ITEMS.filter(
      (item) => !existingNames.has(item.nama_produk.trim().toLowerCase()),
    ).map((item) => ({
      nama_produk: item.nama_produk,
      kategori: item.kategori,
      harga: item.harga,
      deskripsi: item.deskripsi,
      gambar_url: item.gambar_url,
      tersedia: item.tersedia,
    }));

    if (missingItems.length > 0) {
      const { error } = await supabase.from('products').insert(missingItems);
      if (error) {
        throw new Error(`Gagal menambahkan menu awal: ${error.message}`);
      }
    }

    await fetchProducts();
  };

  useEffect(() => {
    if (
      !loading &&
      isAdmin &&
      dbProducts.length === 0 &&
      !autoSeededRef.current
    ) {
      autoSeededRef.current = true;
      void seedInitialMenu().catch((err) => console.error(err));
    }
  }, [loading, isAdmin, dbProducts.length]);

  const getProductRatingStats = (productId: string): ProductRatingStats => {
    const items = ratings.filter((r) => r.product_id === productId);
    if (items.length === 0) {
      return { average: 0, count: 0, items: [] };
    }
    const sum = items.reduce((acc, r) => acc + r.rating, 0);
    return {
      average: Math.round((sum / items.length) * 10) / 10,
      count: items.length,
      items,
    };
  };

  const submitRating = async (
    productId: string,
    stars: number,
    ulasan: string,
  ) => {
    if (!user) {
      throw new Error('Silakan masuk terlebih dahulu untuk memberi rating.');
    }

    const clampedStars = Math.min(5, Math.max(1, Math.round(stars)));
    const reviewerName = (
      profile?.nama_lengkap ||
      user.email?.split('@')[0] ||
      'Pelanggan Dapur Aziz'
    ).slice(0, 120);

    const { error } = await supabase.from('ratings').upsert(
      {
        product_id: productId,
        user_id: user.id,
        nama_pengulas: reviewerName,
        rating: clampedStars,
        ulasan: ulasan.trim().slice(0, 300),
      },
      { onConflict: 'product_id,user_id' },
    );

    if (error) {
      throw new Error(`Gagal menyimpan rating: ${error.message}`);
    }

    await fetchRatings();
  };

  const deleteRating = async (ratingId: string) => {
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('id', ratingId);

    if (error) {
      throw new Error(`Gagal menghapus ulasan: ${error.message}`);
    }

    await fetchRatings();
  };

  const isSeededInDb = dbProducts.length > 0;
  const products: Product[] = isSeededInDb
    ? dbProducts
    : SEED_MENU_ITEMS.map((item) => ({ ...item }));

  return (
    <MenuContext.Provider
      value={{
        products,
        ratings,
        loading,
        isSeededInDb,
        ratingModalProduct,
        openRatingModal: (product) => setRatingModalProduct(product),
        closeRatingModal: () => setRatingModalProduct(null),
        getProductRatingStats,
        submitRating,
        deleteRating,
        seedInitialMenu,
        refreshMenu: fetchProducts,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu must be used inside MenuProvider');
  return ctx;
}
