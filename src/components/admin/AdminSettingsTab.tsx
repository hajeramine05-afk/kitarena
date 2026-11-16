import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import type { StoreSettings } from '../../types';

interface AdminSettingsTabProps {
  initialSettings: StoreSettings;
  onSaved: () => Promise<void>;
}

export function AdminSettingsTab({ initialSettings, onSaved }: AdminSettingsTabProps) {
  const [form, setForm] = useState<StoreSettings>(() => ({
    ...initialSettings,
    servedCities: initialSettings.servedCities.map((c) => ({ ...c })),
  }));
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error || 'Erreur lors de la sauvegarde.');
      } else {
        setSavedMsg('Paramètres enregistrés et appliqués à la boutique.');
        await onSaved();
      }
    } catch {
      setErrorMsg('Erreur réseau.');
    } finally {
      setSaving(false);
    }
  };

  const addCity = () => {
    setForm({
      ...form,
      servedCities: [
        ...form.servedCities,
        {
          city: '',
          feeMad: form.defaultShippingMad,
          delayFr: '48h',
          delayAr: '48 ساعة',
          active: true,
        },
      ],
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-zinc-950">
            Livraison, Promotions & Contact
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configurez les frais de port, villes desservies, bannière promo et coordonnées.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#053B2C] disabled:opacity-60 whitespace-nowrap shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}</span>
        </button>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded-lg bg-[#064E3B]/10 border border-[#064E3B]/30 text-sm text-[#064E3B] font-medium">
          {savedMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          {errorMsg}
        </div>
      )}

      {/* Shipping & Thresholds */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
        <h3 className="text-base font-semibold text-zinc-950 pb-3 border-b border-zinc-100">
          Règles de livraison et seuils
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">
              Frais par défaut (MAD)
            </label>
            <input
              type="number"
              min={0}
              value={form.defaultShippingMad}
              onChange={(e) =>
                setForm({ ...form, defaultShippingMad: Number(e.target.value) || 0 })
              }
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono-tabular"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">
              Seuil livraison gratuite (MAD)
            </label>
            <input
              type="number"
              min={0}
              value={form.freeShippingThresholdMad}
              onChange={(e) =>
                setForm({ ...form, freeShippingThresholdMad: Number(e.target.value) || 0 })
              }
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono-tabular"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">
              Alerte stock faible (unités)
            </label>
            <input
              type="number"
              min={1}
              value={form.lowStockThreshold}
              onChange={(e) =>
                setForm({ ...form, lowStockThreshold: Math.max(1, Number(e.target.value) || 1) })
              }
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono-tabular"
            />
          </div>
        </div>

        {/* Served Cities */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-zinc-900">Villes desservies</h4>
            <button
              type="button"
              onClick={addCity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 text-xs font-semibold hover:bg-zinc-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une ville</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {form.servedCities.map((cityObj, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-lg border border-zinc-200 bg-zinc-50"
              >
                <input
                  type="text"
                  value={cityObj.city}
                  onChange={(e) => {
                    const next = [...form.servedCities];
                    next[idx] = { ...next[idx], city: e.target.value };
                    setForm({ ...form, servedCities: next });
                  }}
                  placeholder="Ville"
                  className="sm:col-span-3 h-9 px-2.5 rounded border border-zinc-300 bg-white text-xs font-medium"
                />
                <input
                  type="number"
                  min={0}
                  value={cityObj.feeMad}
                  onChange={(e) => {
                    const next = [...form.servedCities];
                    next[idx] = { ...next[idx], feeMad: Number(e.target.value) || 0 };
                    setForm({ ...form, servedCities: next });
                  }}
                  placeholder="MAD"
                  className="sm:col-span-2 h-9 px-2.5 rounded border border-zinc-300 bg-white text-xs font-mono-tabular"
                />
                <input
                  type="text"
                  value={cityObj.delayFr}
                  onChange={(e) => {
                    const next = [...form.servedCities];
                    next[idx] = { ...next[idx], delayFr: e.target.value };
                    setForm({ ...form, servedCities: next });
                  }}
                  placeholder="Délai (FR)"
                  className="sm:col-span-3 h-9 px-2.5 rounded border border-zinc-300 bg-white text-xs"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={cityObj.delayAr}
                  onChange={(e) => {
                    const next = [...form.servedCities];
                    next[idx] = { ...next[idx], delayAr: e.target.value };
                    setForm({ ...form, servedCities: next });
                  }}
                  placeholder="المدة (AR)"
                  className="sm:col-span-2 h-9 px-2.5 rounded border border-zinc-300 bg-white text-xs"
                />
                <div className="sm:col-span-2 flex items-center justify-end gap-2">
                  <label className="inline-flex items-center gap-1.5 text-xs">
                    <input
                      type="checkbox"
                      checked={cityObj.active}
                      onChange={(e) => {
                        const next = [...form.servedCities];
                        next[idx] = { ...next[idx], active: e.target.checked };
                        setForm({ ...form, servedCities: next });
                      }}
                    />
                    <span>Actif</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        servedCities: form.servedCities.filter((_, i) => i !== idx),
                      })
                    }
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Promotions Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <h3 className="text-base font-semibold text-zinc-950">Bannière promotionnelle</h3>
          <label className="inline-flex items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={form.promoBannerEnabled}
              onChange={(e) => setForm({ ...form, promoBannerEnabled: e.target.checked })}
            />
            <span>Afficher en haut du site</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Texte bannière (FR)</label>
            <input
              type="text"
              value={form.promoBannerFr}
              onChange={(e) => setForm({ ...form, promoBannerFr: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Texte bannière (AR)</label>
            <input
              type="text"
              dir="rtl"
              value={form.promoBannerAr}
              onChange={(e) => setForm({ ...form, promoBannerAr: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-semibold text-zinc-950 pb-3 border-b border-zinc-100">
          Coordonnées de la boutique
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Adresse (FR)</label>
            <input
              type="text"
              value={form.addressFr}
              onChange={(e) => setForm({ ...form, addressFr: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Adresse (AR)</label>
            <input
              type="text"
              dir="rtl"
              value={form.addressAr}
              onChange={(e) => setForm({ ...form, addressAr: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Téléphone</label>
            <input
              type="text"
              dir="ltr"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono-tabular"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">WhatsApp</label>
            <input
              type="text"
              dir="ltr"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono-tabular"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">E-mail de contact</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700">Horaires (FR)</label>
            <input
              type="text"
              value={form.hoursFr}
              onChange={(e) => setForm({ ...form, hoursFr: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
