import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, LogOut, Tags, MessageCircle, Star, Image as ImageIcon, X, ArrowLeft, Truck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const navItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', to: '/admin', end: true },
    { icon: ShoppingBag, label: 'Commandes',       to: '/admin/orders',      badgeKey: 'orders' },
    { icon: Truck,       label: 'Expéditions',      to: '/admin/expeditions' },
    { icon: Package,     label: 'Produits',          to: '/admin/products' },
    { icon: Star, label: 'Packs', to: '/admin/packs' },
    { icon: Tags, label: 'Promotions', to: '/admin/promos' },
    { icon: ImageIcon, label: 'Gérer la Vitrine', to: '/admin/hero' },
    { icon: MessageCircle, label: 'Messages', to: '/admin/messages', badgeKey: 'messages' },
    { icon: MessageCircle, label: 'Avis', to: '/admin/reviews', badgeKey: 'reviews' },
];

export default function AdminSidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const [counts, setCounts] = useState({ orders: 0, messages: 0, reviews: 0 });

    useEffect(() => { fetchCounts(); }, []);

    const fetchCounts = async () => {
        try {
            const [{ count: orders }, { count: messages }, { count: reviews }] = await Promise.all([
                supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
                supabase.from('product_reviews').select('*', { count: 'exact', head: true }).eq('status', 'pending')
            ]);
            setCounts({ orders: orders || 0, messages: messages || 0, reviews: reviews || 0 });
        } catch (error) {
            console.error(error);
        }
    };

    const SidebarContent = () => (
        <div style={{
            width: '280px',
            backgroundColor: '#111111',
            height: '100vh',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px' }}>
                <span style={{ color: 'white', fontFamily: 'serif', fontSize: '20px', fontWeight: '700' }}>
                    Maison Admin
                </span>
                <button onClick={onClose} className="lg:hidden" style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
            </div>

            {/* Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                {navItems.map(({ to, label, icon: Icon, end, badgeKey }) => {
                    const count = badgeKey ? counts[badgeKey] : 0;
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={onClose}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 16px',
                                borderRadius: '14px',
                                backgroundColor: isActive ? '#C3AB7E' : 'transparent',
                                color: isActive ? '#111111' : 'rgba(255,255,255,0.65)',
                                fontWeight: '700',
                                fontSize: '14px',
                                textDecoration: 'none',
                                transition: 'all 0.2s'
                            })}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                            {count > 0 && (
                                <span style={{
                                    marginLeft: 'auto',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    borderRadius: '20px',
                                    padding: '2px 8px',
                                    minWidth: '20px',
                                    textAlign: 'center'
                                }}>{count}</span>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none',
                        padding: '14px 16px', cursor: 'pointer', fontSize: '14px',
                        fontWeight: '700', borderRadius: '14px', width: '100%', textAlign: 'left'
                    }}
                >
                    <ArrowLeft size={18} /> Retour au site
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* DESKTOP: always visible, sticky in flex row */}
            <div className="hidden lg:block" style={{ flexShrink: 0 }}>
                <SidebarContent />
            </div>

            {/* MOBILE: overlay when isOpen */}
            {isOpen && (
                <>
                    <div
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 99
                        }}
                    />
                    <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100 }}>
                        <SidebarContent />
                    </div>
                </>
            )}
        </>
    );
}
