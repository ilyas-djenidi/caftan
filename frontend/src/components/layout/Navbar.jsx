import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Heart, Search, ChevronDown } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState(null);
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

    useEffect(() => {
        document.documentElement.style.setProperty(
            '--navbar-height',
            isScrolled ? '72px' : '100px'
        );
    }, [isScrolled]);

    const navLinks = [
        {
            label: 'Collections',
            children: [
                { label: 'Caftans', to: '/caftans', desc: 'Caftans haute couture' },
                { label: 'Sacs', to: '/sacs', desc: 'Maroquinerie fine' },
                { label: 'Accessoires', to: '/accessoires', desc: 'Bijoux & accessoires' },
            ]
        },
        { label: 'Packs Mariée', to: '/packs' },
        { label: 'Contact', to: '/contact' },
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
                padding: (isScrolled || !isHome) ? '0 40px' : '0 40px',
                height: isScrolled ? '72px' : '100px',
                backgroundColor: (isScrolled || !isHome) ? 'rgba(255, 255, 255, 0.98)' : 'transparent',
                backdropFilter: (isScrolled || !isHome) ? 'blur(20px)' : 'none',
                borderBottom: (isScrolled || !isHome) ? '1px solid rgba(195, 171, 126, 0.1)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                {/* Desktop nav — centered */}
                <div className="hidden lg:flex items-center gap-8" style={{ flex: 1, justifyContent: 'flex-start' }}>
                    {navLinks.map((link, i) => (
                        <div key={i} style={{ position: 'relative' }}
                            onMouseEnter={() => link.children && setOpenMenu(i)}
                            onMouseLeave={() => setOpenMenu(null)}
                        >
                            {link.to ? (
                                <Link
                                    to={link.to}
                                    style={{
                                        fontSize: '11px', fontWeight: '800',
                                        textTransform: 'uppercase', letterSpacing: '0.2em',
                                        color: isScrolled || !isHome ? '#111111' : '#ffffff',
                                        textDecoration: 'none', transition: 'color 0.3s',
                                        display: 'flex', alignItems: 'center', gap: '4px'
                                    }}
                                    className="hover:text-[#C3AB7E]"
                                >
                                    {link.label}
                                </Link>
                            ) : (
                                <button
                                    style={{
                                        fontSize: '11px', fontWeight: '800',
                                        textTransform: 'uppercase', letterSpacing: '0.2em',
                                        color: isScrolled || !isHome ? '#111111' : '#ffffff',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: 0, transition: 'color 0.3s'
                                    }}
                                    className="hover:text-[#C3AB7E]"
                                >
                                    {link.label}
                                    <ChevronDown size={12} style={{
                                        transition: 'transform 0.2s',
                                        transform: openMenu === i ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }} />
                                </button>
                            )}

                            {/* Dropdown */}
                            {link.children && openMenu === i && (
                                <div style={{
                                    position: 'absolute', top: 'calc(100% + 16px)', left: '50%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: 'white',
                                    borderRadius: '20px',
                                    padding: '8px',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
                                    border: '1px solid #F0EDE8',
                                    minWidth: '220px',
                                    zIndex: 200,
                                    animation: 'fadeInDown 0.15s ease'
                                }}>
                                    {link.children.map((child) => (
                                        <Link
                                            key={child.to}
                                            to={child.to}
                                            onClick={() => setOpenMenu(null)}
                                            style={{
                                                display: 'flex', flexDirection: 'column', gap: '2px',
                                                padding: '14px 16px', borderRadius: '14px',
                                                textDecoration: 'none', transition: 'background 0.2s',
                                                color: '#111111'
                                            }}
                                            className="hover:bg-[#F0EDE8]"
                                        >
                                            <span style={{ fontSize: '13px', fontWeight: '700' }}>{child.label}</span>
                                            <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>{child.desc}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="lg:hidden"
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: isScrolled || !isHome ? '#111111' : '#ffffff',
                        flex: 1, textAlign: 'left'
                    }}>
                    <Menu size={24} />
                </button>

                {/* Center: Logo */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
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
                </div>

                {/* Right: Icons */}
                <div style={{ display: 'flex' }} className="flex-1 items-center justify-end gap-10">
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', overflowY: 'auto' }}>
                        <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '32px', fontFamily: 'serif', color: '#111111', textDecoration: 'none' }}>Accueil</Link>
                        <Link to="/caftans" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '32px', fontFamily: 'serif', color: '#111111', textDecoration: 'none' }}>Caftans</Link>
                        <Link to="/sacs" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '32px', fontFamily: 'serif', color: '#111111', textDecoration: 'none' }}>Sacs</Link>
                        <Link to="/accessoires" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '32px', fontFamily: 'serif', color: '#111111', textDecoration: 'none' }}>Accessoires</Link>
                        <Link to="/packs" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '32px', fontFamily: 'serif', color: '#111111', textDecoration: 'none' }}>Packs Mariée</Link>
                        <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '32px', fontFamily: 'serif', color: '#111111', textDecoration: 'none' }}>Favoris</Link>
                        <Link to="/contact" onClick={() => setIsMenuOpen(false)} style={{ fontSize: '32px', fontFamily: 'serif', color: '#111111', textDecoration: 'none' }}>Contact</Link>
                    </div>
                </div>
            )}
        </>
    );
}
