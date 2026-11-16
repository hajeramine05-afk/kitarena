import { useMemo, useState } from 'react';
import { Eye, EyeOff, ImagePlus, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { ProductImage } from '../ProductImage';
import { formatMad } from '../../i18n';
import { JERSEY_SIZES } from '../../types';
import type { Category, JerseySize, JerseyVersion, Product } from '../../types';

interface AdminProductsTabProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => Promise<void>;
}

const EMPTY_STOCK: Record<JerseySize, number> = { S: 10, M: 10, L: 10, XL: 8, XXL: 4 };

export function AdminProductsTab({ products, categories, onRefresh }: AdminProductsTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [isNewModal, setIsNewModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter === 'published' && !p.isPublished) return false;
      if (statusFilter === 'draft' && p.isPublished) return false;
      if (q) {
        const hay = `${p.nameFr} ${p.nameAr} ${p.teamFr} ${p.season}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, search, statusFilter]);

  const openCreate = () => {
    setFormError(null);
    setNewImageUrl('');
    setIsNewModal(true);
    setEditing({
      nameFr: '',
      nameAr: '',
      teamFr: '',
      teamAr: '',
      categoryIds: categories[0] ? [categories[0].id] : ['clubs-marocains'],
      season: '2025/2026',
      version: 'Supporter',
      priceMad: 320,
      compareAtPriceMad: null,
      descriptionFr: '',
      descriptionAr: '',
      images: [],
      stockBySize: { ...EMPTY_STOCK },
      isPublished: true,
      isNew: true,
      isBestSeller: false,
      isDemo: false,
    });
  };

  const openEdit = (p: Product) => {
    setFormError(null);
    setNewImageUrl('');
    setIsNewModal(false);
    setEditing({
      ...p,
      stockBySize: { ...p.stockBySize },
      images: [...p.images],
      categoryIds: [...p.categoryIds],
    });
  };

  const handleTogglePublish = async (p: Product) => {
    await fetch(`/api/admin/products/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !p.isPublished }),
    });
    await onRefresh();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    setConfirmDeleteId(null);
    await onRefresh();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setFormError(null);
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setFormError(data.error || "Échec de l'envoi de l'image.");
      } else {
        setEditing((prev) =>
          prev ? { ...prev, images: [...(prev.images || []), data.url!] } : prev
        );
      }
    } catch {
      setFormError("Impossible de traiter l'image.");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setFormError(null);
    setSaving(true);
    try {
      const url = isNewModal ? '/api/admin/products' : `/api/admin/products/${editing.id}`;
      const method = isNewModal ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFormError(data.error || 'Erreur lors de la sauvegarde.');
        setSaving(false);
        return;
      }
      setEditing(null);
      await onRefresh();
    } catch {
      setFormError('Erreur réseau.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-zinc-950">Gestion des produits</h2>
          <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">
            {products.length} maillot(s) au total · Remplacez ou publiez vos propres articles
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#053B2C] whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un maillot</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 start-3" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, équipe, saison..."
            className="w-full h-9 ps-9 pe-3 rounded-md border border-zinc-200 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'Tous' },
              { id: 'published', label: 'Publiés' },
              { id: 'draft', label: 'Masqués' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                statusFilter === tab.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs text-zinc-500">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">Maillot</th>
                <th className="py-3 px-4 text-start font-semibold">Équipe & Saison</th>
                <th className="py-3 px-4 text-end font-semibold">Prix</th>
                <th className="py-3 px-4 text-end font-semibold">Stock total</th>
                <th className="py-3 px-4 text-start font-semibold">Statut</th>
                <th className="py-3 px-4 text-end font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((p) => {
                const totalStock = Object.values(p.stockBySize).reduce((s, n) => s + n, 0);
                return (
                  <tr key={p.id} className="hover:bg-zinc-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                          <ProductImage
                            src={p.images[0]}
                            alt={p.nameFr}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-900 truncate max-w-[230px]">
                            {p.nameFr}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {p.version}
                            {p.isDemo ? ' · Démo' : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-700">
                      {p.teamFr} · {p.season}
                    </td>
                    <td className="py-3 px-4 text-end font-mono-tabular font-semibold text-zinc-950">
                      {formatMad(p.priceMad, 'fr')}
                    </td>
                    <td className="py-3 px-4 text-end font-mono-tabular">
                      <span
                        className={`font-semibold ${
                          totalStock === 0
                            ? 'text-red-700'
                            : totalStock <= 10
                              ? 'text-amber-700'
                              : 'text-zinc-900'
                        }`}
                      >
                        {totalStock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium">
                      {p.isPublished ? (
                        <span className="text-[#064E3B] font-semibold">Publié</span>
                      ) : (
                        <span className="text-zinc-500">Masqué</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleTogglePublish(p)}
                          title={p.isPublished ? 'Dépublier' : 'Publier'}
                          className="p-2 rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                        >
                          {p.isPublished ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          title="Modifier"
                          className="p-2 rounded-md border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {confirmDeleteId === p.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void handleDelete(p.id)}
                              className="px-2.5 py-1.5 rounded bg-red-600 text-white text-xs font-semibold"
                            >
                              Confirmer
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded border border-zinc-300 text-xs"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(p.id)}
                            title="Supprimer"
                            className="p-2 rounded-md border border-zinc-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create/Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-zinc-950">
                {isNewModal ? 'Nouveau maillot' : 'Modifier le maillot'}
              </h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {formError && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Nom (FR) *</label>
                  <input
                    type="text"
                    required
                    value={editing.nameFr || ''}
                    onChange={(e) => setEditing({ ...editing, nameFr: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Nom (AR)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={editing.nameAr || ''}
                    onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Équipe (FR) *</label>
                  <input
                    type="text"
                    required
                    value={editing.teamFr || ''}
                    onChange={(e) => setEditing({ ...editing, teamFr: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Équipe (AR)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={editing.teamAr || ''}
                    onChange={(e) => setEditing({ ...editing, teamAr: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Saison *</label>
                  <input
                    type="text"
                    required
                    value={editing.season || ''}
                    onChange={(e) => setEditing({ ...editing, season: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Version</label>
                  <select
                    value={editing.version || 'Supporter'}
                    onChange={(e) =>
                      setEditing({ ...editing, version: e.target.value as JerseyVersion })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 bg-white text-sm"
                  >
                    <option value="Supporter">Supporter</option>
                    <option value="Joueur Pro">Joueur Pro</option>
                    <option value="Rétro">Rétro</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Prix (MAD) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editing.priceMad ?? 0}
                    onChange={(e) =>
                      setEditing({ ...editing, priceMad: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono-tabular"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">
                    Ancien prix (Promo)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editing.compareAtPriceMad ?? ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        compareAtPriceMad: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="Optionnel"
                    className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm font-mono-tabular"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Catégories</label>
                <div className="flex flex-wrap gap-3">
                  {categories.map((cat) => {
                    const checked = (editing.categoryIds || []).includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className="inline-flex items-center gap-2 text-xs font-medium text-zinc-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const prev = editing.categoryIds || [];
                            const next = e.target.checked
                              ? [...prev, cat.id]
                              : prev.filter((id) => id !== cat.id);
                            setEditing({ ...editing, categoryIds: next });
                          }}
                          className="rounded border-zinc-300 text-[#064E3B]"
                        />
                        <span>{cat.nameFr}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Stock by size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Stock par taille</label>
                <div className="grid grid-cols-5 gap-3">
                  {JERSEY_SIZES.map((sz) => (
                    <div key={sz} className="space-y-1">
                      <span className="block text-xs font-semibold text-zinc-600 text-center">
                        {sz}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={editing.stockBySize?.[sz] ?? 0}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            stockBySize: {
                              ...(editing.stockBySize || EMPTY_STOCK),
                              [sz]: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                            },
                          })
                        }
                        className="w-full h-10 px-2 text-center rounded-lg border border-zinc-300 text-sm font-mono-tabular"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Images: URL or Upload */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-700">
                  Photos autorisées du produit
                </label>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Coller une URL d'image (https://... ou /uploads/...)"
                    className="flex-1 min-w-[220px] h-10 px-3 rounded-lg border border-zinc-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newImageUrl.trim()) return;
                      setEditing({
                        ...editing,
                        images: [...(editing.images || []), newImageUrl.trim()],
                      });
                      setNewImageUrl('');
                    }}
                    className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-zinc-300 text-xs font-semibold hover:bg-zinc-100"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span>Ajouter URL</span>
                  </button>

                  <label className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Envoi...' : 'Importer photo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>

                {(editing.images || []).length > 0 && (
                  <div className="flex flex-wrap gap-3 pt-1">
                    {(editing.images || []).map((img, idx) => (
                      <div
                        key={`${img}-${idx}`}
                        className="relative w-24 h-20 rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100"
                      >
                        <ProductImage src={img} alt="Aperçu" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({
                              ...editing,
                              images: (editing.images || []).filter((_, i) => i !== idx),
                            })
                          }
                          aria-label="Supprimer image"
                          className="absolute top-1 end-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Description (FR)</label>
                  <textarea
                    rows={3}
                    value={editing.descriptionFr || ''}
                    onChange={(e) => setEditing({ ...editing, descriptionFr: e.target.value })}
                    className="w-full p-3 rounded-lg border border-zinc-300 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-700">Description (AR)</label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={editing.descriptionAr || ''}
                    onChange={(e) => setEditing({ ...editing, descriptionAr: e.target.value })}
                    className="w-full p-3 rounded-lg border border-zinc-300 text-sm"
                  />
                </div>
              </div>

              {/* Visibility Flags */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-zinc-200 text-xs font-medium text-zinc-800">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.isPublished)}
                    onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })}
                  />
                  <span>Publié sur la boutique</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.isNew)}
                    onChange={(e) => setEditing({ ...editing, isNew: e.target.checked })}
                  />
                  <span>Nouveauté</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.isBestSeller)}
                    onChange={(e) => setEditing({ ...editing, isBestSeller: e.target.checked })}
                  />
                  <span>Meilleure vente</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editing.isDemo)}
                    onChange={(e) => setEditing({ ...editing, isDemo: e.target.checked })}
                  />
                  <span>Marquer comme Démo</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2.5 rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C] disabled:opacity-60"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
