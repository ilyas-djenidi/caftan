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
const Packs = lazy(() => import('./pages/Packs'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Contact = lazy(() => import('./pages/Contact'));
const Checkout = lazy(() => import('./pages/Checkout'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin Pages (Lazy loaded)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminAuth = lazy(() => import('./pages/admin/AdminAuth'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Orders = lazy(() => import('./pages/admin/Orders'));
const Products = lazy(() => import('./pages/admin/Products'));
const PacksAdmin = lazy(() => import('./pages/admin/Packs'));
const Messages = lazy(() => import('./pages/admin/Messages'));
const Promos = lazy(() => import('./pages/admin/Promos'));
const HeroManager = lazy(() => import('./pages/admin/HeroManager'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));


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

function App() {
    return (
        <BrowserRouter>
            <ScrollToTop />
            <Toaster position="bottom-right" />
            <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#FAF8F4' }} />}>
                <Routes>
                    {/* ── Admin routes — NO storefront Navbar/Footer ── */}
                    <Route path="/admin/nad-auth" element={<AdminAuth />} />
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="products" element={<Products />} />
                        <Route path="packs" element={<PacksAdmin />} />
                        <Route path="messages" element={<Messages />} />
                        <Route path="promos" element={<Promos />} />
                        <Route path="hero" element={<HeroManager />} />
                        <Route path="reviews" element={<AdminReviews />} />
                    </Route>

                    {/* ── Storefront routes — wrapped with Navbar + Footer ── */}
                    <Route element={<StorefrontLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/caftans" element={<Caftans />} />
                        <Route path="/sacs" element={<Sacs />} />
                        <Route path="/accessoires" element={<Accessoires />} />
                        <Route path="/packs" element={<Packs />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="*" element={<NotFound />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
