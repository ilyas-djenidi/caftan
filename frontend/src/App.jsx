import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Caftans from './pages/Caftans';
import Sacs from './pages/Sacs';
import Accessoires from './pages/Accessoires';
import Packs from './pages/Packs';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/layout/CartDrawer';

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

function App() {
    return (
        <BrowserRouter>
            <Toaster position="bottom-right" />
            <Navbar />
            <CartDrawer />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/caftans" element={<Caftans />} />
                <Route path="/sacs" element={<Sacs />} />
                <Route path="/accessoires" element={<Accessoires />} />
                <Route path="/packs" element={<Packs />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/panier" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/contact" element={<Contact />} />

                {/* Admin Routes */}
                <Route path="/admin/nad-auth" element={<AdminAuth />} />
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="products" element={<Products />} />
                    <Route path="packs" element={<PacksAdmin />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="promos" element={<Promos />} />
                    <Route path="hero" element={<HeroManager />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
        </BrowserRouter>
    );
}

export default App;
