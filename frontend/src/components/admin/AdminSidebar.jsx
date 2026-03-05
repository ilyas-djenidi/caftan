import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Package, LogOut, Tags, MessageCircle, Star, Image as ImageIcon } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { supabase } from '../../lib/supabase';

const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin' },
    { icon: ShoppingBag, label: 'Commandes', path: '/admin/orders' },
    { icon: Package, label: 'Produits', path: '/admin/products' },
    { icon: Star, label: 'Packs Mariée', path: '/admin/packs' },
    { icon: Tags, label: 'Promotions', path: '/admin/promos' },
    { icon: ImageIcon, label: 'Gérer la Vitrine', path: '/admin/hero' },
    { icon: MessageCircle, label: 'Messages', path: '/admin/messages' },
];

export default function AdminSidebar({ mobileOpen, setMobileOpen }) {
    const { logout } = useAdminStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadCount, setUnreadCount] = useState(0);
    const [pendingOrders, setPendingOrders] = useState(0);

    const handleLogout = async () => {
        await logout();
        navigate('/admin/nad-auth');
    };

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                // Fixed: use is_read = false instead of status = unread
                const { count: msgs } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_read', false);

                const { count: ords } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending');

                setUnreadCount(msgs || 0);
                setPendingOrders(ords || 0);
            } catch (err) {
                console.error("Error fetching admin counts:", err);
            }
        };

        fetchCounts();

        // Subscriptions
        const channels = supabase.channel('admin_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchCounts)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchCounts)
            .subscribe();

        return () => supabase.removeChannel(channels);
    }, []);

    const sidebarStyle = {
        width: '280px', flexShrink: 0, backgroundColor: '#111111', color: 'white',
        borderRight: '1px solid #1f1f1f', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, bottom: 0, left: 0,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 50
    };

    return (
        <aside style={sidebarStyle} className="lg:translate-x-0 lg:static">
            <div style={{ padding: '40px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                    <img src="/logo.png" alt="Maison du Caftans" style={{ height: '40px', filter: 'brightness(0) invert(1)', marginBottom: '8px' }} />
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#C3AB7E', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Administration</span>
                </div>
                {setMobileOpen && (
                    <button onClick={() => setMobileOpen(false)} className="lg:hidden" style={{ background: 'none', border: 'none', color: 'white', padding: '8px' }}>✕</button>
                )}
            </div>

            <div style={{ padding: '32px 20px', flex: 1, overflowY: 'auto' }}>
                <p style={{ fontSize: '10px', fontWeight: '800', color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px', paddingLeft: '12px' }}>
                    Menu Principal
                </p>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileOpen && setMobileOpen(false)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    padding: '16px 20px', borderRadius: '16px',
                                    textDecoration: 'none', fontSize: '13px', fontWeight: '700',
                                    backgroundColor: isActive ? 'rgba(195, 171, 126, 0.1)' : 'transparent',
                                    color: isActive ? '#C3AB7E' : '#9ca3af',
                                    transition: 'all 0.2s'
                                }}
                                className="hover:bg-white/5 hover:text-white group"
                            >
                                <Icon size={20} style={{ color: isActive ? '#C3AB7E' : '#6b7280' }} className="group-hover:text-white transition-colors" />
                                <span style={{ flex: 1 }}>{item.label}</span>

                                {item.label === 'Messages' && unreadCount > 0 && (
                                    <span style={{ backgroundColor: '#C3AB7E', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '100px' }}>
                                        {unreadCount}
                                    </span>
                                )}
                                {item.label === 'Commandes' && pendingOrders > 0 && (
                                    <span style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '100px' }}>
                                        {pendingOrders}
                                    </span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div style={{ padding: '24px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '16px', width: '100%',
                        padding: '16px 20px', borderRadius: '16px', background: 'none', border: 'none',
                        color: '#6b7280', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                        transition: 'all 0.2s', textAlign: 'left'
                    }}
                    className="hover:bg-red-500/10 hover:text-red-500 group"
                >
                    <LogOut size={20} className="group-hover:text-red-500 transition-colors" />
                    Déconnexion
                </button>
            </div>
        </aside>
    );
}
