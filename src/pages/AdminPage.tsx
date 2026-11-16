import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ExternalLink,
  FolderTree,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  Package,
  Plus,
  Settings,
  Shirt,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { KitArenaLogo } from '../components/KitArenaLogo';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { useStore } from '../context/StoreContext';
import { formatDateTime, formatMad, ORDER_STATUS_LABELS } from '../i18n';
import type {
  AdminDashboardStats,
  AdminUserSession,
  Category,
  ContactMessage,
  Order,
  Product,
  StoreSettings,
} from '../types';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'settings'
  | 'messages'
  | 'security';

export function AdminPage() {
  const { navigate, refreshStorefront } = useStore();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);
  const [changingPwd, setChangingPwd] = useState(false);

  // Admin workspace data
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminSettings, setAdminSettings] = useState<StoreSettings | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Category creation state
  const [newCatFr, setNewCatFr] = useState('');
  const [newCatAr, setNewCatAr] = useState('');

  const loadAdminWorkspace = useCallback(async () => {
    setLoadingData(true);
    try {
      const [dashRes, prodRes, catRes, ordRes, setRes, msgRes] = await Promise.all([
        fetch('/api/admin/dashboard'),
        fetch('/api/admin/products'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/messages'),
      ]);

      if (dashRes.ok) {
        const d = (await dashRes.json()) as { stats: AdminDashboardStats };
        setStats(d.stats);
      }
      if (prodRes.ok) {
        const p = (await prodRes.json()) as { products: Product[] };
        setAdminProducts(p.products);
      }
      if (catRes.ok) {
        const c = (await catRes.json()) as { categories: Category[] };
        setAdminCategories(c.categories);
      }
      if (ordRes.ok) {
        const o = (await ordRes.json()) as { orders: Order[] };
        setAdminOrders(o.orders);
      }
      if (setRes.ok) {
        const s = (await setRes.json()) as { settings: StoreSettings };
        setAdminSettings(s.settings);
      }
      if (msgRes.ok) {
        const m = (await msgRes.json()) as { messages: ContactMessage[] };
        setMessages(m.messages);
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadAdminWorkspace(), refreshStorefront()]);
  }, [loadAdminWorkspace, refreshStorefront]);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => res.json())
      .then((data: { authenticated: boolean; admin: AdminUserSession | null }) => {
        if (data.authenticated && data.admin) {
          setAdminUser(data.admin);
          if (!data.admin.mustChangePassword) {
            void loadAdminWorkspace();
          }
        }
      })
      .finally(() => setCheckingAuth(false));
  }, [loadAdminWorkspace]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json()) as {
        authenticated?: boolean;
        admin?: AdminUserSession;
        error?: string;
      };
      if (!res.ok || !data.admin) {
        setLoginError(data.error || 'Identifiants invalides.');
        setLoggingIn(false);
        return;
      }
      setAdminUser(data.admin);
      setPassword('');
      if (!data.admin.mustChangePassword) {
        await loadAdminWorkspace();
      }
    } catch {
      setLoginError('Erreur de connexion au serveur.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword.length < 8) {
      setPwdError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    setChangingPwd(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { admin?: AdminUserSession; error?: string };
      if (!res.ok || !data.admin) {
        setPwdError(data.error || 'Impossible de modifier le mot de passe.');
        setChangingPwd(false);
        return;
      }
      setAdminUser(data.admin);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwdSuccess('Mot de passe mis à jour avec succès.');
      await loadAdminWorkspace();
    } catch {
      setPwdError('Erreur réseau.');
    } finally {
      setChangingPwd(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAdminUser(null);
    setStats(null);
    setUsername('');
    setPassword('');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatFr.trim()) return;
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nameFr: newCatFr.trim(),
        nameAr: newCatAr.trim() || newCatFr.trim(),
        sortOrder: adminCategories.length + 1,
      }),
    });
    if (res.ok) {
      setNewCatFr('');
      setNewCatAr('');
      await refreshAll();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    await refreshAll();
  };

  const handleMarkMessageRead = async (id: string) => {
    await fetch(`/api/admin/messages/${id}/read`, { method: 'PATCH' });
    await loadAdminWorkspace();
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6">
        <p className="text-sm text-zinc-600">Vérification de la session...</p>
      </div>
    );
  }

  // 1. Login View
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-zinc-200 rounded-xl p-7 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <KitArenaLogo />
            <Lock className="w-5 h-5 text-[#064E3B]" />
          </div>

          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-zinc-950">
              Espace d’administration
            </h1>
            <p className="text-xs text-zinc-500">
              Accès réservé à l’équipe Kit Arena Casablanca.
            </p>
          </div>

          {loginError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium"
            >
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="adm-user" className="block text-xs font-semibold text-zinc-700">
                Nom d’utilisateur
              </label>
              <input
                id="adm-user"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="adm-pass" className="block text-xs font-semibold text-zinc-700">
                Mot de passe
              </label>
              <input
                id="adm-pass"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#064E3B]"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C] disabled:opacity-60"
            >
              {loggingIn ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="pt-4 border-t border-zinc-200 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-zinc-600 hover:text-zinc-950 font-medium"
            >
              Retour à la boutique
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Mandatory First-Login Password Change Gate
  if (adminUser.mustChangePassword) {
    return (
      <div className="min-h-screen bg-[#09090B] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-zinc-200 rounded-xl p-7 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <KitArenaLogo />
            <KeyRound className="w-5 h-5 text-[#B45309]" />
          </div>

          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold text-zinc-950">
              Changement de mot de passe requis
            </h1>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Pour sécuriser votre boutique dès votre première connexion, vous devez remplacer le
              mot de passe initial avant d’accéder au tableau de bord.
            </p>
          </div>

          {pwdError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {pwdError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700">
                Mot de passe actuel
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700">
                Nouveau mot de passe (8 caractères minimum)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-zinc-700">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-zinc-300 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={changingPwd}
              className="w-full py-3 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C]"
            >
              {changingPwd ? 'Enregistrement...' : 'Enregistrer et accéder au tableau de bord'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // 3. Full Admin Workspace
  const unreadMessagesCount = messages.filter((m) => !m.isRead).length;
  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'products', label: 'Produits', icon: <Shirt className="w-4 h-4" /> },
    { id: 'categories', label: 'Catégories', icon: <FolderTree className="w-4 h-4" /> },
    { id: 'orders', label: 'Commandes', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'settings', label: 'Livraison & Promo', icon: <Settings className="w-4 h-4" /> },
    {
      id: 'messages',
      label: unreadMessagesCount > 0 ? `Messages (${unreadMessagesCount})` : 'Messages',
      icon: <Mail className="w-4 h-4" />,
    },
    { id: 'security', label: 'Sécurité', icon: <KeyRound className="w-4 h-4" /> },
  ];

  return (
    <div dir="ltr" lang="fr" className="min-h-screen bg-[#F8FAF9] text-zinc-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#09090B] text-zinc-200 shrink-0 flex flex-col justify-between border-e border-zinc-800">
        <div>
          <div className="px-5 py-5 border-b border-zinc-800 flex items-center justify-between">
            <KitArenaLogo inverted />
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#064E3B] text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800 space-y-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            <span>Voir la boutique</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-zinc-800"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion ({adminUser.username})</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-zinc-500">
            Administration / <span className="text-zinc-950 font-semibold">{navItems.find((n) => n.id === activeTab)?.label}</span>
          </p>
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="text-xs font-semibold text-[#064E3B] hover:underline whitespace-nowrap"
          >
            Actualiser
          </button>
        </header>

        <main className="p-6 lg:p-8 max-w-6xl w-full space-y-8">
          {loadingData && !stats ? (
            <div className="py-12 text-sm text-zinc-500">Chargement des données...</div>
          ) : (
            <>
              {activeTab === 'overview' && stats && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-1">
                      <p className="text-xs font-medium text-zinc-500">Total commandes</p>
                      <p className="font-mono-tabular text-2xl font-bold text-zinc-950">
                        {stats.totalOrders}
                      </p>
                      <p className="text-xs text-zinc-500 tabular-nums">
                        {stats.pendingOrders} en cours · {stats.deliveredOrders} livrées
                      </p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-1">
                      <p className="text-xs font-medium text-zinc-500">Ventes (hors annulées)</p>
                      <p className="font-mono-tabular text-2xl font-bold text-[#064E3B]">
                        {formatMad(stats.totalRevenueMad, 'fr')}
                      </p>
                      <p className="text-xs text-zinc-500">Paiement à la livraison</p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-1">
                      <p className="text-xs font-medium text-zinc-500">Catalogue publié</p>
                      <p className="font-mono-tabular text-2xl font-bold text-zinc-950">
                        {stats.publishedProducts} / {stats.totalProducts}
                      </p>
                      <p className="text-xs text-zinc-500">Maillots visibles en ligne</p>
                    </div>

                    <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-1">
                      <p className="text-xs font-medium text-zinc-500">Alertes stock faible</p>
                      <p
                        className={`font-mono-tabular text-2xl font-bold ${
                          stats.lowStockItems.length > 0 ? 'text-amber-700' : 'text-zinc-950'
                        }`}
                      >
                        {stats.lowStockItems.length}
                      </p>
                      <p className="text-xs text-zinc-500">Tailles à réapprovisionner</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Recent Orders */}
                    <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-zinc-950 flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#064E3B]" />
                          <span>Commandes récentes</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab('orders')}
                          className="text-xs font-semibold text-[#064E3B] hover:underline"
                        >
                          Tout voir
                        </button>
                      </div>
                      <div className="divide-y divide-zinc-100">
                        {stats.recentOrders.map((o) => (
                          <div
                            key={o.id}
                            className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm"
                          >
                            <div>
                              <p className="font-mono-tabular font-semibold text-zinc-950">
                                {o.orderNumber}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {o.customerName} · {o.city}
                              </p>
                            </div>
                            <div className="text-end">
                              <p className="font-mono-tabular font-semibold text-zinc-950">
                                {formatMad(o.totalMad, 'fr')}
                              </p>
                              <p className="text-xs text-zinc-600">
                                {ORDER_STATUS_LABELS[o.status].fr}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-zinc-950 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Produits en stock faible</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => setActiveTab('products')}
                          className="text-xs font-semibold text-[#064E3B] hover:underline"
                        >
                          Gérer
                        </button>
                      </div>
                      <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                        {stats.lowStockItems.length === 0 ? (
                          <p className="p-5 text-xs text-zinc-500">
                            Toutes les tailles disposent d’un stock suffisant.
                          </p>
                        ) : (
                          stats.lowStockItems.map((item, idx) => (
                            <div
                              key={`${item.productId}-${item.size}-${idx}`}
                              className="px-5 py-3 flex items-center justify-between gap-3 text-xs"
                            >
                              <span className="font-medium text-zinc-900 truncate">
                                {item.nameFr} ({item.size})
                              </span>
                              <span
                                className={`font-mono-tabular font-bold shrink-0 ${
                                  item.stock === 0 ? 'text-red-700' : 'text-amber-700'
                                }`}
                              >
                                {item.stock} restant(s)
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'products' && (
                <AdminProductsTab
                  products={adminProducts}
                  categories={adminCategories}
                  onRefresh={refreshAll}
                />
              )}

              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-zinc-950">
                      Gestion des catégories
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Organisez les sections du catalogue public.
                    </p>
                  </div>

                  <form
                    onSubmit={handleCreateCategory}
                    className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-wrap items-end gap-3"
                  >
                    <div className="flex-1 min-w-[200px] space-y-1">
                      <label className="text-xs font-semibold text-zinc-700">Nom (FR) *</label>
                      <input
                        type="text"
                        required
                        value={newCatFr}
                        onChange={(e) => setNewCatFr(e.target.value)}
                        placeholder="Ex : Éditions Rétro"
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                      />
                    </div>
                    <div className="flex-1 min-w-[200px] space-y-1">
                      <label className="text-xs font-semibold text-zinc-700">Nom (AR)</label>
                      <input
                        type="text"
                        dir="rtl"
                        value={newCatAr}
                        onChange={(e) => setNewCatAr(e.target.value)}
                        placeholder="إصدارات كلاسيكية"
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#064E3B] text-white text-xs font-semibold hover:bg-[#053B2C]"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter</span>
                    </button>
                  </form>

                  <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
                    {adminCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-zinc-900">{cat.nameFr}</p>
                          <p className="text-xs text-zinc-500">
                            {cat.nameAr} · slug: <span className="font-mono">{cat.slug}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCategory(cat.id)}
                          className="p-2 rounded-md border border-zinc-200 text-red-600 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <AdminOrdersTab orders={adminOrders} onRefresh={refreshAll} />
              )}

              {activeTab === 'settings' && adminSettings && (
                <AdminSettingsTab initialSettings={adminSettings} onSaved={refreshAll} />
              )}

              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-zinc-950">
                      Messages clients
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Demandes envoyées depuis le formulaire Contact.
                    </p>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-xl divide-y divide-zinc-100">
                    {messages.length === 0 ? (
                      <p className="p-8 text-center text-sm text-zinc-500">
                        Aucun message reçu pour le moment.
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className="p-5 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-semibold text-zinc-950 text-sm">
                                {msg.name}
                              </span>{' '}
                              <span className="text-xs text-zinc-500">
                                · {msg.phone} {msg.email ? `· ${msg.email}` : ''}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-zinc-500">
                                {formatDateTime(msg.createdAt, 'fr')}
                              </span>
                              {!msg.isRead && (
                                <button
                                  type="button"
                                  onClick={() => void handleMarkMessageRead(msg.id)}
                                  className="text-[#064E3B] font-semibold hover:underline"
                                >
                                  Marquer comme lu
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-zinc-800">{msg.subject}</p>
                          <p className="text-sm text-zinc-600">{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="max-w-lg space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-zinc-950">
                      Sécurité du compte administrateur
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Modifiez votre mot de passe administrateur à tout moment.
                    </p>
                  </div>

                  <form
                    onSubmit={handleChangePassword}
                    className="bg-white border border-zinc-200 rounded-xl p-6 space-y-4"
                  >
                    {pwdError && (
                      <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                        {pwdError}
                      </div>
                    )}
                    {pwdSuccess && (
                      <div className="p-3.5 rounded-lg bg-[#064E3B]/10 border border-[#064E3B]/30 text-xs text-[#064E3B] font-medium">
                        {pwdSuccess}
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700">
                        Nouveau mot de passe (8 caractères min.)
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-700">
                        Confirmer le nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-zinc-300 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={changingPwd}
                      className="px-5 py-2.5 rounded-lg bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#053B2C]"
                    >
                      {changingPwd ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
