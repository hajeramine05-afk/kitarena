import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  CartItem,
  Category,
  JerseySize,
  Language,
  Product,
  StoreSettings,
} from '../types';

interface StoreContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  route: string;
  navigate: (to: string) => void;
  categories: Category[];
  products: Product[];
  settings: StoreSettings | null;
  loading: boolean;
  error: string | null;
  refreshStorefront: () => Promise<void>;
  cart: CartItem[];
  cartCount: number;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  addToCart: (productId: string, size: JerseySize, quantity?: number) => void;
  updateCartQuantity: (productId: string, size: JerseySize, quantity: number) => void;
  removeFromCart: (productId: string, size: JerseySize) => void;
  clearCart: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'kit_arena_cart_v1';
const LANG_STORAGE_KEY = 'kit_arena_lang_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      return saved === 'ar' ? 'ar' : 'fr';
    } catch {
      return 'fr';
    }
  });

  const [route, setRoute] = useState<string>(() => window.location.pathname + window.location.search);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title =
      lang === 'ar'
        ? 'كيت أرينا — متجر قمصان كرة القدم بالدار البيضاء'
        : 'Kit Arena — Boutique de Maillots de Football à Casablanca';
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage errors
    }
  }, [cart]);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to !== window.location.pathname + window.location.search) {
      window.history.pushState({}, '', to);
      setRoute(to);
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const refreshStorefront = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/storefront');
      if (!res.ok) {
        throw new Error('Impossible de charger le catalogue.');
      }
      const data = (await res.json()) as {
        categories: Category[];
        products: Product[];
        settings: StoreSettings;
      };
      setCategories(data.categories);
      setProducts(data.products);
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStorefront();
  }, [refreshStorefront]);

  const addToCart = useCallback(
    (productId: string, size: JerseySize, quantity = 1) => {
      const product = products.find((p) => p.id === productId);
      const maxStock = product ? product.stockBySize[size] ?? 0 : 99;
      if (maxStock <= 0) return;

      setCart((prev) => {
        const idx = prev.findIndex((item) => item.productId === productId && item.size === size);
        if (idx === -1) {
          return [...prev, { productId, size, quantity: Math.min(quantity, maxStock) }];
        }
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: Math.min(next[idx].quantity + quantity, maxStock),
        };
        return next;
      });
      setCartDrawerOpen(true);
    },
    [products]
  );

  const updateCartQuantity = useCallback(
    (productId: string, size: JerseySize, quantity: number) => {
      if (quantity <= 0) {
        setCart((prev) =>
          prev.filter((item) => !(item.productId === productId && item.size === size))
        );
        return;
      }
      const product = products.find((p) => p.id === productId);
      const maxStock = product ? product.stockBySize[size] ?? 20 : 20;
      setCart((prev) =>
        prev.map((item) =>
          item.productId === productId && item.size === size
            ? { ...item, quantity: Math.min(quantity, maxStock) }
            : item
        )
      );
    },
    [products]
  );

  const removeFromCart = useCallback((productId: string, size: JerseySize) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.size === size))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        lang,
        setLang,
        route,
        navigate,
        categories,
        products,
        settings,
        loading,
        error,
        refreshStorefront,
        cart,
        cartCount,
        cartDrawerOpen,
        setCartDrawerOpen,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
