import { useStore } from '../context/StoreContext';
import { pickLang, UI_TEXT } from '../i18n';
import { KitArenaLogo } from './KitArenaLogo';

export function Footer() {
  const { lang, navigate, settings } = useStore();
  const tNav = UI_TEXT[lang].nav;
  const tFoot = UI_TEXT[lang].footer;

  const linkClass =
    'text-sm text-zinc-400 hover:text-white transition-colors text-start';

  return (
    <footer className="bg-[#09090B] text-zinc-300 border-t border-zinc-800 mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-zinc-800">
          <div className="space-y-4">
            <KitArenaLogo inverted />
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
              {tFoot.disclaimer}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">{tFoot.shopCol}</h4>
            <ul className="space-y-2.5 flex flex-col items-start">
              <li>
                <button type="button" onClick={() => navigate('/')} className={linkClass}>
                  {tNav.home}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/catalogue')} className={linkClass}>
                  {tNav.catalog}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/panier')} className={linkClass}>
                  {tNav.cart}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/suivi')} className={linkClass}>
                  {tNav.track}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">{tFoot.infoCol}</h4>
            <ul className="space-y-2.5 flex flex-col items-start">
              <li>
                <button type="button" onClick={() => navigate('/a-propos')} className={linkClass}>
                  {tNav.about}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/livraison')} className={linkClass}>
                  {lang === 'ar' ? 'التوصيل والاستبدال' : 'Livraison et retours'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/faq')} className={linkClass}>
                  {lang === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/conditions')} className={linkClass}>
                  {lang === 'ar' ? 'الشروط والأحكام' : 'Conditions générales'}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => navigate('/contact')} className={linkClass}>
                  {tNav.contact}
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">{tFoot.contactCol}</h4>
            <div className="text-sm text-zinc-400 space-y-2 leading-relaxed">
              <p>
                {settings
                  ? pickLang(lang, settings.addressFr, settings.addressAr)
                  : "Boulevard d'Anfa, Quartier Gauthier, Casablanca"}
              </p>
              <p className="font-mono-tabular text-zinc-300">
                {settings?.phone || '+212 5 22 00 00 00'}
              </p>
              <p>{settings?.email || 'contact@kitarena.ma'}</p>
              <p>
                {settings
                  ? pickLang(lang, settings.hoursFr, settings.hoursAr)
                  : 'Lun – Sam : 10h00 – 20h00'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>
            © {new Date().getFullYear()} {tFoot.rights}
          </p>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="text-zinc-400 hover:text-[#D4AF37] transition-colors font-medium"
          >
            {tNav.admin}
          </button>
        </div>
      </div>
    </footer>
  );
}
