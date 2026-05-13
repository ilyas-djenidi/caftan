import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search, RefreshCw, Loader2, Package2,
    Copy, CheckCircle2, ChevronLeft, ChevronRight,
    History, XCircle, RotateCcw, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateShipmentStatus } from '../../api/shipments.api';
import { getStatusColor, cancelParcel, getPrintLabel, getParcel, getAllParcels } from '../../services/guepex';

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
    non_expedie: ['En préparation', 'Pas encore expédié', 'Pas encore ramassé', 'A vérifier', 'non_expedie'],
    cree:        ['Ramassé', 'Expédié', 'Centre', 'Transfert', 'En passation', 'Prêt à expédier', 'Prêt pour livreur', 'created', 'Créée'],
    en_transit:  ['Vers Wilaya', 'En transit', 'Reçu à Wilaya', 'En localisation', 'Sorti en livraison', 'En attente du client', 'in_transit'],
    livre:       ['Livré', 'delivered'],
    retourne:    ['Tentative échouée', 'En alerte', 'Bloqué', 'En attente', 'Annulé', 'Echèc livraison',
                  'Retour vers centre', 'Retourné au centre', 'Retour transfert', 'Retour groupé',
                  'Retour à retirer', 'Retour vers vendeur', 'Retourné au vendeur', 'Echange échoué', 'returned', 'cancelled'],
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
    const [hasMore, setHasMore]     = useState(false);
    const [search, setSearch]       = useState('');
    const [tab, setTab]             = useState('Tous');
    const [histTrack, setHistTrack] = useState(null);
    const [cancelling, setCancelling] = useState(null);

    const load = useCallback(async (pageNum) => {
        setLoading(true);
        try {
            const res = await getAllParcels(pageNum);
            if (res && res.data) {
                const mapped = res.data.map(p => ({
                    tracking: p.tracking,
                    order_number: p.order_id, 
                    status: p.last_status,
                    wilaya: p.to_wilaya_name,
                    ville: p.to_commune_name,
                    destinataire_nom: `${p.firstname || ''} ${p.familyname || ''}`.trim(),
                    destinataire_phone: p.contact_phone,
                    date_expedition: p.date_expedition || p.date_creation,
                    weight: p.weight
                }));
                setParcels(mapped);
                setHasMore(res.has_more || false);
            } else {
                setParcels([]);
                setHasMore(false);
            }
        } catch (e) {
            toast.error('Erreur de chargement depuis l\'API Guepex');
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(page);
    }, [page, load]);

    useEffect(() => { setPage(1); }, [tab, search]);

    const handlePrintLabel = async (tracking) => {
        if (!tracking || tracking === '—') {
            toast.error('ID de tracking invalide');
            return;
        }
        const loadingToast = toast.loading('Préparation du bordereau...');
        try {
            const res = await getPrintLabel(tracking);
            const labelUrl = res?.data?.[0]?.label;
            if (labelUrl) {
                window.open(labelUrl, '_blank');
            } else {
                toast.error('Bordereau introuvable');
                console.error('[Guepex] Print response:', res);
            }
        } catch (e) {
            toast.error('Erreur impression');
            console.error(e);
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    const filtered = useMemo(() => {
        const allowed = TAB_MAP[tab] || null;
        const q = search.toLowerCase();
        return parcels.filter(p => {
            const matchTab    = !allowed || allowed.includes(p.status);
            const matchSearch = !q
                || (p.tracking && p.tracking.toLowerCase().includes(q))
                || (p.destinataire_nom && p.destinataire_nom.toLowerCase().includes(q))
                || (p.destinataire_phone && p.destinataire_phone.toLowerCase().includes(q))
                || (p.wilaya && p.wilaya.toLowerCase().includes(q))
                || (p.order_number && p.order_number.toLowerCase().includes(q));
            return matchTab && matchSearch;
        });
    }, [parcels, tab, search]);

    const stats = useMemo(() => ({
        total:     parcels.length,
        transit:   parcels.filter(p => TAB_MAP.en_transit.includes(p.status)).length,
        delivered: parcels.filter(p => TAB_MAP.livre.includes(p.status)).length,
        returned:  parcels.filter(p => TAB_MAP.retourne.includes(p.status)).length,
    }), [parcels]);

    const slice = filtered; // Direct API render, no local slicing needed
    const sp = page;

    const handleCancel = async (p) => {
        if (!window.confirm(`Annuler le colis ${p.tracking} ?`)) return;
        setCancelling(p.tracking);
        try {
            const res = await cancelParcel(p.tracking);
            if (res.error) throw new Error(res.error);
            
            // Update local DB orders to reflect cancellation immediately
            await updateShipmentStatus(p.tracking, 'Annulé', p.order_number);
            
            toast.success('Colis annulé');
            load(page);
        } catch (e) {
            toast.error(e.message || 'Erreur d\'annulation');
        } finally {
            setCancelling(null);
        }
    };

    const COLS = '100px 80px 1fr 110px 100px 90px 80px 60px 120px';
    const th = { fontFamily: F, fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '12px 8px' };
    const td = { padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

    return (
        <>
            <style>{`@keyframes shine{0%{background-position:200% 0}100%{background-position:-200% 0}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Header */}
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'white', 
                    padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0EDE8' 
                }}>
                    <div style={{ 
                        width: '42px', height: '42px', borderRadius: '12px', 
                        backgroundColor: '#fdfbf7', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center' 
                    }}>
                        <Package2 size={20} style={{ color: '#C3AB7E' }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: F, fontSize: '20px', fontWeight: '700', color: '#111', margin: 0 }}>Expéditions Guepex</h1>
                        <p style={{ fontFamily: F, fontSize: '11px', color: '#9ca3af', fontWeight: '600', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {loading ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Loader2 size={10} className="animate-spin" /> Chargement direct depuis Guepex…
                                </span>
                            ) : `Page ${page} - Total visible: ${filtered.length}`}
                        </p>
                    </div>
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
                                    <div style={{ ...td, fontSize: '11px', color: '#6B7280' }}>{p.order_number || '—'}</div>

                                    {/* Destinataire + statut */}
                                    <div style={{ ...td, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#111' }}>{p.destinataire_nom}</span>
                                        <Badge status={p.status} />
                                    </div>

                                    {/* Téléphone */}
                                    <div style={{ ...td, fontSize: '12px', color: '#374151', fontWeight: '500' }}>{p.destinataire_phone}</div>

                                    {/* Wilaya */}
                                    <div style={{ ...td, fontSize: '12px', color: '#374151' }}>{p.wilaya}</div>

                                    {/* Ville */}
                                    <div style={{ ...td, fontSize: '12px', color: '#6B7280' }}>{p.ville}</div>

                                    {/* Date */}
                                    <div style={{ ...td, fontSize: '11px', color: '#9ca3af' }}>{fmtDate(p.date_expedition)}</div>

                                    {/* Poids */}
                                    <div style={{ ...td, fontSize: '12px', color: '#6B7280' }}>{p.weight || '—'}</div>

                                    {/* Actions */}
                                    <div style={{ padding: '0 8px', display: 'flex', gap: '4px' }}>
                                        <button title="Imprimer Étiquette" onClick={() => handlePrintLabel(p.tracking)} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            width: '28px', height: '28px', borderRadius: '7px',
                                            border: '1px solid #E5E7EB', backgroundColor: 'white',
                                            cursor: 'pointer', color: '#111',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                                        >
                                            <Printer size={13} />
                                        </button>
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
                                        {!['Annulé', 'Livré', 'delivered', 'cancelled', 'returned'].includes(p.status) && (
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
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {!loading && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #F0EDE8', padding: '10px 16px' }}>
                        <span style={{ fontFamily: F, fontSize: '12px', color: '#9ca3af', fontWeight: '600' }}>
                            Page {sp} (Temps réel depuis l'API Guepex)
                        </span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={sp === 1} style={{
                                display: 'flex', alignItems: 'center', padding: '6px 12px', borderRadius: '8px',
                                border: '1px solid #E5E7EB', backgroundColor: sp === 1 ? '#F9FAFB' : 'white',
                                color: sp === 1 ? '#9ca3af' : '#111', fontFamily: F, fontSize: '12px', fontWeight: '600',
                                cursor: sp === 1 ? 'not-allowed' : 'pointer',
                            }}>
                                <ChevronLeft size={13} />  Précédent
                            </button>
                            
                            <span style={{ margin: '0 8px', fontSize: '13px', fontWeight: '800', color: '#374151' }}>{sp}</span>

                            <button onClick={() => setPage(p => p + 1)} disabled={!hasMore} style={{
                                display: 'flex', alignItems: 'center', padding: '6px 12px', borderRadius: '8px',
                                border: '1px solid #E5E7EB', backgroundColor: !hasMore ? '#F9FAFB' : 'white',
                                color: !hasMore ? '#9ca3af' : '#111', fontFamily: F, fontSize: '12px', fontWeight: '600',
                                cursor: !hasMore ? 'not-allowed' : 'pointer',
                            }}>
                                Suivant <ChevronRight size={13} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {histTrack && <GuepexHistoryModal tracking={histTrack} onClose={() => setHistTrack(null)} />}
        </>
    );
}


