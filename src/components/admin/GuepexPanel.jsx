import React, { useState, useEffect, useCallback } from 'react';
import {
    Truck, Copy, CheckCircle2, XCircle, RefreshCw,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    getWilayas,
    getCommunes,
    getFees,
    createParcel,
    getParcel,
    cancelParcel,
} from '../../services/guepex';
import GuepexHistoryModal from '../GuepexHistoryModal';
import { updateOrderGuepex } from '../../api/orders.api';

/* ─── Helpers ─────────────────────────────────────────────── */
const DA = (n) => (Number(n) || 0).toLocaleString('fr-FR') + ' DA';

const STATUS_MAP = {
    created:    { label: 'Créée',       color: '#6b7280', bg: '#F3F4F6' },
    in_transit: { label: 'En transit',  color: '#3b82f6', bg: '#EFF6FF' },
    delivered:  { label: 'Livrée',      color: '#22c55e', bg: '#F0FDF4' },
    returned:   { label: 'Retournée',   color: '#ef4444', bg: '#FEF2F2' },
    cancelled:  { label: 'Annulée',     color: '#ef4444', bg: '#FEF2F2' },
};

function StatusBadge({ status }) {
    const s = STATUS_MAP[status?.toLowerCase()] || STATUS_MAP.created;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '100px',
            backgroundColor: s.bg, color: s.color,
            fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block' }} />
            {s.label}
        </span>
    );
}

/* ─── Card wrapper styled like the rest of the admin panel ── */
const Card = ({ children, style = {} }) => (
    <div style={{
        padding: '20px 24px', borderRadius: '20px',
        border: '1px solid #F0EDE8', backgroundColor: '#ffffff',
        ...style
    }}>
        {children}
    </div>
);

const Label = ({ children }) => (
    <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {children}
    </p>
);

const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '12px',
    border: '1px solid #F0EDE8', backgroundColor: 'white',
    fontSize: '13px', fontWeight: '600', color: '#111111',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
};

/* ─── Section 1 — Create Shipment Form ───────────────────── */
function CreateShipmentForm({ order, onCreated }) {
    const [wilayas, setWilayas] = useState([]);
    const [communes, setCommunes] = useState([]);
    const [form, setForm] = useState({
        wilayaId: '',
        communeId: '',
        deliveryType: 'home',
        fee: '',
        name: order.customer_name || '',
        phone: order.customer_phone || order.phone || '',
        address: order.shipping_address || order.address || '',
        note: '',
        weight: 1,
        declaration: order.total_price || 0,
    });
    const [loadingWilayas, setLoadingWilayas] = useState(true);
    const [loadingCommunes, setLoadingCommunes] = useState(false);
    const [loadingFee, setLoadingFee] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Fetch wilayas on mount
    useEffect(() => {
        getWilayas().then(data => {
            if (!data?.error) setWilayas(Array.isArray(data) ? data : (data?.results || []));
            setLoadingWilayas(false);
        });
    }, []);

    // Fetch communes when wilaya changes
    useEffect(() => {
        if (!form.wilayaId) { setCommunes([]); return; }
        setLoadingCommunes(true);
        getCommunes(form.wilayaId).then(data => {
            if (!data?.error) setCommunes(Array.isArray(data) ? data : (data?.results || []));
            setLoadingCommunes(false);
        });
    }, [form.wilayaId]);

    // Calculate fee when wilaya + type change
    useEffect(() => {
        if (!form.wilayaId) { setForm(f => ({ ...f, fee: '' })); return; }
        setLoadingFee(true);
        getFees(form.wilayaId, form.wilayaId).then(data => {
            if (!data?.error) {
                const arr = Array.isArray(data) ? data : (data?.results || [data]);
                const feeItem = arr.find(f => f.type === form.deliveryType) || arr[0];
                const feeValue = feeItem?.price || feeItem?.fee || feeItem?.amount || '';
                setForm(f => ({ ...f, fee: feeValue }));
            }
            setLoadingFee(false);
        });
    }, [form.wilayaId, form.deliveryType]);

    const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.wilayaId) { toast.error('Veuillez sélectionner une wilaya'); return; }
        setSubmitting(true);
        try {
            const wilaya = wilayas.find(w => String(w.id) === String(form.wilayaId));
            const commune = communes.find(c => String(c.id) === String(form.communeId));

            const parcelPayload = {
                client_name: form.name,
                client_phone: form.phone,
                address: form.address,
                wilaya: form.wilayaId,
                commune: form.communeId || undefined,
                delivery_type: form.deliveryType,
                weight: Number(form.weight),
                price: Number(form.declaration),
                note: form.note || undefined,
            };

            const result = await createParcel(parcelPayload);
            if (result?.error) throw new Error(result.error);

            const trackingId = result?.tracking_id || result?.id || result?.reference || result?.parcel_id;
            if (!trackingId) throw new Error('Tracking ID non reçu de Guepex');

            await updateOrderGuepex(order.id, {
                guepex_tracking_id: String(trackingId),
                guepex_status: 'created',
                guepex_created_at: new Date().toISOString(),
                delivery_type: form.deliveryType,
                delivery_fee: form.fee ? Number(form.fee) : null,
            });

            toast.success(`Expédition créée ✓ Tracking: ${trackingId}`, { duration: 5000 });
            onCreated();
        } catch (err) {
            toast.error(err.message || 'Erreur lors de la création');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Wilaya + Commune */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                    <Label>Wilaya</Label>
                    <select
                        value={form.wilayaId}
                        onChange={e => setForm(f => ({ ...f, wilayaId: e.target.value, communeId: '' }))}
                        style={inputStyle}
                        required
                    >
                        <option value="">{loadingWilayas ? 'Chargement…' : '— Choisir —'}</option>
                        {wilayas.map(w => (
                            <option key={w.id} value={w.id}>{w.name || w.name_ar || w.wilaya_name || `Wilaya ${w.id}`}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <Label>Commune</Label>
                    <select
                        value={form.communeId}
                        onChange={set('communeId')}
                        style={inputStyle}
                        disabled={!form.wilayaId}
                    >
                        <option value="">{loadingCommunes ? 'Chargement…' : '— Choisir —'}</option>
                        {communes.map(c => (
                            <option key={c.id} value={c.id}>{c.name || c.commune_name || `Commune ${c.id}`}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Delivery Type */}
            <div>
                <Label>Type de livraison</Label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {[
                        { value: 'home', label: 'À domicile' },
                        { value: 'center', label: 'Point relais / Centre' },
                    ].map(opt => (
                        <label key={opt.value} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 16px', borderRadius: '12px',
                            border: `1px solid ${form.deliveryType === opt.value ? '#C3AB7E' : '#F0EDE8'}`,
                            backgroundColor: form.deliveryType === opt.value ? '#FFFBF0' : 'white',
                            cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#111111',
                            transition: 'all 0.2s', flex: 1,
                        }}>
                            <input
                                type="radio"
                                name="deliveryType"
                                value={opt.value}
                                checked={form.deliveryType === opt.value}
                                onChange={set('deliveryType')}
                                style={{ accentColor: '#C3AB7E' }}
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
            </div>

            {/* Fee (read-only) */}
            <div>
                <Label>Frais de livraison</Label>
                <div style={{ position: 'relative' }}>
                    <input
                        type="text"
                        value={loadingFee ? 'Calcul…' : (form.fee ? DA(form.fee) : '—')}
                        readOnly
                        style={{ ...inputStyle, backgroundColor: '#FAFAFA', color: form.fee ? '#111111' : '#9ca3af', cursor: 'default' }}
                    />
                    {loadingFee && (
                        <Loader2 size={14} className="animate-spin" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#C3AB7E' }} />
                    )}
                </div>
            </div>

            {/* Recipient info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                    <Label>Nom du destinataire</Label>
                    <input type="text" value={form.name} onChange={set('name')} style={inputStyle} required />
                </div>
                <div>
                    <Label>Téléphone</Label>
                    <input type="tel" value={form.phone} onChange={set('phone')} style={inputStyle} required />
                </div>
            </div>

            <div>
                <Label>Adresse complète</Label>
                <input type="text" value={form.address} onChange={set('address')} style={inputStyle} required />
            </div>

            <div>
                <Label>Remarque (optionnelle)</Label>
                <textarea
                    value={form.note}
                    onChange={set('note')}
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                    placeholder="Note pour le livreur…"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                    <Label>Poids (kg)</Label>
                    <input
                        type="number" min="0.1" step="0.1"
                        value={form.weight} onChange={set('weight')}
                        style={inputStyle} required
                    />
                </div>
                <div>
                    <Label>Déclaration (DA)</Label>
                    <input
                        type="number" min="0"
                        value={form.declaration} onChange={set('declaration')}
                        style={inputStyle} required
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={submitting}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '14px 20px', borderRadius: '14px', border: 'none',
                    backgroundColor: submitting ? '#4b5563' : '#374151',
                    color: 'white', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase',
                    letterSpacing: '0.08em', cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', marginTop: '4px',
                }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#C3AB7E'; }}
                onMouseLeave={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#374151'; }}
            >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                {submitting ? 'Création en cours…' : "Créer l'expédition Guepex"}
            </button>
        </form>
    );
}

/* ─── Section 2 — Tracking Info ─────────────────────────── */
function TrackingInfo({ order, onRefresh }) {
    const [showHistory, setShowHistory] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [copied, setCopied] = useState(false);

    const trackingId = order.guepex_tracking_id || order.guepex_tracking;
    const status = order.guepex_status || 'created';

    const handleCopy = () => {
        navigator.clipboard.writeText(trackingId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const data = await getParcel(trackingId);
            if (data?.error) throw new Error(data.error);
            const newStatus = data?.status || data?.state;
            if (newStatus) {
                await updateOrderGuepex(order.id, { guepex_status: newStatus });
                toast.success('Statut mis à jour');
                onRefresh();
            } else {
                toast('Statut inchangé');
            }
        } catch (err) {
            toast.error(err.message || 'Erreur de rafraîchissement');
        } finally {
            setRefreshing(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm(`Annuler l'expédition ${trackingId} ? Cette action est irréversible.`)) return;
        setCancelling(true);
        try {
            const data = await cancelParcel(trackingId);
            if (data?.error) throw new Error(data.error);
            await updateOrderGuepex(order.id, { guepex_status: 'cancelled' });
            toast.success('Expédition annulée');
            onRefresh();
        } catch (err) {
            toast.error(err.message || "Erreur lors de l'annulation");
        } finally {
            setCancelling(false);
        }
    };

    const btnBase = {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        padding: '10px 16px', borderRadius: '12px', border: '1px solid #F0EDE8',
        backgroundColor: 'white', fontSize: '11px', fontWeight: '800',
        textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
        transition: 'all 0.2s', color: '#374151',
    };

    return (
        <>
            {/* Tracking ID chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <button
                    onClick={handleCopy}
                    title="Cliquer pour copier"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 16px', borderRadius: '12px',
                        backgroundColor: '#111111', color: 'white', border: 'none',
                        fontFamily: 'monospace', fontSize: '13px', fontWeight: '700',
                        cursor: 'pointer', transition: 'all 0.2s',
                    }}
                >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {trackingId}
                </button>
                <StatusBadge status={status} />
            </div>

            {/* Fee info */}
            {order.delivery_fee != null && (
                <p style={{ margin: '0 0 16px', fontSize: '12px', fontWeight: '700', color: '#6b7280' }}>
                    Frais de livraison : <strong style={{ color: '#111111' }}>{DA(order.delivery_fee)}</strong>
                    {order.delivery_type === 'center' ? ' • Point relais' : ' • À domicile'}
                </p>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                    style={btnBase}
                    onClick={() => setShowHistory(true)}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                >
                    <History size={14} />
                    Voir l'historique
                </button>

                <button
                    style={{ ...btnBase, opacity: refreshing ? 0.7 : 1 }}
                    disabled={refreshing}
                    onClick={handleRefresh}
                    onMouseEnter={e => { if (!refreshing) e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                >
                    {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Rafraîchir le statut
                </button>

                <button
                    style={{ ...btnBase, color: '#ef4444', borderColor: '#FECACA', opacity: cancelling ? 0.7 : 1 }}
                    disabled={cancelling || status === 'cancelled'}
                    onClick={handleCancel}
                    onMouseEnter={e => { if (!cancelling) e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                >
                    {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Annuler l'expédition
                </button>
            </div>

            {showHistory && (
                <GuepexHistoryModal tracking={trackingId} onClose={() => setShowHistory(false)} />
            )}
        </>
    );
}

/* ─── Main Export ────────────────────────────────────────── */
export default function GuepexPanel({ order, onRefresh }) {
    const status = order?.status?.toLowerCase();
    const isEligible = status === 'confirmed' || status === 'paid';
    if (!isEligible) return null;

    const hasTracking = Boolean(order.guepex_tracking_id);

    return (
        <div style={{ marginTop: '8px' }}>
            <Card>
                {/* Section header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px',
                    paddingBottom: '16px', borderBottom: '1px solid #F0EDE8',
                }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        backgroundColor: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Truck size={18} color="white" />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Expédition
                        </p>
                        <p style={{ margin: '1px 0 0', fontSize: '14px', fontWeight: '800', color: '#111111' }}>
                            Livraison Guepex
                        </p>
                    </div>
                </div>

                {hasTracking ? (
                    <TrackingInfo order={order} onRefresh={onRefresh} />
                ) : (
                    <CreateShipmentForm order={order} onCreated={onRefresh} />
                )}
            </Card>
        </div>
    );
}
