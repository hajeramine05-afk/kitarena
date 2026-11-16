import { useStore } from '../context/StoreContext';
import { formatMad, pickLang, UI_TEXT } from '../i18n';
import type { Product } from '../types';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { lang, navigate } = useStore();
  const txt = UI_TEXT[lang].product;

  const name = pickLang(lang, product.nameFr, product.nameAr);
  const team = pickLang(lang, product.teamFr, product.teamAr);
  const totalStock = Object.values(product.stockBySize).reduce((sum, n) => sum + n, 0);
  const hasDiscount =
    product.compareAtPriceMad !== null && product.compareAtPriceMad > product.priceMad;

  let subtleTag: string | null = null;
  if (totalStock === 0) {
    subtleTag = txt.outOfStock;
  } else if (hasDiscount) {
    subtleTag = txt.promoTag;
  } else if (product.isNew) {
    subtleTag = txt.newTag;
  }

  return (
    <article
      onClick={() => navigate(`/produit/${product.slug}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/produit/${product.slug}`);
        }
      }}
      tabIndex={0}
      role="button"
      className="group cursor-pointer flex flex-col bg-white border border-zinc-200/80 rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]"
    >
      <div className="relative aspect-[4/3] w-full bg-zinc-100 overflow-hidden">
        <ProductImage
          src={product.images[0]}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
            <span className="truncate">
              {team} · {product.season}
            </span>
            {subtleTag && (
              <span
                className={`shrink-0 font-semibold ${
                  totalStock === 0
                    ? 'text-red-700'
                    : hasDiscount
                      ? 'text-[#B45309]'
                      : 'text-[#064E3B]'
                }`}
              >
                {subtleTag}
              </span>
            )}
          </div>
          <h3 className="text-[15px] font-semibold text-zinc-900 leading-snug line-clamp-2 group-hover:text-[#064E3B] transition-colors">
            {name}
          </h3>
        </div>

        <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-zinc-100">
          <div className="flex items-baseline gap-2">
            <span className="font-mono-tabular text-[15px] font-semibold text-zinc-950">
              {formatMad(product.priceMad, lang)}
            </span>
            {hasDiscount && product.compareAtPriceMad && (
              <span className="font-mono-tabular text-xs text-zinc-400 line-through">
                {formatMad(product.compareAtPriceMad, lang)}
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500">{product.version}</span>
        </div>
      </div>
    </article>
  );
}
