import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { Menu, Bell, Calendar, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import AdminSidebar from '../../components/admin/AdminSidebar';
import { useAdminStore } from '../../store/adminStore';

export default function AdminLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { logout } = useAdminStore();

    // Protection: Redirect if no token
    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate('/admin/nad-auth', { replace: true });
        }
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',     // ← explicit row
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: '#f8f8f8',
            maxWidth: '100vw'
        }}>
            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main content — takes remaining space */}
            <div style={{
                flex: 1,
                minWidth: 0,            // ← CRITICAL
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <header style={{
                    backgroundColor: 'white',
                    height: '72px',
                    minHeight: '72px',   // ← don't let it shrink
                    borderBottom: '1px solid #F0EDE8',
                    padding: '0 clamp(16px, 3vw, 40px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    gap: '16px'          // ← gap so items don't collide on small screens
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
                        <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                            <Bell size={20} />
                            <span style={{
                                position: 'absolute', top: '-2px', right: '-2px',
                                width: '8px', height: '8px', backgroundColor: '#ef4444',
                                borderRadius: '50%', border: '2px solid white'
                            }} />
                        </button>

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
