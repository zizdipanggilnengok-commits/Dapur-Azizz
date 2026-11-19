import { useMemo, useState } from 'react';
import { ArrowDown, Flame, Search, Sparkles, Utensils, X } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.tsx';
import { useMenu } from '../context/MenuContext.tsx';
import { HERO_IMAGE_URL } from '../data/seedMenu.ts';
import type { MenuCategory } from '../types.ts';

type CategoryFilter = 'Semua' | MenuCategory;

export function HomePage() {
  const { products, loading } = useMenu();
  const [category, setCategory] = useState<CategoryFilter>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products
      .filter((item) => {
        const matchesCat = category === 'Semua' || item.kategori === category;
        const matchesQuery =
          !q ||
          item.nama_produk.toLowerCase().includes(q) ||
          (item.deskripsi || '').toLowerCase().includes(q);
        return matchesCat && matchesQuery;
      })
      .sort((a, b) => {
        if (a.tersedia !== b.tersedia) return a.tersedia ? -1 : 1;
        if (a.kategori !== b.kategori) return a.kategori === 'Makanan' ? -1 : 1;
        return a.nama_produk.localeCompare(b.nama_produk);
      });
  }, [products, category, searchQuery]);

  const scrollToMenu = () => {
    document.getElementById('katalog-menu')?.scrollIntoView({ behavior: 'smooth' });
  };

  const makananCount = products.filter((p) => p.kategori === 'Makanan').length;
  const minumanCount = products.filter((p) => p.kategori === 'Minuman').length;

  return (
    <main>
      {/* Hero Section */}
      <section className="border-b border-[#EAE3DA] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs font-semibold tracking-wide text-[#B91C1C]">
                Kuliner Nusantara · Lalapan &amp; Sambal Segar
              </p>

              <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#1C1613] leading-[1.1] tracking-tight text-balance">
                Lalapan Hangat, Sambal Ulek Dadakan dari Dapur Aziz.
              </h1>

              <p className="text-base text-[#574941] leading-relaxed max-w-xl">
                Nikmati ayam kampung ungkep, lele goreng garing, bebek serundeng,
                hingga tempe penyet yang selalu dimasak segar saat pesanan masuk,
                ditemani minuman dingin yang menyegarkan.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={scrollToMenu}
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-[#C82319] hover:bg-[#A61B13] text-white text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
                >
                  <span>Pesan Menu Sekarang</span>
                  <ArrowDown className="w-4 h-4" aria-hidden="true" />
                </button>
                <a
                  href="#tentang-kami"
                  className="inline-flex items-center px-5 py-3 min-h-[44px] rounded-xl border border-[#DDD2C5] hover:border-[#C82319] text-sm font-semibold text-[#1C1613] transition-colors"
                >
                  Racikan Kami
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[260px] sm:min-h-[340px] rounded-2xl overflow-hidden bg-[#F4EDE4] border border-[#EAE3DA]">
                <img
                  src={HERO_IMAGE_URL}
                  alt="Hidangan Lalapan Ayam Goreng dan sambal terasi segar khas Dapur Aziz"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex items-end p-6">
                  <p className="text-sm font-medium text-white/95">
                    Lalapan Ayam Goreng · Sambal Terasi Cobek · Kemangi Segar
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-column Highlights Row */}
          <div className="mt-10 pt-8 border-t border-[#F1EBE3] grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="tabular-nums text-2xl font-bold text-[#1C1613]">
                {products.length} Menu
              </p>
              <p className="text-xs text-[#6E5E55] mt-1">
                {makananCount} Lalapan · {minumanCount} Minuman
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1C1613]">Rp 2.000+</p>
              <p className="text-xs text-[#6E5E55] mt-1">
                Harga bersahabat langsung dari dapur
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1C1613]">Masak Segar</p>
              <p className="text-xs text-[#6E5E55] mt-1">
                Digoreng hangat setiap ada pesanan masuk
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1C1613]">Pantau Live</p>
              <p className="text-xs text-[#6E5E55] mt-1">
                Lacak status dimasak hingga siap antar
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Catalog & Filter Section */}
      <section id="katalog-menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-[#1C1613] tracking-tight">
              Katalog Menu Dapur Aziz
            </h2>
            <p className="text-sm text-[#6E5E55] mt-1.5">
              Pilih lalapan favorit dan minuman pendamping, lalu atur catatan sambal saat checkout.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Category Filter Tabs */}
            <div
              role="tablist"
              aria-label="Filter kategori menu"
              className="inline-flex items-center p-1 bg-[#EFE8DF] rounded-xl"
            >
              {(['Semua', 'Makanan', 'Minuman'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={category === cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 min-h-[38px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    category === cat
                      ? 'bg-white text-[#1C1613] shadow-xs'
                      : 'text-[#6E5E55] hover:text-[#1C1613]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[230px] sm:w-64">
              <Search
                className="w-4 h-4 text-[#8A796E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari ayam, lele, es teh..."
                aria-label="Cari menu makanan atau minuman"
                className="w-full pl-10 pr-9 py-2.5 min-h-[42px] rounded-xl bg-white border border-[#DDD2C5] text-sm text-[#1C1613] placeholder:text-[#9C8D82] focus:outline-none focus:ring-2 focus:ring-[#C82319]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A796E] hover:text-[#1C1613] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-[#EAE3DA] rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="aspect-4/3 bg-[#F3ECE4]" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-24 bg-[#F3ECE4] rounded" />
                  <div className="h-5 w-48 bg-[#EFE8DF] rounded" />
                  <div className="h-4 w-full bg-[#F5EFE8] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#EAE3DA] rounded-2xl p-12 text-center space-y-3">
            <Utensils className="w-10 h-10 mx-auto text-[#C82319]/60" aria-hidden="true" />
            <h3 className="font-display text-xl font-bold text-[#1C1613]">
              Menu tidak ditemukan
            </h3>
            <p className="text-sm text-[#6E5E55]">
              Tidak ada hidangan yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory('Semua');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-lg bg-[#C82319] text-white text-xs font-semibold hover:bg-[#A61B13] cursor-pointer"
            >
              Tampilkan Semua Menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Story / Craftsmanship Section */}
      <section
        id="tentang-kami"
        className="border-t border-[#EAE3DA] bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-3">
              <p className="text-xs font-semibold text-[#D97706]">
                Tentang Dapur Aziz
              </p>
              <h2 className="font-display text-3xl font-bold text-[#1C1613] leading-tight text-balance">
                Cita Rasa Warung Rumahan yang Konsisten Setiap Hari.
              </h2>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#FCFAF7] border border-[#EAE3DA] space-y-2">
                <Flame className="w-5 h-5 text-[#C82319]" aria-hidden="true" />
                <h3 className="text-base font-bold text-[#1C1613]">
                  Sambal Cobek Segar
                </h3>
                <p className="text-sm text-[#6E5E55] leading-relaxed">
                  Cabai rawit merah, tomat segar, dan terasi pilihan diulek setiap
                  hari. Anda bebas meminta tingkat kepedasan atau memisah sambal
                  di catatan pesanan.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-[#FCFAF7] border border-[#EAE3DA] space-y-2">
                <Sparkles className="w-5 h-5 text-[#D97706]" aria-hidden="true" />
                <h3 className="text-base font-bold text-[#1C1613]">
                  Bumbu Ungkep Meresap
                </h3>
                <p className="text-sm text-[#6E5E55] leading-relaxed">
                  Ayam, bebek, dan lele diungkep perlahan dengan kunyit, serai,
                  dan lengkuas sehingga daging tetap empuk di dalam dan renyah di
                  luar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
