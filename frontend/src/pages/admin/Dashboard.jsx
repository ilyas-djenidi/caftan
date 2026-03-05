import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../utils';
import { ShoppingBag, Clock, TrendingUp, MessageSquare, Package, ChevronDown, Plus, ExternalLink, Loader2 } from 'lucide-react';

const ChartBar = ({ value, maxValue, label, isToday }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '8px', flex: 1
        }}>
            <span style={{
                fontSize: '13px', fontWeight: '800',
                color: isToday ? '#C3AB7E' : '#111111',
                minHeight: '20px'
            }}>
                {value > 0 ? value : ''}
            </span>

            <div style={{
                width: '100%', height: '180px',
                display: 'flex', alignItems: 'flex-end',
                backgroundColor: 'transparent'
            }}>
                <div style={{
                    width: '100%',
                    height: `${Math.max(percentage, 4)}%`,
                    backgroundColor: isToday ? '#C3AB7E' : '#F0EDE8',
                    borderRadius: '8px 8px 0 0',
                    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                }} />
            </div>

            <span style={{
                fontSize: '11px', fontWeight: isToday ? '800' : '600',
                color: isToday ? '#C3AB7E' : '#9ca3af',
                textAlign: 'center', whiteSpace: 'nowrap'
            }}>
                {label}
            </span>
        </div>
    )
}

export default function Dashboard() {
    const [stats, setStats] = useState({
        today_orders: 0,
        pending_orders: 0,
        month_revenue: 0,
        unread_messages: 0,
        products_count: 0
    });
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

            const [
                { count: todayOrders },
                { count: pendingOrders },
                { data: revenueData },
                { count: unreadMsgs },
                { count: totalProds }
            ] = await Promise.all([
                supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', today),
                supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('orders').select('total_price').gte('created_at', startOfMonth).eq('status', 'delivered'),
                supabase.from('messages').select('*', { count: 'exact', head: true }).eq('status', 'unread'),
                supabase.from('products').select('*', { count: 'exact', head: true })
            ]);

            const rev = revenueData?.reduce((sum, r) => sum + (r.total_price || 0), 0) || 0;

            setStats({
                today_orders: todayOrders || 0,
                pending_orders: pendingOrders || 0,
                month_revenue: rev,
                unread_messages: unreadMsgs || 0,
                products_count: totalProds || 0
            });

            // Demo chart data
            setChartData([
                { label: 'Lun', value: 4 },
                { label: 'Mar', value: 7 },
                { label: 'Mer', value: 5 },
                { label: 'Jeu', value: 8 },
                { label: 'Ven', value: 12 },
                { label: 'Sam', value: 15 },
                { label: 'Dim', value: todayOrders || 0 },
            ]);

        } catch (error) {
            console.error('Stats error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#C3AB7E]" size={40} /></div>;

    return (
        <div className="flex flex-col gap-8 w-full animate-fade-in-up pb-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                    { label: "COMMANDES AUJ.", value: stats.today_orders, icon: <ShoppingBag size={18} />, color: '#C3AB7E' },
                    { label: 'EN ATTENTE', value: stats.pending_orders, icon: <Clock size={18} />, color: '#f59e0b' },
                    { label: 'REVENU MOIS', value: `${stats.month_revenue.toLocaleString()} DA`, icon: <TrendingUp size={18} />, color: '#22c55e' },
                    { label: 'MESSAGES', value: stats.unread_messages, icon: <MessageSquare size={18} />, color: '#3b82f6' },
                    { label: 'PRODUITS', value: stats.products_count, icon: <Package size={18} />, color: '#8b5cf6' },
                ].map((stat, i) => (
                    <div key={i} style={{ backgroundColor: 'white', border: '1px solid #F0EDE8', borderRadius: '20px', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af', letterSpacing: '0.1em' }}>{stat.label}</span>
                            <div style={{ color: stat.color }}>{stat.icon}</div>
                        </div>
                        <p style={{ margin: 0, fontSize: '24px', fontFamily: 'serif', fontWeight: '700' }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div style={{ backgroundColor: 'white', border: '1px solid #F0EDE8', borderRadius: '24px', padding: '32px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontFamily: 'serif', fontWeight: '700', fontStyle: 'italic' }}>Volume des Commandes</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '40px' }}>
                    {chartData.map((day, i) => (
                        <ChartBar
                            key={i}
                            value={day.value}
                            maxValue={Math.max(...chartData.map(d => d.value), 1)}
                            label={day.label}
                            isToday={i === chartData.length - 1}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
