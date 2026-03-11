import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Truck, Search, RefreshCw, Loader2, Package2,
    Copy, CheckCircle2, Clock, ChevronLeft, ChevronRight,
    History, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllParcels, cancelParcel, getStatusColor } from '../../services/guepex';
import GuepexHistoryModal from '../../components/GuepexHistoryModal';

/* ─── Helpers ─────────────────────────────────────────────────────── */
const FONTS = { title: "'Cormorant Garamond', serif", body: "'Jost', sans-serif" };

const isTransit   = (s) => ['Ramassé','Expédié','Centre','Transfert','En passation',
    'Prêt à expédier','Vers Wilaya','En transit','Reçu à Wilaya','En localisation'].includes(s);
const isDelivered = (s) => s === 'Livré';
const isReturned  = (s) => s?.startsWith('Retour') || s === 'Retourné au vendeur';

const FILTER_STATUSES = [
    'Tous','En préparation','Expédié','En transit',
    'Sorti en livraison','Livré','Retour vers vendeur','Annulé',
];

/* ─── Sub-components ─────────────────────────────────────────────── */
function Skeleton({ h = 16, w = '100%', style = {} }) {
    return (
        <div style={{
            height: h, width: w, borderRadius: 6,
            background: 'linear-gradient(90deg,#E8E2D6 25%,#F0EDE8 50%,#E8E2D6 75%)',
            backgroundSize: '200% 100%', animation: 'shine 1.4s infinite',
            ...style,
        }} />
    );
}

function StatusBadge({ status }) {
    const color = getStatusColor(status);
    const tint = (() => {
        const n = parseInt(color.replace('#',''), 16);
        return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},0.12)`;
    })();
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '100px',
            backgroundColor: tint, color,
            fontSize: '11px', fontWeight: '700',
            fontFamily: FONTS.body, whiteSpace: 'nowrap',
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
            {status || '—'}
        </span>
    );
}

function StatCard({ label, value, loading }) {
    return (
        <div style={{
            backgroundColor: 'white', borderRadius: '20px',
            border: '1px solid #F0EDE8', padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
            {loading
                ? <><Skeleton h={32} w="50%" /><Skeleton h={12} w="60%" style={{ marginTop: 4 }} /></>
                : <>
                    <p style={{ margin: 0, fontFamily: FONTS.title, fontSize: '36px', fontWeight: '600', color: '#111111', lineHeight: 1 }}>
                        {value ?? 0}
                    </p>
                    <p style={{ margin: 0, fontFamily: FONTS.body, fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {label}
                    </p>
                </>
            }
        </div>
    );
}

function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex', alignItems: 'center' }}
            title="Copier le tracking"
        >
            {copied ? <CheckCircle2 size={13} color="#10B981" /> : <Copy size={13} />}
        </button>
    );
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function Expeditions() {
    const [data, setData] = useState(null);         // full API response
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous');
    const [historyTracking, setHistoryTracking] = useState(null);
    const [cancelling, setCancelling] = useState(null);

    const load = useCallback(async (p = page) => {
        setLoading(true);
        const res = await getAllParcels(p);
        setData(res);
        setLoading(false);
    }, [page]);

    useEffect(() => { load(page); }, [page]);

    const parcels = useMemo(() => {
        const raw = data?.results || data?.data || (Array.isArray(data) ? data : []);
        return raw;
    }, [data]);

    const filtered = useMemo(() => {
        return parcels.filter(p => {
            const s = p.last_status || p.status || '';
            const t = p.tracking || p.tracking_id || '';
            const o = p.order_id || p.order || '';
            const matchSearch = !search || t.toLowerCase().includes(search.toLowerCase()) || o.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === 'Tous' || s === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [parcels, search, statusFilter]);

    /* Stats over full page */
    const stats = useMemo(() => ({
        total:     data?.total_data ?? data?.count ?? parcels.length,
        transit:   parcels.filter(p => isTransit(p.last_status || p.status)).length,
        delivered: parcels.filter(p => isDelivered(p.last_status || p.status)).length,
        returned:  parcels.filter(p => isReturned(p.last_status || p.status)).length,
    }), [data, parcels]);

    const totalPages = data?.total_pages || Math.ceil((data?.count || 0) / 50) || 1;

    const handleCancel = async (tracking) => {
        if (!window.confirm(`Annuler le colis ${tracking} ?`)) return;
        setCancelling(tracking);
        const res = await cancelParcel(tracking);
        setCancelling(null);
        if (res?.error) { toast.error(res.error); return; }
        toast.success('Colis annulé');
        load(page);
    };

    return (
        <>
            <style>{`@keyframes shine{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* ── Page header ── */}
                <div>
                    <h1 style={{ fontFamily: FONTS.title, fontSize: '32px', fontStyle: 'italic', fontWeight: '500', color: '#111111', margin: '0 0 4px' }}>
                        Expéditions Guepex
                    </h1>
                    <p style={{ fontFamily: FONTS.body, fontSize: '12px', color: '#9ca3af', fontWeight: '400', margin: 0 }}>
                        Suivi des colis via l'API Guepex
                    </p>
                </div>

                {/* ── Stats row ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                    <StatCard label="Total colis"  value={stats.total}     loading={loading} />
                    <StatCard label="En transit"   value={stats.transit}   loading={loading} />
                    <StatCard label="Livrés"       value={stats.delivered} loading={loading} />
                    <StatCard label="Retournés"    value={stats.returned}  loading={loading} />
                </div>

                {/* ── Filters bar ── */}
                <div style={{
                    backgroundColor: 'white', borderRadius: '20px',
                    border: '1px solid #F0EDE8', padding: '16px 20px',
                    display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
                }}>
                    {/* Search */}
                    <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '160px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            placeholder="Tracking ou Order ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%', paddingLeft: '36px', paddingRight: '12px',
                                height: '40px', border: '1px solid #F0EDE8', borderRadius: '12px',
                                fontFamily: FONTS.body, fontSize: '13px', fontWeight: '400', color: '#111111',
                                outline: 'none', boxSizing: 'border-box', backgroundColor: '#FAFAFA',
                            }}
                        />
                    </div>

                    {/* Status dropdown */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{
                            height: '40px', padding: '0 14px', borderRadius: '12px',
                            border: '1px solid #F0EDE8', backgroundColor: '#FAFAFA',
                            fontFamily: FONTS.body, fontSize: '13px', fontWeight: '600', color: '#111111',
                            outline: 'none', cursor: 'pointer',
                        }}
                    >
                        {FILTER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* Refresh */}
                    <button
                        onClick={() => load(page)}
                        disabled={loading}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            height: '40px', padding: '0 16px', borderRadius: '12px',
                            border: '1px solid #F0EDE8', backgroundColor: 'white',
                            fontFamily: FONTS.body, fontSize: '11px', fontWeight: '800',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                            cursor: loading ? 'not-allowed' : 'pointer', color: '#374151',
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={14} />}
                        Rafraîchir
                    </button>
                </div>

                {/* ── Table ── */}
                <div style={{ backgroundColor: 'white', borderRadius: '20px', border: '1px solid #F0EDE8', overflow: 'hidden' }}>
                    {/* Table header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1.6fr 1.2fr 1fr 1fr',
                        gap: '0',
                        padding: '0 20px',
                        borderBottom: '1px solid #F0EDE8',
                        backgroundColor: '#FAFAFA',
                    }}>
                        {['Tracking', 'Commande', 'Destinataire', 'Statut', 'Wilaya', 'Actions'].map(h => (
                            <div key={h} style={{
                                padding: '12px 8px',
                                fontFamily: FONTS.body, fontSize: '10px', fontWeight: '800',
                                color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em',
                            }}>{h}</div>
                        ))}
                    </div>

                    {/* Rows */}
                    {loading ? (
                        /* Skeleton rows */
                        <div>
                            {[...Array(8)].map((_, i) => (
                                <div key={i} style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr 1.6fr 1.2fr 1fr 1fr',
                                    gap: 0, padding: '14px 20px',
                                    borderBottom: i < 7 ? '1px solid #F0EDE8' : 'none',
                                    alignItems: 'center',
                                }}>
                                    {[70, 60, 80, 100, 60, 80].map((w, ci) => (
                                        <Skeleton key={ci} h={14} w={`${w}%`} style={{ margin: '0 8px' }} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <Package2 size={32} style={{ color: '#E8E2D6', margin: '0 auto 12px' }} />
                            <p style={{ fontFamily: FONTS.body, fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                                Aucun colis trouvé
                            </p>
                        </div>
                    ) : (
                        filtered.map((parcel, i) => {
                            const tracking  = parcel.tracking || parcel.tracking_id || parcel.id || '—';
                            const orderId   = parcel.order_id || parcel.order || '—';
                            const recipient = parcel.client_name || parcel.recipient || '—';
                            const status    = parcel.last_status || parcel.status || '—';
                            const wilaya    = parcel.destination_wilaya || parcel.wilaya_name || parcel.wilaya || '—';

                            return (
                                <div key={tracking + i} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr 1.6fr 1.2fr 1fr 1fr',
                                    padding: '14px 20px',
                                    borderBottom: i < filtered.length - 1 ? '1px solid #F0EDE8' : 'none',
                                    alignItems: 'center',
                                    transition: 'background 0.15s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    {/* Tracking */}
                                    <div style={{ padding: '0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: '#111111' }}>
                                            {tracking}
                                        </span>
                                        {tracking !== '—' && <CopyButton text={tracking} />}
                                    </div>

                                    {/* Order */}
                                    <div style={{ padding: '0 8px', fontFamily: FONTS.body, fontSize: '12px', color: '#6B6458', fontWeight: '400' }}>
                                        {orderId}
                                    </div>

                                    {/* Recipient */}
                                    <div style={{ padding: '0 8px', fontFamily: FONTS.body, fontSize: '13px', fontWeight: '600', color: '#111111' }}>
                                        {recipient}
                                    </div>

                                    {/* Status */}
                                    <div style={{ padding: '0 8px' }}>
                                        <StatusBadge status={status} />
                                    </div>

                                    {/* Wilaya */}
                                    <div style={{ padding: '0 8px', fontFamily: FONTS.body, fontSize: '12px', color: '#6B6458', fontWeight: '400' }}>
                                        {wilaya}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ padding: '0 8px', display: 'flex', gap: '4px' }}>
                                        <button
                                            title="Voir l'historique"
                                            onClick={() => setHistoryTracking(tracking)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                border: '1px solid #F0EDE8', backgroundColor: 'white',
                                                cursor: 'pointer', color: '#374151',
                                                transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0EDE8'; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                                        >
                                            <History size={14} />
                                        </button>

                                        <button
                                            title="Annuler le colis"
                                            onClick={() => handleCancel(tracking)}
                                            disabled={cancelling === tracking}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                border: '1px solid #FECACA', backgroundColor: 'white',
                                                cursor: cancelling === tracking ? 'not-allowed' : 'pointer',
                                                color: '#EF4444', opacity: cancelling === tracking ? 0.5 : 1,
                                                transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={e => { if (cancelling !== tracking) e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                                        >
                                            {cancelling === tracking
                                                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                                                : <XCircle size={14} />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        backgroundColor: 'white', borderRadius: '20px',
                        border: '1px solid #F0EDE8', padding: '14px 20px',
                    }}>
                        <span style={{ fontFamily: FONTS.body, fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            Page {page} / {totalPages}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                                { icon: ChevronLeft,  disabled: page === 1,          onClick: () => setPage(p => Math.max(1, p - 1)),           label: 'Précédent' },
                                { icon: ChevronRight, disabled: page === totalPages,  onClick: () => setPage(p => Math.min(totalPages, p + 1)),   label: 'Suivant'   },
                            ].map(({ icon: Icon, disabled, onClick, label }) => (
                                <button
                                    key={label}
                                    onClick={onClick}
                                    disabled={disabled}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        padding: '8px 16px', borderRadius: '12px',
                                        border: '1px solid #F0EDE8',
                                        backgroundColor: disabled ? '#FAFAFA' : 'white',
                                        color: disabled ? '#9ca3af' : '#111111',
                                        fontFamily: FONTS.body, fontSize: '11px', fontWeight: '800',
                                        textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── History Modal ── */}
            {historyTracking && (
                <GuepexHistoryModal tracking={historyTracking} onClose={() => setHistoryTracking(null)} />
            )}
        </>
    );
}
