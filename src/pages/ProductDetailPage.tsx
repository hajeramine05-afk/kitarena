import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Minus, Plus, ShieldAlert, Truck } from 'lucide-react';
import { ProductImage } from '../components/ProductImage';
import { useStore } from '../context/StoreContext';
import { formatMad, pickLang, UI_TEXT } from '../i18n';
import { JERSEY_SIZES } from '../types';
import type { JerseySize, Product } from '../types';

export function ProductDetailPage({ slug }: { slug: string }) {
  const { lang, products, settings, addToCart, navigate } = useStore();
  const t = UI_TEXT[lang].product;
  const BackIcon = lang === 'ar' ? ArrowRight : ArrowLeft;

  const cached = products.find((p) => p.slug === slug || p.id === slug) || null;
  const [product, setProduct] = useState<Product | null>(cached);
  const [loading, setLoading] = useState<boolean>(!cached);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<JerseySize | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setActiveImageIdx(0);
    setQuantity(1);
    setJustAdded(false);
    const found = products.find((p) => p.slug === slug || p.id === slug);
    if (found) {
      setProduct(found);
      setLoading(false);
      const firstAvail = JERSEY_SIZES.find((s) => (found.stockBySize[s] ?? 0) > 0) || null;
      setSelectedSize(firstAvail);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { product?: Product } | null) => {
        if (cancelled) return;
        const p = data?.product ?? null;
        setProduct(p);
        if (p) {
          const firstAvail = JERSEY_SIZES.find((s) => (p.stockBySize[s] ?? 0) > 0) || null;
          setSelectedSize(firstAvail);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, products]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-pulse">
        <div className="lg:col-span-7 aspect-[4/3] bg-zinc-200 rounded-xl" />
        <div className="lg:col-span-5 space-y-4">
          <div className="h-4 w-1/2 bg-zinc-200 rounded" />
          <div className="h-8 w-5/6 bg-zinc-200 rounded" />
          <div className="h-6 w-1/3 bg-zinc-200 rounded" />
          <div className="h-32 w-full bg-zinc-200 rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-zinc-950">
          {lang === 'ar' ? 'القميص غير متوفر' : 'Maillot introuvable'}
        </h1>
        <button
          type="button"
          onClick={() => navigate('/catalogue')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#064E3B] text-white text-sm font-semibold"
        >
          <BackIcon className="w-4 h-4" />
          <span>{t.backToCatalog}</span>
        </button>
      </div>
    );
  }

  const name = pickLang(lang, product.nameFr, product.nameAr);
  const team = pickLang(lang, product.teamFr, product.teamAr);
  const description = pickLang(lang, product.descriptionFr, product.descriptionAr);
  const currentStock = selectedSize ? product.stockBySize[selectedSize] ?? 0 : 0;
  const totalStock = Object.values(product.stockBySize).reduce((sum, n) => sum + n, 0);
  const lowThreshold = settings?.lowStockThreshold ?? 5;
  const hasDiscount =
    product.compareAtPriceMad !== null && product.compareAtPriceMad > product.priceMad;

  const handleAdd = () => {
    if (!selectedSize || currentStock <= 0) return;
    addToCart(product.id, selectedSize, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
      <button
        type="button"
        onClick={() => navigate('/catalogue')}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950 mb-6"
      >
        <BackIcon className="w-4 h-4" />
        <span>{t.backToCatalog}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Sticky Gallery */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
          <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200">
            <ProductImage
              src={product.images[activeImageIdx] || product.images[0]}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>

          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-24 aspect-[4/3] rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIdx === idx
                      ? 'border-[#064E3B]'
                      : 'border-zinc-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <ProductImage
                    src={img}
                    alt={`${name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 sm:p-7 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-500">
              {team} · {t.season} {product.season} · {product.version}
            </p>
            <h1 className="font-display text-3xl font-bold text-zinc-950 leading-tight [text-wrap:balance]">
              {name}
            </h1>
            <div className="flex items-baseline gap-3 pt-1">
              <span className="font-mono-tabular text-2xl font-bold text-zinc-950">
                {formatMad(product.priceMad, lang)}
              </span>
              {hasDiscount && product.compareAtPriceMad && (
                <span className="font-mono-tabular text-base text-zinc-400 line-through">
                  {formatMad(product.compareAtPriceMad, lang)}
                </span>
              )}
            </div>
          </div>

          {/* Availability state with explicit text */}
          <div className="text-sm font-medium">
            {totalStock === 0 || !selectedSize ? (
              <span className="text-red-700">{t.outOfStock}</span>
            ) : currentStock <= lowThreshold ? (
              <span className="text-amber-700">
                {t.lowStock} — <span className="font-mono-tabular">{currentStock}</span> {t.unitsLeft}
              </span>
            ) : (
              <span className="text-[#064E3B]">
                {t.inStock} — <span className="font-mono-tabular">{currentStock}</span> {t.unitsLeft}
              </span>
            )}
          </div>

          {/* Size selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
              <span>{t.selectSize}</span>
              {selectedSize && (
                <span className="text-zinc-500 font-mono-tabular">
                  {selectedSize} ({product.stockBySize[selectedSize] ?? 0})
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {JERSEY_SIZES.map((sz) => {
                const stock = product.stockBySize[sz] ?? 0;
                const active = selectedSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    disabled={stock <= 0}
                    onClick={() => {
                      setSelectedSize(sz);
                      setQuantity((q) => Math.min(q, Math.max(1, stock)));
                    }}
                    className={`h-11 rounded-lg text-sm font-semibold border transition-colors ${
                      stock <= 0
                        ? 'border-zinc-200 bg-zinc-100 text-zinc-400 line-through cursor-not-allowed'
                        : active
                          ? 'border-[#064E3B] bg-[#064E3B] text-white'
                          : 'border-zinc-300 bg-white text-zinc-900 hover:border-zinc-900'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center border border-zinc-300 rounded-lg h-12 bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Diminuer la quantité"
                className="w-11 h-full flex items-center justify-center text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 rounded-s-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-mono-tabular text-sm font-semibold">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(currentStock || 1, q + 1))}
                disabled={quantity >= currentStock}
                aria-label="Augmenter la quantité"
                className="w-11 h-full flex items-center justify-center text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 rounded-e-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedSize || currentStock <= 0}
              className="flex-1 h-12 px-5 rounded-lg bg-[#064E3B] hover:bg-[#053B2C] disabled:bg-zinc-300 disabled:text-zinc-500 text-white text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{t.addedFeedback}</span>
                </>
              ) : (
                <span>{totalStock === 0 ? t.outOfStock : t.addToCart}</span>
              )}
            </button>
          </div>

          {/* Description */}
          <div className="pt-4 border-t border-zinc-200 space-y-2">
            <h2 className="text-sm font-semibold text-zinc-950">{t.description}</h2>
            <p className="text-sm text-zinc-600 leading-relaxed">{description}</p>
          </div>

          {/* Delivery & Payment notice */}
          <div className="p-4 rounded-lg bg-[#F8FAF9] border border-zinc-200 space-y-2 text-xs text-zinc-700">
            <div className="flex items-center gap-2 font-semibold text-zinc-900">
              <Truck className="w-4 h-4 text-[#064E3B]" />
              <span>{t.deliverySummary}</span>
            </div>
            <p>{t.codBadge}</p>
            {!settings?.onlinePaymentEnabled && (
              <p className="text-zinc-500">{t.onlineUnavailable}</p>
            )}
          </div>

          {product.isDemo && (
            <div className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#B45309]" />
              <span>{t.demoNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky buy bar (compact <= 64px) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-zinc-200 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono-tabular text-base font-bold text-zinc-950">
            {formatMad(product.priceMad, lang)}
          </p>
          <p className="text-[11px] text-zinc-500">
            {selectedSize ? `${t.selectSize} : ${selectedSize}` : t.outOfStock}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedSize || currentStock <= 0}
          className="px-5 py-2.5 rounded-lg bg-[#064E3B] text-white text-sm font-semibold disabled:bg-zinc-300 whitespace-nowrap"
        >
          {t.addToCart}
        </button>
      </div>
    </div>
  );
}
