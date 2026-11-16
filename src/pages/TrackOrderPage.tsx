import { useState } from 'react';
import { PackageSearch } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatDateTime, formatMad, ORDER_STATUS_LABELS, pickLang } from '../i18n';
import type { Order } from '../types';

export function TrackOrderPage() {
  const { lang } = useStore();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders/lookup?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
      );
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok || !data.order) {
        setError(
          data.error ||
            (lang === 'ar'
              ? 'لم يتم العثور على طلب مطابق.'
              : 'Aucune commande trouvée avec ces informations.')
        );
      } else {
        setOrder(data.order);
      }
    } catch {
      setError(lang === 'ar' ? 'حدث خطأ في الاتصال.' : 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-[#064E3B] text-sm font-semibold">
          <PackageSearch className="w-5 h-5" />
          <span>{lang === 'ar' ? 'تتبع الطلب' : 'Suivi de commande'}</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-950">
          {lang === 'ar' ? 'تحقق من حالة طلبك' : 'Vérifiez l’état de votre commande'}
        </h1>
        <p className="text-sm text-zinc-600">
          {lang === 'ar'
            ? 'أدخل رقم الطلب (مثال KA-2026-1001) ورقم الهاتف المسجل عند الطلب.'
            : 'Entrez votre numéro de commande (ex : KA-2026-1001) et votre numéro de téléphone.'}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4"
      >
        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700">
              {lang === 'ar' ? 'رقم الطلب' : 'Numéro de commande'}
            </label>
            <input
              type="text"
              required
              dir="ltr"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="KA-2026-1001"
              className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm font-mono-tabular"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700">
              {lang === 'ar' ? 'رقم الهاتف' : 'Téléphone'}
            </label>
            <input
              type="tel"
              required
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 61 23 45 67"
              className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm font-mono-tabular"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C]"
        >
          {loading
            ? lang === 'ar'
              ? 'جاري البحث...'
              : 'Recherche...'
            : lang === 'ar'
              ? 'بحث عن الطلب'
              : 'Rechercher la commande'}
        </button>
      </form>

      {order && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200">
            <div>
              <p className="text-xs text-zinc-500">
                {lang === 'ar' ? 'رقم الطلب' : 'Commande'}
              </p>
              <p className="font-mono-tabular text-lg font-bold text-zinc-950">
                {order.orderNumber}
              </p>
            </div>
            <span className="px-3 py-1 rounded-md bg-[#064E3B]/10 text-[#064E3B] text-xs font-semibold">
              {pickLang(
                lang,
                ORDER_STATUS_LABELS[order.status].fr,
                ORDER_STATUS_LABELS[order.status].ar
              )}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-zinc-500">{lang === 'ar' ? 'المدينة' : 'Ville'}</p>
              <p className="font-medium text-zinc-900">{order.city}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">{lang === 'ar' ? 'التاريخ' : 'Date'}</p>
              <p className="font-medium text-zinc-900">
                {formatDateTime(order.createdAt, lang)}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-100 flex justify-between items-center text-sm font-semibold">
            <span>{lang === 'ar' ? 'الإجمالي عند الاستلام' : 'Total à la livraison'}</span>
            <span className="font-mono-tabular text-[#064E3B]">
              {formatMad(order.totalMad, lang)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
