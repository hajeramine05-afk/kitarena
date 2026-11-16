import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatMad, pickLang, UI_TEXT } from '../i18n';
import { ProductImage } from './ProductImage';

export function CartDrawer() {
  const {
    lang,
    cart,
    products,
    settings,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    navigate,
  } = useStore();

  if (!cartDrawerOpen) return null;

  const t = UI_TEXT[lang].cart;
  const resolved = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return { item, product };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotal = resolved.reduce(
    (sum, entry) => sum + entry.product.priceMad * entry.item.quantity,
    0
  );
  const threshold = settings?.freeShippingThresholdMad ?? 600;
  const remainingForFree = Math.max(0, threshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]">
      <div
        className="fixed inset-0"
        onClick={() => setCartDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className="relative z-10 w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-s border-zinc-200"
      >
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#064E3B]" />
            <h2 className="text-lg font-semibold text-zinc-950">{t.title}</h2>
          </div>
          <button
            type="button"
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Fermer"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping progress */}
        {resolved.length > 0 && (
          <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-700">
            {remainingForFree === 0 ? (
              <p className="font-semibold text-[#064E3B]">{t.freeShippingUnlocked}</p>
            ) : (
              <p>
                {t.freeShippingMissing}{' '}
                <span className="font-mono-tabular font-semibold text-zinc-950">
                  {formatMad(remainingForFree, lang)}
                </span>{' '}
                {t.freeShippingSuffix}
              </p>
            )}
            <div className="mt-2 h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#064E3B] transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round((subtotal / Math.max(1, threshold)) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {resolved.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-zinc-900">{t.emptyTitle}</p>
                <p className="text-sm text-zinc-500">{t.emptyBody}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/catalogue');
                }}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C] transition-colors"
              >
                {t.browseCatalog}
              </button>
            </div>
          ) : (
            resolved.map(({ item, product }) => {
              const name = pickLang(lang, product.nameFr, product.nameAr);
              const maxStock = product.stockBySize[item.size] ?? 0;
              return (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex gap-4 pb-4 border-b border-zinc-100"
                >
                  <div className="w-20 h-20 rounded-md overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                    <ProductImage
                      src={product.images[0]}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 line-clamp-1">
                          {name}
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {t.size} : <span className="font-semibold text-zinc-800">{item.size}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId, item.size)}
                        aria-label={t.remove}
                        className="text-zinc-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="inline-flex items-center border border-zinc-200 rounded-md">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(item.productId, item.size, item.quantity - 1)
                          }
                          aria-label="Diminuer la quantité"
                          className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono-tabular text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(item.productId, item.size, item.quantity + 1)
                          }
                          disabled={item.quantity >= maxStock}
                          aria-label="Augmenter la quantité"
                          className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="font-mono-tabular text-sm font-semibold text-zinc-950">
                        {formatMad(product.priceMad * item.quantity, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {resolved.length > 0 && (
          <div className="p-6 border-t border-zinc-200 bg-zinc-50 space-y-3">
            <div className="flex items-center justify-between text-base font-semibold text-zinc-950">
              <span>{t.subtotal}</span>
              <span className="font-mono-tabular">{formatMad(subtotal, lang)}</span>
            </div>
            <p className="text-xs text-zinc-500">{t.shippingNote}</p>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/commander');
                }}
                className="w-full py-3 px-4 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C] transition-colors"
              >
                {t.checkoutBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('/panier');
                }}
                className="w-full py-2.5 px-4 rounded-lg border border-zinc-300 bg-white text-zinc-800 text-sm font-medium hover:bg-zinc-100 transition-colors"
              >
                {t.viewFullCart}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
