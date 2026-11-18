import { useState } from 'react';
import { Minus, Plus, Star, UtensilsCrossed } from 'lucide-react';
import { formatRupiah } from '../data/seedMenu.ts';
import { useCart } from '../context/CartContext.tsx';
import { useMenu } from '../context/MenuContext.tsx';
import type { Product } from '../types.ts';

export function ProductCard({ product }: { product: Product }) {
  const { addItem, updateQty, getQty } = useCart();
  const { getProductRatingStats, openRatingModal } = useMenu();
  const [imgError, setImgError] = useState(false);

  const qtyInCart = getQty(product.id);
  const { average, count } = getProductRatingStats(product.id);

  return (
    <article className="group bg-white border border-[#EAE3DA] rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* 4:3 Culinary Image with Zero-Broken-Image Fallback */}
      <div className="relative aspect-4/3 bg-[#F6F0E8] overflow-hidden">
        {product.gambar_url && !imgError ? (
          <img
            src={product.gambar_url}
            alt={product.nama_produk}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
              !product.tersedia ? 'grayscale opacity-65' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#F7EDE2] to-[#EFE2D2] text-[#8A796E] px-4 text-center">
            <UtensilsCrossed className="w-8 h-8 text-[#C82319]/60" aria-hidden="true" />
            <span className="text-xs font-medium">{product.nama_produk}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Clean Unboxed Metadata (Zero-Pill Discipline) */}
        <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#7B6B61] mb-1.5">
          <div className="flex items-center gap-2">
            <span>{product.kategori}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                product.tersedia
                  ? 'text-[#15803D] font-semibold'
                  : 'text-[#B91C1C] font-semibold'
              }
            >
              {product.tersedia ? 'Tersedia' : 'Stok Habis'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => openRatingModal(product)}
            aria-label={`Lihat dan beri rating untuk ${product.nama_produk}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#574941] hover:text-[#C82319] transition-colors cursor-pointer shrink-0"
          >
            <Star
              className={`w-3.5 h-3.5 ${
                count > 0
                  ? 'fill-[#F59E0B] text-[#F59E0B]'
                  : 'text-[#B8AAA0]'
              }`}
              aria-hidden="true"
            />
            <span className="tabular-nums">
              {count > 0 ? `${average.toFixed(1)} (${count})` : 'Beri Rating'}
            </span>
          </button>
        </div>

        <h3 className="text-base font-bold text-[#1C1613] leading-snug mb-1.5">
          {product.nama_produk}
        </h3>

        <p className="text-sm text-[#6E5E55] leading-relaxed line-clamp-2 mb-4 flex-1">
          {product.deskripsi}
        </p>

        {/* Price + Action Row */}
        <div className="pt-3 border-t border-[#F3ECE4] flex items-center justify-between gap-3">
          <span className="tabular-nums text-base font-bold text-[#B91C1C]">
            {formatRupiah(product.harga)}
          </span>

          {!product.tersedia ? (
            <button
              type="button"
              disabled
              className="px-4 py-2 min-h-[40px] rounded-lg bg-[#F1ECE6] text-[#8A796E] text-xs font-semibold cursor-not-allowed whitespace-nowrap shrink-0"
            >
              Habis
            </button>
          ) : qtyInCart === 0 ? (
            <button
              type="button"
              onClick={() => addItem(product)}
              className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-[#C82319] hover:bg-[#A61B13] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tambah</span>
            </button>
          ) : (
            <div className="inline-flex items-center rounded-lg border border-[#C82319] bg-[#FFF8F6] overflow-hidden">
              <button
                type="button"
                onClick={() => updateQty(product.id, -1)}
                aria-label={`Kurangi jumlah ${product.nama_produk}`}
                className="w-9 h-9 inline-flex items-center justify-center text-[#C82319] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="tabular-nums px-2.5 text-xs font-bold text-[#1C1613] min-w-[24px] text-center">
                {qtyInCart}
              </span>
              <button
                type="button"
                onClick={() => updateQty(product.id, 1)}
                aria-label={`Tambah jumlah ${product.nama_produk}`}
                className="w-9 h-9 inline-flex items-center justify-center text-[#C82319] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
