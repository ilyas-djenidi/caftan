import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { lazy, Suspense } from 'react';

// Layout components — always needed synchronously, never lazy
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/layout/CartDrawer';
import FloatingIcons from './components/layout/FloatingIcons';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const Caftans = lazy(() => import('./pages/Caftans'));
const Sacs = lazy(() => import('./pages/Sacs'));
const Accessoires = lazy(() => import('./pages/Accessoires'));
const Jellabas = lazy(() => import('./pages/Jellabas'));
const Packs = lazy(() => import('./pages/Packs'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Contact = lazy(() => import('./pages/Contact'));
const Checkout = lazy(() => import('./pages/Checkout'));
const SuiviCommande = lazy(() => import('./pages/SuiviCommande'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin Pages — lazy loaded (each page only fetched when first visited)
const AdminLayout   = lazy(() => import('./pages/admin/AdminLayout'));
const AdminAuth     = lazy(() => import('./pages/admin/AdminAuth'));
const Dashboard     = lazy(() => import('./pages/admin/Dashboard'));
const Orders        = lazy(() => import('./pages/admin/Orders'));
const Expeditions   = lazy(() => import('./pages/admin/Expeditions'));
const Products      = lazy(() => import('./pages/admin/Products'));
const PacksAdmin    = lazy(() => import('./pages/admin/Packs'));
const Messages      = lazy(() => import('./pages/admin/Messages'));
const Promos        = lazy(() => import('./pages/admin/Promos'));
const HeroManager   = lazy(() => import('./pages/admin/HeroManager'));
const AdminReviews  = lazy(() => import('./pages/admin/AdminReviews'));


// Storefront layout wrapper — renders Navbar + CartDrawer + FloatingIcons + page + Footer
function StorefrontLayout() {
    const { i18n } = useTranslation();

    useEffect(() => {
        const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', i18n.language);
    }, [i18n.language]);

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <CartDrawer />
            <FloatingIcons />
            <div className="flex-grow">
                <Outlet />
            </div>
            <Footer />
        </div>
    );
}

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

const PageSpinner = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF8F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #E8D5B0', borderTopColor: '#B8963E', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
);

const AdminSpinner = () => (
    <div style={{ minHeight: '100vh', backgroundColor: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #333', borderTopColor: '#C3AB7E', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
);

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Toaster position="bottom-right" />
            <Routes>
                {/* ── Admin routes — each page loaded only on first visit ── */}
                <Route path="/admin/nad-auth" element={
                    <Suspense fallback={<AdminSpinner />}><AdminAuth /></Suspense>
                } />
                <Route path="/admin" element={
                    <Suspense fallback={<AdminSpinner />}><AdminLayout /></Suspense>
                }>
                    <Route index element={<Suspense fallback={<AdminSpinner />}><Dashboard /></Suspense>} />
                    <Route path="orders"      element={<Suspense fallback={<AdminSpinner />}><Orders /></Suspense>} />
                    <Route path="expeditions" element={<Suspense fallback={<AdminSpinner />}><Expeditions /></Suspense>} />
                    <Route path="products"    element={<Suspense fallback={<AdminSpinner />}><Products /></Suspense>} />
                    <Route path="packs"       element={<Suspense fallback={<AdminSpinner />}><PacksAdmin /></Suspense>} />
                    <Route path="messages"    element={<Suspense fallback={<AdminSpinner />}><Messages /></Suspense>} />
                    <Route path="promos"      element={<Suspense fallback={<AdminSpinner />}><Promos /></Suspense>} />
                    <Route path="hero"        element={<Suspense fallback={<AdminSpinner />}><HeroManager /></Suspense>} />
                    <Route path="reviews"     element={<Suspense fallback={<AdminSpinner />}><AdminReviews /></Suspense>} />
                </Route>

                {/* ── Storefront routes — each page loaded only on first visit ── */}
                <Route element={<StorefrontLayout />}>
                    <Route path="/"                element={<Suspense fallback={<PageSpinner />}><Home /></Suspense>} />
                    <Route path="/caftans"         element={<Suspense fallback={<PageSpinner />}><Caftans /></Suspense>} />
                    <Route path="/sacs"            element={<Suspense fallback={<PageSpinner />}><Sacs /></Suspense>} />
                    <Route path="/accessoires"     element={<Suspense fallback={<PageSpinner />}><Accessoires /></Suspense>} />
                    <Route path="/jellabas"        element={<Suspense fallback={<PageSpinner />}><Jellabas /></Suspense>} />
                    <Route path="/packs"           element={<Suspense fallback={<PageSpinner />}><Packs /></Suspense>} />
                    <Route path="/product/:id"     element={<Suspense fallback={<PageSpinner />}><ProductDetail /></Suspense>} />
                    <Route path="/wishlist"        element={<Suspense fallback={<PageSpinner />}><Wishlist /></Suspense>} />
                    <Route path="/contact"         element={<Suspense fallback={<PageSpinner />}><Contact /></Suspense>} />
                    <Route path="/checkout"        element={<Suspense fallback={<PageSpinner />}><Checkout /></Suspense>} />
                    <Route path="/suivi-commande"  element={<Suspense fallback={<PageSpinner />}><SuiviCommande /></Suspense>} />
                    <Route path="*"                element={<Suspense fallback={<PageSpinner />}><NotFound /></Suspense>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
