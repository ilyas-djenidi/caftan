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
    const { items, totalPrice, clearCart } = useCartStore();
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
            const orderNumber = `MDC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

            // 1. Create Order — corrected field names
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
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
                })
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items — corrected field names
            const orderItems = items.map(item => ({
                order_id: order.id,
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
            setOrderSuccess(order);
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
        <div className="min-h-screen bg-[#fafafa]">
            <main className="container mx-auto px-4 md:px-10 pt-40 pb-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                    {/* Left: Checkout Form */}
                    <div className="lg:col-span-7">
                        <header className="mb-12">
                            <h1 style={{ fontSize: '40px', fontFamily: 'serif', margin: 0 }}>Finaliser la commande</h1>
                            {/* Steps bar — flex-wrap for mobile */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px', rowGap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 1 ? '#111111' : '#9ca3af' }}>
                                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>1</span>
                                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Informations</span>
                                </div>
                                <div style={{ height: '1px', width: '40px', backgroundColor: '#f0ede8', alignSelf: 'center' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: step >= 2 ? '#111111' : '#9ca3af' }}>
                                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800' }}>2</span>
                                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Vérification</span>
                                </div>
                            </div>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === 1 ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#111111' }}>Nom Complet</label>
                                            <input required name="fullName" value={formData.fullName} onChange={handleInput} placeholder="Ex: Amina Benali" style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} className="focus:border-[#C3AB7E] bg-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#111111' }}>Téléphone</label>
                                            <input required name="phone" value={formData.phone} onChange={handleInput} placeholder="05XX XX XX XX" style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} className="focus:border-[#C3AB7E] bg-white" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#111111' }}>Wilaya</label>
                                            <select required name="wilaya" value={formData.wilaya} onChange={handleInput} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }} className="focus:border-[#C3AB7E] bg-white">
                                                <option value="">Sélectionner votre wilaya</option>
                                                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#111111' }}>Commune</label>
                                            <select required name="city" value={formData.city} onChange={handleInput} disabled={!formData.wilaya} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', fontSize: '14px', opacity: !formData.wilaya ? 0.5 : 1, boxSizing: 'border-box' }} className="focus:border-[#C3AB7E] bg-white">
                                                <option value="">Sélectionner votre commune</option>
                                                {formData.wilaya && ALGERIA_CITIES[formData.wilaya]?.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#111111' }}>Adresse Détaillée</label>
                                        <textarea required name="address" value={formData.address} onChange={handleInput} placeholder="Rue, quartier, n° de porte..." rows="3" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} className="focus:border-[#C3AB7E] bg-white" />
                                    </div>

                                    <button type="submit" style={{ width: '100%', height: '72px', backgroundColor: '#111111', color: 'white', borderRadius: '24px', fontWeight: '800', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '20px', border: 'none', cursor: 'pointer' }} className="hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                        Continuer vers la vérification <ArrowRight size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '32px', border: '1px solid #f0ede8' }}>
                                        <h3 style={{ fontSize: '14px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Récapitulatif de livraison</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div>
                                                <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Destinataire</p>
                                                <p style={{ fontWeight: '700' }}>{formData.fullName}</p>
                                                <p>{formData.phone}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Adresse</p>
                                                <p style={{ fontWeight: '700' }}>{formData.wilaya} - {formData.city}</p>
                                                <p>{formData.address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button disabled={loading} type="submit" style={{ width: '100%', height: '72px', backgroundColor: '#111111', color: 'white', borderRadius: '24px', fontWeight: '800', fontSize: '14px', letterSpacing: '0.2em', textTransform: 'uppercase', border: 'none', cursor: loading ? 'default' : 'pointer' }} className="hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                        {loading ? <Loader2 className="animate-spin" /> : <>Confirmer ma commande <CheckCircle size={20} /></>}
                                    </button>

                                    <button onClick={() => setStep(1)} style={{ width: '100%', background: 'none', border: 'none', color: '#9ca3af', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }} className="hover:text-[#111111]">Modifier mes informations</button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="lg:col-span-5">
                        <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '40px', position: 'sticky', top: '140px', border: '1px solid #f0ede8' }}>
                            <h3 style={{ fontSize: '20px', fontFamily: 'serif', marginBottom: '32px' }}>Votre Panier</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                                {items.map((item) => (
                                    <div key={item.key} style={{ display: 'flex', gap: '16px' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f9f9f9', flexShrink: 0 }}>
                                            <img
                                                src={
                                                    item.product?.images?.find(img => img.is_primary)?.image_url
                                                    || item.product?.images?.[0]?.image_url
                                                    || item.product?.cover_image_url
                                                    || '/placeholder.jpg'
                                                }
                                                alt={item.product?.name_fr}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>{item.product?.name_fr}</h4>
                                            <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                                                Qté: {item.quantity} {item.size && `• ${item.size}`} {item.color && `• ${item.color}`}
                                            </p>
                                            <p style={{ fontSize: '14px', fontWeight: '800', marginTop: '4px' }}>{((item.product?.price || 0) * item.quantity).toLocaleString()} DA</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ height: '1px', backgroundColor: '#f0ede8', margin: '24px 0' }} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#6b7280' }}>Sous-total</span>
                                    <span style={{ fontWeight: '700' }}>{totalPrice.toLocaleString()} DA</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span style={{ color: '#6b7280' }}>Livraison</span>
                                    <span style={{ color: '#16a34a', fontWeight: '800', fontSize: '11px', textTransform: 'uppercase' }}>Gratuite (Offre)</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0ede8' }}>
                                    <span style={{ fontSize: '18px', fontWeight: '800' }}>Total</span>
                                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#C3AB7E' }}>{totalPrice.toLocaleString()} DA</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
