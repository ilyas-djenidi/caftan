import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/adminStore';
import {
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    MoreVertical,
    Phone,
    MapPin,
    MessageSquare,
    Package,
    Calendar,
    CheckCircle2,
    Clock,
    Truck,
    XCircle,
    AlertCircle,
    ArrowUpRight,
    CreditCard,
    ShoppingBag,
    Loader2,
    Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getImageUrl } from '../../utils';

const ORDER_STATUSES = [
    { value: 'PENDING', label: 'En attente', color: '#f59e0b', bg: '#FFFBEB' },
    { value: 'CONFIRMED', label: 'Confirmée', color: '#3b82f6', bg: '#EFF6FF' },
    { value: 'SHIPPED', label: 'Expédiée', color: '#8b5cf6', bg: '#F5F3FF' },
    { value: 'DELIVERED', label: 'Livrée', color: '#22c55e', bg: '#F0FDF4' },
    { value: 'CANCELLED', label: 'Annulée', color: '#ef4444', bg: '#FEF2F2' }
];

const Orders = () => {
    const { orders, fetchOrders, updateOrderStatus, fetchStats } = useAdminStore();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchOrders();
            setLoading(false);
        };
        load();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        setUpdatingId(id);
        try {
            await updateOrderStatus(id, status);
            await fetchStats(); // Refresh stats too
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
        const matchesSearch =
            (order.order_number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.customer_phone?.includes(searchTerm));
        return matchesStatus && matchesSearch;
    });

    const getStatusInfo = (status) => {
        return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-10" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#111111]">Commandes</h1>
                    <p className="text-gray-400 text-sm mt-1 uppercase font-bold tracking-widest">Gérez vos expéditions et suivis</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#C3AB7E] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                paddingLeft: '44px', paddingRight: '16px', py: '12px',
                                borderRadius: '15px', border: '1px solid #F0EDE8',
                                backgroundColor: 'white', width: '100%', maxWidth: '300px', outline: 'none',
                                fontSize: '14px', fontWeight: '500', transition: 'all 0.2s'
                            }}
                            className="focus:border-[#C3AB7E] focus:ring-4 focus:ring-[#C3AB7E]/5"
                        />
                    </div>

                    <div style={{
                        display: 'flex',
                        overflowX: 'auto',
                        whiteSpace: 'nowrap',
                        gap: '4px',
                        backgroundColor: '#ffffff',
                        borderRadius: '15px',
                        padding: '4px',
                        border: '1px solid #F0EDE8',
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none'
                    }} className="no-scrollbar">
                        {['ALL', 'PENDING', 'SHIPPED', 'DELIVERED'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                style={{
                                    padding: '8px 16px', borderRadius: '11px',
                                    fontSize: '11px', fontWeight: '800', border: 'none',
                                    backgroundColor: statusFilter === s ? '#111111' : 'transparent',
                                    color: statusFilter === s ? 'white' : '#9ca3af',
                                    cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase',
                                    flexShrink: 0
                                }}
                            >
                                {s === 'ALL' ? 'TOUT' : s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '30px',
                border: '1px solid #F0EDE8',
                overflow: 'hidden',
                boxShadow: '0 4px 30px rgba(0,0,0,0.02)'
            }}>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr style={{ borderBottom: '1px solid #F0EDE8', backgroundColor: '#ffffff' }}>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Commande</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Client</th>
                            <th className="hidden sm:table-cell" style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</th>
                            <th className="hidden md:table-cell" style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Statut</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Détails</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EDE8]">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="animate-spin text-[#C3AB7E]" size={32} />
                                        <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Chargement...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-20 text-center text-gray-400 italic">Aucune commande trouvée</td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => {
                                const isOpened = expandedOrder === order.id;
                                const status = getStatusInfo(order.status);

                                return (
                                    <React.Fragment key={order.id}>
                                        <tr
                                            onClick={() => setExpandedOrder(isOpened ? null : order.id)}
                                            style={{
                                                transition: 'background 0.15s',
                                                backgroundColor: isOpened ? 'rgba(255,255,255,0.6)' : 'transparent'
                                            }}
                                            className="hover:bg-[rgba(255,255,255,0.5)] cursor-default flex flex-col sm:table-row"
                                        >
                                            {/* Order Info */}
                                            <td style={{ padding: '16px 24px' }}>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-[#111111]" style={{ whiteSpace: 'nowrap' }}>#{order.order_number}</span>
                                                    <span className="text-[11px] text-gray-400 font-bold uppercase">
                                                        {order.created_at ? format(new Date(order.created_at), 'd MMM yyyy, HH:mm', { locale: fr }) : '—'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td style={{ padding: '16px 24px' }}>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-[#111111]">{order.customer_name}</span>
                                                    <span className="text-xs text-gray-400 font-medium">{order.customer_phone}</span>
                                                </div>
                                            </td>

                                            {/* Total */}
                                            <td className="hidden sm:table-cell" style={{ padding: '16px 24px' }}>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-[#111111]">{order.total_price || 0} DA</span>
                                                    <span className="text-[10px] text-[#C3AB7E] font-bold uppercase tracking-wider">{order.payment_method || 'COD'}</span>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="hidden md:table-cell" style={{ padding: '16px 24px' }}>
                                                <div style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                                    padding: '6px 14px', borderRadius: '100px',
                                                    backgroundColor: status.bg, color: status.color,
                                                    fontSize: '11px', fontWeight: '800', textTransform: 'uppercase'
                                                }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: status.color }} />
                                                    {status.label}
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }} className="sm:table-cell">
                                                <button style={{
                                                    padding: '8px', borderRadius: '12px', border: '1px solid #F0EDE8',
                                                    backgroundColor: isOpened ? '#C3AB7E' : 'transparent',
                                                    color: isOpened ? 'white' : '#C3AB7E',
                                                    transition: 'all 0.2s', cursor: 'pointer'
                                                }}>
                                                    {isOpened ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Details */}
                                        {isOpened && (
                                            <tr>
                                                <td colSpan="5" style={{ padding: 'clamp(12px, 2vw, 32px)', backgroundColor: '#ffffff' }}>
                                                    <div className="animate-fade-in-up flex flex-col lg:grid lg:grid-cols-[1.2fr_0.8fr] gap-8 p-6 md:p-8 rounded-[24px] bg-white border border-[#F0EDE8]">
                                                        {/* Items Section */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-6">
                                                                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contenu du colis</h4>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Statut:</span>
                                                                    <select
                                                                        value={order.status}
                                                                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                                        disabled={updatingId === order.id}
                                                                        style={{
                                                                            padding: '6px 12px', borderRadius: '10px',
                                                                            border: '1px solid #F0EDE8', backgroundColor: 'white',
                                                                            fontSize: '11px', fontWeight: '800', color: '#111111',
                                                                            outline: 'none', cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        {ORDER_STATUSES.map(s => (
                                                                            <option key={s.value} value={s.value}>{s.label.toUpperCase()}</option>
                                                                        ))}
                                                                    </select>
                                                                    {updatingId === order.id && <Loader2 className="animate-spin text-[#C3AB7E]" size={14} />}
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                {order.items && order.items.map((item, i) => (
                                                                    <div key={i} style={{
                                                                        display: 'flex', alignItems: 'center', gap: '16px',
                                                                        padding: '14px 18px',
                                                                        borderBottom: i < order.items.length - 1 ? '1px solid #ffffff' : 'none'
                                                                    }}>
                                                                        <img
                                                                            src={getImageUrl(item.product_image || item.product?.image || item.image)}
                                                                            style={{ width: '56px', height: '64px', borderRadius: '10px', objectFit: 'cover' }}
                                                                        />
                                                                        <div style={{ flex: 1 }}>
                                                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#111111' }}>
                                                                                {item.product_name || item.product?.name || 'Produit'}
                                                                            </p>
                                                                            <p style={{ margin: '2px 0 0', fontSize: '11px', fontWeight: '800', color: '#C3AB7E', textTransform: 'uppercase' }}>
                                                                                {item.size ? `Taille ${item.size}` : ''} {item.color ? `• ${item.color}` : ''} × {item.quantity}
                                                                            </p>
                                                                        </div>
                                                                        <span style={{ fontWeight: '800', fontSize: '13px', color: '#111111', whiteSpace: 'nowrap' }}>
                                                                            {((item.price_at_purchase || item.price || 0) * item.quantity).toLocaleString()} DA
                                                                        </span>
                                                                    </div>
                                                                ))}

                                                                <div style={{
                                                                    marginTop: '16px', padding: '20px 18px',
                                                                    backgroundColor: '#ffffff', borderRadius: '16px',
                                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                                }}>
                                                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Grand Total</span>
                                                                    <span style={{ fontSize: '20px', fontFamily: 'serif', fontWeight: '700', color: '#111111' }}>
                                                                        {order.total_price || 0} DA
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Delivery Section */}
                                                        <div>
                                                            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6">Détails de livraison</h4>
                                                            <div className="flex flex-col gap-6">
                                                                {/* Map / Address Card */}
                                                                <div style={{
                                                                    padding: '24px', borderRadius: '20px',
                                                                    backgroundColor: '#ffffff',
                                                                    border: '1px solid #F0EDE8'
                                                                }}>
                                                                    <div className="flex flex-col gap-4">
                                                                        <div className="flex items-start gap-4">
                                                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C3AB7E', border: '1px solid #F0EDE8' }}>
                                                                                <MapPin size={20} />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Adresse complète</p>
                                                                                <p className="text-sm font-bold text-[#111111] leading-relaxed">{order.shipping_address || 'Non spécifiée'}</p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-start gap-4">
                                                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C3AB7E', border: '1px solid #F0EDE8' }}>
                                                                                <Calendar size={20} />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Wilaya</p>
                                                                                <p className="text-sm font-bold text-[#111111]">{order.wilaya || order.wilaya_id || '—'}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Contact Actions */}
                                                                <div className="flex flex-col gap-3">
                                                                    <a
                                                                        href={`tel:${order.customer_phone}`}
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                                                            padding: '16px', borderRadius: '16px', backgroundColor: '#111111',
                                                                            color: 'white', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase',
                                                                            transition: 'all 0.2s', textDecoration: 'none'
                                                                        }}
                                                                        className="hover:scale-[1.02] active:scale-[0.98]"
                                                                    >
                                                                        <Phone size={16} />
                                                                        Appeler le client
                                                                    </a>
                                                                    <a
                                                                        href={`https://wa.me/213${order.customer_phone?.replace(/^0/, '')}`}
                                                                        target="_blank"
                                                                        style={{
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                                                            padding: '16px', borderRadius: '16px', backgroundColor: 'transparent',
                                                                            color: '#25D366', border: '2px solid #25D366', fontWeight: '800', fontSize: '11px',
                                                                            textTransform: 'uppercase', transition: 'all 0.2s', textDecoration: 'none'
                                                                        }}
                                                                        className="hover:bg-[#25D366] hover:text-white"
                                                                    >
                                                                        <MessageSquare size={16} />
                                                                        WhatsApp
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Orders;
