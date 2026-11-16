export type Language = 'fr' | 'ar';

export type JerseySize = 'S' | 'M' | 'L' | 'XL' | 'XXL';

export const JERSEY_SIZES: JerseySize[] = ['S', 'M', 'L', 'XL', 'XXL'];

export type JerseyVersion = 'Supporter' | 'Joueur Pro' | 'Rétro';

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'new',
  'confirmed',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
];

export interface Category {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  teamFr: string;
  teamAr: string;
  categoryIds: string[];
  season: string;
  version: JerseyVersion;
  priceMad: number;
  compareAtPriceMad: number | null;
  descriptionFr: string;
  descriptionAr: string;
  images: string[];
  stockBySize: Record<JerseySize, number>;
  isPublished: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServedCity {
  city: string;
  feeMad: number;
  delayFr: string;
  delayAr: string;
  active: boolean;
}

export interface StoreSettings {
  storeName: string;
  cityFr: string;
  cityAr: string;
  addressFr: string;
  addressAr: string;
  phone: string;
  whatsapp: string;
  email: string;
  hoursFr: string;
  hoursAr: string;
  defaultShippingMad: number;
  freeShippingThresholdMad: number;
  servedCities: ServedCity[];
  onlinePaymentEnabled: boolean;
  promoBannerEnabled: boolean;
  promoBannerFr: string;
  promoBannerAr: string;
  lowStockThreshold: number;
}

export interface OrderItem {
  productId: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  teamFr: string;
  teamAr: string;
  size: JerseySize;
  quantity: number;
  unitPriceMad: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  notes: string;
  paymentMethod: 'cod';
  items: OrderItem[];
  subtotalMad: number;
  shippingMad: number;
  totalMad: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  size: JerseySize;
  quantity: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface AdminUserSession {
  id: number;
  username: string;
  mustChangePassword: boolean;
}

export interface AdminDashboardStats {
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalRevenueMad: number;
  publishedProducts: number;
  totalProducts: number;
  lowStockItems: Array<{
    productId: string;
    nameFr: string;
    nameAr: string;
    size: JerseySize;
    stock: number;
  }>;
  recentOrders: Order[];
}
