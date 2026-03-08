import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'fr', label: 'FR' },
    { code: 'en', label: 'EN' },
    { code: 'ar', label: 'AR' },
];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const { items, openDrawer } = useCartStore();
    const { items: wishlistItems } = useWishlistStore();
    const { t, i18n } = useTranslation();

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        localStorage.setItem('lang', code);
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty(
            '--navbar-height',
            isScrolled ? '72px' : '100px'
        );
    }, [isScrolled]);

    const isHome = location.pathname === '/';
    const iconColor = isScrolled || !isHome ? '#111111' : '#ffffff';

    return (
        <>
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 80,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: '0 40px',
                height: isScrolled ? '72px' : '100px',
                backgroundColor: (isScrolled || !isHome) ? 'rgba(255, 255, 255, 0.98)' : 'transparent',
                backdropFilter: (isScrolled || !isHome) ? 'blur(20px)' : 'none',
                borderBottom: (isScrolled || !isHome) ? '1px solid rgba(195, 171, 126, 0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {/* Left: Hamburger */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: iconColor,
                            display: 'flex', alignItems: 'center', gap: '12px'
                        }}
                        className="group"
                    >
                        <Menu size={24} className="group-hover:text-[#C3AB7E] transition-colors" />
                    </button>
                </div>

                {/* Center: Logo */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                            src="/logo.png"
                            alt="Maison du Caftans"
                            style={{
                                height: isScrolled ? '50px' : '70px',
                                transition: 'all 0.5s'
                            }}
                        />
                    </Link>
                </div>

                {/* Right: Language Switcher + Icons */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px' }}>
                    {/* Icon buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Link to="/wishlist" style={{ color: iconColor, position: 'relative' }}>
                            <Heart size={20} strokeWidth={1.5} />
                            {wishlistItems.length > 0 && (
                                <span style={{
                                    position: 'absolute', top: -4, right: -4,
                                    width: '14px', height: '14px', borderRadius: '50%',
                                    backgroundColor: '#C3AB7E', color: 'white',
                                    fontSize: '8px', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {wishlistItems.length}
                                </span>
                            )}
                        </Link>
                        <button
                            onClick={openDrawer}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: iconColor,
                                position: 'relative'
                            }}>
                            <ShoppingBag size={20} strokeWidth={1.5} />
                            {items.length > 0 && (
                                <span style={{
                                    position: 'absolute', top: -4, right: -4,
                                    width: '14px', height: '14px', borderRadius: '50%',
                                    backgroundColor: '#C3AB7E', color: 'white',
                                    fontSize: '8px', fontWeight: 'bold',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {items.reduce((s, i) => s + i.quantity, 0)}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Sidebar Slide-in Menu */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            style={{
                                position: 'fixed', inset: 0,
                                backgroundColor: 'rgba(0,0,0,0.4)',
                                zIndex: 100, backdropFilter: 'blur(4px)'
                            }}
                        />
                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: i18n.language === 'ar' ? '100%' : '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: i18n.language === 'ar' ? '100%' : '-100%' }}
                            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                            style={{
                                position: 'fixed', top: 0,
                                ...(i18n.language === 'ar' ? { right: 0 } : { left: 0 }),
                                bottom: 0,
                                width: '320px', backgroundColor: '#FAF8F4',
                                zIndex: 110,
                                padding: i18n.language === 'ar' ? '32px 40px 40px 0' : '32px 0 40px 40px',
                                display: 'flex', flexDirection: 'column',
                                boxShadow: i18n.language === 'ar' ? '-20px 0 60px rgba(0,0,0,0.1)' : '20px 0 60px rgba(0,0,0,0.1)'
                            }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                style={{
                                    position: 'absolute', top: '24px',
                                    ...(i18n.language === 'ar' ? { left: '24px' } : { right: '24px' }),
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#6B6458', transition: 'color 0.3s'
                                }}
                                className="hover:text-[#1A1714]"
                            >
                                <X size={24} strokeWidth={1} />
                            </button>

                            {/* Brand Name */}
                            <div style={{ marginBottom: '60px' }}>
                                <span style={{
                                    fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: '400',
                                    fontSize: '24px', color: '#1A1714'
                                }}>
                                    Maison du Caftans
                                </span>
                            </div>

                            <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {[
                                    { labelKey: 'nav.caftans', to: '/caftans' },
                                    { labelKey: 'nav.bags', to: '/sacs' },
                                    { labelKey: 'nav.accessories', to: '/accessoires' },
                                    { labelKey: 'nav.packs', to: '/packs' },
                                    { labelKey: 'nav.contact', to: '/contact' }
                                ].map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        onClick={() => setIsSidebarOpen(false)}
                                        style={{
                                            fontSize: '22px', fontWeight: '400',
                                            fontFamily: "'Cormorant Garamond', serif",
                                            fontStyle: 'italic',
                                            color: '#1A1714', textDecoration: 'none',
                                            textAlign: i18n.language === 'ar' ? 'center' : 'left'
                                        }}
                                        className="hover:text-[#C3AB7E] transition-colors"
                                    >
                                        {t(link.labelKey)}
                                    </Link>
                                ))}
                            </nav>

                            {/* Language switcher in sidebar too */}
                            <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: i18n.language === 'ar' ? 'center' : 'flex-start' }}>
                                    {LANGUAGES.map(({ code, label }) => (
                                        <button
                                            key={code}
                                            onClick={() => changeLanguage(code)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                border: '1px solid',
                                                borderColor: i18n.language === code ? '#B8963E' : '#E8E2D6',
                                                backgroundColor: i18n.language === code ? '#B8963E' : 'transparent',
                                                color: i18n.language === code ? 'white' : '#6B6458',
                                                fontSize: '11px', fontWeight: '800',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
