import { useMemo, useState } from 'react';
import { AlertCircle, Banknote, CreditCard, Lock, Truck } from 'lucide-react';
import { ProductImage } from '../components/ProductImage';
import { useStore } from '../context/StoreContext';
import { formatMad, pickLang, UI_TEXT } from '../i18n';
import type { Order } from '../types';

export function CheckoutPage() {
  const {
    lang,
    cart,
    products,
    settings,
    clearCart,
    refreshStorefront,
    navigate,
  } = useStore();
  const t = UI_TEXT[lang].checkout;

  const activeCities = useMemo(
    () => (settings?.servedCities || []).filter((c) => c.active),
    [settings]
  );

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState(() => activeCities[0]?.city || 'Casablanca');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resolvedItems = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { item, product } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotal = resolvedItems.reduce(
    (sum, entry) => sum + entry.product.priceMad * entry.item.quantity,
    0
  );

  const selectedCityObj =
    activeCities.find((c) => c.city === city) || activeCities[0] || null;
  const threshold = settings?.freeShippingThresholdMad ?? 600;
  const baseFee = selectedCityObj?.feeMad ?? settings?.defaultShippingMad ?? 35;
  const shippingFee = subtotal >= threshold ? 0 : baseFee;
  const total = subtotal + shippingFee;

  const validateMoroccanPhone = (val: string) => {
    const cleaned = val.replace(/[\s\-().]/g, '');
    return /^(\+212|0)[5-7]\d{8}$/.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (resolvedItems.length === 0) {
      setFormError(t.emptyCartWarning);
      return;
    }
    if (customerName.trim().length < 2) {
      setFormError(
        lang === 'ar' ? 'يرجى إدخال الاسم الكامل.' : 'Veuillez saisir votre nom complet.'
      );
      return;
    }
    if (!validateMoroccanPhone(customerPhone)) {
      setFormError(
        lang === 'ar'
          ? 'رقم الهاتف المغربي غير صالح (مثال: 0612345678).'
          : 'Numéro de téléphone marocain invalide (ex : 06 12 34 56 78).'
      );
      return;
    }
    if (!city) {
      setFormError(
        lang === 'ar' ? 'يرجى اختيار مدينة التوصيل.' : 'Veuillez choisir une ville.'
      );
      return;
    }
    if (address.trim().length < 5) {
      setFormError(
        lang === 'ar'
          ? 'يرجى إدخال عنوان التوصيل الكامل.'
          : 'Veuillez indiquer votre adresse complète de livraison.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          city,
          address: address.trim(),
          notes: notes.trim(),
          paymentMethod: 'cod',
          items: resolvedItems.map((entry) => ({
            productId: entry.product.id,
            size: entry.item.size,
            quantity: entry.item.quantity,
          })),
        }),
      });

      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setFormError(data.error || 'Impossible de valider la commande.');
        setSubmitting(false);
        return;
      }

      try {
        sessionStorage.setItem(
          `kit_arena_order_${data.order.orderNumber}`,
          JSON.stringify(data.order)
        );
      } catch {
        // Ignore session storage errors
      }

      clearCart();
      await refreshStorefront();
      navigate(`/confirmation/${encodeURIComponent(data.order.orderNumber)}`);
    } catch {
      setFormError(
        lang === 'ar'
          ? 'تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.'
          : 'Erreur réseau lors de l’envoi de la commande.'
      );
      setSubmitting(false);
    }
  };

  if (resolvedItems.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-zinc-950">{t.title}</h1>
        <p className="text-sm text-zinc-600">{t.emptyCartWarning}</p>
        <button
          type="button"
          onClick={() => navigate('/catalogue')}
          className="px-6 py-3 rounded-lg bg-[#064E3B] text-white text-sm font-semibold"
        >
          {UI_TEXT[lang].cart.browseCatalog}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-950 tracking-tight">
          {t.title}
        </h1>
        <p className="text-sm text-zinc-600 mt-1">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Form & Payment */}
        <div className="lg:col-span-7 space-y-6">
          {formError && (
            <div
              role="alert"
              className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-zinc-950 pb-3 border-b border-zinc-100">
              {t.customerSection}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="chk-name" className="block text-xs font-semibold text-zinc-700">
                  {t.fullName} *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={t.fullNamePlaceholder}
                  className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="chk-phone" className="block text-xs font-semibold text-zinc-700">
                  {t.phone} *
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  required
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={t.phonePlaceholder}
                  className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="chk-city" className="block text-xs font-semibold text-zinc-700">
                {t.city} *
              </label>
              <select
                id="chk-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              >
                {activeCities.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city} — {subtotal >= threshold ? t.free : formatMad(c.feeMad, lang)} (
                    {pickLang(lang, c.delayFr, c.delayAr)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="chk-address" className="block text-xs font-semibold text-zinc-700">
                {t.address} *
              </label>
              <input
                id="chk-address"
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t.addressPlaceholder}
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="chk-notes" className="block text-xs font-semibold text-zinc-700">
                {t.notes}
              </label>
              <textarea
                id="chk-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="w-full p-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-zinc-950 pb-3 border-b border-zinc-100">
              {t.paymentSection}
            </h2>

            <div className="p-4 rounded-lg border-2 border-[#064E3B] bg-[#064E3B]/5 flex items-start gap-3">
              <Banknote className="w-5 h-5 text-[#064E3B] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-zinc-950">{t.codTitle}</p>
                <p className="text-xs text-zinc-600 leading-relaxed">{t.codDesc}</p>
              </div>
            </div>

            {!settings?.onlinePaymentEnabled && (
              <div className="p-4 rounded-lg border border-zinc-200 bg-zinc-50 flex items-start gap-3 opacity-85">
                <CreditCard className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-600">{t.onlineTitle}</p>
                    <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{t.onlineDisabled}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order & Delivery Summary */}
        <aside className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 space-y-5 lg:sticky lg:top-24">
          <h2 className="text-base font-semibold text-zinc-950 pb-3 border-b border-zinc-100">
            {t.summaryTitle}
          </h2>

          <div className="space-y-3 max-h-72 overflow-y-auto pe-1">
            {resolvedItems.map(({ item, product }) => {
              const name = pickLang(lang, product.nameFr, product.nameAr);
              return (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                    <ProductImage
                      src={product.images[0]}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{name}</p>
                    <p className="text-xs text-zinc-500">
                      {item.size} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-mono-tabular font-semibold text-zinc-950 shrink-0">
                    {formatMad(product.priceMad * item.quantity, lang)}
                  </span>
                </div>
              );
            })}
          </div>

          {selectedCityObj && (
            <div className="p-3.5 rounded-lg bg-[#F8FAF9] border border-zinc-200 space-y-1 text-xs">
              <div className="flex items-center gap-2 font-semibold text-zinc-900">
                <Truck className="w-4 h-4 text-[#064E3B]" />
                <span>
                  {t.deliveryPreview} — {selectedCityObj.city}
                </span>
              </div>
              <p className="text-zinc-600">
                {t.estimatedDelay} : {pickLang(lang, selectedCityObj.delayFr, selectedCityObj.delayAr)}
              </p>
            </div>
          )}

          <div className="space-y-2.5 pt-3 border-t border-zinc-200 text-sm">
            <div className="flex items-center justify-between text-zinc-600">
              <span>{t.subtotal}</span>
              <span className="font-mono-tabular font-medium text-zinc-950">
                {formatMad(subtotal, lang)}
              </span>
            </div>
            <div className="flex items-center justify-between text-zinc-600">
              <span>{t.shipping}</span>
              <span className="font-mono-tabular font-medium text-zinc-950">
                {shippingFee === 0 ? (
                  <span className="text-[#064E3B] font-semibold">{t.free}</span>
                ) : (
                  formatMad(shippingFee, lang)
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-base font-bold text-zinc-950 pt-3 border-t border-zinc-200">
              <span>{t.total}</span>
              <span className="font-mono-tabular text-lg text-[#064E3B]">
                {formatMad(total, lang)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-5 rounded-lg bg-[#064E3B] hover:bg-[#053B2C] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {submitting ? t.submitting : t.submitOrder}
          </button>
        </aside>
      </form>
    </div>
  );
}
