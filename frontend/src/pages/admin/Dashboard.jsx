import { useEffect, useState } from 'react';
import { getDashboardStats } from '../../api/stats.api';
import { ShoppingBag, Clock, TrendingUp, MessageSquare, Package, Loader2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const ChartBar = ({ value, maxValue, label, isToday }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '10px', flex: 1,
            cursor: 'default'
        }}>
            {/* Value label above bar */}
            <span style={{
                fontSize: '12px', fontWeight: '800',
                color: isToday ? '#C3AB7E' : '#111111',
                minHeight: '18px', opacity: value > 0 ? 1 : 0
            }}>{value}</span>

            {/* Bar container */}
            <div style={{
                width: '100%', height: '200px',
                display: 'flex', alignItems: 'flex-end',
                position: 'relative'
            }}>
                {/* Background track */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundColor: '#F8F8F6',
                    borderRadius: '12px'
                }} />
                {/* Filled bar */}
                <div style={{
                    width: '100%',
                    height: `${Math.max(percentage, 3)}%`,
                    background: isToday
                        ? 'linear-gradient(to top, #C3AB7E, #e8d5a3)'
                        : 'linear-gradient(to top, #e5e5e5, #f0f0f0)',
                    borderRadius: '10px',
                    position: 'relative',
                    zIndex: 1,
                    transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isToday ? '0 4px 20px rgba(195,171,126,0.4)' : 'none'
                }}>
                    {/* Shine effect on top */}
                    {isToday && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0,
                            height: '4px', borderRadius: '10px 10px 0 0',
                            backgroundColor: 'rgba(255,255,255,0.6)'
                        }} />
                    )}
                </div>
            </div>

            {/* Day label */}
            <span style={{
                fontSize: '11px',
                fontWeight: isToday ? '900' : '600',
                color: isToday ? '#C3AB7E' : '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>{label}</span>
        </div>
    );
};

export default function Dashboard() {
    const [stats, setStats] = useState({
        today_orders: 0,
        pending_orders: 0,
        month_revenue: 0,
        unread_messages: 0,
        products_count: 0,
        visitors: 0
    });
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const data = await getDashboardStats();
            setStats({
                today_orders: data.today_orders ?? 0,
                pending_orders: data.pending_orders ?? 0,
                month_revenue: data.month_revenue ?? 0,
                unread_messages: data.unread_messages ?? 0,
                products_count: data.products_count ?? 0,
                visitors: 0,
            });

            const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            const chart = (data.chart_7d ?? []).map((d, i) => ({
                label: days[i] ?? d.date,
                value: parseInt(d.orders, 10) ?? 0,
            }));
            setChartData(chart);
            setRecentOrders(data.recent_orders ?? []);
        } catch (error) {
            console.error('Stats error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#C3AB7E]" size={40} /></div>;

    const kpiCards = [
        {
            label: 'Commandes Auj.',
            value: stats.today_orders,
            icon: ShoppingBag,
            gradient: 'linear-gradient(135deg, #111111 0%, #2d2d2d 100%)',
            iconColor: '#C3AB7E',
            textColor: 'white',
            trend: '+12%'
        },
        {
            label: 'En Attente',
            value: stats.pending_orders,
            icon: Clock,
            gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            iconColor: '#d97706',
            textColor: '#111111',
            trend: null
        },
        {
            label: 'Revenu du Mois',
            value: `${stats.month_revenue.toLocaleString()} DA`,
            icon: TrendingUp,
            gradient: 'linear-gradient(135deg, #C3AB7E 0%, #a8915f 100%)',
            iconColor: 'white',
            textColor: 'white',
            trend: '+8%'
        },
        {
            label: 'Visiteurs',
            value: stats.visitors || 0,
            icon: Users,
            gradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            iconColor: '#2563eb',
            textColor: '#111111',
            trend: null
        },
        {
            label: 'Produits Actifs',
            value: stats.products_count,
            icon: Package,
            gradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            iconColor: '#6b7280',
            textColor: '#111111',
            trend: null
        },
    ];

    return (
        <div className="flex flex-col gap-8 w-full animate-fade-in-up pb-10" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {kpiCards.map((card, i) => (
                    <div key={i} style={{
                        background: card.gradient,
                        borderRadius: '24px',
                        padding: '28px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px',
                        position: 'relative',
                        overflow: 'hidden',
                        minHeight: '160px'
                    }}>
                        {/* Decorative circle */}
                        <div style={{
                            position: 'absolute', top: '-20px', right: '-20px',
                            width: '100px', height: '100px', borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.06)'
                        }} />
                        <div style={{
                            position: 'absolute', bottom: '-30px', right: '20px',
                            width: '80px', height: '80px', borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.04)'
                        }} />

                        {/* Top row: label + icon */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span style={{
                                fontSize: '10px', fontWeight: '800',
                                color: card.textColor, opacity: 0.6,
                                textTransform: 'uppercase', letterSpacing: '0.15em'
                            }}>{card.label}</span>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '12px',
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: card.iconColor
                            }}>
                                <card.icon size={18} />
                            </div>
                        </div>

                        {/* Value */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <span style={{
                                fontSize: 'clamp(24px, 3vw, 36px)',
                                fontWeight: '800', color: card.textColor,
                                fontFamily: 'serif', lineHeight: 1
                            }}>{card.value}</span>
                            {card.trend && (
                                <span style={{
                                    fontSize: '11px', fontWeight: '800',
                                    color: card.textColor, opacity: 0.7,
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    padding: '4px 10px', borderRadius: '20px'
                                }}>{card.trend}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                backgroundColor: 'white',
                borderRadius: '28px',
                padding: '32px',
                border: '1px solid #F0EDE8',
                boxShadow: '0 2px 20px rgba(0,0,0,0.03)'
            }}>
                {/* Chart header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontFamily: 'serif', fontWeight: '700', fontStyle: 'italic' }}>
                            Volume des Commandes
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>
                            Cette semaine
                        </p>
                    </div>
                    {/* Legend */}
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'linear-gradient(to top, #C3AB7E, #e8d5a3)' }} />
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af' }}>Aujourd'hui</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#e5e5e5' }} />
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#9ca3af' }}>Autres jours</span>
                        </div>
                    </div>
                </div>

                {/* Bars */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', padding: '0 8px' }}>
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

            <div style={{
                backgroundColor: 'white', borderRadius: '28px',
                padding: '32px', border: '1px solid #F0EDE8',
                boxShadow: '0 2px 20px rgba(0,0,0,0.03)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '20px', fontFamily: 'serif', fontStyle: 'italic' }}>
                        Dernières Commandes
                    </h3>
                    <Link to="/admin/orders" style={{
                        fontSize: '11px', fontWeight: '800', color: '#C3AB7E',
                        textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase'
                    }}>Voir tout →</Link>
                </div>

                {/* Fetch and show last 5 orders from adminStore.orders */}
                {recentOrders.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                        Aucune commande récente
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentOrders.map(order => (
                            <div key={order.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '16px 20px', backgroundColor: '#FAFAFA',
                                borderRadius: '16px', gap: '12px', flexWrap: 'wrap'
                            }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: '800', fontSize: '14px' }}>{order.order_number}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>{order.customer_name}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span style={{ fontWeight: '800', fontSize: '14px' }}>{order.total_price?.toLocaleString()} DA</span>
                                    <span style={{
                                        fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                                        padding: '4px 12px', borderRadius: '20px',
                                        backgroundColor: order.status === 'pending' ? '#fef3c7' : order.status === 'delivered' ? '#dcfce7' : '#f3f4f6',
                                        color: order.status === 'pending' ? '#d97706' : order.status === 'delivered' ? '#16a34a' : '#6b7280'
                                    }}>{order.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

