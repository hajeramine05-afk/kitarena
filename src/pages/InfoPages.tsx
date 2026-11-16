import { useState } from 'react';
import { ChevronDown, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatMad, pickLang } from '../i18n';

export function AboutPage() {
  const { lang, settings, navigate } = useStore();
  const isAr = lang === 'ar';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-3 pb-6 border-b border-zinc-200">
        <p className="text-xs font-semibold text-[#064E3B]">
          {isAr ? 'الدار البيضاء · المغرب' : 'Casablanca · Maroc'}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-950">
          {isAr ? 'عن متجر كيت أرينا' : 'À propos de Kit Arena'}
        </h1>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-5 text-sm sm:text-base text-zinc-700 leading-relaxed">
        <p>
          {isAr
            ? 'كيت أرينا هو متجر إلكتروني مقره الدار البيضاء متخصص في قمصان كرة القدم المستوحاة من الشغف الكروي المغربي والدولي. نختار بعناية خامات مريحة وتفاصيل دقيقة لتقديم تجربة تسوق سريعة وموثوقة في جميع أنحاء المغرب.'
            : 'Kit Arena est une boutique en ligne basée à Casablanca, au cœur du quartier Gauthier, dédiée aux amateurs de maillots de football. Nous sélectionnons des pièces soignées, inspirées de l’énergie des stades marocains et internationaux.'}
        </p>
        <p>
          {isAr
            ? 'نؤمن بالبساطة والشفافية: أسعار واضحة بالدرهم المغربي، حالة المخزون محدثة حسب المقاس، وتوصيل مع إمكانية الدفع نقداً عند الاستلام.'
            : 'Notre priorité repose sur la clarté : prix transparents en dirhams marocains (MAD), disponibilité réelle par taille, préparation rapide à Casablanca et paiement à la livraison sur l’ensemble des villes desservies.'}
        </p>

        <div className="p-5 rounded-lg bg-[#F8FAF9] border border-zinc-200 space-y-2 text-sm">
          <h2 className="font-semibold text-zinc-950">
            {isAr ? 'الاستقلالية وحقوق الملكية' : 'Indépendance et transparence'}
          </h2>
          <p className="text-zinc-600">
            {isAr
              ? 'كيت أرينا متجر مستقل ولا يدّعي أي شراكة أو انتماء رسمي لأي نادٍ أو اتحاد رياضي أو علامة تجارية. المنتجات التجريبية المعروضة مخصصة للتوضيح ويمكن للمسؤول استبدالها بمنتجاته وصوره المرخصة من لوحة الإدارة.'
              : 'Kit Arena est une enseigne indépendante et ne prétend à aucune affiliation officielle avec un club, une fédération ou un équipementier. Les articles de démonstration peuvent être remplacés ou mis à jour à tout moment par l’administrateur avec ses propres photos autorisées.'}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/catalogue')}
            className="px-5 py-2.5 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C]"
          >
            {isAr ? 'تصفح الكتالوج' : 'Découvrir le catalogue'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/contact')}
            className="px-5 py-2.5 rounded-lg border border-zinc-300 text-zinc-800 text-sm font-medium hover:bg-zinc-100"
          >
            {isAr ? 'تواصل معنا' : 'Nous contacter'}
          </button>
        </div>
      </div>

      {settings && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-1">
            <p className="text-xs text-zinc-500">{isAr ? 'العنوان' : 'Adresse'}</p>
            <p className="font-medium text-zinc-900">
              {pickLang(lang, settings.addressFr, settings.addressAr)}
            </p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-1">
            <p className="text-xs text-zinc-500">{isAr ? 'الهاتف' : 'Téléphone'}</p>
            <p className="font-mono-tabular font-medium text-zinc-900">{settings.phone}</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-5 space-y-1">
            <p className="text-xs text-zinc-500">{isAr ? 'ساعات العمل' : 'Horaires'}</p>
            <p className="font-medium text-zinc-900">
              {pickLang(lang, settings.hoursFr, settings.hoursAr)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function DeliveryReturnsPage() {
  const { lang, settings } = useStore();
  const isAr = lang === 'ar';
  const activeCities = (settings?.servedCities || []).filter((c) => c.active);
  const threshold = settings?.freeShippingThresholdMad ?? 600;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-2 pb-6 border-b border-zinc-200">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-950">
          {isAr ? 'التوصيل والاستبدال' : 'Livraison et retours'}
        </h1>
        <p className="text-sm text-zinc-600">
          {isAr
            ? `توصيل مجاني ابتداءً من ${formatMad(threshold, lang)} في جميع المدن المغربية المشمولة.`
            : `Livraison gratuite dès ${formatMad(threshold, lang)} d'achat partout au Maroc.`}
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <h2 className="text-base font-semibold text-zinc-950">
            {isAr ? 'المدن المغطاة ورسوم التوصيل' : 'Villes desservies et tarifs de livraison'}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500">
              <tr>
                <th className="py-3 px-6 text-start font-semibold">
                  {isAr ? 'المدينة' : 'Ville'}
                </th>
                <th className="py-3 px-6 text-start font-semibold">
                  {isAr ? 'المدة المتوقعة' : 'Délai estimé'}
                </th>
                <th className="py-3 px-6 text-end font-semibold">
                  {isAr ? 'التكلفة' : 'Tarif'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {activeCities.map((c) => (
                <tr key={c.city} className="hover:bg-zinc-50/70">
                  <td className="py-3.5 px-6 font-medium text-zinc-900">{c.city}</td>
                  <td className="py-3.5 px-6 text-zinc-600">
                    {pickLang(lang, c.delayFr, c.delayAr)}
                  </td>
                  <td className="py-3.5 px-6 text-end font-mono-tabular font-semibold text-zinc-950">
                    {formatMad(c.feeMad, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-2.5">
          <h3 className="text-base font-semibold text-zinc-950">
            {isAr ? 'الدفع عند الاستلام' : 'Paiement à la livraison'}
          </h3>
          <p className="text-sm text-zinc-600 leading-relaxed">
            {isAr
              ? 'الدفع يتم نقداً بالدرهم المغربي عند استلام الطلب من الموزع. الدفع الإلكتروني بالبطاقة غير مفعّل حالياً.'
              : 'Le règlement s’effectue en espèces (MAD) à la remise du colis par notre livreur. Aucun paiement par carte en ligne n’est actif sur la boutique.'}
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-2.5">
          <h3 className="text-base font-semibold text-zinc-950">
            {isAr ? 'سياسة الاستبدال والإرجاع (7 أيام)' : 'Politique de retours et échanges (7 jours)'}
          </h3>
          <p className="text-sm text-zinc-600 leading-relaxed">
            {isAr
              ? 'يمكنك طلب استبدال المقاس أو إرجاع المنتج خلال 7 أيام من الاستلام شرط أن يكون جديداً غير ملبوس وببطاقته الأصلية.'
              : 'Vous disposez de 7 jours après réception pour demander un échange de taille ou un retour, à condition que le maillot n’ait pas été porté ni lavé et conserve ses étiquettes.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ContactPage() {
  const { lang, settings } = useStore();
  const isAr = lang === 'ar';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, subject, message }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error || "Impossible d'envoyer le message.");
      } else {
        setSent(true);
        setName('');
        setPhone('');
        setEmail('');
        setSubject('');
        setMessage('');
      }
    } catch {
      setError(isAr ? 'حدث خطأ أثناء الإرسال.' : "Erreur réseau lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-2 pb-6 border-b border-zinc-200">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-950">
          {isAr ? 'اتصل بنا' : 'Contactez Kit Arena'}
        </h1>
        <p className="text-sm text-zinc-600">
          {isAr
            ? 'فريقنا في الدار البيضاء رهن إشارتكم لأي استفسار حول المقاسات أو الطلبات.'
            : 'Notre équipe à Casablanca répond à vos questions sur les tailles, stocks et livraisons.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 space-y-5 text-sm">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#064E3B] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-950">{isAr ? 'العنوان' : 'Boutique & retrait'}</p>
              <p className="text-zinc-600 mt-0.5">
                {settings
                  ? pickLang(lang, settings.addressFr, settings.addressAr)
                  : "Boulevard d'Anfa, Quartier Gauthier, Casablanca"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-[#064E3B] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-950">{isAr ? 'الهاتف وواتساب' : 'Téléphone & WhatsApp'}</p>
              <p className="font-mono-tabular text-zinc-700 mt-0.5">{settings?.phone}</p>
              <p className="font-mono-tabular text-zinc-500 text-xs mt-0.5">
                WhatsApp : {settings?.whatsapp}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-[#064E3B] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-950">{isAr ? 'البريد الإلكتروني' : 'E-mail'}</p>
              <p className="text-zinc-700 mt-0.5">{settings?.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-[#064E3B] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-950">{isAr ? 'ساعات العمل' : 'Horaires'}</p>
              <p className="text-zinc-600 mt-0.5">
                {settings ? pickLang(lang, settings.hoursFr, settings.hoursAr) : 'Lun – Sam : 10h – 20h'}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 space-y-4"
        >
          {sent && (
            <div className="p-4 rounded-lg bg-[#064E3B]/10 border border-[#064E3B]/30 text-sm text-[#064E3B] font-medium">
              {isAr
                ? 'تم استلام رسالتك بنجاح. سنتواصل معك في أقرب وقت.'
                : 'Votre message a bien été enregistré. Notre équipe vous répondra rapidement.'}
            </div>
          )}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700">
                {isAr ? 'الاسم الكامل' : 'Nom complet'} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700">
                {isAr ? 'الهاتف' : 'Téléphone'}
              </label>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm font-mono-tabular"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700">
                {isAr ? 'البريد الإلكتروني' : 'E-mail'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700">
                {isAr ? 'الموضوع' : 'Sujet'}
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-700">
              {isAr ? 'الرسالة' : 'Message'} *
            </label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 rounded-lg border border-zinc-300 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C]"
          >
            <Send className="w-4 h-4" />
            <span>
              {sending
                ? isAr
                  ? 'جاري الإرسال...'
                  : 'Envoi en cours...'
                : isAr
                  ? 'إرسال الرسالة'
                  : 'Envoyer le message'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}

export function FaqPage() {
  const { lang } = useStore();
  const isAr = lang === 'ar';
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const items = isAr
    ? [
        {
          q: 'كيف أختار المقاس المناسب؟',
          a: 'نسخة «Supporter» تأتي بقصة مريحة عادية، بينما نسخة «Joueur Pro» تكون أكثر تحديداً على الجسم. إذا كنت بين مقاسين في نسخة Joueur Pro، ننصحك باختيار المقاس الأكبر.',
        },
        {
          q: 'ما هي طرق الدفع المتاحة؟',
          a: 'نوفر حالياً الدفع نقداً عند الاستلام (بالدرهم المغربي) في جميع المدن المغطاة. الدفع الإلكتروني بالبطاقة غير مفعّل في الوقت الحالي.',
        },
        {
          q: 'كم تستغرق مدة التوصيل؟',
          a: 'في الدار البيضاء والمحمدية يتم التوصيل خلال 24 ساعة. أما الرباط، مراكش، طنجة، فاس وباقي المدن فتتراوح المدة بين 24 و72 ساعة.',
        },
        {
          q: 'هل يمكنني استبدال المقاس بعد الاستلام؟',
          a: 'نعم، يمكنك طلب استبدال المقاس خلال 7 أيام من الاستلام شريطة بقاء القميص بحالته الأصلية غير مستعمل.',
        },
      ]
    : [
        {
          q: 'Quelle différence entre version Supporter, Joueur Pro et Rétro ?',
          a: 'La version Supporter offre une coupe droite confortable pour un usage quotidien. La version Joueur Pro propose une coupe athlétique plus ajustée en maille technique légère. La version Rétro privilégie une coupe héritage classique.',
        },
        {
          q: 'Comment fonctionne le paiement à la livraison ?',
          a: 'Vous passez commande sans avancer de frais en ligne et vous réglez le montant total en dirhams (MAD) directement en espèces au livreur à la réception du colis. Aucun paiement par carte en ligne n’est activé.',
        },
        {
          q: 'Quels sont les délais de livraison depuis Casablanca ?',
          a: 'Sur Casablanca et Mohammedia, la livraison s’effectue sous 24h ouvrées. Vers Rabat, Marrakech, Tanger, Fès, Agadir et les autres villes du Maroc, comptez 24h à 72h.',
        },
        {
          q: 'Puis-je changer de taille si le maillot ne me convient pas ?',
          a: 'Oui, vous disposez de 7 jours après réception pour demander un échange de taille, à condition que l’article soit neuf, non porté et avec son étiquette.',
        },
      ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-950 pb-4 border-b border-zinc-200">
        {isAr ? 'الأسئلة الشائعة' : 'Foire aux questions (FAQ)'}
      </h1>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const open = openIdx === idx;
          return (
            <div
              key={item.q}
              className="bg-white border border-zinc-200 rounded-xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between gap-4 text-start font-semibold text-sm sm:text-base text-zinc-950 hover:bg-zinc-50"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-zinc-500 transition-transform ${
                    open ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {open && (
                <div className="px-6 pb-5 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TermsPage() {
  const { lang } = useStore();
  const isAr = lang === 'ar';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-zinc-950 pb-4 border-b border-zinc-200">
        {isAr ? 'الشروط والأحكام العامة' : 'Conditions générales de vente'}
      </h1>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 space-y-5 text-sm text-zinc-700 leading-relaxed">
        <section className="space-y-1.5">
          <h2 className="font-semibold text-zinc-950">
            {isAr ? '1. الأسعار والعملة' : '1. Prix et devise'}
          </h2>
          <p>
            {isAr
              ? 'جميع الأسعار المعروضة على موقع كيت أرينا هي بالدرهم المغربي (MAD) ولا تشمل رسوم التوصيل إلا عند بلوغ عتبة التوصيل المجاني.'
              : 'Tous les prix affichés sur Kit Arena sont exprimés en dirhams marocains (MAD). Les frais de livraison s’ajoutent selon la ville sélectionnée, sauf lorsque la commande atteint le seuil de livraison gratuite.'}
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-semibold text-zinc-950">
            {isAr ? '2. الدفع عند الاستلام' : '2. Modalités de paiement'}
          </h2>
          <p>
            {isAr
              ? 'يتم الدفع نقداً عند استلام الطرد. لا يطلب الموقع أي بيانات بطاقة بنكية في الوقت الحالي.'
              : 'Le règlement des commandes s’effectue exclusivement en espèces à la livraison. Aucun prestataire de paiement par carte bancaire en ligne n’est activé.'}
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-semibold text-zinc-950">
            {isAr ? '3. حماية المعطيات الشخصية' : '3. Données personnelles'}
          </h2>
          <p>
            {isAr
              ? 'تُستخدم معلومات العميل (الاسم، الهاتف، المدينة، العنوان) حصرياً لمعالجة الطلب وتوصيله.'
              : 'Les informations saisies lors de la commande (nom, téléphone, ville, adresse) sont utilisées exclusivement pour le traitement et l’acheminement de votre colis.'}
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-semibold text-zinc-950">
            {isAr ? '4. استقلالية المتجر' : '4. Statut indépendant'}
          </h2>
          <p>
            {isAr
              ? 'كيت أرينا متجر مستقل بالدار البيضاء غير تابع رسمياً لأي نادٍ رياضي أو علامة مصنّعة.'
              : 'Kit Arena est un commerce indépendant situé à Casablanca sans affiliation officielle aux clubs sportifs, fédérations ou équipementiers.'}
          </p>
        </section>
      </div>
    </div>
  );
}
