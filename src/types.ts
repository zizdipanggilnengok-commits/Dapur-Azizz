import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'user';
export type MenuCategory = 'Makanan' | 'Minuman';
export type OrderStatus =
  | 'Menunggu Konfirmasi'
  | 'Dimasak'
  | 'Selesai'
  | 'Dibatalkan';

export interface Profile {
  id: string;
  nama_lengkap: string;
  email: string;
  no_hp: string;
  alamat: string;
  role: UserRole;
  created_at?: Timestamp | null;
  updated_at?: Timestamp | null;
}

export interface Product {
  id: string;
  nama_produk: string;
  kategori: MenuCategory;
  harga: number;
  deskripsi: string;
  gambar_url: string;
  tersedia: boolean;
  created_at?: Timestamp | null;
  updated_at?: Timestamp | null;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface Order {
  id: string;
  user_id: string;
  nama_pelanggan: string;
  no_hp: string;
  alamat_pengiriman: string;
  total_harga: number;
  jumlah_item: number;
  ringkasan_menu: string;
  status_pesanan: OrderStatus;
  catatan: string;
  created_at?: Timestamp | null;
  updated_at?: Timestamp | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  user_id: string;
  product_id: string;
  nama_produk: string;
  harga_satuan: number;
  qty: number;
  subtotal: number;
}

export interface Rating {
  id: string;
  product_id: string;
  user_id: string;
  nama_pengulas: string;
  rating: number;
  ulasan: string;
  created_at?: Timestamp | null;
  updated_at?: Timestamp | null;
}
