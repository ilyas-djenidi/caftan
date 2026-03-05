import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Heart, Search } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const { items, openDrawer } = useCartStore();
    const { items: wishlistItems } = useWishlistStore();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Caftans', to: '/caftans' },
        { label: 'Sacs', to: '/sacs' },
        { label: 'Accessoires', to: '/accessoires' },
        { label: 'Packs', to: '/packs' },
    ];

    const isHome = location.pathname === '/';

    return (
        <>
            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 80,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: (isScrolled || !isHome) ? '15px 40px' : '30px 40px',
                backgroundColor: (isScrolled || !isHome) ? 'rgba(255, 255, 255, 0.98)' : 'transparent',
                backdropFilter: (isScrolled || !isHome) ? 'blur(20px)' : 'none',
                borderBottom: (isScrolled || !isHome) ? '1px solid rgba(195, 171, 126, 0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {/* Left: Nav Links (Desktop) */}
                <div style={{ display: 'none' }} className="lg:flex items-center gap-12 flex-1">
                    {navLinks.slice(0, 2).map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                textTransform: 'uppercase',
                                letterSpacing: '0.2em',
                                color: isScrolled || !isHome ? '#111111' : '#ffffff',
                                textDecoration: 'none',
                                transition: 'all 0.3s'
                            }}
                            className="hover:text-[#C3AB7E]"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="lg:hidden"
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: isScrolled || !isHome ? '#111111' : '#ffffff'
                    }}>
                    <Menu size={24} />
                </button>

                {/* Center: Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                        src="/logo.png"
                        alt="Maison du Caftans"
                        style={{
                            height: isScrolled ? '50px' : '70px',
                            transition: 'all 0.5s',
                            filter: isScrolled || !isHome ? 'none' : 'brightness(0) invert(1)'
                        }}
                    />
                </Link>

                {/* Right: Icons + Nav Links (Desktop) */}
                <div style={{ display: 'flex' }} className="flex-1 items-center justify-end gap-10">
                    <div style={{ display: 'none' }} className="lg:flex items-center gap-12 mr-10">
                        {navLinks.slice(2).map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                style={{
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.2em',
                                    color: isScrolled || !isHome ? '#111111' : '#ffffff',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s'
                                }}
                                className="hover:text-[#C3AB7E]"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Link to="/wishlist" style={{ color: isScrolled || !isHome ? '#111111' : '#ffffff', position: 'relative' }}>
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
                                color: isScrolled || !isHome ? '#111111' : '#ffffff',
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

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    backgroundColor: 'white', padding: '40px',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
                        <img src="/logo.png" style={{ height: '50px' }} alt="Logo" />
                        <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={32} strokeWidth={1} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '32px', fontFamily: 'serif', color: '#111111', textDecoration: 'none' }}>Accueil</Link>
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                onClick={() => setIsMenuOpen(false)}
                                style={{ fontSize: '32px', fontFamily: 'serif', color: '#111111', textDecoration: 'none' }}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '32px', fontFamily: 'serif', color: '#111111', textDecoration: 'none' }}>Favoris</Link>
                        <Link to="/contact" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '32px', fontFamily: 'serif', color: '#111111', textDecoration: 'none' }}>Contact</Link>
                    </div>
                </div>
            )}
        </>
    );
}
