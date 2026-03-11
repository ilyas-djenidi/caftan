import React, { useState, useEffect, useCallback } from 'react';
import { useAdminStore } from '../../store/adminStore';
import {
    Search,
    ChevronDown,
    ChevronUp,
    Phone,
    MapPin,
    MessageSquare,
    Calendar,
    Truck,
    XCircle,
    Loader2,
    Trash2,
    Square,
    CheckSquare,
    RotateCcw,
    Package2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getImageUrl } from '../../utils';
import { getOrderById, updateOrderGuepex, getGuepexDeliveryStats } from '../../api/orders.api';
import { getParcel } from '../../services/guepex';
import toast from 'react-hot-toast';
import GuepexPanel from '../../components/admin/GuepexPanel';

const ORDER_STATUSES = [
    { value: 'PENDING', label: 'En attente', color: '#f59e0b', bg: '#FFFBEB' },
    { value: 'CONFIRMED', label: 'Confirmée', color: '#3b82f6', bg: '#EFF6FF' },
    { value: 'SHIPPED', label: 'Expédiée', color: '#8b5cf6', bg: '#F5F3FF' },
    { value: 'DELIVERED', label: 'Livrée', color: '#22c55e', bg: '#F0FDF4' },
    { value: 'CANCELLED', label: 'Annulée', color: '#ef4444', bg: '#FEF2F2' }
];

/* ─── Guepex status definitions (shared) ──────────────────── */
const GUEPEX_STATUSES = [
    { value: 'ALL',        label: 'Tous' },
    { value: 'none',       label: 'Non expédié' },
    { value: 'created',    label: 'Créé' },
    { value: 'in_transit', label: 'En transit' },
    { value: 'delivered',  label: 'Livré' },
    { value: 'returned',   label: 'Retourné' },
];

const GUEPEX_STATUS_META = {
    created:    { color: '#6b7280', bg: '#F3F4F6', label: 'Créée' },
    in_transit: { color: '#3b82f6', bg: '#EFF6FF', label: 'En transit' },
    delivered:  { color: '#22c55e', bg: '#F0FDF4', label: 'Livrée' },
    returned:   { color: '#ef4444', bg: '#FEF2F2', label: 'Retournée' },
    cancelled:  { color: '#ef4444', bg: '#FEF2F2', label: 'Annulée' },
};

const Orders = () => {
    const { orders, fetchOrders, updateOrderStatus, fetchStats, deleteOrder, totalPages, totalOrders } = useAdminStore();
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [guepexFilter, setGuepexFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [expandedOrderDetails, setExpandedOrderDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    // Bulk
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkRefreshing, setBulkRefreshing] = useState(false);
    const [bulkProgress, setBulkProgress] = useState('');
    // Delivery stats
    const [deliveryStats, setDeliveryStats] = useState({ total: 0, in_transit: 0, delivered: 0, returned: 0 });

    // Debounce Search Term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reset to page 1 on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setPage(1); // Reset to page 1 on status change
    }, [statusFilter]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await fetchOrders({ 
                page, 
                limit: 10, 
                status: statusFilter === 'ALL' ? null : statusFilter.toLowerCase(), 
                search: debouncedSearch 
            });
            setLoading(false);
        };
        load();
    }, [page, statusFilter, debouncedSearch]);

    // Fetch delivery stats on mount
    useEffect(() => {
        getGuepexDeliveryStats().then(setDeliveryStats).catch(console.error);
    }, []);

    const refreshDeliveryStats = () =>
        getGuepexDeliveryStats().then(setDeliveryStats).catch(console.error);

    const handleExpandRow = async (orderId) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            setExpandedOrderDetails(null);
        } else {
            setExpandedOrderId(orderId);
            setLoadingDetails(true);
            try {
                const { data } = await getOrderById(orderId);
                setExpandedOrderDetails(data);
            } catch (error) {
                console.error("Error fetching order details", error);
                toast.error("Erreur lors du chargement des détails");
            } finally {
                setLoadingDetails(false);
            }
        }
    };

    const handleGuepexRefresh = useCallback(async () => {
        if (!expandedOrderId) return;
        try {
            const { data } = await getOrderById(expandedOrderId);
            setExpandedOrderDetails(data);
        } catch (err) {
            console.error('Guepex refresh error', err);
        }
    }, [expandedOrderId]);

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

    const handleDeleteOrder = async (id, e) => {
        if (e) e.stopPropagation();
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.")) {
            setDeletingId(id);
            try {
                await deleteOrder(id);
                await fetchStats();
                setExpandedOrderId(null);
                setExpandedOrderDetails(null);
            } catch (error) {
                console.error('Error deleting order:', error);
            } finally {
                setDeletingId(null);
            }
        }
    };

    // Bulk refresh selected orders
    const handleBulkRefresh = async () => {
        const ordersWithTracking = orders.filter(
            o => selectedIds.includes(o.id) && o.guepex_tracking_id
        );
        if (ordersWithTracking.length === 0) {
            toast('Aucune commande sélectionnée avec un tracking Guepex');
            return;
        }
        setBulkRefreshing(true);
        let done = 0;
        const total = ordersWithTracking.length;
        for (const order of ordersWithTracking) {
            setBulkProgress(`Mise à jour ${done + 1}/${total}…`);
            try {
                const data = await getParcel(order.guepex_tracking_id);
                const newStatus = data?.status || data?.state;
                if (newStatus && !data?.error) {
                    await updateOrderGuepex(order.id, { guepex_status: newStatus });
                }
            } catch (e) { /* skip */ }
            done++;
        }
        setBulkRefreshing(false);
        setBulkProgress('');
        setSelectedIds([]);
        refreshDeliveryStats();
        toast.success(`${total} statut(s) mis à jour ✓`);
    };

    // Client-side Guepex filter on top of server-side data
    const filteredOrders = orders.filter(order => {
        if (guepexFilter === 'ALL') return true;
        if (guepexFilter === 'none') return !order.guepex_tracking_id;
        return order.guepex_status === guepexFilter;
    });

    const allFilteredSelected =
        filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.includes(o.id));

    const toggleAll = () => {
        if (allFilteredSelected) setSelectedIds([]);
        else setSelectedIds(filteredOrders.map(o => o.id));
    };

    const toggleOne = (id) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const getStatusInfo = (status) => {
        return ORDER_STATUSES.find(s => s.value === status?.toUpperCase()) || ORDER_STATUSES[0];
    };

    return (
        <>
        <style>{`@keyframes slideUpIn { from { opacity:0; transform:translate(-50%,12px); } to { opacity:1; transform:translate(-50%,0); } }`}</style>
        <div className="flex flex-col gap-8 animate-fade-in pb-20" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
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
                        display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap',
                        gap: '4px', backgroundColor: '#ffffff', borderRadius: '15px',
                        padding: '4px', border: '1px solid #F0EDE8',
                        msOverflowStyle: 'none', scrollbarWidth: 'none'
                    }} className="no-scrollbar">
                        {[{ value: 'ALL', label: 'TOUT' }, ...ORDER_STATUSES].map((s) => (
                            <button
                                key={s.value}
                                onClick={() => setStatusFilter(s.value)}
                                style={{
                                    padding: '8px 16px', borderRadius: '11px',
                                    fontSize: '11px', fontWeight: '800', border: 'none',
                                    backgroundColor: statusFilter === s.value ? '#111111' : 'transparent',
                                    color: statusFilter === s.value ? 'white' : '#9ca3af',
                                    cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase',
                                    flexShrink: 0
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Statistiques Livraison ─────────────────────────────── */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px'
            }}>
                {[
                    { label: 'Total expéditions', value: deliveryStats.total,      color: '#111111' },
                    { label: 'En transit',         value: deliveryStats.in_transit, color: '#3b82f6' },
                    { label: 'Livrées',            value: deliveryStats.delivered,  color: '#22c55e' },
                    { label: 'Retournées',         value: deliveryStats.returned,   color: '#ef4444' },
                ].map((stat) => (
                    <div key={stat.label} style={{
                        backgroundColor: 'white', borderRadius: '20px',
                        border: '1px solid #F0EDE8', padding: '20px 24px',
                        boxShadow: '0 4px 30px rgba(0,0,0,0.02)',
                    }}>
                        <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {stat.label}
                        </p>
                        <p style={{ margin: 0, fontSize: '32px', fontFamily: 'Cormorant Garamond, serif', fontWeight: '700', color: stat.color, lineHeight: 1 }}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ─── Guepex Delivery Filter ─────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Truck size={14} style={{ color: '#9ca3af' }} />
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '4px' }}>Livraison Guepex :</span>
                <div style={{
                    display: 'flex', gap: '4px', backgroundColor: '#ffffff',
                    borderRadius: '14px', padding: '4px', border: '1px solid #F0EDE8',
                }}>
                    {GUEPEX_STATUSES.map(s => (
                        <button key={s.value} onClick={() => setGuepexFilter(s.value)}
                            style={{
                                padding: '6px 14px', borderRadius: '10px', border: 'none',
                                fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                                backgroundColor: guepexFilter === s.value ? '#111111' : 'transparent',
                                color: guepexFilter === s.value ? 'white' : '#9ca3af',
                                cursor: 'pointer', transition: 'all 0.2s',
                            }}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Area */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '30px',
                border: '1px solid #F0EDE8',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                boxShadow: '0 4px 30px rgba(0,0,0,0.02)'
            }}>
                <table className="w-full text-left border-collapse mobile-card-table" style={{ minWidth: '960px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #F0EDE8', backgroundColor: '#ffffff' }}>
                            {/* Checkbox */}
                            <th style={{ padding: '20px 12px 20px 24px', width: '40px' }}>
                                <button onClick={toggleAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                                    {allFilteredSelected ? <CheckSquare size={16} color="#C3AB7E" /> : <Square size={16} />}
                                </button>
                            </th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Commande</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Client</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Statut</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Livraison</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Statut Guepex</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Détails</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EDE8]">
                        {loading ? (
                            <tr>
                                <td colSpan="8" style={{ padding: '80px 0', textAlign: 'center' }}>
                                    <Loader2 size={32} className="animate-spin text-[#C3AB7E] inline-block" />
                                </td>
                            </tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="py-20 text-center text-gray-400 italic">Aucune commande trouvée</td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => {
                                const isOpened = expandedOrderId === order.id;
                                const status = getStatusInfo(order.status);

                                const isSelected = selectedIds.includes(order.id);
                                const gMeta = order.guepex_status ? (GUEPEX_STATUS_META[order.guepex_status] || null) : null;

                                return (
                                    <React.Fragment key={order.id}>
                                        <tr
                                            onClick={() => handleExpandRow(order.id)}
                                            style={{
                                                transition: 'background 0.15s',
                                                backgroundColor: isOpened ? 'rgba(255,255,255,0.6)' : isSelected ? '#FFFBF0' : 'transparent',
                                                opacity: deletingId === order.id ? 0.5 : 1
                                            }}
                                            className="hover:bg-[rgba(255,255,255,0.5)] cursor-default transition-colors"
                                        >
                                            {/* Checkbox */}
                                            <td style={{ padding: '16px 12px 16px 24px' }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => toggleOne(order.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                >
                                                    {isSelected
                                                        ? <CheckSquare size={16} color="#C3AB7E" />
                                                        : <Square size={16} color="#d1d5db" />}
                                                </button>
                                            </td>

                                            {/* Order Info */}
                                            <td style={{ padding: '16px 24px' }} className={`w-full-mobile ${!isOpened ? 'mobile-hidden-closed' : ''}`}>
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
                                                    <span className="font-bold text-[#111111] leading-tight">{order.customer_name}</span>
                                                    <span className="text-xs text-gray-400 font-medium">{order.customer_phone}</span>
                                                </div>
                                            </td>

                                            {/* Total */}
                                            <td style={{ padding: '16px 24px' }}>
                                                <div className="flex flex-col gap-0.5 items-end md:items-start text-right md:text-left">
                                                    <span className="font-bold text-[#111111]">{order.total_price || 0} DA</span>
                                                    <span className="text-[10px] text-[#C3AB7E] font-bold uppercase tracking-wider">{order.payment_method || 'COD'}</span>
                                                </div>
                                            </td>

                                            {/* Statut commande */}
                                            <td style={{ padding: '16px 24px' }} className={`w-full-mobile ${!isOpened ? 'mobile-hidden-closed' : ''}`}>
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

                                            {/* Livraison (tracking badge) */}
                                            <td style={{ padding: '16px 24px' }}>
                                                {order.guepex_tracking_id ? (
                                                    <div style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        padding: '5px 10px', borderRadius: '8px',
                                                        backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB',
                                                    }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: gMeta?.color || '#6b7280', flexShrink: 0 }} />
                                                        <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: '700', color: '#374151', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {order.guepex_tracking_id}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '700' }}>—</span>
                                                )}
                                            </td>

                                            {/* Statut Guepex */}
                                            <td style={{ padding: '16px 24px' }}>
                                                {gMeta ? (
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                        padding: '5px 10px', borderRadius: '100px',
                                                        backgroundColor: gMeta.bg, color: gMeta.color,
                                                        fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                                                    }}>
                                                        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: gMeta.color, display: 'inline-block' }} />
                                                        {gMeta.label}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#d1d5db', fontSize: '14px', fontWeight: '700' }}>—</span>
                                                )}
                                            </td>

                                            {/* Action */}
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
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
                                                <td colSpan="8" style={{ padding: 'clamp(12px, 2vw, 32px)', backgroundColor: '#ffffff' }}>
                                                    {loadingDetails ? (
                                                        <div className="flex justify-center p-8">
                                                            <Loader2 className="animate-spin text-[#C3AB7E]" size={32} />
                                                        </div>
                                                    ) : expandedOrderDetails ? (
                                                        <div className="animate-fade-in-up flex flex-col gap-6 p-6 md:p-8 rounded-[24px] bg-white border border-[#F0EDE8]">
                                                            {/* Two-column: items + delivery */}
                                                            <div className="flex flex-col lg:grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
                                                            {/* Items Section */}
                                                            <div>
                                                                <div className="flex items-center justify-between mb-6">
                                                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contenu du colis</h4>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Statut:</span>
                                                                        <select
                                                                            value={expandedOrderDetails.status?.toUpperCase()}
                                                                            onChange={(e) => {
                                                                                handleStatusUpdate(expandedOrderDetails.id, e.target.value.toLowerCase());
                                                                                setExpandedOrderDetails(prev => ({...prev, status: e.target.value.toLowerCase()}));
                                                                            }}
                                                                            disabled={updatingId === expandedOrderDetails.id}
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
                                                                        {updatingId === expandedOrderDetails.id && <Loader2 className="animate-spin text-[#C3AB7E]" size={14} />}
                                                                    </div>
                                                                </div>

                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                    {expandedOrderDetails.items && expandedOrderDetails.items.map((item, i) => (
                                                                        <div key={i} style={{
                                                                            display: 'flex', alignItems: 'center', gap: '16px',
                                                                            padding: '14px 18px',
                                                                            borderBottom: i < expandedOrderDetails.items.length - 1 ? '1px solid #ffffff' : 'none'
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
                                                                            {expandedOrderDetails.total_price || 0} DA
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Delivery Section */}
                                                            <div>
                                                                <div className="flex items-center justify-between mb-6">
                                                                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Détails de livraison</h4>
                                                                    <button
                                                                        onClick={(e) => handleDeleteOrder(expandedOrderDetails.id, e)}
                                                                        disabled={deletingId === expandedOrderDetails.id}
                                                                        className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', fontSize: '12px', fontWeight: '700' }}
                                                                    >
                                                                        {deletingId === order.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                                        Supprimer
                                                                    </button>
                                                                </div>
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
                                                                                    <p className="text-sm font-bold text-[#111111] leading-relaxed">{expandedOrderDetails.shipping_address || 'Non spécifiée'}</p>
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-start gap-4">
                                                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C3AB7E', border: '1px solid #F0EDE8' }}>
                                                                                    <Calendar size={20} />
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Wilaya</p>
                                                                                    <p className="text-sm font-bold text-[#111111]">{expandedOrderDetails.wilaya || expandedOrderDetails.wilaya_id || '—'}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Contact Actions */}
                                                                    <div className="flex flex-col gap-3">
                                                                        <a
                                                                            href={`tel:${expandedOrderDetails.customer_phone}`}
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
                                                                            href={`https://wa.me/213${expandedOrderDetails.customer_phone?.replace(/^0/, '')}`}
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

                                                            {/* Guepex Shipping Panel – full width */}
                                                            <GuepexPanel
                                                                order={expandedOrderDetails}
                                                                onRefresh={handleGuepexRefresh}
                                                            />
                                                        </div>
                                                    ) : null}
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#F0EDE8]">
                    <span className="text-sm text-gray-400 font-bold uppercase">
                        Page {page} sur {totalPages} ({totalOrders} commandes)
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{
                                padding: '8px 16px', borderRadius: '12px', border: '1px solid #F0EDE8',
                                backgroundColor: page === 1 ? '#FAFAFA' : 'white',
                                color: page === 1 ? '#9ca3af' : '#111111',
                                fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', cursor: page === 1 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                            className={page !== 1 ? "hover:bg-gray-50" : ""}
                        >
                            Précédent
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={{
                                padding: '8px 16px', borderRadius: '12px', border: '1px solid #F0EDE8',
                                backgroundColor: page === totalPages ? '#FAFAFA' : 'white',
                                color: page === totalPages ? '#9ca3af' : '#111111',
                                fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                            className={page !== totalPages ? "hover:bg-gray-50" : ""}
                        >
                            Suivant
                        </button>
                    </div>
                </div>
            )}

            {/* ─── Bulk Action Bar ───────────────────────────────────── */}
            {selectedIds.length > 0 && (
                <div style={{
                    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9000, display: 'flex', alignItems: 'center', gap: '16px',
                    backgroundColor: '#111111', color: 'white',
                    padding: '14px 24px', borderRadius: '20px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
                    animation: 'slideUpIn 0.25s ease',
                    whiteSpace: 'nowrap',
                }}>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>
                        {bulkProgress || `${selectedIds.length} commande${selectedIds.length > 1 ? 's' : ''} sélectionnée${selectedIds.length > 1 ? 's' : ''}`}
                    </span>
                    <button
                        onClick={handleBulkRefresh}
                        disabled={bulkRefreshing}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 18px', borderRadius: '12px',
                            backgroundColor: '#C3AB7E', color: 'white', border: 'none',
                            fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                            letterSpacing: '0.06em', cursor: bulkRefreshing ? 'not-allowed' : 'pointer',
                            opacity: bulkRefreshing ? 0.7 : 1, transition: 'all 0.2s',
                        }}
                    >
                        {bulkRefreshing
                            ? <Loader2 size={14} className="animate-spin" />
                            : <RotateCcw size={14} />
                        }
                        Rafraîchir les statuts
                    </button>
                    <button
                        onClick={() => setSelectedIds([])}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#9ca3af', padding: '4px', fontSize: '12px', fontWeight: '700',
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
        </>
    );
};

export default Orders;
