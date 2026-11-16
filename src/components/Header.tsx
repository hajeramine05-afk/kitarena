import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { pickLang, UI_TEXT } from '../i18n';
import { KitArenaLogo } from './KitArenaLogo';

export function Header() {
  const {
    lang,
    setLang,
    route,
    navigate,
    settings,
    cartCount,
    setCartDrawerOpen,
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = UI_TEXT[lang].nav;
  const currentPath = route.split('?')[0];

  const navItems = [
    { path: '/', label: t.home },
    { path: '/catalogue', label: t.catalog },
    { path: '/livraison', label: t.delivery },
    { path: '/a-propos', label: t.about },
    { path: '/contact', label: t.contact },
  ];

  const handleNav = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Slim non-sticky utility & promo bar (<= 36px) */}
      <div className="bg-[#09090B] text-zinc-200 border-b border-zinc-800 text-xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-9 flex items-center justify-between gap-4">
          <div className="truncate text-zinc-300">
            {settings?.promoBannerEnabled
              ? pickLang(lang, settings.promoBannerFr, settings.promoBannerAr)
              : pickLang(lang, 'Casablanca · Paiement à la livraison', 'الدار البيضاء · الدفع عند الاستلام')}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => handleNav('/suivi')}
              className="hidden sm:inline-block text-zinc-300 hover:text-[#D4AF37] transition-colors whitespace-nowrap"
            >
              {t.track}
            </button>
            <span className="hidden sm:inline text-zinc-700" aria-hidden="true">
              |
            </span>
            <div className="flex items-center gap-1" role="group" aria-label="Langue">
              <button
                type="button"
                onClick={() => setLang('fr')}
                className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  lang === 'fr'
                    ? 'bg-[#064E3B] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setLang('ar')}
                className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  lang === 'ar'
                    ? 'bg-[#064E3B] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                العربية
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Zone Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark + emblem */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/');
            }}
            className="whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] rounded"
          >
            <KitArenaLogo />
          </a>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600">
            {navItems.map((item) => {
              const active =
                item.path === '/'
                  ? currentPath === '/'
                  : currentPath.startsWith(item.path);
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(item.path);
                  }}
                  className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 ${
                    active
                      ? 'text-[#064E3B] border-[#064E3B] font-semibold'
                      : 'border-transparent hover:text-zinc-950 hover:border-zinc-300'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action (Panier) + mobile menu toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] focus-visible:ring-offset-2"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>{t.cart}</span>
              <span className="font-mono-tabular inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded bg-black/25 text-xs text-white">
                {cartCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-zinc-200 text-zinc-800 hover:bg-zinc-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile navigation panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const active =
                item.path === '/'
                  ? currentPath === '/'
                  : currentPath.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleNav(item.path)}
                  className={`w-full text-start px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#064E3B]/10 text-[#064E3B] font-semibold'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handleNav('/suivi')}
              className="w-full text-start px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              {t.track}
            </button>
          </div>
        )}
      </header>
    </>
  );
}
