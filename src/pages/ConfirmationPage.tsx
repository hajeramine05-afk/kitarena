import { useEffect, useState } from 'react';
import { CheckCircle2, Printer } from 'lucide-react';
import { ProductImage } from '../components/ProductImage';
import { useStore } from '../context/StoreContext';
import { formatDateTime, formatMad, ORDER_STATUS_LABELS, pickLang, UI_TEXT } from '../i18n';
import type { Order } from '../types';

export function ConfirmationPage({ orderNumber }: { orderNumber: string }) {
  const { lang, navigate } = useStore();
  const t = UI_TEXT[lang].confirmation;

  const [order, setOrder] = useState<Order | null>(() => {
    try {
      const raw = sessionStorage.getItem(`kit_arena_order_${orderNumber}`);
      return raw ? (JSON.parse(raw) as Order) : null;
    } catch {
      return null;
    }
  });
  const [phoneInput, setPhoneInput] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`kit_arena_order_${orderNumber}`);
      if (raw) setOrder(JSON.parse(raw) as Order);
    } catch {
      // Ignore
    }
  }, [orderNumber]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phoneInput)}`
      );
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setLookupError(data.error || 'Commande introuvable.');
      } else {
        setOrder(data.order);
      }
    } catch {
      setLookupError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <h1 className="font-display text-2xl font-bold text-zinc-950">
            {t.orderNumber} : <span className="font-mono-tabular">{orderNumber}</span>
          </h1>
          <p className="text-sm text-zinc-600">
            {lang === 'ar'
              ? 'أدخل رقم الهاتف المستخدم في الطلب لعرض التفاصيل.'
              : 'Saisissez le numéro de téléphone utilisé lors de la commande pour afficher le récapitulatif.'}
          </p>
          {lookupError && <p className="text-xs text-red-700">{lookupError}</p>}
          <form onSubmit={handleLookup} className="space-y-3">
            <input
              type="tel"
              required
              dir="ltr"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm font-mono-tabular"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#064E3B] text-white text-sm font-semibold"
            >
              {lang === 'ar' ? 'عرض الطلب' : 'Afficher le récapitulatif'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const statusLabel = pickLang(
    lang,
    ORDER_STATUS_LABELS[order.status].fr,
    ORDER_STATUS_LABELS[order.status].ar
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
          <div className="flex items-start gap-3.5">
            <CheckCircle2 className="w-8 h-8 text-[#064E3B] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[#064E3B]">{t.kicker}</p>
              <h1 className="font-display text-3xl font-bold text-zinc-950">{t.title}</h1>
              <p className="text-xs text-zinc-500 mt-1">{t.trackHelp}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-300 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 self-start print:hidden"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printBtn}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-[#F8FAF9] border border-zinc-200 rounded-lg p-4">
          <div>
            <p className="text-xs text-zinc-500">{t.orderNumber}</p>
            <p className="font-mono-tabular font-bold text-zinc-950 mt-0.5">
              {order.orderNumber}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">{t.status}</p>
            <p className="font-semibold text-[#064E3B] mt-0.5">{statusLabel}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">{t.date}</p>
            <p className="text-zinc-900 mt-0.5">{formatDateTime(order.createdAt, lang)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-500">{t.customerInfo}</p>
            <p className="font-semibold text-zinc-950">{order.customerName}</p>
            <p className="font-mono-tabular text-zinc-700">{order.customerPhone}</p>
            <p className="text-zinc-700">
              {order.address}, {order.city}
            </p>
            {order.notes && <p className="text-xs text-zinc-500 pt-1">{order.notes}</p>}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-zinc-500">
              {UI_TEXT[lang].checkout.paymentSection}
            </p>
            <p className="font-semibold text-zinc-950">{t.paymentInfo}</p>
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-950">{t.itemsTitle}</h2>
          <div className="divide-y divide-zinc-100">
            {order.items.map((item, idx) => {
              const name = pickLang(lang, item.nameFr, item.nameAr);
              return (
                <div key={`${item.productId}-${item.size}-${idx}`} className="py-3 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200 shrink-0">
                    <ProductImage
                      src={item.image}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{name}</p>
                    <p className="text-xs text-zinc-500">
                      {item.size} × {item.quantity} ·{' '}
                      <span className="font-mono-tabular">
                        {formatMad(item.unitPriceMad, lang)}
                      </span>
                    </p>
                  </div>
                  <span className="font-mono-tabular text-sm font-semibold text-zinc-950">
                    {formatMad(item.unitPriceMad * item.quantity, lang)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>{UI_TEXT[lang].checkout.subtotal}</span>
            <span className="font-mono-tabular">{formatMad(order.subtotalMad, lang)}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>{UI_TEXT[lang].checkout.shipping}</span>
            <span className="font-mono-tabular">
              {order.shippingMad === 0
                ? UI_TEXT[lang].checkout.free
                : formatMad(order.shippingMad, lang)}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-zinc-950 pt-2 border-t border-zinc-200">
            <span>{UI_TEXT[lang].checkout.total}</span>
            <span className="font-mono-tabular text-[#064E3B]">
              {formatMad(order.totalMad, lang)}
            </span>
          </div>
        </div>

        <div className="pt-2 print:hidden">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C]"
          >
            {t.continueBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
