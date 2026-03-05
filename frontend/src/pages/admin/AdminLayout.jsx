import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
    Menu,
    Bell,
    Calendar,
    LogOut,
    ArrowLeft
} from 'lucide-react';
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

    // Simulate notifications for the bell
    const activeNotifications = 3;

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            maxWidth: '100vw',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* SIDEBAR Component */}
            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area Wrapper */}
            <div style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#ffffff',
                height: '100vh'
            }}>
                {/* Header */}
                <header
                    style={{
                        backgroundColor: 'white',
                        height: '80px',
                        borderBottom: '1px solid #F0EDE8',
                        padding: '0 40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        zIndex: 40,
                        flexShrink: 0
                    }}
                >
                    {/* Left Header Section */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <Menu size={24} className="text-gray-600" />
                        </button>
                        <div>
                            <h2 className="font-serif text-2xl font-bold text-[#111111]">Welcome back</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Calendar size={12} className="text-[#C3AB7E]" />
                                <span className="text-xs text-[#C3AB7E] font-bold uppercase tracking-[0.1em]">
                                    {format(new Date(), 'EEEE, d MMMM', { locale: fr })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right side — only these elements: Bell, Divider, Admin info, Avatar */}
                    <div className="flex items-center gap-[16px]">
                        {/* Notification Bell */}
                        <button className="relative text-[#9ca3af] hover:text-[#111111] transition-colors">
                            <Bell size={20} />
                            {activeNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                            )}
                        </button>

                        <div style={{ width: '1px', height: '32px', backgroundColor: '#F0EDE8' }} />

                        {/* Déconnexion Button */}
                        <button onClick={async () => {
                            await logout();
                            navigate('/admin/nad-auth');
                        }} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '10px',
                            backgroundColor: 'transparent',
                            border: '1px solid rgba(195,171,126,0.3)',
                            color: '#C3AB7E', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '700',
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            transition: 'all 0.2s'
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = '#111111'
                                e.currentTarget.style.borderColor = '#111111'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                e.currentTarget.style.borderColor = 'rgba(195,171,126,0.3)'
                            }}>
                            <LogOut size={14} />
                            Déconnexion
                        </button>
                    </div>
                </header>

                {/* Content Container */}
                <main style={{
                    flex: 1,
                    padding: 'clamp(16px, 3vw, 32px)',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}>
                    <div className="max-w-[1600px] mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
