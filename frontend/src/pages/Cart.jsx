import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function Cart() {
    const { items, updateQuantity, removeItem, totalPrice } = useCartStore();

    return (
        <main className="container mx-auto px-4 md:px-10 pb-32" style={{ paddingTop: 'calc(var(--navbar-height) + 40px)' }}>
            <header className="mb-12">
                <h1 style={{ fontSize: '48px', fontFamily: 'serif' }}>Votre Panier</h1>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
                    {items.length} articles dans votre sélection.
                </p>
            </header>

            {items.length === 0 ? (
                <div style={{ padding: '100px 0', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', backgroundColor: '#f9f9f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <ShoppingBag size={32} style={{ color: '#f0ede8' }} />
                    </div>
                    <h2 style={{ fontSize: '24px', fontFamily: 'serif', marginBottom: '32px' }}>Votre panier est vide</h2>
                    <Link to="/caftans" style={{
                        display: 'inline-block', backgroundColor: '#111111', color: 'white',
                        padding: '20px 48px', borderRadius: '100px', textDecoration: 'none',
                        fontWeight: '800', fontSize: '11px', letterSpacing: '0.2em'
                    }}>EXPLORER LES COLLECTIONS</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-8">
                        <div className="space-y-8">
                            {items.map((item) => (
                                <div key={item.key} style={{ paddingBottom: '32px', borderBottom: '1px solid #f0ede8' }}>
                                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
                                        {/* Image — smaller on mobile */}
                                        <div style={{ borderRadius: '24px', overflow: 'hidden', backgroundColor: '#f9f9f9', flexShrink: 0, width: '100px', height: '120px' }} className="sm:w-40 sm:h-48">
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
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{item.product?.name_fr}</h3>
                                                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                                                        {item.size && `Taille: ${item.size}`} {item.color && ` • Couleur: ${item.color}`}
                                                    </p>
                                                </div>
                                                <span style={{ fontSize: '18px', fontWeight: '800' }}>{((item.product?.price || 0) * item.quantity).toLocaleString()} DA</span>
                                            </div>

                                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px' }}>
                                                <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#f9f9f9', padding: '6px', borderRadius: '12px', gap: '16px' }}>
                                                    <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center hover:scale-110 transition-all"><Minus size={14} /></button>
                                                    <span style={{ fontWeight: '800', width: '20px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-white flex items-center justify-center hover:scale-110 transition-all"><Plus size={14} /></button>
                                                </div>
                                                <button onClick={() => removeItem(item.key)} style={{ color: '#9ca3af', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} className="hover:text-red-500 transition-colors">
                                                    <Trash2 size={16} /> <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Supprimer</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <div style={{ backgroundColor: '#fafafa', padding: '40px', borderRadius: '40px', position: 'sticky', top: '140px' }}>
                            <h3 style={{ fontSize: '20px', fontFamily: 'serif', marginBottom: '32px' }}>Résumé de la commande</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Sous-total</span>
                                    <span style={{ fontWeight: '700' }}>{totalPrice.toLocaleString()} DA</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#6b7280' }}>Livraison</span>
                                    <span style={{ color: '#16a34a', fontWeight: '800', fontSize: '11px' }}>GRATUITE</span>
                                </div>
                                <div style={{ height: '1px', backgroundColor: '#f0ede8', margin: '20px 0' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '18px', fontWeight: '800' }}>Total</span>
                                    <span style={{ fontSize: '32px', fontWeight: '800', color: '#111111' }}>{totalPrice.toLocaleString()} DA</span>
                                </div>
                                <Link to="/checkout" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111111', color: 'white',
                                    height: '72px', borderRadius: '24px', textDecoration: 'none',
                                    fontWeight: '800', fontSize: '14px', letterSpacing: '0.2em', marginTop: '20px'
                                }} className="hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200 uppercase">PASSER LA COMMANDE</Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
