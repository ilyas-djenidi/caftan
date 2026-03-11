import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search, RefreshCw, Loader2, Package2,
    Copy, CheckCircle2, ChevronLeft, ChevronRight,
    History, XCircle, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllParcels, cancelParcel, getStatusColor } from '../../services/guepex';
import { supabase } from '../../lib/supabase';
import GuepexHistoryModal from '../../components/GuepexHistoryModal';

/* ─── Constants ─────────────────────────────────────────────────── */
const F = "'Jost', sans-serif";
const PAGE_SIZE = 50;


const TABS = [
    { value: 'Tous',        label: 'Tous' },
    { value: 'non_expedie', label: 'Non expédié' },
    { value: 'cree',        label: 'Créé' },
    { value: 'en_transit',  label: 'En transit' },
    { value: 'livre',       label: 'Livré' },
    { value: 'retourne',    label: 'Retourné' },
];

// Maps tab key → Guepex last_status values
const TAB_MAP = {
    non_expedie: ['En préparation', 'Pas encore expédié', 'Pas encore ramassé', 'A vérifier'],
    cree:        ['Ramassé', 'Expédié', 'Centre', 'Transfert', 'En passation', 'Prêt à expédier', 'Prêt pour livreur'],
    en_transit:  ['Vers Wilaya', 'En transit', 'Reçu à Wilaya', 'En localisation', 'Sorti en livraison', 'En attente du client'],
    livre:       ['Livré'],
    retourne:    ['Tentative échouée', 'En alerte', 'Bloqué', 'En attente', 'Annulé', 'Echèc livraison',
                  'Retour vers centre', 'Retourné au centre', 'Retour transfert', 'Retour groupé',
                  'Retour à retirer', 'Retour vers vendeur', 'Retourné au vendeur', 'Echange échoué'],
};

/* ─── Helpers ──────────────────────────────────────────────────── */
const tint = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0.12)`;
};

const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

/* ─── Fetch ALL parcels from Guepex (auto-paginate) ───────────── */
async function fetchAllParcels() {
    let all = [];
    let page = 1;

    while (true) {
        const res = await getAllParcels(page);
        if (res?.error) break;

        // Real response: { has_more, total_data, data: [...], links }
        const batch = res?.data || res?.results || (Array.isArray(res) ? res : []);
        all = [...all, ...batch];

        if (!res?.has_more || batch.length === 0) break;
        page++;
        if (page > 50) break; // safety cap
    }
    return all;
}

/* ─── Map raw Guepex parcel to display shape ──────────────────── */
function mapParcel(p) {
    return {
        tracking:  p.tracking  || '—',
        name:      `${p.firstname || ''} ${p.familyname || ''}`.trim() || '—',
        phone:     p.contact_phone || '—',
        wilaya:    p.to_wilaya_name || '—',
        commune:   p.to_commune_name || '—',
        weight:    p.weight != null ? `${p.weight} kg` : '—',
        date:      p.date_expedition || p.date_creation || null,
        status:    p.last_status || null,
        order_id:  p.order_id || '—',
        raw:       p,
    };
}

/* ─── Fetch linked Supabase orders keyed by order_number ─────── */
async function fetchDbOrders() {
    const { data } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_phone, wilaya')
        .order('created_at', { ascending: false });
    const map = {};
    for (const o of (data || [])) {
        if (o.order_number) map[o.order_number] = o;
    }
    return map;
}

/* ─── Sub-components ─────────────────────────────────────────── */
function Sk({ h = 13, w = '70%' }) {
    return (
        <div style={{
            height: h, width: w, borderRadius: 5,
            background: 'linear-gradient(90deg,#f0f0f0 25%,#f8f8f8 50%,#f0f0f0 75%)',
            backgroundSize: '200% 100%', animation: 'shine 1.3s infinite',
        }} />
    );
}

function Badge({ status }) {
    if (!status) return <span style={{ color: '#9ca3af', fontSize: '12px', fontFamily: F }}>—</span>;
    const color = getStatusColor(status);
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 9px', borderRadius: '100px',
            backgroundColor: tint(color), color,
            fontSize: '11px', fontWeight: '700', fontFamily: F, whiteSpace: 'nowrap',
        }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
            {status}
        </span>
    );
}

function Stat({ label, value, loading }) {
    return (
        <div style={{
            backgroundColor: 'white', borderRadius: '16px',
            border: '1px solid #F0EDE8', padding: '18px 20px',
        }}>
            {loading
                ? <><Sk h={28} w="40%" /><Sk h={10} w="55%" style={{ marginTop: 6 }} /></>
                : <>
                    <div style={{ fontFamily: F, fontSize: '28px', fontWeight: '700', color: '#111', lineHeight: 1 }}>{value ?? 0}</div>
                    <div style={{ fontFamily: F, fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '5px' }}>{label}</div>
                </>}
        </div>
    );
}

function CopyBtn({ text }) {
    const [ok, setOk] = useState(false);
    return (
        <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex' }}>
            {ok ? <CheckCircle2 size={12} color="#10B981" /> : <Copy size={12} />}
        </button>
    );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function Expeditions() {
    const [parcels, setParcels]     = useState([]);
    const [loading, setLoading]     = useState(true);
    const [page, setPage]           = useState(1);
    const [search, setSearch]       = useState('');
    const [tab, setTab]             = useState('Tous');
    const [histTrack, setHistTrack] = useState(null);
    const [cancelling, setCancelling] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [raw, dbMap] = await Promise.all([fetchAllParcels(), fetchDbOrders()]);
            const mapped = raw.map(p => {
                const m = mapParcel(p);
                // Try to enrich from DB if order_id matches
                const db = dbMap[m.order_id] || {};
                if (m.name === '—' && db.customer_name) m.name = db.customer_name;
                if (m.phone === '—' && db.customer_phone) m.phone = db.customer_phone;
                if (m.wilaya === '—' && db.wilaya) m.wilaya = db.wilaya;
                return m;
            });
            setParcels(mapped);
        } catch (e) {
            toast.error('Erreur de chargement');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [tab, search]);

    const filtered = useMemo(() => {
        const allowed = TAB_MAP[tab] || null;
        const q = search.toLowerCase();
        return parcels.filter(p => {
            const matchTab    = !allowed || allowed.includes(p.status);
            const matchSearch = !q
                || p.tracking.toLowerCase().includes(q)
                || p.name.toLowerCase().includes(q)
                || p.phone.toLowerCase().includes(q)
                || p.wilaya.toLowerCase().includes(q)
                || p.order_id.toLowerCase().includes(q);
            return matchTab && matchSearch;
        });
    }, [parcels, tab, search]);

    const stats = useMemo(() => ({
        total:     parcels.length,
        transit:   parcels.filter(p => TAB_MAP.en_transit.includes(p.status)).length,
        delivered: parcels.filter(p => p.status === 'Livré').length,
        returned:  parcels.filter(p => TAB_MAP.retourne.includes(p.status)).length,
    }), [parcels]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const sp         = Math.min(page, totalPages);
    const slice      = filtered.slice((sp - 1) * PAGE_SIZE, sp * PAGE_SIZE);

    const handleCancel = async (p) => {
        if (!window.confirm(`Annuler ${p.tracking} ?`)) return;
        setCancelling(p.tracking);
        const res = await cancelParcel(p.tracking);
        setCancelling(null);
        if (res?.error) { toast.error(res.error); return; }
        setParcels(prev => prev.map(x => x.tracking === p.tracking ? { ...x, status: 'Annulé' } : x));
        toast.success('Colis annulé');
    };

    const COLS = '130px 90px 1.5fr 130px 120px 110px 75px 65px 76px';

    const th = { padding: '11px 8px', fontFamily: F, fontSize: '10px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.09em', whiteSpace: 'nowrap' };
    const td = { padding: '0 8px', fontFamily: F, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

    return (
        <>
            <style>{`@keyframes shine{0%{background-position:200% 0}100%{background-position:-200% 0}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                        <h1 style={{ fontFamily: F, fontSize: '22px', fontWeight: '700', color: '#111', margin: 0 }}>Expéditions Guepex</h1>
                        <p style={{ fontFamily: F, fontSize: '12px', color: '#9ca3af', margin: '3px 0 0' }}>
                            {loading ? 'Chargement…' : `${parcels.length} colis au total`}
                        </p>
                    </div>
                    <button onClick={load} disabled={loading} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        height: '38px', padding: '0 16px', borderRadius: '10px',
                        border: '1px solid #E5E7EB', backgroundColor: 'white',
                        fontFamily: F, fontSize: '12px', fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer', color: '#374151',
                        opacity: loading ? 0.6 : 1,
                    }}>
                        <RotateCcw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                        Actualiser
                    </button>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px' }}>
                    <Stat label="Total colis"  value={stats.total}     loading={loading} />
                    <Stat label="En transit"   value={stats.transit}   loading={loading} />
                    <Stat label="Livrés"       value={stats.delivered} loading={loading} />
                    <Stat label="Retournés"    value={stats.returned}  loading={loading} />
                </div>

                {/* Tabs */}
                <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #F0EDE8', padding: '5px', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                    {TABS.map(({ value, label }) => {
                        const active = tab === value;
                        const count  = value === 'Tous' ? parcels.length : parcels.filter(p => (TAB_MAP[value] || []).includes(p.status)).length;
                        return (
                            <button key={value} onClick={() => setTab(value)} style={{
                                display: 'flex', alignItems: 'center', gap: '5px',
                                padding: '7px 14px', borderRadius: '9px', border: 'none',
                                backgroundColor: active ? '#111' : 'transparent',
                                color: active ? 'white' : '#6B7280',
                                fontFamily: F, fontSize: '12px', fontWeight: '600',
                                cursor: 'pointer', transition: 'all 0.14s', whiteSpace: 'nowrap',
                            }}
                                onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.color = '#111'; }}}
                                onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6B7280'; }}}
                            >
                                {label}
                                <span style={{
                                    fontSize: '10px', fontWeight: '700',
                                    backgroundColor: active ? 'rgba(255,255,255,0.18)' : '#F3F4F6',
                                    color: active ? 'white' : '#9ca3af',
                                    padding: '1px 6px', borderRadius: '100px',
                                }}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        placeholder="Tracking, nom, téléphone, wilaya, N° commande…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', boxSizing: 'border-box',
                            paddingLeft: '38px', paddingRight: '14px', height: '40px',
                            border: '1px solid #E5E7EB', borderRadius: '10px',
                            fontFamily: F, fontSize: '13px', color: '#111', outline: 'none',
                            backgroundColor: 'white',
                        }}
                    />
                </div>

                {/* Table */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #F0EDE8', overflow: 'auto' }}>
                    {/* Head */}
                    <div style={{ display: 'grid', gridTemplateColumns: COLS, minWidth: '880px', borderBottom: '1px solid #F0EDE8', backgroundColor: '#FAFAFA', padding: '0 12px' }}>
                        {['Tracking','Commande','Destinataire','Téléphone','Wilaya','Ville','Date','Poids','Actions'].map(h => (
                            <div key={h} style={th}>{h}</div>
                        ))}
                    </div>

                    {/* Body */}
                    <div style={{ minWidth: '880px' }}>
                        {loading ? (
                            [...Array(10)].map((_, i) => (
                                <div key={i} style={{ display: 'grid', gridTemplateColumns: COLS, padding: '13px 12px', borderBottom: i < 9 ? '1px solid #F0EDE8' : 'none', alignItems: 'center' }}>
                                    {[65,50,80,65,55,45,40,30,50].map((w, ci) => <Sk key={ci} w={`${w}%`} />)}
                                </div>
                            ))
                        ) : slice.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center' }}>
                                <Package2 size={30} style={{ color: '#E5E7EB', display: 'block', margin: '0 auto 10px' }} />
                                <p style={{ fontFamily: F, fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                                    {search || tab !== 'Tous' ? 'Aucun résultat' : 'Aucun colis Guepex'}
                                </p>
                            </div>
                        ) : (
                            slice.map((p, i) => (
                                <div key={p.tracking + i}
                                    style={{ display: 'grid', gridTemplateColumns: COLS, padding: '11px 12px', borderBottom: i < slice.length - 1 ? '1px solid #F0EDE8' : 'none', alignItems: 'center', transition: 'background .1s' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAFA'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    {/* Tracking */}
                                    <div style={{ ...td, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '700', color: '#111' }}>{p.tracking}</span>
                                        {p.tracking !== '—' && <CopyBtn text={p.tracking} />}
                                    </div>

                                    {/* Commande */}
                                    <div style={{ ...td, fontSize: '11px', color: '#6B7280' }}>{p.order_id}</div>

                                    {/* Destinataire + statut */}
                                    <div style={{ ...td, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>{p.name}</span>
                                        <Badge status={p.status} />
                                    </div>

                                    {/* Téléphone */}
                                    <div style={{ ...td, fontSize: '12px', color: '#374151', fontWeight: '500' }}>{p.phone}</div>

                                    {/* Wilaya */}
                                    <div style={{ ...td, fontSize: '12px', color: '#374151' }}>{p.wilaya}</div>

                                    {/* Ville */}
                                    <div style={{ ...td, fontSize: '12px', color: '#6B7280' }}>{p.commune}</div>

                                    {/* Date */}
                                    <div style={{ ...td, fontSize: '11px', color: '#9ca3af' }}>{fmtDate(p.date)}</div>

                                    {/* Poids */}
                                    <div style={{ ...td, fontSize: '12px', color: '#6B7280' }}>{p.weight}</div>

                                    {/* Actions */}
                                    <div style={{ padding: '0 8px', display: 'flex', gap: '4px' }}>
                                        <button title="Historique" onClick={() => setHistTrack(p.tracking)} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '28px', height: '28px', borderRadius: '7px',
                                            border: '1px solid #E5E7EB', backgroundColor: 'white',
                                            cursor: 'pointer', color: '#374151',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            <History size={13} />
                                        </button>
                                        <button title="Annuler" onClick={() => handleCancel(p)} disabled={cancelling === p.tracking} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '28px', height: '28px', borderRadius: '7px',
                                            border: '1px solid #FECACA', backgroundColor: 'white',
                                            cursor: cancelling === p.tracking ? 'not-allowed' : 'pointer',
                                            color: '#EF4444', opacity: cancelling === p.tracking ? 0.5 : 1,
                                        }}
                                            onMouseEnter={e => { if (cancelling !== p.tracking) e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            {cancelling === p.tracking
                                                ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                                : <XCircle size={13} />}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #F0EDE8', padding: '10px 16px' }}>
                        <span style={{ fontFamily: F, fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>
                            {filtered.length} résultats · Page {sp} / {totalPages}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={sp === 1} style={{
                                display: 'flex', alignItems: 'center', padding: '6px 12px', borderRadius: '8px',
                                border: '1px solid #E5E7EB', backgroundColor: sp === 1 ? '#F9FAFB' : 'white',
                                color: sp === 1 ? '#9ca3af' : '#111', fontFamily: F, fontSize: '12px', fontWeight: '600',
                                cursor: sp === 1 ? 'not-allowed' : 'pointer',
                            }}>
                                <ChevronLeft size={13} />
                            </button>

                            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                const start = Math.max(1, Math.min(sp - 3, totalPages - 6));
                                const pg = start + i;
                                return (
                                    <button key={pg} onClick={() => setPage(pg)} style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        border: '1px solid #E5E7EB',
                                        backgroundColor: pg === sp ? '#111' : 'white',
                                        color: pg === sp ? 'white' : '#374151',
                                        fontFamily: F, fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                                    }}>{pg}</button>
                                );
                            })}

                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={sp === totalPages} style={{
                                display: 'flex', alignItems: 'center', padding: '6px 12px', borderRadius: '8px',
                                border: '1px solid #E5E7EB', backgroundColor: sp === totalPages ? '#F9FAFB' : 'white',
                                color: sp === totalPages ? '#9ca3af' : '#111', fontFamily: F, fontSize: '12px', fontWeight: '600',
                                cursor: sp === totalPages ? 'not-allowed' : 'pointer',
                            }}>
                                <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {histTrack && <GuepexHistoryModal tracking={histTrack} onClose={() => setHistTrack(null)} />}
        </>
    );
}
