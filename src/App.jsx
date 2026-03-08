import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import Caftans from './pages/Caftans';
import Sacs from './pages/Sacs';
import Accessoires from './pages/Accessoires';
import Packs from './pages/Packs';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Contact from './pages/Contact';
import Checkout from './pages/Checkout';
import NotFound from './pages/NotFound';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/layout/CartDrawer';
import FloatingIcons from './components/layout/FloatingIcons';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminAuth from './pages/admin/AdminAuth';
import Dashboard from './pages/admin/Dashboard';
import Orders from './pages/admin/Orders';
import Products from './pages/admin/Products';
import PacksAdmin from './pages/admin/Packs';
import Messages from './pages/admin/Messages';
import Promos from './pages/admin/Promos';
import HeroManager from './pages/admin/HeroManager';
import AdminReviews from './pages/admin/AdminReviews';

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
        </BrowserRouter>
    );
}

export default App;
