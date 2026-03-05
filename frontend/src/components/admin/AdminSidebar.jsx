import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Boxes,
    MessageSquare,
    Tag,
    Settings,
    LogOut,
    ArrowLeft,
    X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const navItems = [
    { to: '/admin', label: 'Aperçu', icon: LayoutDashboard, end: true },
    { to: '/admin/orders', label: 'Commandes', icon: ShoppingBag, badgeKey: 'orders' },
    { to: '/admin/products', label: 'Produits', icon: Package },
    { to: '/admin/packs', label: 'Packs', icon: Boxes },
    { to: '/admin/messages', label: 'Messages', icon: MessageSquare, badgeKey: 'messages' },
    { to: '/admin/promos', label: 'Promos', icon: Tag },
    { to: '/admin/hero', label: 'Contenu', icon: Settings },
];

export default function AdminSidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [counts, setCounts] = useState({ orders: 0, messages: 0 });

    useEffect(() => {
        fetchCounts();
    }, []);

    const fetchCounts = async () => {
        try {
            const [
                { count: orders },
                { count: messages }
            ] = await Promise.all([
                supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'unread')
            ]);
            setCounts({ orders: orders || 0, messages: messages || 0 });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden" onClick={onClose} />
            )}

            <aside
                style={{
                    width: '300px',
                    backgroundColor: '#111111',
                    height: '100vh',
                    position: 'sticky',
                    top: 0,
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50
                }}
                className={`fixed lg:sticky top-0 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="flex items-center justify-between mb-12">
                    <span style={{ color: 'white', fontFamily: 'serif', fontSize: '24px' }}>ADMIN</span>
                    <button onClick={onClose} className="lg:hidden text-white"><X /></button>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                                    padding: '16px',
                                    borderRadius: '16px',
                                    backgroundColor: isActive ? '#C3AB7E' : 'transparent',
                                    color: isActive ? '#111' : 'rgba(255,255,255,0.6)',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    textDecoration: 'none'
                                })}
                            >
                                <Icon size={20} />
                                {label}
                                {count > 0 && (
                                    <span style={{ marginLeft: 'auto', backgroundColor: '#ef4444', color: 'white', fontSize: '10px', borderRadius: '10px', padding: '2px 8px' }}>{count}</span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div style={{ marginTop: 'auto' }}>
                    <button 
                        onClick={() => navigate('/')}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', padding: '16px', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={20} /> Retour au site
                    </button>
                    <button 
                        onClick={() => { localStorage.removeItem('admin_token'); navigate('/admin/nad-auth'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', background: 'none', border: 'none', padding: '16px', cursor: 'pointer' }}
                    >
                        <LogOut size={20} /> Déconnexion
                    </button>
                </div>
            </aside>
        </>
    );
}
