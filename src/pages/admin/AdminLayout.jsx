import { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { Menu, Bell, Calendar, LogOut, MessageSquare, Star } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAdminStore } from '../../store/adminStore';
import { supabase } from '../../lib/supabase';

export default function AdminLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [pendingReviews, setPendingReviews] = useState(0);
    const notificationsRef = useRef(null);
    const { logout } = useAdminStore();

    // Protection: Redirect if no token or invalid session
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                navigate('/admin/nad-auth', { replace: true });
                return;
            }

            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                // Token exists but session is invalid, clear token and redirect
                localStorage.removeItem('admin_token');
                navigate('/admin/nad-auth', { replace: true });
            }
        };
        
        checkAuth();
    }, [navigate]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const [msgsRes, revsRes] = await Promise.all([
                    supabase.from('messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
                    supabase.from('product_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending')
                ]);

                if (msgsRes.count !== null) setUnreadMessages(msgsRes.count);
                if (revsRes.count !== null) setPendingReviews(revsRes.count);
            } catch (error) {
                console.error("Error fetching notifications", error);
            }
        };

        fetchNotifications();

        // Optional: Set up an interval or real-time subscription here
        const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Close notifications dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const totalNotifications = unreadMessages + pendingReviews;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: '#f8f8f8',
            maxWidth: '100vw'
        }}>
            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main content — takes remaining space */}
            <div style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <header style={{
                    backgroundColor: 'white',
                    height: '72px',
                    minHeight: '72px',
                    borderBottom: '1px solid #F0EDE8',
                    padding: '0 clamp(16px, 3vw, 40px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    gap: '16px'
                }}>
                    {/* Left */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                        >
                            <Menu size={22} />
                        </button>
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{
                                fontFamily: 'serif', fontSize: 'clamp(16px, 2vw, 22px)',
                                fontWeight: '700', color: '#111111', margin: 0,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                            }}>Welcome back</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <Calendar size={11} style={{ color: '#C3AB7E', flexShrink: 0 }} />
                                <span style={{
                                    fontSize: '10px', color: '#C3AB7E', fontWeight: '800',
                                    textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap'
                                }}>
                                    {format(new Date(), 'EEEE, d MMMM', { locale: fr })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <div ref={notificationsRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                            >
                                <Bell size={20} className={isNotificationsOpen ? "text-[#C3AB7E]" : ""} />
                                {totalNotifications > 0 && (
                                    <span style={{
                                        position: 'absolute', top: '0px', right: '0px',
                                        width: '10px', height: '10px', backgroundColor: '#ef4444',
                                        borderRadius: '50%', border: '2px solid white'
                                    }} />
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotificationsOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 12px)',
                                    right: 0,
                                    width: '320px',
                                    backgroundColor: 'white',
                                    borderRadius: '20px',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                                    border: '1px solid #F0EDE8',
                                    overflow: 'hidden',
                                    zIndex: 50
                                }} className="animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0EDE8', backgroundColor: '#fafafa' }}>
                                        <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Notifications</h3>
                                    </div>
                                    <div style={{ padding: '8px' }}>
                                        <Link
                                            to="/admin/messages"
                                            onClick={() => setIsNotificationsOpen(false)}
                                            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', borderRadius: '12px', textDecoration: 'none', color: 'inherit' }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: unreadMessages > 0 ? '#fdfbf7' : '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <MessageSquare size={16} style={{ color: unreadMessages > 0 ? '#C3AB7E' : '#9ca3af' }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111111', margin: '0 0 2px 0' }}>Messages Clients</p>
                                                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                                                    {unreadMessages > 0 ? <span style={{ color: '#d97706', fontWeight: '600' }}>{unreadMessages} non lu{unreadMessages > 1 ? 's' : ''}</span> : 'Aucun nouveau message'}
                                                </p>
                                            </div>
                                        </Link>

                                        <Link
                                            to="/admin/reviews"
                                            onClick={() => setIsNotificationsOpen(false)}
                                            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', borderRadius: '12px', textDecoration: 'none', color: 'inherit' }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: pendingReviews > 0 ? '#fdfbf7' : '#f8f8f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Star size={16} style={{ color: pendingReviews > 0 ? '#C3AB7E' : '#9ca3af' }} />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111111', margin: '0 0 2px 0' }}>Avis Clients</p>
                                                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                                                    {pendingReviews > 0 ? <span style={{ color: '#d97706', fontWeight: '600' }}>{pendingReviews} en attente</span> : 'Aucun avis en attente'}
                                                </p>
                                            </div>
                                        </Link>
                                    </div>
                                    {totalNotifications === 0 && (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                                            Vous êtes à jour !
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ width: '1px', height: '28px', backgroundColor: '#F0EDE8' }} />

                        <button
                            onClick={async () => { await logout(); navigate('/admin/nad-auth'); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: '10px',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(195,171,126,0.3)',
                                color: '#C3AB7E', cursor: 'pointer',
                                fontSize: '11px', fontWeight: '700',
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <LogOut size={13} />
                            <span className="hidden sm:inline">Déconnexion</span>
                        </button>
                    </div>
                </header>

                {/* Scrollable content */}
                <main style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: 'clamp(16px, 3vw, 32px)',
                    backgroundColor: '#f8f8f8'
                }}>
                    <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
