import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { SEED_MENU_ITEMS } from '../data/seedMenu.ts';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
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

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('kategori', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as Product);
        setDbProducts(list);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'products');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'ratings'),
      (snapshot) => {
        const list = snapshot.docs.map((d) => d.data() as Rating);
        list.sort((a, b) => {
          const tA = a.updated_at?.toMillis() ?? a.created_at?.toMillis() ?? 0;
          const tB = b.updated_at?.toMillis() ?? b.created_at?.toMillis() ?? 0;
          return tB - tA;
        });
        setRatings(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'ratings');
      },
    );

    return () => unsubscribe();
  }, []);

  const REMOVED_PRODUCT_IDS = ['es-kukubima', 'es-extrajoss'];

  const seedInitialMenu = async () => {
    const batch = writeBatch(db);
    for (const item of SEED_MENU_ITEMS) {
      const ref = doc(db, 'products', item.id);
      batch.set(ref, {
        ...item,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }
    for (const removedId of REMOVED_PRODUCT_IDS) {
      batch.delete(doc(db, 'products', removedId));
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  useEffect(() => {
    if (!loading && isAdmin && dbProducts.length === 0 && !autoSeededRef.current) {
      autoSeededRef.current = true;
      void seedInitialMenu();
      return;
    }

    if (!loading && isAdmin && dbProducts.length > 0) {
      const stale = dbProducts.filter((p) => REMOVED_PRODUCT_IDS.includes(p.id));
      if (stale.length > 0) {
        const batch = writeBatch(db);
        stale.forEach((item) => batch.delete(doc(db, 'products', item.id)));
        void batch.commit().catch((error) => {
          handleFirestoreError(error, OperationType.DELETE, 'products');
        });
      }
    }
  }, [loading, isAdmin, dbProducts]);

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
    if (!user) throw new Error('Silakan masuk terlebih dahulu untuk memberi rating.');
    if (!user.emailVerified) {
      throw new Error(
        'Verifikasi email Anda terlebih dahulu sebelum mengirim rating.',
      );
    }
    const clampedStars = Math.min(5, Math.max(1, Math.round(stars)));
    const ratingId = `${productId}__${user.uid}`;
    const path = `ratings/${ratingId}`;
    const ref = doc(db, 'ratings', ratingId);
    const existing = ratings.find((r) => r.id === ratingId);
    const reviewerName = (
      profile?.nama_lengkap ||
      user.displayName ||
      user.email?.split('@')[0] ||
      'Pelanggan Dapur Aziz'
    ).slice(0, 120);

    try {
      if (existing) {
        await updateDoc(ref, {
          nama_pengulas: reviewerName,
          rating: clampedStars,
          ulasan: ulasan.trim().slice(0, 300),
          updated_at: serverTimestamp(),
        });
      } else {
        await setDoc(ref, {
          id: ratingId,
          product_id: productId,
          user_id: user.uid,
          nama_pengulas: reviewerName,
          rating: clampedStars,
          ulasan: ulasan.trim().slice(0, 300),
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const deleteRating = async (ratingId: string) => {
    const path = `ratings/${ratingId}`;
    try {
      await deleteDoc(doc(db, 'ratings', ratingId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
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
