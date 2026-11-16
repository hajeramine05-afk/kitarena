import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { ProductImage } from '../components/ProductImage';
import { useStore } from '../context/StoreContext';
import { formatMad, pickLang, UI_TEXT } from '../i18n';

export function CartPage() {
  const {
    lang,
    cart,
    products,
    settings,
    updateCartQuantity,
    removeFromCart,
    navigate,
  } = useStore();
  const t = UI_TEXT[lang].cart;

  const resolved = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { item, product } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotal = resolved.reduce(
    (sum, entry) => sum + entry.product.priceMad * entry.item.quantity,
    0
  );
  const threshold = settings?.freeShippingThresholdMad ?? 600;
  const remaining = Math.max(0, threshold - subtotal);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-950 tracking-tight">
        {t.title}
      </h1>

      {resolved.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl py-16 px-6 text-center space-y-4">
          <ShoppingBag className="w-10 h-10 mx-auto text-zinc-400" />
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-zinc-900">{t.emptyTitle}</h2>
            <p className="text-sm text-zinc-500">{t.emptyBody}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/catalogue')}
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C]"
          >
            {t.browseCatalog}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-200">
            {resolved.map(({ item, product }) => {
              const name = pickLang(lang, product.nameFr, product.nameAr);
              const team = pickLang(lang, product.teamFr, product.teamAr);
              const maxStock = product.stockBySize[item.size] ?? 0;

              return (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="p-5 flex flex-col sm:flex-row sm:items-center gap-5"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/produit/${product.slug}`)}
                    className="w-28 aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0"
                  >
                    <ProductImage
                      src={product.images[0]}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs text-zinc-500">
                      {team} · {product.season}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(`/produit/${product.slug}`)}
                      className="text-base font-semibold text-zinc-950 hover:text-[#064E3B] text-start"
                    >
                      {name}
                    </button>
                    <p className="text-xs text-zinc-600">
                      {t.size} : <span className="font-semibold text-zinc-900">{item.size}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="inline-flex items-center border border-zinc-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.productId, item.size, item.quantity - 1)
                        }
                        aria-label="Diminuer la quantité"
                        className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-9 text-center font-mono-tabular text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCartQuantity(item.productId, item.size, item.quantity + 1)
                        }
                        disabled={item.quantity >= maxStock}
                        aria-label="Augmenter la quantité"
                        className="w-9 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <span className="font-mono-tabular text-base font-semibold text-zinc-950 min-w-[96px] text-end">
                      {formatMad(product.priceMad * item.quantity, lang)}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.size)}
                      aria-label={t.remove}
                      className="text-zinc-400 hover:text-red-600 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="lg:col-span-4 bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
            <div className="text-xs text-zinc-700 bg-zinc-50 border border-zinc-200 rounded-lg p-3.5">
              {remaining === 0 ? (
                <span className="font-semibold text-[#064E3B]">{t.freeShippingUnlocked}</span>
              ) : (
                <span>
                  {t.freeShippingMissing}{' '}
                  <strong className="font-mono-tabular">{formatMad(remaining, lang)}</strong>{' '}
                  {t.freeShippingSuffix}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-base font-semibold text-zinc-950 pt-2 border-t border-zinc-200">
              <span>{t.subtotal}</span>
              <span className="font-mono-tabular text-lg">{formatMad(subtotal, lang)}</span>
            </div>

            <p className="text-xs text-zinc-500">{t.shippingNote}</p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => navigate('/commander')}
                className="w-full py-3 px-5 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C] transition-colors"
              >
                {t.checkoutBtn}
              </button>
              <button
                type="button"
                onClick={() => navigate('/catalogue')}
                className="w-full py-2.5 px-5 rounded-lg border border-zinc-300 bg-white text-zinc-800 text-sm font-medium hover:bg-zinc-100 transition-colors"
              >
                {t.continueShopping}
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
