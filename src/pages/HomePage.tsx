import { ArrowLeft, ArrowRight, CheckCircle2, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { formatMad, pickLang, UI_TEXT } from '../i18n';

export function HomePage() {
  const { lang, categories, products, settings, loading, navigate } = useStore();
  const tHero = UI_TEXT[lang].hero;
  const tHome = UI_TEXT[lang].home;
  const ArrowIcon = lang === 'ar' ? ArrowLeft : ArrowRight;

  const newArrivals = products.filter((p) => p.isNew).slice(0, 3);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 3);
  const fallbackNew = newArrivals.length > 0 ? newArrivals : products.slice(0, 3);
  const fallbackBest = bestSellers.length > 0 ? bestSellers : products.slice(0, 3);

  const freeThreshold = settings?.freeShippingThresholdMad ?? 600;

  return (
    <div>
      {/* 1. Hero Focal Showcase */}
      <section className="relative bg-[#09090B] text-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/hero_casablanca_stadium_1794857253103.jpg"
            alt={
              lang === 'ar'
                ? 'ملعب كرة القدم في الدار البيضاء عند الغروب'
                : 'Stade de football à Casablanca au crépuscule'
            }
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-70"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#09090B]/95 via-[#09090B]/75 to-[#09090B]/30"
            aria-hidden="true"
          />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-32">
          <div className="max-w-2xl space-y-6">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[#D4AF37]">
              {tHero.kicker}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.06] tracking-tight [text-wrap:balance]">
              {tHero.title}
            </h1>
            <p className="text-base sm:text-lg text-zinc-200 leading-relaxed max-w-xl">
              {tHero.subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => navigate('/catalogue')}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#064E3B] hover:bg-[#08634B] text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
              >
                <span>{tHero.cta}</span>
                <ArrowIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/livraison')}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-zinc-200 hover:text-[#D4AF37] transition-colors"
              >
                {tHero.secondaryCta}
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Category Strip */}
        <div className="relative border-t border-white/10 bg-black/55 backdrop-blur-sm">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => navigate('/catalogue')}
              className="px-3.5 py-2 rounded-md text-xs font-semibold text-white bg-white/10 hover:bg-[#064E3B] transition-colors whitespace-nowrap shrink-0"
            >
              {tHome.allJerseys}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate(`/catalogue?category=${encodeURIComponent(cat.slug)}`)}
                className="px-3.5 py-2 rounded-md text-xs font-medium text-zinc-200 hover:bg-white/15 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                {pickLang(lang, cat.nameFr, cat.nameAr)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Nouveautés */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-zinc-950 tracking-tight">
              {tHome.newArrivals}
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 mt-1">{tHome.newArrivalsSub}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/catalogue?category=nouveaux-maillots')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#064E3B] hover:text-[#053B2C] whitespace-nowrap shrink-0"
          >
            <span>{tHome.viewAll}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-zinc-200" />
                <div className="p-4 space-y-3">
                  <div className="h-3 w-1/2 bg-zinc-200 rounded" />
                  <div className="h-4 w-5/6 bg-zinc-200 rounded" />
                  <div className="h-4 w-1/3 bg-zinc-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {fallbackNew.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Meilleures Ventes */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-zinc-950 tracking-tight">
              {tHome.bestSellers}
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 mt-1">{tHome.bestSellersSub}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/catalogue?sort=best')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#064E3B] hover:text-[#053B2C] whitespace-nowrap shrink-0"
          >
            <span>{tHome.viewAll}</span>
            <ArrowIcon className="w-4 h-4" />
          </button>
        </div>

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {fallbackBest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Casablanca Delivery & Independence Trust Section */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 tracking-tight">
              {tHome.trustTitle}
            </h2>
            <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
              {tHome.trustDesc}
            </p>
            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-1.5">
              <p className="text-xs font-semibold text-zinc-900">{tHome.disclaimerTitle}</p>
              <p className="text-xs text-zinc-600 leading-relaxed">{tHome.disclaimerBody}</p>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 rounded-lg border border-zinc-200 bg-[#F8FAF9] space-y-2">
              <CheckCircle2 className="w-5 h-5 text-[#064E3B]" />
              <h3 className="text-sm font-semibold text-zinc-950">{tHome.trustCodTitle}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">{tHome.trustCodDesc}</p>
            </div>
            <div className="p-5 rounded-lg border border-zinc-200 bg-[#F8FAF9] space-y-2">
              <Truck className="w-5 h-5 text-[#064E3B]" />
              <h3 className="text-sm font-semibold text-zinc-950">
                {tHome.trustFreeTitle}{' '}
                <span className="font-mono-tabular text-[#064E3B]">
                  {formatMad(freeThreshold, lang)}
                </span>
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {lang === 'ar'
                  ? 'توصيل سريع خلال 24 ساعة في الدار البيضاء ومن 24 إلى 72 ساعة لباقي المدن.'
                  : 'Expédition 24h sur Casablanca et 24h à 72h vers les principales villes du Royaume.'}
              </p>
            </div>
            <div className="p-5 rounded-lg border border-zinc-200 bg-[#F8FAF9] space-y-2">
              <RefreshCw className="w-5 h-5 text-[#064E3B]" />
              <h3 className="text-sm font-semibold text-zinc-950">{tHome.trustReturnTitle}</h3>
              <p className="text-xs text-zinc-600 leading-relaxed">{tHome.trustReturnDesc}</p>
            </div>
            <div className="p-5 rounded-lg border border-zinc-200 bg-[#F8FAF9] space-y-2">
              <ShieldCheck className="w-5 h-5 text-[#064E3B]" />
              <h3 className="text-sm font-semibold text-zinc-950">
                {lang === 'ar' ? 'صور ومخزون محدّث' : 'Stock vérifié en direct'}
              </h3>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {lang === 'ar'
                  ? 'يتم التحقق من توفر كل مقاس بشكل فوري قبل تأكيد الطلب.'
                  : 'Les quantités par taille sont vérifiées et réservées dès la validation.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
