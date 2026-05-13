import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronRight, MapPin, ShoppingBag, CheckCircle,
    ArrowLeft, Loader2, ShieldCheck, Truck, Smartphone,
    CreditCard, LayoutGrid, ArrowRight
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { supabase } from '../lib/supabase';
import { ALGERIA_CITIES, WILAYAS, getDeliveryFee } from '../utils';
import { useTranslation } from 'react-i18next';
import { getWilayas, getFees } from '../services/guepex';

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[''\-_\s]+/g, '');

export default function Checkout() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { items, clearCart } = useCartStore();
    const subtotal = items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(null);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        wilaya: '',
        city: '',
        address: '',
        deliveryType: 'home',  // 'home' | 'bureau'
    });

    const [fetchedWilayas, setFetchedWilayas] = useState([]);
    const [fetchedFees, setFetchedFees] = useState(null);
    const [apiDeliveryFee, setApiDeliveryFee] = useState(null);
    const [isFetchingFee, setIsFetchingFee] = useState(false);

    useEffect(() => {
        getWilayas().then(data => {
            if (!data?.error) {
                const list = Array.isArray(data) ? data : (data?.data || data?.results || []);
                setFetchedWilayas(list);
            }
        });
    }, []);

    useEffect(() => {
        if (!formData.wilaya || !fetchedWilayas.length) {
            setFetchedFees(null);
            setApiDeliveryFee(null);
            return;
        }

        const wilayaNorm = norm(formData.wilaya);
        const match = fetchedWilayas.find(w => norm(w.name) === wilayaNorm || norm(w.wilaya_name) === wilayaNorm);

        if (match) {
            setIsFetchingFee(true);
            const fromId = Number(import.meta.env.VITE_STORE_WILAYA_ID) || 28;
            getFees(fromId, match.id).then(data => {
                if (!data?.error && data?.per_commune) {
                    setFetchedFees(data.per_commune);
                } else {
                    setFetchedFees(null);
                }
            }).catch(() => setFetchedFees(null))
              .finally(() => setIsFetchingFee(false));
        } else {
            setFetchedFees(null);
            setApiDeliveryFee(null);
        }
    }, [formData.wilaya, fetchedWilayas]);

    useEffect(() => {
        if (!fetchedFees || !formData.city) {
            setApiDeliveryFee(null);
            return;
        }

        const cityNorm = norm(formData.city);
        const communes = Object.values(fetchedFees);
        const match = communes.find(c => norm(c.commune_name) === cityNorm);

        if (match) {
            const fee = formData.deliveryType === 'home' ? match.express_home : match.express_desk;
            setApiDeliveryFee(fee);
        } else {
            setApiDeliveryFee(null);
        }
    }, [fetchedFees, formData.city, formData.deliveryType]);

    useEffect(() => {
        if (items.length === 0 && !orderSuccess) {
            navigate('/');
        }
    }, [items, orderSuccess, navigate]);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const fallbackFee = getDeliveryFee(formData.wilaya, formData.deliveryType);
    const deliveryFee = apiDeliveryFee !== null ? apiDeliveryFee : fallbackFee;
    const totalPrice = subtotal + deliveryFee;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
            window.scrollTo(0, 0);
            return;
        }

        setLoading(true);
        try {
            const orderId = crypto.randomUUID();
            const orderNumber = `MDC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

            // 1. Create Order
            const { error: orderError } = await supabase
                .from('orders')
                .insert({
                    id: orderId,
                    order_number: orderNumber,
                    customer_name: formData.fullName,
                    customer_phone: formData.phone,
                    shipping_address: formData.address,
                    wilaya: formData.wilaya,
                    commune: formData.city,
                    status: 'pending',
                    total_price: totalPrice,
                    notes: `${formData.address} | Livraison: ${formData.deliveryType === 'home' ? 'Domicile' : 'Bureau'} | Frais: ${deliveryFee} DA`
                });

            if (orderError) throw orderError;

            // 2. Create Order Items — corrected field names
            const orderItems = items.map(item => {
                const combinedSize = item.model ? (item.size ? `${item.size} (Modèle ${item.model})` : `Modèle ${item.model}`) : (item.size || null);
                
                const colorAttr = item.product?.attributes?.find(a => a.type === 'color' && a.value === item.color);
                const readableColor = colorAttr ? colorAttr.label : (item.color || null);

                return {
                    order_id: orderId,
                    product_id: item.product?.is_pack ? null : (item.product?.id || null),
                    pack_id: item.product?.is_pack ? (item.product?.id || null) : null,
                    product_name: item.product?.name_fr || item.product?.name || '',
                    product_image: item.product?.images?.[0]?.image_url || item.product?.image_url || item.product?.image || '',
                    quantity: item.quantity,
                    size: combinedSize,
                    color: readableColor,
                    price_at_purchase: item.product?.price || 0
                };
            });

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // Send to n8n webhook
            try {
                await fetch('https://innovation-team.hawiyat.org/webhook/COFTAN', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        order_number: orderNumber,
                        customer_name: formData.fullName,
                        customer_phone: formData.phone,
                        wilaya: formData.wilaya,
                        city: formData.city,
                        address: formData.address,
                        delivery_fee: deliveryFee,
                        total_price: totalPrice,
                        items: items.map(item => {
                            const colorAttr = item.product?.attributes?.find(a => a.type === 'color' && a.value === item.color);
                            const readableColor = colorAttr ? colorAttr.label : (item.color || '');
                            return {
                                product_name: item.product?.name_fr || '',
                                quantity: item.quantity,
                                price: item.product?.price || 0,
                                size: item.size || '',
                                color: readableColor,
                                model: item.model || ''
                            };
                        })
                    })
                });
            } catch (webhookError) {
                console.error('Webhook error:', webhookError);
                // Don't fail the order if webhook fails
            }

            // 3. Success
            setOrderSuccess({ order_number: orderNumber });
            clearCart();
            setStep(3);
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Une erreur est survenue lors de la commande. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Success screen — no extra Navbar
    if (step === 3 && orderSuccess) {
        return (
            <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-4">
                <div style={{ maxWidth: '360px', width: '100%', textAlign: 'center', backgroundColor: '#FFFFFF', padding: '40px 24px', borderRadius: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', border: '1px solid #E8E2D6' }}>
                    <div style={{
                        width: '64px', height: '64px', backgroundColor: '#f0fdf4',
                        color: '#16a34a', borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                    }}>
                        <CheckCircle size={32} />
                    </div>
                    <h1 style={{ fontSize: '28px', fontFamily: "'Cormorant Garamond', serif", marginBottom: '12px', fontWeight: '500', color: '#1A1714' }}>{t('checkout.successTitle')}</h1>
                    <p style={{ color: '#6b7280', fontSize: '13px', fontFamily: "'Jost', sans-serif", marginBottom: '32px', lineHeight: '1.6' }}>
                        {t('checkout.successDesc')}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <Link to="/" style={{
                            backgroundColor: '#1A1714', color: '#FAF8F4', height: '44px',
                            borderRadius: '10px', textDecoration: 'none', fontWeight: '400',
                            fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase',
                            fontFamily: "'Jost', sans-serif", display: 'flex', alignItems: 'center',
                            justifyContent: 'center', transition: 'background 0.3s'
                        }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#B8963E'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1A1714'}>
                            {t('wishlist.back')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#FAF8F4',
            paddingTop: 'calc(var(--navbar-height, 100px) + 12px)',
            paddingBottom: '20px',
            paddingLeft: '24px',
            paddingRight: '24px',
        }}>
            {step === 1 ? (
                <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                    {/* Page Title Block — outside the card */}
                    <div style={{ textAlign: 'left', marginBottom: '14px' }}>
                        <h1 style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: '24px',
                            fontWeight: '500',
                            color: '#1A1714',
                            margin: '0 0 3px',
                        }}>
                            {t('checkout.step1')}
                        </h1>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#9ca3af', fontWeight: '300', margin: '0 0 10px' }}>
                            {t('checkout.fullName')}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', fontFamily: "'Jost', sans-serif", color: '#1A1714' }}>① {t('checkout.step1')}</span>
                            <div style={{ width: '16px', height: '1px', backgroundColor: '#E8E2D6' }} />
                            <span style={{ fontSize: '11px', fontWeight: '400', fontFamily: "'Jost', sans-serif", color: '#9ca3af' }}>② {t('checkout.step2')}</span>
                        </div>
                    </div>

                    {/* Card — all fields + button inside */}
                    <div style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '14px',
                        padding: '20px 22px 18px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        width: '100%',
                        boxSizing: 'border-box',
                    }}>
                        {/* Row 1: Name + Phone */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                            {/* Full Name */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{
                                    fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: '400',
                                    color: '#1A1714', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px',
                                }}>
                                    {t('checkout.fullName')}
                                    <span style={{ color: '#9ca3af', fontWeight: '300', fontSize: '12px' }}>(Ex: Amira Rahmani)</span>
                                </label>
                                <input
                                    required name="fullName" value={formData.fullName} onChange={handleInput}
                                    placeholder="Amira Rahmani"
                                    style={{
                                        width: '100%', padding: '10px 14px', backgroundColor: '#F5F5F5',
                                        border: '1.5px solid transparent', borderRadius: '10px',
                                        fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: '300',
                                        color: '#1A1714', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#B8963E'}
                                    onBlur={e => e.target.style.borderColor = 'transparent'}
                                />
                            </div>

                            {/* Phone */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{
                                    fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: '400',
                                    color: '#1A1714', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px',
                                }}>
                                    {t('checkout.phone')}
                                    <span style={{ color: '#9ca3af', fontWeight: '300', fontSize: '12px' }}>(05xx xx xx xx)</span>
                                </label>
                                <input
                                    required type="tel" name="phone" value={formData.phone} onChange={handleInput}
                                    placeholder="0555 55 55 55"
                                    style={{
                                        width: '100%', padding: '10px 14px', backgroundColor: '#F5F5F5',
                                        border: '1.5px solid transparent', borderRadius: '10px',
                                        fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: '300',
                                        color: '#1A1714', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#B8963E'}
                                    onBlur={e => e.target.style.borderColor = 'transparent'}
                                />
                            </div>
                        </div>

                        {/* Row 2: Wilaya + Commune */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                            {/* Wilaya */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{
                                    fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: '400',
                                    color: '#1A1714', marginBottom: '5px',
                                }}>Wilaya</label>
                                <select
                                    required name="wilaya" value={formData.wilaya} onChange={handleInput}
                                    style={{
                                        width: '100%', padding: '10px 14px', backgroundColor: '#F5F5F5',
                                        border: '1.5px solid transparent', borderRadius: '10px',
                                        fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: '300',
                                        color: '#1A1714', outline: 'none', appearance: 'none',
                                        transition: 'border-color 0.2s', boxSizing: 'border-box',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#B8963E'}
                                    onBlur={e => e.target.style.borderColor = 'transparent'}
                                >
                                    <option value="">{t('checkout.selectWilaya')}</option>
                                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>

                            {/* Commune */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{
                                    fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: '400',
                                    color: '#1A1714', marginBottom: '5px',
                                }}>{t('checkout.city')}</label>
                                <select
                                    required name="city" value={formData.city} onChange={handleInput}
                                    disabled={!formData.wilaya}
                                    style={{
                                        width: '100%', padding: '10px 14px', backgroundColor: '#F5F5F5',
                                        border: '1.5px solid transparent', borderRadius: '10px',
                                        fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: '300',
                                        color: '#1A1714', outline: 'none', appearance: 'none',
                                        transition: 'border-color 0.2s', opacity: !formData.wilaya ? 0.5 : 1,
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => e.target.style.borderColor = '#B8963E'}
                                    onBlur={e => e.target.style.borderColor = 'transparent'}
                                >
                                    <option value="">{t('checkout.selectCity')}</option>
                                    {formData.wilaya && ALGERIA_CITIES[formData.wilaya]?.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Row 3: Delivery type */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{
                                fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: '400',
                                color: '#1A1714', marginBottom: '8px', display: 'block',
                            }}>Mode de livraison</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {[
                                    { value: 'home',   label: 'À domicile' },
                                    { value: 'bureau', label: 'Bureau' },
                                ].map(opt => {
                                    const active = formData.deliveryType === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData(f => ({ ...f, deliveryType: opt.value }))}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                                                border: `1.5px solid ${active ? '#1A1714' : '#E8E2D6'}`,
                                                backgroundColor: active ? '#1A1714' : '#F5F5F5',
                                                transition: 'all 0.2s', textAlign: 'left',
                                            }}
                                        >
                                            {/* Radio circle */}
                                            <span style={{
                                                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                                                border: `2px solid ${active ? 'white' : '#9ca3af'}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {active && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />}
                                            </span>
                                            <span style={{
                                                fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: '500',
                                                color: active ? 'white' : '#1A1714',
                                            }}>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Row 4: Address — full width, only for home delivery */}
                        <div style={{ marginBottom: '12px', display: formData.deliveryType === 'home' ? 'block' : 'none' }}>
                            <label style={{
                                fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: '400',
                                color: '#1A1714', marginBottom: '5px', display: 'block',
                            }}>{t('checkout.streetAddress')}</label>
                            <textarea
                                required name="address" value={formData.address} onChange={handleInput}
                                placeholder="Rue, quartier, n° de porte..."
                                rows={2}
                                style={{
                                    width: '100%', padding: '10px 14px', backgroundColor: '#F5F5F5',
                                    border: '1.5px solid transparent', borderRadius: '10px',
                                    fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: '300',
                                    color: '#1A1714', outline: 'none', transition: 'border-color 0.2s',
                                    resize: 'none', boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = '#B8963E'}
                                onBlur={e => e.target.style.borderColor = 'transparent'}
                            />
                        </div>

                        {/* Continue button — inside card */}
                        <button
                            onClick={handleSubmit}
                            style={{
                                width: '100%', height: '44px',
                                backgroundColor: '#1A1714', color: '#FAF8F4',
                                border: 'none', borderRadius: '10px',
                                fontFamily: "'Jost', sans-serif", fontSize: '11px',
                                fontWeight: '400', letterSpacing: '0.2em',
                                textTransform: 'uppercase', cursor: 'pointer',
                                marginTop: '6px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'background 0.3s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#B8963E'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1A1714'}
                        >
                            Continuer <span>→</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                    {/* Page Title Block */}
                    <div style={{ textAlign: 'left', marginBottom: '14px' }}>
                        <h1 style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: '24px',
                            fontWeight: '500',
                            color: '#1A1714',
                            margin: '0 0 3px',
                        }}>Vérification</h1>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#9ca3af', fontWeight: '300', margin: '0 0 10px' }}>
                            Vérifiez votre commande avant de confirmer
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '400', fontFamily: "'Jost', sans-serif", color: '#9ca3af' }}>① Informations</span>
                            <div style={{ width: '16px', height: '1px', backgroundColor: '#E8E2D6' }} />
                            <span style={{ fontSize: '11px', fontWeight: '600', fontFamily: "'Jost', sans-serif", color: '#1A1714' }}>② Vérification</span>
                        </div>
                    </div>

                    {/* Verification Card */}
                    <div style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '14px',
                        padding: '20px 22px 18px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                        width: '100%',
                        boxSizing: 'border-box',
                    }}>
                        {/* Bag Summary Section */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{
                                fontSize: '11px', fontFamily: "'Jost', sans-serif",
                                fontWeight: '600', letterSpacing: '0.12em',
                                textTransform: 'uppercase', color: '#1A1714', margin: 0
                            }}>Bag Summary</h3>
                            <span style={{
                                backgroundColor: '#F5F5F5', color: '#6B6458',
                                fontSize: '10px', fontFamily: "'Jost', sans-serif",
                                padding: '3px 10px', borderRadius: '20px'
                            }}>
                                {items.length} items
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                            {items.map((item) => (
                                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{
                                            fontSize: '13px', fontFamily: "'Cormorant Garamond', serif",
                                            fontWeight: '500', color: '#1A1714', margin: '0 0 2px'
                                        }}>{item.product?.name_fr}</p>
                                        <p style={{
                                            fontSize: '11px', fontFamily: "'Jost', sans-serif",
                                            color: '#6B6458', margin: 0
                                        }}>Qty: {item.quantity}</p>
                                    </div>
                                    <p style={{
                                        fontSize: '13px', fontFamily: "'Jost', sans-serif",
                                        fontWeight: '400', color: '#1A1714', margin: 0
                                    }}>
                                        {((item.product?.price || 0) * item.quantity).toLocaleString('fr-FR')} DA
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div style={{ height: '1px', backgroundColor: '#E8E2D6', margin: '0 0 10px' }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontFamily: "'Jost', sans-serif", color: '#6B6458' }}>Subtotal</span>
                                <span style={{ fontSize: '12px', fontFamily: "'Jost', sans-serif", color: '#1A1714' }}>{subtotal.toLocaleString('fr-DZ')} DA</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontFamily: "'Jost', sans-serif", color: '#6B6458' }}>Livraison {formData.wilaya ? `(${formData.wilaya})` : ''}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: "'Jost', sans-serif", color: deliveryFee ? '#1A1714' : '#6B6458' }}>
                                    {isFetchingFee && <Loader2 size={12} className="animate-spin text-[#6B6458]" />}
                                    {deliveryFee ? `+${deliveryFee.toLocaleString('fr-DZ')} DA` : '—'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ fontSize: '13px', fontFamily: "'Jost', sans-serif", fontWeight: '600', color: '#1A1714' }}>Total</span>
                                <span style={{ fontSize: '16px', fontFamily: "'Jost', sans-serif", fontWeight: '700', color: '#B8963E' }}>{totalPrice.toLocaleString('fr-DZ')} DA</span>
                            </div>
                        </div>

                        <div style={{ height: '1px', backgroundColor: '#E8E2D6', margin: '0 0 12px' }} />

                        {/* Recapitulatif Section */}
                        <h3 style={{
                            fontSize: '11px', fontFamily: "'Jost', sans-serif",
                            fontWeight: '600', letterSpacing: '0.12em',
                            textTransform: 'uppercase', color: '#1A1714',
                            marginBottom: '10px'
                        }}>Récapitulatif</h3>

                        <div style={{ display: 'flex', gap: '24px', marginBottom: '14px' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{
                                    fontSize: '10px', fontFamily: "'Jost', sans-serif",
                                    color: '#6B6458', fontWeight: '600',
                                    textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.1em'
                                }}>Client</p>
                                <p style={{ fontSize: '13px', fontFamily: "'Jost', sans-serif", fontWeight: '500', color: '#1A1714', margin: '0 0 2px' }}>{formData.fullName}</p>
                                <p style={{ fontSize: '12px', fontFamily: "'Jost', sans-serif", color: '#6B6458', margin: 0 }}>{formData.phone}</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{
                                    fontSize: '10px', fontFamily: "'Jost', sans-serif",
                                    color: '#6B6458', fontWeight: '600',
                                    textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.1em'
                                }}>Adresse</p>
                                <p style={{ fontSize: '13px', fontFamily: "'Jost', sans-serif", fontWeight: '500', color: '#1A1714', margin: '0 0 2px' }}>{formData.wilaya} – {formData.city}</p>
                                <p style={{ fontSize: '12px', fontFamily: "'Jost', sans-serif", color: '#9ca3af', margin: 0 }}>{formData.address}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                                onClick={() => setStep(1)}
                                style={{
                                    width: '100%', height: '40px',
                                    backgroundColor: 'transparent', color: '#1A1714',
                                    borderRadius: '10px', fontFamily: "'Jost', sans-serif",
                                    fontWeight: '400', fontSize: '11px',
                                    letterSpacing: '0.2em', textTransform: 'uppercase',
                                    border: '1px solid #E8E2D6', cursor: 'pointer'
                                }}
                            >
                                ← Modifier
                            </button>
                            <button
                                disabled={loading || isFetchingFee}
                                onClick={handleSubmit}
                                style={{
                                    width: '100%', height: '44px',
                                    backgroundColor: '#1A1714', color: '#FAF8F4',
                                    borderRadius: '10px', fontFamily: "'Jost', sans-serif",
                                    fontWeight: '400', fontSize: '11px',
                                    letterSpacing: '0.2em', textTransform: 'uppercase', border: 'none',
                                    cursor: (loading || isFetchingFee) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'background 0.3s',
                                    opacity: (loading || isFetchingFee) ? 0.7 : 1,
                                }}
                                onMouseEnter={e => !(loading || isFetchingFee) && (e.currentTarget.style.backgroundColor = '#B8963E')}
                                onMouseLeave={e => !(loading || isFetchingFee) && (e.currentTarget.style.backgroundColor = '#1A1714')}
                            >
                                {(loading || isFetchingFee) ? <Loader2 size={16} className="animate-spin" /> : <>Confirmer la commande ✓</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
