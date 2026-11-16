import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type {
  AdminDashboardStats,
  Category,
  ContactMessage,
  JerseySize,
  JerseyVersion,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  StoreSettings,
} from '../src/types.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.join(DATA_DIR, 'kit_arena.sqlite');

// Pre-computed scrypt hash for initial onboarding account; never store plaintext password in repo.
const INITIAL_ADMIN_SCRYPT_HASH =
  'a4f8c29e10b7d3456f89a1c2e3d4b5a6:baab9431cad70c0878fea5eb402a987ea491497b6784d4d9b783dec39c68889a97b11a523ecb64ef02449ce1c67ce09ce7fbb93de7dd757a87dba681649a5daf';

let dbInstance: DatabaseSync | null = null;

function hashPasswordInline(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      must_change_password INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_fr TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_fr TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      team_fr TEXT NOT NULL,
      team_ar TEXT NOT NULL,
      categories_json TEXT NOT NULL,
      season TEXT NOT NULL,
      version TEXT NOT NULL,
      price_mad INTEGER NOT NULL,
      compare_at_price_mad INTEGER,
      description_fr TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      images_json TEXT NOT NULL,
      stock_by_size_json TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 1,
      is_new INTEGER NOT NULL DEFAULT 0,
      is_best_seller INTEGER NOT NULL DEFAULT 0,
      is_demo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      payment_method TEXT NOT NULL DEFAULT 'cod',
      items_json TEXT NOT NULL,
      subtotal_mad INTEGER NOT NULL,
      shipping_mad INTEGER NOT NULL,
      total_mad INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0
    );
  `);

  seedInitialData(db);
  dbInstance = db;
  return db;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Kit Arena',
  cityFr: 'Casablanca, Maroc',
  cityAr: 'الدار البيضاء، المغرب',
  addressFr: "Boulevard d'Anfa, Quartier Gauthier, Casablanca 20250",
  addressAr: 'شارع أنفا، حي غوتييه، الدار البيضاء 20250',
  phone: '+212 5 22 00 00 00',
  whatsapp: '+212 6 00 00 00 00',
  email: 'contact@kitarena.ma',
  hoursFr: 'Lun – Sam : 10h00 – 20h00',
  hoursAr: 'الإثنين – السبت: 10:00 – 20:00',
  defaultShippingMad: 35,
  freeShippingThresholdMad: 600,
  servedCities: [
    { city: 'Casablanca', feeMad: 20, delayFr: 'Livraison 24h', delayAr: 'التوصيل خلال 24 ساعة', active: true },
    { city: 'Mohammedia', feeMad: 25, delayFr: 'Livraison 24h', delayAr: 'التوصيل خلال 24 ساعة', active: true },
    { city: 'Rabat', feeMad: 35, delayFr: '24h – 48h', delayAr: '24 – 48 ساعة', active: true },
    { city: 'Salé', feeMad: 35, delayFr: '24h – 48h', delayAr: '24 – 48 ساعة', active: true },
    { city: 'Kénitra', feeMad: 35, delayFr: '24h – 48h', delayAr: '24 – 48 ساعة', active: true },
    { city: 'Marrakech', feeMad: 40, delayFr: '48h', delayAr: '48 ساعة', active: true },
    { city: 'Tanger', feeMad: 40, delayFr: '48h', delayAr: '48 ساعة', active: true },
    { city: 'Fès', feeMad: 40, delayFr: '48h', delayAr: '48 ساعة', active: true },
    { city: 'Meknès', feeMad: 40, delayFr: '48h', delayAr: '48 ساعة', active: true },
    { city: 'Agadir', feeMad: 45, delayFr: '48h – 72h', delayAr: '48 – 72 ساعة', active: true },
    { city: 'Tétouan', feeMad: 45, delayFr: '48h – 72h', delayAr: '48 – 72 ساعة', active: true },
    { city: 'Oujda', feeMad: 50, delayFr: '48h – 72h', delayAr: '48 – 72 ساعة', active: true },
    { city: 'Autre ville (Maroc)', feeMad: 50, delayFr: '48h – 72h', delayAr: '48 – 72 ساعة', active: true },
  ],
  onlinePaymentEnabled: false,
  promoBannerEnabled: true,
  promoBannerFr: 'Livraison gratuite dès 600 MAD · Paiement à la livraison partout au Maroc',
  promoBannerAr: 'توصيل مجاني ابتداءً من 600 درهم · الدفع عند الاستلام في جميع أنحاء المغرب',
  lowStockThreshold: 5,
};

function seedInitialData(db: DatabaseSync): void {
  const now = new Date().toISOString();

  // 1. Seed initial Admin user if none exists
  const adminCount = db.prepare('SELECT COUNT(*) as c FROM admin_users').get() as { c: number };
  if (adminCount.c === 0) {
    const initialUsername = process.env.ADMIN_INITIAL_USERNAME?.trim() || 'Admin';
    const envPassword = process.env.ADMIN_INITIAL_PASSWORD?.trim();
    const initialHash = envPassword ? hashPasswordInline(envPassword) : INITIAL_ADMIN_SCRYPT_HASH;
    db.prepare(
      `INSERT INTO admin_users (username, password_hash, must_change_password, created_at, updated_at)
       VALUES (?, ?, 1, ?, ?)`
    ).run(initialUsername, initialHash, now, now);
  }

  // 2. Seed store settings if missing
  const settingsRow = db.prepare("SELECT key FROM store_settings WHERE key = 'settings'").get();
  if (!settingsRow) {
    db.prepare("INSERT INTO store_settings (key, value_json) VALUES ('settings', ?)").run(
      JSON.stringify(DEFAULT_SETTINGS)
    );
  }

  // 3. Seed default categories if empty
  const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number };
  if (catCount.c === 0) {
    const initialCategories: Category[] = [
      { id: 'clubs-marocains', slug: 'clubs-marocains', nameFr: 'Clubs marocains', nameAr: 'الأندية المغربية', sortOrder: 1 },
      { id: 'clubs-internationaux', slug: 'clubs-internationaux', nameFr: 'Clubs internationaux', nameAr: 'الأندية العالمية', sortOrder: 2 },
      { id: 'equipes-nationales', slug: 'equipes-nationales', nameFr: 'Équipes nationales', nameAr: 'المنتخبات الوطنية', sortOrder: 3 },
      { id: 'nouveaux-maillots', slug: 'nouveaux-maillots', nameFr: 'Nouveaux maillots', nameAr: 'أحدث القمصان', sortOrder: 4 },
      { id: 'promotions', slug: 'promotions', nameFr: 'Promotions', nameAr: 'عروض خاصة', sortOrder: 5 },
    ];
    const insertCat = db.prepare(
      'INSERT INTO categories (id, slug, name_fr, name_ar, sort_order) VALUES (?, ?, ?, ?, ?)'
    );
    for (const c of initialCategories) {
      insertCat.run(c.id, c.slug, c.nameFr, c.nameAr, c.sortOrder);
    }
  }

  // 4. Seed or migrate to the 7 distinct demo products (each with a unique full-jersey photo)
  const catalogVersionRow = db
    .prepare("SELECT value_json FROM store_settings WHERE key = 'demo_catalog_version'")
    .get() as { value_json: string } | undefined;
  const prodCount = db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number };

  if (!catalogVersionRow || prodCount.c === 0) {
    db.prepare('DELETE FROM products WHERE is_demo = 1').run();

    const demoProducts: Product[] = [
      {
        id: 'prod-casablanca-vert',
        slug: 'maillot-casablanca-vert-blanc-domicile',
        nameFr: 'Maillot Vert & Blanc Édition Casablanca',
        nameAr: 'قميص الدار البيضاء الأخضر والأبيض',
        teamFr: 'Casablanca Vert (Inspiration)',
        teamAr: 'الدار البيضاء الأخضر (مستوحى)',
        categoryIds: ['clubs-marocains', 'nouveaux-maillots'],
        season: '2025/2026',
        version: 'Supporter',
        priceMad: 320,
        compareAtPriceMad: null,
        descriptionFr:
          "Article de démonstration modifiable depuis l'espace admin. Maillot vert émeraude à bande diagonale blanche et liseré doré au col, inspiré de la ferveur verte casablancaise.",
        descriptionAr:
          'منتج تجريبي قابل للتعديل من لوحة الإدارة. قميص أخضر زمردي بوشاح أبيض مائل وتفاصيل ذهبية على الياقة مستوحى من أجواء الدار البيضاء.',
        images: ['/src/assets/images/kit_casa_green_white_1794858091184.jpg'],
        stockBySize: { S: 8, M: 14, L: 12, XL: 7, XXL: 3 },
        isPublished: true,
        isNew: true,
        isBestSeller: false,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-casablanca-rouge',
        slug: 'maillot-casablanca-rouge-blanc-domicile',
        nameFr: 'Maillot Rouge & Blanc Édition Casablanca',
        nameAr: 'قميص الدار البيضاء الأحمر والأبيض',
        teamFr: 'Casablanca Rouge (Inspiration)',
        teamAr: 'الدار البيضاء الأحمر (مستوحى)',
        categoryIds: ['clubs-marocains', 'nouveaux-maillots', 'promotions'],
        season: '2025/2026',
        version: 'Joueur Pro',
        priceMad: 360,
        compareAtPriceMad: 420,
        descriptionFr:
          "Article de démonstration modifiable depuis l'espace admin. Coupe athlétique rouge carmin avec large bande thoracique blanche et liseré doré au col.",
        descriptionAr:
          'منتج تجريبي قابل للتعديل من لوحة الإدارة. قميص أحمر قرمزي مع شريط صدري أبيض ولمسة ذهبية أنيقة.',
        images: ['/src/assets/images/jersey_casablanca_red_1794857253857.jpg'],
        stockBySize: { S: 6, M: 11, L: 9, XL: 5, XXL: 2 },
        isPublished: true,
        isNew: true,
        isBestSeller: false,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-maroc-national',
        slug: 'maillot-maroc-rouge-vert-selection',
        nameFr: 'Maillot Rouge & Vert Sélection du Maroc',
        nameAr: 'قميص المنتخب المغربي الأحمر والأخضر',
        teamFr: 'Équipe Nationale du Maroc (Inspiration)',
        teamAr: 'المنتخب الوطني المغربي (مستوحى)',
        categoryIds: ['equipes-nationales', 'nouveaux-maillots'],
        season: '2025/2026',
        version: 'Joueur Pro',
        priceMad: 390,
        compareAtPriceMad: null,
        descriptionFr:
          "Article de démonstration modifiable depuis l'espace admin. Maille jacquard rouge profond avec col et bordures géométriques vert émeraude et or.",
        descriptionAr:
          'منتج تجريبي قابل للتعديل من لوحة الإدارة. قميص أحمر غامق بنسيج جاكار وياقة هندسية خضراء وذهبية مستوحاة من ألوان المنتخب.',
        images: ['/src/assets/images/jersey_atlas_crimson_1794857254530.jpg'],
        stockBySize: { S: 10, M: 16, L: 14, XL: 9, XXL: 4 },
        isPublished: true,
        isNew: true,
        isBestSeller: false,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-barcelone-blaugrana',
        slug: 'maillot-bleu-grenat-edition-barcelone',
        nameFr: 'Maillot Bleu & Grenat Édition Barcelone',
        nameAr: 'قميص أزرق وعنابي إصدار برشلونة',
        teamFr: 'FC Barcelone (Inspiration)',
        teamAr: 'نادي برشلونة (مستوحى)',
        categoryIds: ['clubs-internationaux', 'nouveaux-maillots'],
        season: '2025/2026',
        version: 'Supporter',
        priceMad: 350,
        compareAtPriceMad: null,
        descriptionFr:
          "Article de démonstration modifiable depuis l'espace admin. Rayures verticales bleu royal et grenat avec col rond contrasté et finitions dorées.",
        descriptionAr:
          'منتج تجريبي قابل للتعديل من لوحة الإدارة. خطوط عمودية زرقاء وعنابية كلاسيكية مع حواف ذهبية على الياقة والأكمام.',
        images: ['/src/assets/images/kit_barcelona_blaugrana_1794858091579.jpg'],
        stockBySize: { S: 7, M: 12, L: 10, XL: 6, XXL: 3 },
        isPublished: true,
        isNew: true,
        isBestSeller: false,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-madrid-blanc-or',
        slug: 'maillot-blanc-or-edition-madrid',
        nameFr: 'Maillot Blanc & Or Édition Madrid',
        nameAr: 'قميص أبيض وذهبي إصدار مدريد',
        teamFr: 'Real Madrid (Inspiration)',
        teamAr: 'نادي ريال مدريد (مستوحى)',
        categoryIds: ['clubs-internationaux'],
        season: '2025/2026',
        version: 'Joueur Pro',
        priceMad: 380,
        compareAtPriceMad: null,
        descriptionFr:
          "Article de démonstration modifiable depuis l'espace admin. Maillot blanc pur à col V et manches bordés de marine et d'or métallisé.",
        descriptionAr:
          'منتج تجريبي قابل للتعديل من لوحة الإدارة. قميص أبيض ناصع بياقة V مزينة بخطوط كحلية وذهبية أنيقة.',
        images: ['/src/assets/images/kit_madrid_white_gold_1794858092336.jpg'],
        stockBySize: { S: 9, M: 15, L: 13, XL: 8, XXL: 4 },
        isPublished: true,
        isNew: false,
        isBestSeller: true,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-paris-marine',
        slug: 'maillot-bleu-marine-edition-paris',
        nameFr: 'Maillot Bleu Marine Édition Paris',
        nameAr: 'قميص أزرق كحلي إصدار باريس',
        teamFr: 'Paris Saint-Germain (Inspiration)',
        teamAr: 'نادي باريس (مستوحى)',
        categoryIds: ['clubs-internationaux', 'promotions'],
        season: '2025/2026',
        version: 'Supporter',
        priceMad: 295,
        compareAtPriceMad: 360,
        descriptionFr:
          "Article de démonstration modifiable depuis l'espace admin. Corps bleu marine nuit traversé d'une bande centrale rouge encadrée de fins liserés blancs.",
        descriptionAr:
          'منتج تجريبي قابل للتعديل من لوحة الإدارة. تصميم أزرق كحلي مع شريط مركزي أحمر محاط بخطوط بيضاء دقيقة.',
        images: ['/src/assets/images/kit_paris_navy_stripe_1794858092382.jpg'],
        stockBySize: { S: 5, M: 10, L: 11, XL: 7, XXL: 2 },
        isPublished: true,
        isNew: false,
        isBestSeller: true,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'prod-milan-rouge-noir',
        slug: 'maillot-rouge-noir-edition-milan',
        nameFr: 'Maillot Rouge & Noir Édition Milan',
        nameAr: 'قميص أحمر وأسود إصدار ميلان',
        teamFr: 'AC Milan (Inspiration)',
        teamAr: 'نادي ميلان (مستوحى)',
        categoryIds: ['clubs-internationaux', 'promotions'],
        season: '2025/2026',
        version: 'Rétro',
        priceMad: 285,
        compareAtPriceMad: 350,
        descriptionFr:
          "Article de démonstration modifiable depuis l'espace admin. Rayures verticales rouge et noir intenses avec col polo boutonné et poignets noirs côtelés.",
        descriptionAr:
          'منتج تجريبي قابل للتعديل من لوحة الإدارة. خطوط عمودية حمراء وسوداء مع ياقة بولو سوداء وأكمام متناسقة.',
        images: ['/src/assets/images/kit_milan_red_black_1794858093578.jpg'],
        stockBySize: { S: 3, M: 8, L: 7, XL: 4, XXL: 1 },
        isPublished: true,
        isNew: false,
        isBestSeller: true,
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const insertProd = db.prepare(`
      INSERT OR REPLACE INTO products (
        id, slug, name_fr, name_ar, team_fr, team_ar, categories_json,
        season, version, price_mad, compare_at_price_mad, description_fr, description_ar,
        images_json, stock_by_size_json, is_published, is_new, is_best_seller, is_demo,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of demoProducts) {
      insertProd.run(
        p.id,
        p.slug,
        p.nameFr,
        p.nameAr,
        p.teamFr,
        p.teamAr,
        JSON.stringify(p.categoryIds),
        p.season,
        p.version,
        p.priceMad,
        p.compareAtPriceMad,
        p.descriptionFr,
        p.descriptionAr,
        JSON.stringify(p.images),
        JSON.stringify(p.stockBySize),
        p.isPublished ? 1 : 0,
        p.isNew ? 1 : 0,
        p.isBestSeller ? 1 : 0,
        p.isDemo ? 1 : 0,
        p.createdAt,
        p.updatedAt
      );
    }

    db.prepare(
      "INSERT OR REPLACE INTO store_settings (key, value_json) VALUES ('demo_catalog_version', ?)"
    ).run(JSON.stringify('v2_7_distinct_kits'));
  }

  // 5. Seed 2 clear sample orders if orders table is empty
  const orderCount = db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number };
  if (orderCount.c === 0) {
    const sampleItems1: OrderItem[] = [
      {
        productId: 'prod-casablanca-vert',
        slug: 'maillot-casablanca-vert-blanc-domicile',
        nameFr: 'Maillot Vert & Blanc Édition Casablanca',
        nameAr: 'قميص الدار البيضاء الأخضر والأبيض',
        teamFr: 'Casablanca Vert (Inspiration)',
        teamAr: 'الدار البيضاء الأخضر (مستوحى)',
        size: 'L',
        quantity: 2,
        unitPriceMad: 320,
        image: '/src/assets/images/kit_casa_green_white_1794858091184.jpg',
      },
    ];
    const sampleItems2: OrderItem[] = [
      {
        productId: 'prod-maroc-national',
        slug: 'maillot-maroc-rouge-vert-selection',
        nameFr: 'Maillot Rouge & Vert Sélection du Maroc',
        nameAr: 'قميص المنتخب المغربي الأحمر والأخضر',
        teamFr: 'Équipe Nationale du Maroc (Inspiration)',
        teamAr: 'المنتخب الوطني المغربي (مستوحى)',
        size: 'M',
        quantity: 1,
        unitPriceMad: 390,
        image: '/src/assets/images/jersey_atlas_crimson_1794857254530.jpg',
      },
    ];

    const insertOrder = db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_name, customer_phone, city, address, notes,
        payment_method, items_json, subtotal_mad, shipping_mad, total_mad,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'cod', ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOrder.run(
      'ord-demo-1',
      'KA-2026-1001',
      'Youssef El Amrani (Démo)',
      '0661234567',
      'Casablanca',
      '24 Rue Jean Jaurès, Quartier Gauthier',
      'Appeler 15 min avant arrivée',
      JSON.stringify(sampleItems1),
      640,
      0,
      640,
      'delivered',
      new Date(Date.now() - 86400000 * 2).toISOString(),
      now
    );

    insertOrder.run(
      'ord-demo-2',
      'KA-2026-1002',
      'Salma Bennani (Démo)',
      '0672987654',
      'Rabat',
      '12 Avenue Fal Ould Oumeir, Agdal',
      'Livraison après 17h',
      JSON.stringify(sampleItems2),
      390,
      35,
      425,
      'confirmed',
      new Date(Date.now() - 3600000 * 6).toISOString(),
      now
    );
  }
}

// --- Admin Queries ---

interface AdminRow {
  id: number;
  username: string;
  password_hash: string;
  must_change_password: number;
}

export function getAdminByUsername(username: string): AdminRow | null {
  const db = getDb();
  const row = db
    .prepare('SELECT id, username, password_hash, must_change_password FROM admin_users WHERE lower(username) = lower(?)')
    .get(username.trim()) as AdminRow | undefined;
  return row ?? null;
}

export function getAdminById(id: number): AdminRow | null {
  const db = getDb();
  const row = db
    .prepare('SELECT id, username, password_hash, must_change_password FROM admin_users WHERE id = ?')
    .get(id) as AdminRow | undefined;
  return row ?? null;
}

export function updateAdminPassword(id: number, newHash: string): void {
  const db = getDb();
  db.prepare(
    'UPDATE admin_users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?'
  ).run(newHash, new Date().toISOString(), id);
}

// --- Settings Queries ---

export function getStoreSettings(): StoreSettings {
  const db = getDb();
  const row = db.prepare("SELECT value_json FROM store_settings WHERE key = 'settings'").get() as
    | { value_json: string }
    | undefined;
  if (!row) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(row.value_json) as Partial<StoreSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function updateStoreSettings(settings: StoreSettings): StoreSettings {
  const db = getDb();
  db.prepare("INSERT OR REPLACE INTO store_settings (key, value_json) VALUES ('settings', ?)").run(
    JSON.stringify(settings)
  );
  return getStoreSettings();
}

// --- Category Queries ---

interface CategoryRow {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  sort_order: number;
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    slug: row.slug,
    nameFr: row.name_fr,
    nameAr: row.name_ar,
    sortOrder: row.sort_order,
  };
}

export function listCategories(): Category[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, slug, name_fr, name_ar, sort_order FROM categories ORDER BY sort_order ASC, name_fr ASC')
    .all() as unknown as CategoryRow[];
  return rows.map(mapCategory);
}

export function upsertCategory(cat: Category): Category {
  const db = getDb();
  db.prepare(
    `INSERT INTO categories (id, slug, name_fr, name_ar, sort_order)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       slug = excluded.slug,
       name_fr = excluded.name_fr,
       name_ar = excluded.name_ar,
       sort_order = excluded.sort_order`
  ).run(cat.id, cat.slug, cat.nameFr, cat.nameAr, cat.sortOrder);
  return cat;
}

export function deleteCategory(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
}

// --- Product Queries ---

interface ProductRow {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  team_fr: string;
  team_ar: string;
  categories_json: string;
  season: string;
  version: string;
  price_mad: number;
  compare_at_price_mad: number | null;
  description_fr: string;
  description_ar: string;
  images_json: string;
  stock_by_size_json: string;
  is_published: number;
  is_new: number;
  is_best_seller: number;
  is_demo: number;
  created_at: string;
  updated_at: string;
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    nameFr: row.name_fr,
    nameAr: row.name_ar,
    teamFr: row.team_fr,
    teamAr: row.team_ar,
    categoryIds: JSON.parse(row.categories_json) as string[],
    season: row.season,
    version: row.version as JerseyVersion,
    priceMad: row.price_mad,
    compareAtPriceMad: row.compare_at_price_mad,
    descriptionFr: row.description_fr,
    descriptionAr: row.description_ar,
    images: JSON.parse(row.images_json) as string[],
    stockBySize: JSON.parse(row.stock_by_size_json) as Record<JerseySize, number>,
    isPublished: Boolean(row.is_published),
    isNew: Boolean(row.is_new),
    isBestSeller: Boolean(row.is_best_seller),
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listProducts(includeUnpublished = false): Product[] {
  const db = getDb();
  const sql = includeUnpublished
    ? 'SELECT * FROM products ORDER BY created_at DESC'
    : 'SELECT * FROM products WHERE is_published = 1 ORDER BY is_new DESC, is_best_seller DESC, created_at DESC';
  const rows = db.prepare(sql).all() as unknown as ProductRow[];
  return rows.map(mapProduct);
}

export function getProductByIdOrSlug(idOrSlug: string, includeUnpublished = false): Product | null {
  const db = getDb();
  const sql = includeUnpublished
    ? 'SELECT * FROM products WHERE id = ? OR slug = ?'
    : 'SELECT * FROM products WHERE (id = ? OR slug = ?) AND is_published = 1';
  const row = db.prepare(sql).get(idOrSlug, idOrSlug) as ProductRow | undefined;
  return row ? mapProduct(row) : null;
}

export function createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
  const db = getDb();
  const now = new Date().toISOString();
  const id = `prod-${crypto.randomUUID().slice(0, 8)}`;
  const uniqueSlug = ensureUniqueSlug(db, product.slug || product.nameFr, id);

  db.prepare(`
    INSERT INTO products (
      id, slug, name_fr, name_ar, team_fr, team_ar, categories_json,
      season, version, price_mad, compare_at_price_mad, description_fr, description_ar,
      images_json, stock_by_size_json, is_published, is_new, is_best_seller, is_demo,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    uniqueSlug,
    product.nameFr,
    product.nameAr,
    product.teamFr,
    product.teamAr,
    JSON.stringify(product.categoryIds),
    product.season,
    product.version,
    product.priceMad,
    product.compareAtPriceMad,
    product.descriptionFr,
    product.descriptionAr,
    JSON.stringify(product.images),
    JSON.stringify(product.stockBySize),
    product.isPublished ? 1 : 0,
    product.isNew ? 1 : 0,
    product.isBestSeller ? 1 : 0,
    product.isDemo ? 1 : 0,
    now,
    now
  );

  return getProductByIdOrSlug(id, true)!;
}

export function updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | null {
  const db = getDb();
  const existing = getProductByIdOrSlug(id, true);
  if (!existing) return null;

  const merged: Product = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (updates.slug && updates.slug !== existing.slug) {
    merged.slug = ensureUniqueSlug(db, updates.slug, id);
  }

  db.prepare(`
    UPDATE products SET
      slug = ?, name_fr = ?, name_ar = ?, team_fr = ?, team_ar = ?,
      categories_json = ?, season = ?, version = ?, price_mad = ?,
      compare_at_price_mad = ?, description_fr = ?, description_ar = ?,
      images_json = ?, stock_by_size_json = ?, is_published = ?,
      is_new = ?, is_best_seller = ?, is_demo = ?, updated_at = ?
    WHERE id = ?
  `).run(
    merged.slug,
    merged.nameFr,
    merged.nameAr,
    merged.teamFr,
    merged.teamAr,
    JSON.stringify(merged.categoryIds),
    merged.season,
    merged.version,
    merged.priceMad,
    merged.compareAtPriceMad,
    merged.descriptionFr,
    merged.descriptionAr,
    JSON.stringify(merged.images),
    JSON.stringify(merged.stockBySize),
    merged.isPublished ? 1 : 0,
    merged.isNew ? 1 : 0,
    merged.isBestSeller ? 1 : 0,
    merged.isDemo ? 1 : 0,
    merged.updatedAt,
    id
  );

  return getProductByIdOrSlug(id, true);
}

export function deleteProduct(id: string): boolean {
  const db = getDb();
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return info.changes > 0;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'maillot';
}

function ensureUniqueSlug(db: DatabaseSync, raw: string, selfId: string): string {
  const base = slugify(raw);
  let candidate = base;
  let counter = 1;
  while (true) {
    const row = db
      .prepare('SELECT id FROM products WHERE slug = ? AND id != ?')
      .get(candidate, selfId) as { id: string } | undefined;
    if (!row) return candidate;
    counter += 1;
    candidate = `${base}-${counter}`;
  }
}

// --- Order Queries ---

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  address: string;
  notes: string;
  payment_method: string;
  items_json: string;
  subtotal_mad: number;
  shipping_mad: number;
  total_mad: number;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    city: row.city,
    address: row.address,
    notes: row.notes,
    paymentMethod: 'cod',
    items: JSON.parse(row.items_json) as OrderItem[],
    subtotalMad: row.subtotal_mad,
    shippingMad: row.shipping_mad,
    totalMad: row.total_mad,
    status: row.status as OrderStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listOrders(): Order[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM orders ORDER BY created_at DESC')
    .all() as unknown as OrderRow[];
  return rows.map(mapOrder);
}

export function getOrderByNumber(orderNumber: string): Order | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM orders WHERE upper(order_number) = upper(?)')
    .get(orderNumber.trim()) as OrderRow | undefined;
  return row ? mapOrder(row) : null;
}

export function placeOrderTransactional(input: {
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  notes: string;
  items: Array<{ productId: string; size: JerseySize; quantity: number }>;
}): { ok: true; order: Order } | { ok: false; status: number; error: string } {
  const db = getDb();
  const settings = getStoreSettings();

  const cityEntry = settings.servedCities.find(
    (c) => c.active && c.city.toLowerCase() === input.city.trim().toLowerCase()
  );
  if (!cityEntry) {
    return {
      ok: false,
      status: 400,
      error: "La ville sélectionnée n'est pas desservie actuellement.",
    };
  }

  db.exec('BEGIN IMMEDIATE;');
  try {
    const resolvedItems: OrderItem[] = [];
    let subtotalMad = 0;

    for (const reqItem of input.items) {
      const prodRow = db
        .prepare('SELECT * FROM products WHERE id = ? AND is_published = 1')
        .get(reqItem.productId) as ProductRow | undefined;

      if (!prodRow) {
        db.exec('ROLLBACK;');
        return {
          ok: false,
          status: 400,
          error: 'Un produit de votre panier n’est plus disponible.',
        };
      }

      const product = mapProduct(prodRow);
      const available = product.stockBySize[reqItem.size] ?? 0;
      if (reqItem.quantity < 1 || reqItem.quantity > available) {
        db.exec('ROLLBACK;');
        return {
          ok: false,
          status: 400,
          error: `Stock insuffisant pour ${product.nameFr} (taille ${reqItem.size}). Disponible : ${available}.`,
        };
      }

      const updatedStock = {
        ...product.stockBySize,
        [reqItem.size]: available - reqItem.quantity,
      };
      db.prepare('UPDATE products SET stock_by_size_json = ?, updated_at = ? WHERE id = ?').run(
        JSON.stringify(updatedStock),
        new Date().toISOString(),
        product.id
      );

      subtotalMad += product.priceMad * reqItem.quantity;
      resolvedItems.push({
        productId: product.id,
        slug: product.slug,
        nameFr: product.nameFr,
        nameAr: product.nameAr,
        teamFr: product.teamFr,
        teamAr: product.teamAr,
        size: reqItem.size,
        quantity: reqItem.quantity,
        unitPriceMad: product.priceMad,
        image: product.images[0] || '',
      });
    }

    const shippingMad =
      subtotalMad >= settings.freeShippingThresholdMad ? 0 : cityEntry.feeMad;
    const totalMad = subtotalMad + shippingMad;

    const countRow = db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number };
    const seq = 1001 + countRow.c;
    let orderNumber = `KA-${new Date().getFullYear()}-${seq}`;
    while (
      db.prepare('SELECT id FROM orders WHERE order_number = ?').get(orderNumber)
    ) {
      orderNumber = `KA-${new Date().getFullYear()}-${seq + Math.floor(Math.random() * 900 + 100)}`;
    }

    const id = `ord-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO orders (
        id, order_number, customer_name, customer_phone, city, address, notes,
        payment_method, items_json, subtotal_mad, shipping_mad, total_mad,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'cod', ?, ?, ?, ?, 'new', ?, ?)
    `).run(
      id,
      orderNumber,
      input.customerName,
      input.customerPhone,
      cityEntry.city,
      input.address,
      input.notes,
      JSON.stringify(resolvedItems),
      subtotalMad,
      shippingMad,
      totalMad,
      now,
      now
    );

    db.exec('COMMIT;');
    const created = getOrderByNumber(orderNumber)!;
    return { ok: true, order: created };
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Order transaction error:', err);
    return { ok: false, status: 500, error: 'Erreur lors de la création de la commande.' };
  }
}

export function updateOrderStatus(id: string, nextStatus: OrderStatus): Order | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
  if (!row) return null;

  const current = mapOrder(row);
  const now = new Date().toISOString();

  db.exec('BEGIN IMMEDIATE;');
  try {
    // Restore stock if transitioning into cancelled from a non-cancelled state
    if (nextStatus === 'cancelled' && current.status !== 'cancelled') {
      for (const item of current.items) {
        const prodRow = db
          .prepare('SELECT stock_by_size_json FROM products WHERE id = ?')
          .get(item.productId) as { stock_by_size_json: string } | undefined;
        if (prodRow) {
          const stock = JSON.parse(prodRow.stock_by_size_json) as Record<JerseySize, number>;
          stock[item.size] = (stock[item.size] ?? 0) + item.quantity;
          db.prepare('UPDATE products SET stock_by_size_json = ?, updated_at = ? WHERE id = ?').run(
            JSON.stringify(stock),
            now,
            item.productId
          );
        }
      }
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(
      nextStatus,
      now,
      id
    );
    db.exec('COMMIT;');
    const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as unknown as OrderRow;
    return mapOrder(updated);
  } catch {
    db.exec('ROLLBACK;');
    return null;
  }
}

export function getAdminDashboardStats(): AdminDashboardStats {
  const products = listProducts(true);
  const orders = listOrders();
  const settings = getStoreSettings();
  const threshold = settings.lowStockThreshold ?? 5;

  const nonCancelled = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenueMad = nonCancelled.reduce((sum, o) => sum + o.totalMad, 0);
  const pendingOrders = orders.filter(
    (o) => o.status === 'new' || o.status === 'confirmed' || o.status === 'preparing'
  ).length;
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;

  const lowStockItems: AdminDashboardStats['lowStockItems'] = [];
  for (const prod of products) {
    (['S', 'M', 'L', 'XL', 'XXL'] as JerseySize[]).forEach((size) => {
      const stock = prod.stockBySize[size] ?? 0;
      if (stock <= threshold) {
        lowStockItems.push({
          productId: prod.id,
          nameFr: prod.nameFr,
          nameAr: prod.nameAr,
          size,
          stock,
        });
      }
    });
  }

  return {
    totalOrders: orders.length,
    pendingOrders,
    deliveredOrders,
    totalRevenueMad,
    publishedProducts: products.filter((p) => p.isPublished).length,
    totalProducts: products.length,
    lowStockItems,
    recentOrders: orders.slice(0, 6),
  };
}

// --- Contact Messages ---

export function createContactMessage(input: {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}): ContactMessage {
  const db = getDb();
  const id = `msg-${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO contact_messages (id, name, phone, email, subject, message, created_at, is_read)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
  ).run(id, input.name, input.phone, input.email, input.subject, input.message, now);

  return {
    id,
    name: input.name,
    phone: input.phone,
    email: input.email,
    subject: input.subject,
    message: input.message,
    createdAt: now,
    isRead: false,
  };
}

export function listContactMessages(): ContactMessage[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC')
    .all() as Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
    is_read: number;
  }>;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    subject: r.subject,
    message: r.message,
    createdAt: r.created_at,
    isRead: Boolean(r.is_read),
  }));
}

export function markContactMessageRead(id: string): void {
  const db = getDb();
  db.prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?').run(id);
}
