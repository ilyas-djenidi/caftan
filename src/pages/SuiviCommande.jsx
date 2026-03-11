import { useState, useCallback } from 'react';
import { Search, Truck, Package2, RefreshCw, History } from 'lucide-react';
import { getParcel } from '../services/guepex';
import GuepexHistoryModal from '../components/GuepexHistoryModal';

/* ─── Design tokens ──────────────────────────────────────────────── */
const C = {
    ivory:   '#FAF8F4',
    charcoal:'#1A1714',
    gold:    '#B8963E',
    muted:   '#9ca3af',
    border:  '#E8E2D6',
    card:    '#FFFFFF',
};

const fonts = {
    title:  "'Cormorant Garamond', serif",
    body:   "'Jost', sans-serif",
};

/* ─── Status palette ─────────────────────────────────────────────── */
const STATUS = {
    created:          { color: '#9CA3AF', bg: '#F3F4F6',  label: 'Créée' },
    in_transit:       { color: '#3B82F6', bg: '#EFF6FF',  label: 'En transit' },
    out_for_delivery: { color: '#B8963E', bg: '#FEF9EC',  label: 'En livraison' },
    delivered:        { color: '#10B981', bg: '#ECFDF5',  label: 'Livrée' },
    returned:         { color: '#EF4444', bg: '#FEF2F2',  label: 'Retournée' },
    cancelled:        { color: '#EF4444', bg: '#FEF2F2',  label: 'Annulée' },
};

const getMeta = (s) => STATUS[s?.toLowerCase()] || STATUS.created;

/* ─── Skeleton loader ────────────────────────────────────────────── */
function Skeleton({ height = 20, width = '100%', radius = 8, style = {} }) {
    return (
        <div style={{
            height, width, borderRadius: radius,
            background: 'linear-gradient(90deg,#E8E2D6 25%,#F0EDE8 50%,#E8E2D6 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
            ...style,
        }} />
    );
}

/* ─── Status badge ────────────────────────────────────────────────── */
function StatusBadge({ status, size = 'md' }) {
    const m = getMeta(status);
    const pad = size === 'lg' ? '8px 20px' : '5px 12px';
    const fs  = size === 'lg' ? '13px' : '11px';
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: pad, borderRadius: '100px',
            backgroundColor: m.bg, color: m.color,
            fontSize: fs, fontWeight: '800', textTransform: 'uppercase',
            fontFamily: fonts.body, letterSpacing: '0.06em',
        }}>
            <span style={{ width: size === 'lg' ? 8 : 6, height: size === 'lg' ? 8 : 6, borderRadius: '50%', backgroundColor: m.color, display: 'inline-block' }} />
            {m.label}
        </span>
    );
}

/* ─── Card wrapper ───────────────────────────────────────────────── */
function Card({ children, style = {} }) {
    return (
        <div style={{
            backgroundColor: C.card, borderRadius: '16px',
            border: `1px solid ${C.border}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
            padding: '28px 32px',
            ...style,
        }}>
            {children}
        </div>
    );
}

/* ─── Label ──────────────────────────────────────────────────────── */
function Label({ children }) {
    return (
        <p style={{
            margin: '0 0 4px',
            fontFamily: fonts.body, fontSize: '10px', fontWeight: '700',
            color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>{children}</p>
    );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function SuiviCommande() {
    const [trackingInput, setTrackingInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [parcel, setParcel]   = useState(null);
    const [error, setError]     = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    const handleSearch = useCallback(async (e) => {
        e?.preventDefault();
        const id = trackingInput.trim();
        if (!id) return;
        setLoading(true);
        setParcel(null);
        setError(null);
        setShowHistory(false);
        try {
            const pData = await getParcel(id);
            if (pData?.error || !pData || (typeof pData === 'object' && Object.keys(pData).length === 0)) {
                setError('not_found');
            } else {
                setParcel(pData);
                const arr = Array.isArray(hData) ? hData : (hData?.results || []);
                setHistory(arr);
            }
        } catch (err) {
            setError(err.message || 'Erreur réseau');
        } finally {
            setLoading(false);
        }
    }, [trackingInput]);

    const statusMeta = parcel ? getMeta(parcel.status || parcel.state) : null;

    return (
        <>
            {/* Keyframe */}
            <style>{`
                @keyframes shimmer {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div style={{
                minHeight: '100vh',
                backgroundColor: C.ivory,
                paddingTop: 'calc(var(--navbar-height, 100px) + 40px)',
                paddingBottom: '120px',
                paddingLeft: '20px',
                paddingRight: '20px',
            }}>
                {/* ── Page title ── */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{
                        fontFamily: fonts.title, fontSize: '42px',
                        fontStyle: 'italic', fontWeight: '500',
                        color: C.charcoal, margin: '0 0 10px',
                    }}>
                        Suivre ma commande
                    </h1>
                    <p style={{
                        fontFamily: fonts.body, fontSize: '14px',
                        fontWeight: '300', color: C.muted, margin: 0,
                    }}>
                        Entrez votre numéro de commande pour vérifier son statut.
                    </p>
                </div>

                {/* ── Search form ── */}
                <form
                    onSubmit={handleSearch}
                    style={{ maxWidth: '500px', margin: '0 auto 48px' }}
                >
                    <div style={{
                        position: 'relative', marginBottom: '0',
                        display: 'flex', flexDirection: 'column', gap: '10px',
                    }}>
                        <div style={{ position: 'relative' }}>
                            <Search
                                size={16}
                                style={{
                                    position: 'absolute', left: '16px', top: '50%',
                                    transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none',
                                }}
                            />
                            <input
                                type="text"
                                value={trackingInput}
                                onChange={e => setTrackingInput(e.target.value)}
                                placeholder="Ex: #PKR-123456-789"
                                style={{
                                    width: '100%', height: '52px',
                                    paddingLeft: '44px', paddingRight: '16px',
                                    backgroundColor: C.card,
                                    border: `1.5px solid ${C.border}`,
                                    borderRadius: '0',
                                    fontFamily: fonts.body, fontSize: '14px',
                                    fontWeight: '300', color: C.charcoal,
                                    outline: 'none', boxSizing: 'border-box',
                                    transition: 'border-color 0.2s',
                                }}
                                onFocus={e => e.target.style.borderColor = C.gold}
                                onBlur={e => e.target.style.borderColor = C.border}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !trackingInput.trim()}
                            style={{
                                width: '100%', height: '52px',
                                backgroundColor: loading ? '#4b5563' : C.charcoal,
                                color: C.ivory,
                                border: 'none', borderRadius: '0',
                                fontFamily: fonts.body, fontSize: '11px',
                                fontWeight: '600', letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                cursor: loading || !trackingInput.trim() ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'background 0.3s',
                                opacity: loading || !trackingInput.trim() ? 0.85 : 1,
                            }}
                            onMouseEnter={e => { if (!loading && trackingInput.trim()) e.currentTarget.style.backgroundColor = C.gold; }}
                            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = C.charcoal; }}
                        >
                            {loading
                                ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Recherche en cours…</>
                                : <><Search size={14} /> Rechercher</>
                            }
                        </button>
                    </div>
                </form>

                {/* ── Results area ── */}
                <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Loading skeletons */}
                    {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeUp 0.3s ease' }}>
                            <Card>
                                <Skeleton height={28} width="55%" radius={6} style={{ marginBottom: '16px' }} />
                                <Skeleton height={32} width="35%" radius={100} style={{ marginBottom: '24px' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i}>
                                            <Skeleton height={10} width="40%" radius={4} style={{ marginBottom: '6px' }} />
                                            <Skeleton height={16} width="70%" radius={4} />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                            <Card>
                                <Skeleton height={16} width="40%" radius={4} style={{ marginBottom: '24px' }} />
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                                        <Skeleton height={14} width={14} radius={7} style={{ flexShrink: 0, marginTop: '3px' }} />
                                        <div style={{ flex: 1 }}>
                                            <Skeleton height={10} width="30%" radius={4} style={{ marginBottom: '6px' }} />
                                            <Skeleton height={14} width="60%" radius={4} />
                                        </div>
                                    </div>
                                ))}
                            </Card>
                        </div>
                    )}

                    {/* Error state */}
                    {!loading && error && (
                        <div style={{ textAlign: 'center', padding: '60px 24px', animation: 'fadeUp 0.3s ease' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                backgroundColor: '#FEF2F2', color: '#EF4444',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px',
                            }}>
                                <Package2 size={28} />
                            </div>
                            <p style={{
                                fontFamily: fonts.body, fontSize: '15px',
                                fontWeight: '400', color: '#6B6458', margin: '0 0 20px',
                            }}>
                                Aucune expédition trouvée pour ce numéro de suivi.
                            </p>
                            <button
                                onClick={() => { setError(null); setTrackingInput(''); }}
                                style={{
                                    padding: '10px 28px', borderRadius: '0',
                                    border: `1.5px solid ${C.charcoal}`,
                                    backgroundColor: 'transparent', color: C.charcoal,
                                    fontFamily: fonts.body, fontSize: '11px',
                                    fontWeight: '600', letterSpacing: '0.14em',
                                    textTransform: 'uppercase', cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.charcoal; e.currentTarget.style.color = C.ivory; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.charcoal; }}
                            >
                                Réessayer
                            </button>
                        </div>
                    )}

                    {/* ── Parcel card ── */}
                    {!loading && parcel && (
                        <>
                        {/* Shipment info card */}
                        <Card style={{ animation: 'fadeUp 0.35s ease' }}>
                            {/* Tracking ID + status */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '24px' }}>
                                <div>
                                    <Label>Numéro de suivi</Label>
                                    <p style={{
                                        fontFamily: fonts.title, fontSize: '26px',
                                        fontWeight: '600', color: C.charcoal,
                                        margin: '0 0 8px', letterSpacing: '0.02em',
                                    }}>
                                        {parcel.tracking_id || parcel.id || parcel.reference || trackingInput}
                                    </p>
                                    <StatusBadge status={parcel.status || parcel.state} size="lg" />
                                </div>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '14px',
                                    backgroundColor: statusMeta?.bg || '#F3F4F6',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: statusMeta?.color || C.muted,
                                }}>
                                    <Truck size={24} />
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '1px', backgroundColor: C.border, marginBottom: '24px' }} />

                            {/* Details grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px' }}>
                                <div>
                                    <Label>Destinataire</Label>
                                    <p style={{ fontFamily: fonts.body, fontSize: '14px', fontWeight: '500', color: C.charcoal, margin: 0 }}>
                                        {parcel.client_name || parcel.recipient_name || parcel.name || '—'}
                                    </p>
                                </div>
                                <div>
                                    <Label>Wilaya</Label>
                                    <p style={{ fontFamily: fonts.body, fontSize: '14px', fontWeight: '500', color: C.charcoal, margin: 0 }}>
                                        {parcel.wilaya_name || parcel.destination_wilaya || parcel.wilaya || '—'}
                                    </p>
                                </div>
                                <div>
                                    <Label>Commune</Label>
                                    <p style={{ fontFamily: fonts.body, fontSize: '14px', fontWeight: '500', color: C.charcoal, margin: 0 }}>
                                        {parcel.commune_name || parcel.commune || '—'}
                                    </p>
                                </div>
                                <div>
                                    <Label>Mode de livraison</Label>
                                    <p style={{ fontFamily: fonts.body, fontSize: '14px', fontWeight: '500', color: C.charcoal, margin: 0 }}>
                                        {parcel.delivery_type === 'center' ? 'Point relais' : 'À domicile'}
                                    </p>
                                </div>
                                {(parcel.delivery_date || parcel.estimated_delivery) && (
                                    <div>
                                        <Label>Livraison estimée</Label>
                                        <p style={{ fontFamily: fonts.body, fontSize: '14px', fontWeight: '500', color: C.gold, margin: 0 }}>
                                            {parcel.delivery_date || parcel.estimated_delivery}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* History button */}
                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${C.border}` }}>
                                <button
                                    onClick={() => setShowHistory(true)}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '10px 20px', borderRadius: '0',
                                        border: `1.5px solid ${C.charcoal}`,
                                        backgroundColor: 'transparent', color: C.charcoal,
                                        fontFamily: fonts.body, fontSize: '11px',
                                        fontWeight: '600', letterSpacing: '0.14em',
                                        textTransform: 'uppercase', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.charcoal; e.currentTarget.style.color = C.ivory; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.charcoal; }}
                                >
                                    <History size={14} /> Voir l'historique
                                </button>
                            </div>
                        </Card>

                        {/* Timeline card */}
                        <Card style={{ animation: 'fadeUp 0.45s ease' }}>
                            <h3 style={{
                                fontFamily: fonts.body, fontSize: '11px', fontWeight: '800',
                                color: C.muted, textTransform: 'uppercase', letterSpacing: '0.14em',
                                margin: '0 0 24px',
                            }}>
                                Historique de l'expédition
                            </h3>

                            {history.length === 0 ? (
                                <p style={{ fontFamily: fonts.body, fontSize: '13px', color: C.muted, margin: 0, textAlign: 'center', padding: '24px 0' }}>
                                    Aucun historique disponible pour le moment.
                                </p>
                            ) : (
                                <div style={{ position: 'relative', paddingLeft: '28px' }}>
                                    {/* Vertical timeline line */}
                                    <div style={{
                                        position: 'absolute', left: '7px', top: '8px', bottom: '8px',
                                        width: '2px', backgroundColor: C.border,
                                    }} />

                                    {history.map((entry, i) => {
                                        const m = getMeta(entry.status);
                                        const dateStr = entry.created_at || entry.date || entry.timestamp;
                                        const isFirst = i === 0;
                                        return (
                                            <div key={i} style={{ position: 'relative', marginBottom: i < history.length - 1 ? '28px' : 0 }}>
                                                {/* Dot */}
                                                <div style={{
                                                    position: 'absolute', left: '-22px', top: '4px',
                                                    width: isFirst ? 16 : 12, height: isFirst ? 16 : 12,
                                                    borderRadius: '50%', backgroundColor: m.color,
                                                    border: `2px solid ${C.card}`,
                                                    boxShadow: `0 0 0 2px ${m.color}40`,
                                                    marginLeft: isFirst ? '-2px' : 0,
                                                }} />

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {/* Date */}
                                                    <span style={{
                                                        fontFamily: fonts.body, fontSize: '10px',
                                                        fontWeight: '700', color: C.muted,
                                                        textTransform: 'uppercase', letterSpacing: '0.06em',
                                                    }}>
                                                        {dateStr ? new Date(dateStr).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                                    </span>
                                                    {/* Status badge */}
                                                    <StatusBadge status={entry.status} size="sm" />
                                                    {/* Description */}
                                                    {(entry.description || entry.comment || entry.note) && (
                                                        <p style={{
                                                            fontFamily: fonts.body, fontSize: '13px',
                                                            fontWeight: '300', color: '#6B6458',
                                                            margin: '2px 0 0', lineHeight: '1.55',
                                                        }}>
                                                            {entry.description || entry.comment || entry.note}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                        </>
                    )}

                </div>
            </div>

            {/* History Modal */}
            {showHistory && trackingId && (
                <GuepexHistoryModal tracking={trackingId} onClose={() => setShowHistory(false)} />
            )}
        </>
    );
}
