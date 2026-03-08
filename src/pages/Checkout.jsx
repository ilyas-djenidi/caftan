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

export default function Checkout() {
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
        address: ''
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

            // 1. Create Order — corrected field names
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
            <div className="min-h-screen bg-white flex items-center justify-center p-10">
                <div style={{ maxWidth: '600px', textAlign: 'center' }}>
                    <div style={{
                        width: '100px', height: '100px', backgroundColor: '#f0fdf4',
                        color: '#16a34a', borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px'
                    }}>
                        <CheckCircle size={48} />
                    </div>
                    <h1 style={{ fontSize: '40px', fontFamily: 'serif', marginBottom: '16px' }}>Merci pour votre commande !</h1>
                    <p style={{ color: '#6b7280', fontSize: '18px', marginBottom: '32px' }}>
                        Votre commande <strong style={{ color: '#111111' }}>{orderSuccess.order_number}</strong> a été enregistrée avec succès. Nous vous contacterons par téléphone pour valider l'expédition.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Link to="/" style={{
                            backgroundColor: '#111111', color: 'white', padding: '20px',
                            borderRadius: '16px', textDecoration: 'none', fontWeight: '800',
                            fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase',
                            display: 'block'
                        }}>Retour à l'accueil</Link>
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
                            Vos Informations
                        </h1>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#9ca3af', fontWeight: '300', margin: '0 0 10px' }}>
                            Complétez vos détails de livraison
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', fontFamily: "'Jost', sans-serif", color: '#1A1714' }}>① Informations</span>
                            <div style={{ width: '16px', height: '1px', backgroundColor: '#E8E2D6' }} />
                            <span style={{ fontSize: '11px', fontWeight: '400', fontFamily: "'Jost', sans-serif", color: '#9ca3af' }}>② Vérification</span>
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
                                    Nom Complet
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
                                    Numéro de Téléphone
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
                                    <option value="">Sélectionner une wilaya</option>
                                    {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>

                            {/* Commune */}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label style={{
                                    fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: '400',
                                    color: '#1A1714', marginBottom: '5px',
                                }}>Commune</label>
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
                                    <option value="">Sélectionner une commune</option>
                                    {formData.wilaya && ALGERIA_CITIES[formData.wilaya]?.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Row 3: Address — full width */}
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{
                                fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: '400',
                                color: '#1A1714', marginBottom: '5px', display: 'block',
                            }}>Adresse Détaillée</label>
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
                                        {((item.product?.price || 0) * item.quantity).toLocaleString()} DA
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div style={{ height: '1px', backgroundColor: '#E8E2D6', margin: '0 0 10px' }} />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontFamily: "'Jost', sans-serif", color: '#6B6458' }}>Subtotal</span>
                                <span style={{ fontSize: '12px', fontFamily: "'Jost', sans-serif", color: '#1A1714' }}>{totalPrice.toLocaleString()} DA</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', fontFamily: "'Jost', sans-serif", fontWeight: '600', color: '#1A1714' }}>Total</span>
                                <span style={{ fontSize: '16px', fontFamily: "'Jost', sans-serif", fontWeight: '700', color: '#B8963E' }}>{totalPrice.toLocaleString()} DA</span>
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
