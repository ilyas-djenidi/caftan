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
import { ALGERIA_CITIES, WILAYAS } from '../utils';
import { useTranslation } from 'react-i18next';

export default function Checkout() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { items, clearCart } = useCartStore();
    const totalPrice = items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);
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

    useEffect(() => {
        if (items.length === 0 && !orderSuccess) {
            navigate('/');
        }
    }, [items, orderSuccess, navigate]);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

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
                    customer_email: '',
                    shipping_address: formData.address,
                    wilaya: formData.wilaya,
                    city: formData.city,
                    delivery_type: formData.deliveryType,
                    payment_method: 'COD',
                    status: 'pending',
                    total_price: totalPrice,
                    notes: formData.city
                });

            if (orderError) throw orderError;

            // 2. Create Order Items — corrected field names
            const orderItems = items.map(item => ({
                order_id: orderId,
                product_id: item.product?.id || null,
                product_name: item.product?.name_fr || '',
                product_image: item.product?.images?.[0]?.image_url || '',
                quantity: item.quantity,
                size: item.size || null,
                color: item.color || null,
                price_at_purchase: item.product?.price || 0
            }));

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
                        total_price: totalPrice,
                        items: items.map(item => ({
                            product_name: item.product?.name_fr || '',
                            quantity: item.quantity,
                            price: item.product?.price || 0,
                            size: item.size || '',
                            color: item.color || ''
                        }))
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
                        <Link to="/suivi-commande" style={{
                            backgroundColor: 'transparent', color: '#B8963E', height: '44px',
                            borderRadius: '10px', textDecoration: 'none', fontWeight: '600',
                            fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase',
                            fontFamily: "'Jost', sans-serif", display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '6px',
                            border: '1.5px solid #B8963E', transition: 'all 0.3s'
                        }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#B8963E'; e.currentTarget.style.color = '#FAF8F4'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#B8963E'; }}>
                            Suivre votre commande →
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
                                    { value: 'home',   icon: '🏠', label: 'À domicile',  sub: 'Livraison à votre adresse' },
                                    { value: 'bureau', icon: '📦', label: 'Bureau',       sub: 'Retrait au point relais' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setFormData(f => ({ ...f, deliveryType: opt.value }))}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                            padding: '12px 14px', borderRadius: '10px', cursor: 'pointer',
                                            border: `1.5px solid ${formData.deliveryType === opt.value ? '#B8963E' : '#E8E2D6'}`,
                                            backgroundColor: formData.deliveryType === opt.value ? '#FFFBF0' : '#F5F5F5',
                                            transition: 'all 0.2s', textAlign: 'left',
                                        }}
                                    >
                                        <span style={{ fontSize: '16px', marginBottom: '4px' }}>{opt.icon}</span>
                                        <span style={{
                                            fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: '500',
                                            color: formData.deliveryType === opt.value ? '#B8963E' : '#1A1714',
                                        }}>{opt.label}</span>
                                        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: '#9ca3af', fontWeight: '300' }}>
                                            {opt.sub}
                                        </span>
                                    </button>
                                ))}
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
                                <span style={{ fontSize: '12px', fontFamily: "'Jost', sans-serif", color: '#1A1714' }}>{totalPrice.toLocaleString('fr-FR')} DA</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontFamily: "'Jost', sans-serif", fontWeight: '600', color: '#1A1714' }}>Total</span>
                                <span style={{ fontSize: '16px', fontFamily: "'Jost', sans-serif", fontWeight: '700', color: '#B8963E' }}>{totalPrice.toLocaleString('fr-FR')} DA</span>
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
                                disabled={loading}
                                onClick={handleSubmit}
                                style={{
                                    width: '100%', height: '44px',
                                    backgroundColor: '#1A1714', color: '#FAF8F4',
                                    borderRadius: '10px', fontFamily: "'Jost', sans-serif",
                                    fontWeight: '400', fontSize: '11px',
                                    letterSpacing: '0.2em', textTransform: 'uppercase', border: 'none',
                                    cursor: loading ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'background 0.3s',
                                }}
                                onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#B8963E')}
                                onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = '#1A1714')}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <>Confirmer la commande ✓</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
