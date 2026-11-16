import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { StoreProvider, useStore } from './context/StoreContext';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { CatalogPage } from './pages/CatalogPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ConfirmationPage } from './pages/ConfirmationPage';
import { HomePage } from './pages/HomePage';
import {
  AboutPage,
  ContactPage,
  DeliveryReturnsPage,
  FaqPage,
  TermsPage,
} from './pages/InfoPages';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { TrackOrderPage } from './pages/TrackOrderPage';

function AppRouter() {
  const { route, error, refreshStorefront } = useStore();
  const pathname = route.split('?')[0] || '/';

  // Distinct Admin route without storefront chrome
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <AdminPage />;
  }

  let pageContent: React.ReactNode;

  if (pathname === '/' || pathname === '') {
    pageContent = <HomePage />;
  } else if (pathname === '/catalogue') {
    pageContent = <CatalogPage />;
  } else if (pathname.startsWith('/produit/')) {
    const slug = decodeURIComponent(pathname.slice('/produit/'.length));
    pageContent = <ProductDetailPage slug={slug} />;
  } else if (pathname === '/panier') {
    pageContent = <CartPage />;
  } else if (pathname === '/commander') {
    pageContent = <CheckoutPage />;
  } else if (pathname.startsWith('/confirmation/')) {
    const orderNumber = decodeURIComponent(pathname.slice('/confirmation/'.length));
    pageContent = <ConfirmationPage orderNumber={orderNumber} />;
  } else if (pathname === '/suivi') {
    pageContent = <TrackOrderPage />;
  } else if (pathname === '/a-propos') {
    pageContent = <AboutPage />;
  } else if (pathname === '/livraison') {
    pageContent = <DeliveryReturnsPage />;
  } else if (pathname === '/contact') {
    pageContent = <ContactPage />;
  } else if (pathname === '/faq') {
    pageContent = <FaqPage />;
  } else if (pathname === '/conditions') {
    pageContent = <TermsPage />;
  } else {
    pageContent = <HomePage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] text-[#09090B]">
      <Header />
      <main className="flex-1">
        {error && (
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-6">
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center justify-between gap-4">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => void refreshStorefront()}
                className="px-3 py-1.5 rounded bg-red-700 text-white text-xs font-semibold shrink-0"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
        {pageContent}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
}
