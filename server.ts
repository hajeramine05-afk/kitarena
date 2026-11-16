import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import dotenv from 'dotenv';
import {
  checkLoginRateLimit,
  clearFailedLogins,
  clearSessionCookie,
  getAuthenticatedAdmin,
  hashPassword,
  recordFailedLogin,
  requireAdminAuth,
  requirePasswordChanged,
  setSessionCookie,
  signSessionToken,
  verifyPassword,
} from './server/auth.ts';
import type { AuthenticatedRequest } from './server/auth.ts';
import {
  UPLOADS_DIR,
  createContactMessage,
  createProduct,
  deleteCategory,
  deleteProduct,
  getAdminById,
  getAdminByUsername,
  getAdminDashboardStats,
  getDb,
  getOrderByNumber,
  getProductByIdOrSlug,
  getStoreSettings,
  listCategories,
  listContactMessages,
  listOrders,
  listProducts,
  markContactMessageRead,
  placeOrderTransactional,
  updateAdminPassword,
  updateOrderStatus,
  updateProduct,
  updateStoreSettings,
  upsertCategory,
} from './server/db.ts';
import type {
  JerseySize,
  JerseyVersion,
  OrderStatus,
  StoreSettings,
} from './src/types.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const VALID_SIZES: JerseySize[] = ['S', 'M', 'L', 'XL', 'XXL'];
const VALID_VERSIONS: JerseyVersion[] = ['Supporter', 'Joueur Pro', 'Rétro'];
const VALID_STATUSES: OrderStatus[] = [
  'new',
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
];

function normalizeMoroccanPhone(raw: string): string {
  return raw.replace(/[\s\-().]/g, '');
}

function isValidMoroccanPhone(raw: string): boolean {
  const cleaned = normalizeMoroccanPhone(raw);
  return /^(\+212|0)[5-7]\d{8}$/.test(cleaned);
}

function sanitizeStock(input: unknown): Record<JerseySize, number> {
  const obj = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const out: Record<JerseySize, number> = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
  for (const size of VALID_SIZES) {
    const val = Number(obj[size] ?? 0);
    out[size] = Number.isFinite(val) && val >= 0 ? Math.floor(val) : 0;
  }
  return out;
}

async function startServer(): Promise<void> {
  // Ensure SQLite DB and initial seed are initialized before serving requests
  getDb();

  const app = express();
  app.use(express.json({ limit: '8mb' }));

  // Serve admin-uploaded images safely
  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Public storefront bootstrap
  app.get('/api/storefront', (_req, res) => {
    const categories = listCategories();
    const products = listProducts(false);
    const settings = getStoreSettings();
    res.json({ categories, products, settings });
  });

  // Public single product detail
  app.get('/api/products/:idOrSlug', (req, res) => {
    const product = getProductByIdOrSlug(req.params.idOrSlug, false);
    if (!product) {
      res.status(404).json({ error: 'Maillot introuvable.' });
      return;
    }
    res.json({ product });
  });

  // Public order creation (Cash on Delivery)
  app.post('/api/orders', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const customerName = String(body.customerName ?? '').trim();
    const customerPhone = String(body.customerPhone ?? '').trim();
    const city = String(body.city ?? '').trim();
    const address = String(body.address ?? '').trim();
    const notes = String(body.notes ?? '').trim().slice(0, 500);
    const paymentMethod = String(body.paymentMethod ?? 'cod');
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (customerName.length < 2 || customerName.length > 100) {
      res.status(400).json({ error: 'Veuillez saisir un nom complet valide (2 caractères minimum).' });
      return;
    }
    if (!isValidMoroccanPhone(customerPhone)) {
      res.status(400).json({
        error: 'Numéro de téléphone marocain invalide (ex: 06 12 34 56 78 ou +212 6 12 34 56 78).',
      });
      return;
    }
    if (!city) {
      res.status(400).json({ error: 'Veuillez sélectionner une ville de livraison.' });
      return;
    }
    if (address.length < 5 || address.length > 300) {
      res.status(400).json({ error: 'Veuillez saisir une adresse de livraison complète.' });
      return;
    }

    const settings = getStoreSettings();
    if (paymentMethod !== 'cod') {
      if (!settings.onlinePaymentEnabled) {
        res.status(400).json({
          error: "Le paiement en ligne n'est pas disponible. Seul le paiement à la livraison est accepté.",
        });
        return;
      }
    }

    if (rawItems.length === 0) {
      res.status(400).json({ error: 'Votre panier est vide.' });
      return;
    }

    const items: Array<{ productId: string; size: JerseySize; quantity: number }> = [];
    for (const raw of rawItems) {
      const item = raw as Record<string, unknown>;
      const productId = String(item.productId ?? '').trim();
      const size = String(item.size ?? '') as JerseySize;
      const quantity = Math.floor(Number(item.quantity ?? 0));
      if (!productId || !VALID_SIZES.includes(size) || !Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
        res.status(400).json({ error: 'Article ou quantité invalide dans le panier.' });
        return;
      }
      items.push({ productId, size, quantity });
    }

    const result = placeOrderTransactional({
      customerName,
      customerPhone: normalizeMoroccanPhone(customerPhone),
      city,
      address,
      notes,
      items,
    });

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.status(201).json({ order: result.order });
  });

  // Public order verification / tracking lookup
  app.get('/api/orders/lookup', (req, res) => {
    const orderNumber = String(req.query.orderNumber ?? '').trim();
    const phone = normalizeMoroccanPhone(String(req.query.phone ?? ''));
    if (!orderNumber || !phone) {
      res.status(400).json({ error: 'Numéro de commande et téléphone requis.' });
      return;
    }
    const order = getOrderByNumber(orderNumber);
    if (!order || normalizeMoroccanPhone(order.customerPhone) !== phone) {
      res.status(404).json({ error: 'Aucune commande correspondante trouvée.' });
      return;
    }
    res.json({ order });
  });

  // Public contact message submission
  app.post('/api/contact', (req, res) => {
    const body = req.body as Record<string, unknown>;
    const name = String(body.name ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const email = String(body.email ?? '').trim();
    const subject = String(body.subject ?? '').trim();
    const message = String(body.message ?? '').trim();

    if (name.length < 2) {
      res.status(400).json({ error: 'Veuillez indiquer votre nom.' });
      return;
    }
    if (!phone && !email) {
      res.status(400).json({ error: 'Veuillez indiquer un téléphone ou une adresse e-mail.' });
      return;
    }
    if (message.length < 10) {
      res.status(400).json({ error: 'Votre message doit contenir au moins 10 caractères.' });
      return;
    }

    const saved = createContactMessage({
      name: name.slice(0, 100),
      phone: phone.slice(0, 40),
      email: email.slice(0, 120),
      subject: (subject || 'Demande générale').slice(0, 150),
      message: message.slice(0, 2000),
    });

    res.status(201).json({ ok: true, id: saved.id });
  });

  // --- Admin Authentication Routes ---

  app.get('/api/admin/me', (req, res) => {
    const admin = getAuthenticatedAdmin(req);
    if (!admin) {
      res.json({ authenticated: false, admin: null });
      return;
    }
    res.json({ authenticated: true, admin });
  });

  app.post('/api/admin/login', (req, res) => {
    const clientIp = req.ip || 'unknown';
    const rate = checkLoginRateLimit(clientIp);
    if (!rate.allowed) {
      res.status(429).json({
        error: `Trop de tentatives. Réessayez dans ${rate.retryAfterSec} secondes.`,
      });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const username = String(body.username ?? '').trim();
    const password = String(body.password ?? '');

    if (!username || !password) {
      res.status(400).json({ error: "Nom d'utilisateur et mot de passe requis." });
      return;
    }

    const admin = getAdminByUsername(username);
    if (!admin || !verifyPassword(password, admin.password_hash)) {
      recordFailedLogin(clientIp);
      res.status(401).json({ error: 'Identifiants invalides.' });
      return;
    }

    clearFailedLogins(clientIp);
    const token = signSessionToken(admin.id);
    setSessionCookie(res, token, req);

    res.json({
      authenticated: true,
      admin: {
        id: admin.id,
        username: admin.username,
        mustChangePassword: Boolean(admin.must_change_password),
      },
    });
  });

  app.post('/api/admin/logout', (req, res) => {
    clearSessionCookie(res, req);
    res.json({ ok: true });
  });

  app.post('/api/admin/change-password', requireAdminAuth, (req: AuthenticatedRequest, res) => {
    const body = req.body as Record<string, unknown>;
    const currentPassword = String(body.currentPassword ?? '');
    const newPassword = String(body.newPassword ?? '');

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Mot de passe actuel et nouveau mot de passe requis.' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    if (newPassword === currentPassword) {
      res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l’ancien.' });
      return;
    }

    const adminRow = getAdminById(req.adminUser!.id);
    if (!adminRow || !verifyPassword(currentPassword, adminRow.password_hash)) {
      res.status(401).json({ error: 'Mot de passe actuel incorrect.' });
      return;
    }

    updateAdminPassword(adminRow.id, hashPassword(newPassword));
    res.json({
      ok: true,
      admin: {
        id: adminRow.id,
        username: adminRow.username,
        mustChangePassword: false,
      },
    });
  });

  // --- Protected Admin Operations ---

  app.get('/api/admin/dashboard', requireAdminAuth, requirePasswordChanged, (_req, res) => {
    res.json({ stats: getAdminDashboardStats() });
  });

  app.get('/api/admin/products', requireAdminAuth, requirePasswordChanged, (_req, res) => {
    res.json({ products: listProducts(true) });
  });

  app.post('/api/admin/products', requireAdminAuth, requirePasswordChanged, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const nameFr = String(body.nameFr ?? '').trim();
    const nameAr = String(body.nameAr ?? '').trim() || nameFr;
    const teamFr = String(body.teamFr ?? '').trim();
    const teamAr = String(body.teamAr ?? '').trim() || teamFr;
    const season = String(body.season ?? '2025/2026').trim();
    const version = (VALID_VERSIONS.includes(body.version as JerseyVersion)
      ? body.version
      : 'Supporter') as JerseyVersion;
    const priceMad = Math.round(Number(body.priceMad ?? 0));
    const compareRaw = body.compareAtPriceMad;
    const compareAtPriceMad =
      compareRaw !== null && compareRaw !== undefined && compareRaw !== '' && Number(compareRaw) > priceMad
        ? Math.round(Number(compareRaw))
        : null;
    const descriptionFr = String(body.descriptionFr ?? '').trim();
    const descriptionAr = String(body.descriptionAr ?? '').trim() || descriptionFr;
    const categoryIds = Array.isArray(body.categoryIds)
      ? body.categoryIds.map((c) => String(c).trim()).filter(Boolean)
      : [];
    const images = Array.isArray(body.images)
      ? body.images.map((img) => String(img).trim()).filter(Boolean)
      : [];

    if (!nameFr || !teamFr || !Number.isFinite(priceMad) || priceMad <= 0) {
      res.status(400).json({ error: 'Nom, équipe et prix (MAD) valides requis.' });
      return;
    }

    const created = createProduct({
      slug: String(body.slug ?? nameFr),
      nameFr,
      nameAr,
      teamFr,
      teamAr,
      categoryIds: categoryIds.length > 0 ? categoryIds : ['clubs-marocains'],
      season,
      version,
      priceMad,
      compareAtPriceMad,
      descriptionFr,
      descriptionAr,
      images,
      stockBySize: sanitizeStock(body.stockBySize),
      isPublished: body.isPublished !== false,
      isNew: Boolean(body.isNew),
      isBestSeller: Boolean(body.isBestSeller),
      isDemo: Boolean(body.isDemo),
    });

    res.status(201).json({ product: created });
  });

  app.put('/api/admin/products/:id', requireAdminAuth, requirePasswordChanged, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const existing = getProductByIdOrSlug(req.params.id, true);
    if (!existing) {
      res.status(404).json({ error: 'Produit introuvable.' });
      return;
    }

    const priceMad =
      body.priceMad !== undefined ? Math.round(Number(body.priceMad)) : existing.priceMad;
    if (!Number.isFinite(priceMad) || priceMad <= 0) {
      res.status(400).json({ error: 'Prix en MAD invalide.' });
      return;
    }

    let compareAtPriceMad = existing.compareAtPriceMad;
    if (body.compareAtPriceMad !== undefined) {
      const c = body.compareAtPriceMad;
      compareAtPriceMad =
        c !== null && c !== '' && Number(c) > priceMad ? Math.round(Number(c)) : null;
    }

    const updated = updateProduct(existing.id, {
      slug: body.slug !== undefined ? String(body.slug) : existing.slug,
      nameFr: body.nameFr !== undefined ? String(body.nameFr).trim() : existing.nameFr,
      nameAr: body.nameAr !== undefined ? String(body.nameAr).trim() : existing.nameAr,
      teamFr: body.teamFr !== undefined ? String(body.teamFr).trim() : existing.teamFr,
      teamAr: body.teamAr !== undefined ? String(body.teamAr).trim() : existing.teamAr,
      categoryIds: Array.isArray(body.categoryIds)
        ? body.categoryIds.map((c) => String(c).trim()).filter(Boolean)
        : existing.categoryIds,
      season: body.season !== undefined ? String(body.season).trim() : existing.season,
      version: VALID_VERSIONS.includes(body.version as JerseyVersion)
        ? (body.version as JerseyVersion)
        : existing.version,
      priceMad,
      compareAtPriceMad,
      descriptionFr:
        body.descriptionFr !== undefined ? String(body.descriptionFr).trim() : existing.descriptionFr,
      descriptionAr:
        body.descriptionAr !== undefined ? String(body.descriptionAr).trim() : existing.descriptionAr,
      images: Array.isArray(body.images)
        ? body.images.map((i) => String(i).trim()).filter(Boolean)
        : existing.images,
      stockBySize:
        body.stockBySize !== undefined ? sanitizeStock(body.stockBySize) : existing.stockBySize,
      isPublished: body.isPublished !== undefined ? Boolean(body.isPublished) : existing.isPublished,
      isNew: body.isNew !== undefined ? Boolean(body.isNew) : existing.isNew,
      isBestSeller: body.isBestSeller !== undefined ? Boolean(body.isBestSeller) : existing.isBestSeller,
      isDemo: body.isDemo !== undefined ? Boolean(body.isDemo) : existing.isDemo,
    });

    res.json({ product: updated });
  });

  app.delete('/api/admin/products/:id', requireAdminAuth, requirePasswordChanged, (req, res) => {
    const ok = deleteProduct(req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'Produit introuvable.' });
      return;
    }
    res.json({ ok: true });
  });

  // Categories
  app.get('/api/admin/categories', requireAdminAuth, requirePasswordChanged, (_req, res) => {
    res.json({ categories: listCategories() });
  });

  app.post('/api/admin/categories', requireAdminAuth, requirePasswordChanged, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const nameFr = String(body.nameFr ?? '').trim();
    const nameAr = String(body.nameAr ?? '').trim() || nameFr;
    const sortOrder = Math.floor(Number(body.sortOrder ?? 10));
    if (!nameFr) {
      res.status(400).json({ error: 'Nom de catégorie requis.' });
      return;
    }
    const slug =
      String(body.slug ?? nameFr)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;
    const saved = upsertCategory({
      id: slug,
      slug,
      nameFr,
      nameAr,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 10,
    });
    res.status(201).json({ category: saved });
  });

  app.put('/api/admin/categories/:id', requireAdminAuth, requirePasswordChanged, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const nameFr = String(body.nameFr ?? '').trim();
    const nameAr = String(body.nameAr ?? '').trim() || nameFr;
    const sortOrder = Math.floor(Number(body.sortOrder ?? 0));
    if (!nameFr) {
      res.status(400).json({ error: 'Nom de catégorie requis.' });
      return;
    }
    const saved = upsertCategory({
      id: req.params.id,
      slug: String(body.slug ?? req.params.id),
      nameFr,
      nameAr,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    });
    res.json({ category: saved });
  });

  app.delete('/api/admin/categories/:id', requireAdminAuth, requirePasswordChanged, (req, res) => {
    deleteCategory(req.params.id);
    res.json({ ok: true });
  });

  // Orders
  app.get('/api/admin/orders', requireAdminAuth, requirePasswordChanged, (_req, res) => {
    res.json({ orders: listOrders() });
  });

  app.patch('/api/admin/orders/:id/status', requireAdminAuth, requirePasswordChanged, (req, res) => {
    const status = String((req.body as Record<string, unknown>).status ?? '') as OrderStatus;
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Statut de commande invalide.' });
      return;
    }
    const updated = updateOrderStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ error: 'Commande introuvable.' });
      return;
    }
    res.json({ order: updated });
  });

  // Settings
  app.get('/api/admin/settings', requireAdminAuth, requirePasswordChanged, (_req, res) => {
    res.json({ settings: getStoreSettings() });
  });

  app.put('/api/admin/settings', requireAdminAuth, requirePasswordChanged, (req, res) => {
    const body = req.body as Partial<StoreSettings>;
    const current = getStoreSettings();
    const next: StoreSettings = {
      ...current,
      ...body,
      defaultShippingMad: Math.max(0, Math.round(Number(body.defaultShippingMad ?? current.defaultShippingMad))),
      freeShippingThresholdMad: Math.max(
        0,
        Math.round(Number(body.freeShippingThresholdMad ?? current.freeShippingThresholdMad))
      ),
      lowStockThreshold: Math.max(1, Math.round(Number(body.lowStockThreshold ?? current.lowStockThreshold))),
      servedCities: Array.isArray(body.servedCities)
        ? body.servedCities
            .filter((c) => c && typeof c.city === 'string' && c.city.trim())
            .map((c) => ({
              city: c.city.trim(),
              feeMad: Math.max(0, Math.round(Number(c.feeMad ?? 0))),
              delayFr: String(c.delayFr ?? '24h – 48h').trim(),
              delayAr: String(c.delayAr ?? '24 – 48 ساعة').trim(),
              active: Boolean(c.active),
            }))
        : current.servedCities,
      onlinePaymentEnabled: Boolean(body.onlinePaymentEnabled),
      promoBannerEnabled: Boolean(body.promoBannerEnabled),
    };
    const saved = updateStoreSettings(next);
    res.json({ settings: saved });
  });

  // Contact messages
  app.get('/api/admin/messages', requireAdminAuth, requirePasswordChanged, (_req, res) => {
    res.json({ messages: listContactMessages() });
  });

  app.patch('/api/admin/messages/:id/read', requireAdminAuth, requirePasswordChanged, (req, res) => {
    markContactMessageRead(req.params.id);
    res.json({ ok: true });
  });

  // Authorized product image upload (base64 payload)
  app.post('/api/admin/upload', requireAdminAuth, requirePasswordChanged, (req, res) => {
    const body = req.body as Record<string, unknown>;
    const dataUrl = String(body.dataUrl ?? '');
    const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: 'Format image invalide. Formats autorisés : JPG, PNG, WebP.' });
      return;
    }
    const mime = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: "L'image dépasse la limite de 5 Mo." });
      return;
    }

    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const filename = `kit-${crypto.randomUUID().slice(0, 12)}.${ext}`;
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
    res.status(201).json({ url: `/uploads/${filename}` });
  });

  // Vite dev middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'public')));
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kit Arena server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Kit Arena server:', err);
  process.exit(1);
});
