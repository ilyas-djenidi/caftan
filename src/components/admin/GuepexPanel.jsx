import React, { useState, useEffect } from 'react';
import {
    Truck, Copy, CheckCircle2, XCircle, RefreshCw,
    Loader2, History, Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    getWilayas,
    getCommunes,
    createParcel,
    getParcel,
    cancelParcel,
} from '../../services/guepex';
import { getDeliveryFee } from '../../utils';
import GuepexHistoryModal from '../GuepexHistoryModal';
import { updateOrderGuepex, updateOrderStatus } from '../../api/orders.api';

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
const norm = (s) => (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[''\-_\s]+/g, '');

function CreateShipmentForm({ order, onCreated }) {
    const [wilayas, setWilayas] = useState([]);
    const [communes, setCommunes] = useState([]);
    const [form, setForm] = useState({
        wilayaId: '',
        communeId: '',
        deliveryType: order.delivery_type === 'bureau' ? 'center' : 'home',
        fee: order.wilaya ? getDeliveryFee(order.wilaya, order.delivery_type === 'bureau' ? 'bureau' : 'home') : '',
        name: order.customer_name || '',
        phone: order.customer_phone || order.phone || '',
        address: order.shipping_address || order.address || '',
        note: '',
        weight: 1,
        declaration: order.total_price || 0,
    });
    const [loadingWilayas, setLoadingWilayas] = useState(true);
    const [loadingCommunes, setLoadingCommunes] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getWilayas().then(data => {
            if (!data?.error) {
                const list = Array.isArray(data) ? data : (data?.data || data?.results || []);
                setWilayas(list);
                if (order.wilaya && list.length > 0) {
                    const orderNorm = norm(order.wilaya);
                    const match = list.find(w => norm(w.name) === orderNorm || norm(w.wilaya_name) === orderNorm);
                    if (match) setForm(f => ({ ...f, wilayaId: String(match.id) }));
                }
            }
            setLoadingWilayas(false);
        });
    }, []);

    // 1. Unified effect to sync form with wilayas and calculate fee
    useEffect(() => {
        if (!wilayas.length) return;

        // Auto-select wilayaId if order.wilaya exists and not yet set
        if (!form.wilayaId && order.wilaya) {
            const orderNorm = norm(order.wilaya);
            const match = wilayas.find(w => norm(w.name) === orderNorm || norm(w.wilaya_name) === orderNorm);
            if (match) {
                setForm(f => ({ ...f, wilayaId: String(match.id) }));
            }
        }

        // Sync fee based on current wilaya selection
        if (form.wilayaId) {
            const wilaya = wilayas.find(w => String(w.id) === String(form.wilayaId));
            const wilayaName = wilaya?.name || order.wilaya; 
            if (wilayaName) {
                const fee = getDeliveryFee(wilayaName, form.deliveryType === 'center' ? 'bureau' : 'home');
                setForm(f => ({ ...f, fee: (fee !== undefined && fee !== null) ? fee : '' }));
            }
        }
    }, [wilayas, form.wilayaId, form.deliveryType, order.wilaya]);

    // 2. Load communes when wilayaId changes
    useEffect(() => {
        if (!form.wilayaId) { setCommunes([]); return; }
        setLoadingCommunes(true);
        getCommunes(form.wilayaId).then(data => {
            if (!data?.error) {
                const list = Array.isArray(data) ? data : (data?.data || data?.results || []);
                setCommunes(list);
                const cityRaw = order.city || order.notes || '';
                if (cityRaw && list.length > 0) {
                    const cityNorm = norm(cityRaw);
                    const match = list.find(c => norm(c.name) === cityNorm || norm(c.commune_name) === cityNorm);
                    if (match) setForm(f => ({ ...f, communeId: String(match.id) }));
                }
            }
            setLoadingCommunes(false);
        });
    }, [form.wilayaId]);

    const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.wilayaId) { toast.error('Veuillez sélectionner une wilaya'); return; }
        setSubmitting(true);
        try {
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
            
            await updateOrderGuepex(order.id, {
                guepex_tracking_id: String(trackingId),
                guepex_status: 'created',
                guepex_created_at: new Date().toISOString(),
                delivery_type: form.deliveryType,
                delivery_fee: form.fee ? Number(form.fee) : null,
            });
            await updateOrderStatus(order.id, 'SHIPPED');
            toast.success(`Expédition créée ✓ Tracking: ${trackingId}`);
            onCreated();
        } catch (err) {
            toast.error(err.message || 'Erreur lors de la création');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                    <Label>Wilaya</Label>
                    <select value={form.wilayaId} onChange={e => setForm(f => ({ ...f, wilayaId: e.target.value, communeId: '' }))} style={inputStyle} required>
                        <option value="">{loadingWilayas ? 'Chargement…' : '— Choisir —'}</option>
                        {wilayas.map(w => <option key={w.id} value={w.id}>{w.name || w.wilaya_name}</option>)}
                    </select>
                </div>
                <div>
                    <Label>Commune</Label>
                    <select value={form.communeId} onChange={set('communeId')} style={inputStyle} disabled={!form.wilayaId}>
                        <option value="">{loadingCommunes ? 'Chargement…' : '— Choisir —'}</option>
                        {communes.map(c => <option key={c.id} value={c.id}>{c.name || c.commune_name}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <Label>Type de livraison</Label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {[{ value: 'home', label: 'À domicile' }, { value: 'center', label: 'Point relais' }].map(opt => (
                        <label key={opt.value} style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px',
                            border: `1px solid ${form.deliveryType === opt.value ? '#C3AB7E' : '#F0EDE8'}`,
                            backgroundColor: form.deliveryType === opt.value ? '#FFFBF0' : 'white', cursor: 'pointer', fontSize: '12px', fontWeight: '700', flex: 1
                        }}>
                            <input type="radio" value={opt.value} checked={form.deliveryType === opt.value} onChange={set('deliveryType')} style={{ accentColor: '#C3AB7E' }} />
                            {opt.label}
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <Label>Frais de livraison</Label>
                <input type="text" value={(form.fee !== '' && form.fee !== null) ? DA(form.fee) : '—'} readOnly style={{ ...inputStyle, backgroundColor: '#FAFAFA' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="text" placeholder="Nom destinataire" value={form.name} onChange={set('name')} style={inputStyle} required />
                <input type="tel" placeholder="Téléphone" value={form.phone} onChange={set('phone')} style={inputStyle} required />
            </div>
            <input type="text" placeholder="Adresse complète" value={form.address} onChange={set('address')} style={inputStyle} required />
            <textarea placeholder="Remarque…" value={form.note} onChange={set('note')} style={{ ...inputStyle, resize: 'none' }} rows={2} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><Label>Poids (kg)</Label><input type="number" step="0.1" value={form.weight} onChange={set('weight')} style={inputStyle} required /></div>
                <div><Label>Déclaration (DA)</Label><input type="number" value={form.declaration} onChange={set('declaration')} style={inputStyle} required /></div>
            </div>
            <button type="submit" disabled={submitting} style={{
                padding: '14px', borderRadius: '14px', backgroundColor: '#374151', color: 'white', fontWeight: '800', cursor: submitting ? 'not-allowed' : 'pointer', border: 'none'
            }}>
                {submitting ? 'Création…' : "Créer l'expédition Guepex"}
            </button>
        </form>
    );
}

function TrackingInfo({ order, onRefresh }) {
    const [showHistory, setShowHistory] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [copied, setCopied] = useState(false);
    const trackingId = order.guepex_tracking_id || order.guepex_tracking;
    const status = order.guepex_status || 'created';

    const handlePrint = () => {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guepex-proxy?endpoint=/parcels/${trackingId}/sticker/`;
        window.open(url, '_blank');
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const data = await getParcel(trackingId);
            if (data?.status) {
                await updateOrderGuepex(order.id, { guepex_status: data.status });
                toast.success('Statut mis à jour');
                onRefresh();
            }
        } catch (err) { toast.error('Erreur rafraîchissement'); }
        finally { setRefreshing(false); }
    };

    const btnStyle = {
        padding: '10px 16px', borderRadius: '12px', border: '1px solid #F0EDE8',
        backgroundColor: 'white', fontSize: '11px', fontWeight: '800', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '6px'
    };

    return (
        <>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{trackingId}</span>
                <StatusBadge status={status} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button style={btnStyle} onClick={() => setShowHistory(true)}><History size={14}/> Histoire</button>
                <button style={btnStyle} onClick={handleRefresh} disabled={refreshing}><RefreshCw size={14}/> Actualiser</button>
                <button style={{ ...btnStyle, backgroundColor: '#111', color: 'white', border: 'none' }} onClick={handlePrint}><Printer size={14}/> Imprimer</button>
            </div>
            {showHistory && <GuepexHistoryModal tracking={trackingId} onClose={() => setShowHistory(false)} />}
        </>
    );
}

export default function GuepexPanel({ order, onRefresh }) {
    const status = order?.status?.toUpperCase();
    if (!['CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED'].includes(status)) return null;
    const hasTracking = Boolean(order.guepex_tracking_id || order.guepex_tracking);

    return (
        <div style={{ marginTop: '8px' }}>
            <Card>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    <Truck size={20} /> <span style={{ fontWeight: 'bold' }}>Livraison Guepex</span>
                </div>
                {hasTracking ? <TrackingInfo order={order} onRefresh={onRefresh} /> : <CreateShipmentForm order={order} onCreated={onRefresh} />}
            </Card>
        </div>
    );
}
