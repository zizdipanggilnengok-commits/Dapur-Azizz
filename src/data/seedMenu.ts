import type { Product } from '../types.ts';

export const HERO_IMAGE_URL =
  '/src/assets/images/hero_dapur_aziz_1794986393629.jpg';

export const IMAGE_PRESETS = [
  {
    label: 'Lalapan Ayam Goreng',
    url: '/src/assets/images/menu_ayam_goreng_1794986393478.jpg',
  },
  {
    label: 'Lalapan Lele Goreng',
    url: '/src/assets/images/menu_lele_goreng_1794986393149.jpg',
  },
  {
    label: 'Lalapan Bebek Goreng',
    url: '/src/assets/images/menu_bebek_goreng_1794986395153.jpg',
  },
  {
    label: 'Tempe & Tahu Penyet',
    url: '/src/assets/images/menu_tempe_tahu_1794986394692.jpg',
  },
  {
    label: 'Es Teh',
    url: '/src/assets/images/menu_es_teh_1794986395862.jpg',
  },
  {
    label: 'Es Jeruk',
    url: '/src/assets/images/menu_es_jeruk_1794986395415.jpg',
  },
  {
    label: 'Es Milo',
    url: '/src/assets/images/menu_es_milo_1794986396587.jpg',
  },
  {
    label: 'Teh Panas / Tawar',
    url: '/src/assets/images/menu_teh_panas_1794986396344.jpg',
  },
];

export const SEED_MENU_ITEMS: Omit<Product, 'created_at' | 'updated_at'>[] = [
  {
    id: 'lalapan-ayam-goreng',
    nama_produk: 'Lalapan Ayam Goreng',
    kategori: 'Makanan',
    harga: 18000,
    deskripsi:
      'Ayam ungkep rempah kunyit goreng garing dengan kremesan renyah, lalapan segar timun, kol, daun kemangi, dan sambal terasi ulek dadakan.',
    gambar_url: '/src/assets/images/menu_ayam_goreng_1794986393478.jpg',
    tersedia: true,
  },
  {
    id: 'lalapan-lele-goreng',
    nama_produk: 'Lalapan Lele Goreng',
    kategori: 'Makanan',
    harga: 15000,
    deskripsi:
      'Lele segar goreng kering gurih berbumbu bawang ketumbar, lengkap dengan lalapan timun, kemangi, dan sambal tomat pedas mantap.',
    gambar_url: '/src/assets/images/menu_lele_goreng_1794986393149.jpg',
    tersedia: true,
  },
  {
    id: 'lalapan-bebek-goreng',
    nama_produk: 'Lalapan Bebek Goreng',
    kategori: 'Makanan',
    harga: 25000,
    deskripsi:
      'Bebek empuk berbumbu ungkep khas Dapur Aziz digoreng keemasan dengan taburan serundeng gurih, lalapan segar, dan sambal pedas.',
    gambar_url: '/src/assets/images/menu_bebek_goreng_1794986395153.jpg',
    tersedia: true,
  },
  {
    id: 'lalapan-tempe-tahu-penyet',
    nama_produk: 'Lalapan Tempe & Tahu Penyet',
    kategori: 'Makanan',
    harga: 10000,
    deskripsi:
      'Perpaduan tempe dan tahu goreng hangat yang dipenyet langsung di atas cobek sambal terasi pedas beserta kemangi dan timun segar.',
    gambar_url: '/src/assets/images/menu_tempe_tahu_1794986394692.jpg',
    tersedia: true,
  },
  {
    id: 'es-teh',
    nama_produk: 'Es Teh',
    kategori: 'Minuman',
    harga: 4000,
    deskripsi:
      'Seduhan teh melati pilihan dengan gula asli dan es batu kristal yang menyegarkan setelah menikmati lalapan pedas.',
    gambar_url: '/src/assets/images/menu_es_teh_1794986395862.jpg',
    tersedia: true,
  },
  {
    id: 'es-jeruk',
    nama_produk: 'Es Jeruk',
    kategori: 'Minuman',
    harga: 5000,
    deskripsi:
      'Perasan jeruk peras segar alami berpadu manis pas dan es batu dingin, kaya vitamin dan segar di tenggorokan.',
    gambar_url: '/src/assets/images/menu_es_jeruk_1794986395415.jpg',
    tersedia: true,
  },
  {
    id: 'es-milo',
    nama_produk: 'Es Milo',
    kategori: 'Minuman',
    harga: 7000,
    deskripsi:
      'Minuman cokelat malt dingin kental dan creamy dengan taburan bubuk Milo di atasnya.',
    gambar_url: '/src/assets/images/menu_es_milo_1794986396587.jpg',
    tersedia: true,
  },
  {
    id: 'teh-panas',
    nama_produk: 'Teh Panas',
    kategori: 'Minuman',
    harga: 3000,
    deskripsi:
      'Teh melati hangat aromatik dengan tingkat kemanisan seimbang, cocok dinikmati kapan saja.',
    gambar_url: '/src/assets/images/menu_teh_panas_1794986396344.jpg',
    tersedia: true,
  },
  {
    id: 'teh-tawar',
    nama_produk: 'Teh Tawar',
    kategori: 'Minuman',
    harga: 2000,
    deskripsi:
      'Teh seduh murni tanpa gula (bisa hangat atau dingin sesuai catatan pesanan) untuk menetralisir rasa gurih.',
    gambar_url: '/src/assets/images/menu_teh_panas_1794986396344.jpg',
    tersedia: true,
  },
];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
