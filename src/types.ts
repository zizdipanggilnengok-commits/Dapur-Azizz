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
  created_at?: string | null;
}

export interface Product {
  id: string;
  nama_produk: string;
  kategori: MenuCategory;
  harga: number;
  deskripsi: string;
  gambar_url: string | null;
  tersedia: boolean;
  created_at?: string | null;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  nama_produk: string;
  jumlah: number;
  harga_satuan: number;
}

export interface Order {
  id: string;
  user_id: string;
  nama_penerima: string;
  alamat_pengiriman: string;
  no_hp: string;
  total_harga: number;
  status_pesanan: OrderStatus;
  catatan: string | null;
  created_at?: string | null;
  order_items?: OrderItem[];
}

export interface Rating {
  id: string;
  product_id: string;
  user_id: string;
  nama_pengulas: string;
  rating: number;
  ulasan: string;
  created_at?: string | null;
  updated_at?: string | null;
}
