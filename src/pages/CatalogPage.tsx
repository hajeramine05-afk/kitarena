import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { pickLang, UI_TEXT } from '../i18n';
import { JERSEY_SIZES } from '../types';
import type { JerseySize } from '../types';

export function CatalogPage() {
  const { lang, categories, products, loading, route } = useStore();
  const t = UI_TEXT[lang].catalog;

  const searchParams = useMemo(() => new URLSearchParams(route.split('?')[1] || ''), [route]);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'all'
  );
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedSize, setSelectedSize] = useState<JerseySize | 'all'>('all');
  const [maxPrice, setMaxPrice] = useState<number | 'all'>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'featured');

  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) setSelectedCategory(catParam);
    const sortParam = searchParams.get('sort');
    if (sortParam) setSortBy(sortParam);
  }, [searchParams]);

  const teams = useMemo(() => {
    const map = new Map<string, { fr: string; ar: string }>();
    for (const p of products) {
      if (!map.has(p.teamFr)) {
        map.set(p.teamFr, { fr: p.teamFr, ar: p.teamAr });
      }
    }
    return Array.from(map.values());
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      if (q) {
        const hay = `${p.nameFr} ${p.nameAr} ${p.teamFr} ${p.teamAr} ${p.season}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedCategory !== 'all') {
        if (!p.categoryIds.includes(selectedCategory)) return false;
      }
      if (selectedTeam !== 'all' && p.teamFr !== selectedTeam) {
        return false;
      }
      if (selectedSize !== 'all') {
        if ((p.stockBySize[selectedSize] ?? 0) <= 0) return false;
      }
      if (maxPrice !== 'all' && p.priceMad > maxPrice) {
        return false;
      }
      if (inStockOnly) {
        const total = Object.values(p.stockBySize).reduce((s, n) => s + n, 0);
        if (total <= 0) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sortBy === 'price_asc') {
      sorted.sort((a, b) => a.priceMad - b.priceMad);
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => b.priceMad - a.priceMad);
    } else if (sortBy === 'best') {
      sorted.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller));
    } else {
      sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));
    }
    return sorted;
  }, [products, query, selectedCategory, selectedTeam, selectedSize, maxPrice, inStockOnly, sortBy]);

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedTeam('all');
    setSelectedSize('all');
    setMaxPrice('all');
    setInStockOnly(false);
    setSortBy('featured');
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-950 tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-zinc-600 mt-1 tabular-nums">
            {filtered.length} {t.resultsCount}
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 start-3.5 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            className="w-full h-11 ps-10 pe-4 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          />
        </div>
      </div>

      {/* Category segmented filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            selectedCategory === 'all'
              ? 'bg-[#064E3B] text-white'
              : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          {t.allCategories}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-[#064E3B] text-white'
                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {pickLang(lang, cat.nameFr, cat.nameAr)}
          </button>
        ))}
      </div>

      {/* Secondary filter toolbar */}
      <div className="bg-white border border-zinc-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </span>

          {/* Team */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            aria-label={t.allTeams}
            className="h-9 px-3 rounded-md border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          >
            <option value="all">{t.allTeams}</option>
            {teams.map((tm) => (
              <option key={tm.fr} value={tm.fr}>
                {pickLang(lang, tm.fr, tm.ar)}
              </option>
            ))}
          </select>

          {/* Price */}
          <select
            value={String(maxPrice)}
            onChange={(e) => setMaxPrice(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            aria-label={t.allPrices}
            className="h-9 px-3 rounded-md border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          >
            <option value="all">{t.allPrices}</option>
            <option value="250">{t.max250}</option>
            <option value="350">{t.max350}</option>
            <option value="450">{t.max450}</option>
          </select>

          {/* Sizes */}
          <div className="flex items-center gap-1" role="group" aria-label={t.allSizes}>
            <button
              type="button"
              onClick={() => setSelectedSize('all')}
              className={`h-9 px-2.5 rounded-md text-xs font-medium transition-colors ${
                selectedSize === 'all'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {t.allSizes}
            </button>
            {JERSEY_SIZES.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSize(sz)}
                className={`h-9 min-w-[36px] px-2 rounded-md text-xs font-semibold transition-colors ${
                  selectedSize === sz
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>

          {/* Availability */}
          <label className="inline-flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer select-none px-2">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-zinc-300 text-[#064E3B] focus:ring-[#064E3B]"
            />
            <span>{t.inStockOnly}</span>
          </label>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label htmlFor="catalog-sort" className="text-xs text-zinc-500 whitespace-nowrap">
            {t.sortLabel}
          </label>
          <select
            id="catalog-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 px-3 rounded-md border border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
          >
            <option value="featured">{t.sortFeatured}</option>
            <option value="price_asc">{t.sortPriceAsc}</option>
            <option value="price_desc">{t.sortPriceDesc}</option>
            <option value="best">{t.sortBest}</option>
          </select>
        </div>
      </div>

      {/* Grid / Loading / Empty */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-xl py-16 px-6 text-center space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900">{t.emptyTitle}</h2>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">{t.emptyBody}</p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.resetFilters}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
