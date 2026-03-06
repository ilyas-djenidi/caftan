import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { getImageUrl } from '../../utils';

export default function CartDrawer() {
    const { items, isDrawerOpen, closeDrawer, updateQuantity, removeItem } = useCartStore();
    const navigate = useNavigate();

    // Fixed: use product.price instead of item.price
    const total = items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);

    const handleCheckout = () => {
        closeDrawer();
        navigate('/panier');
    };

    return (
        <AnimatePresence>
            {isDrawerOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeDrawer}
                        style={{
                            position: 'fixed', inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 100
                        }}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed', top: 0, right: 0, bottom: 0,
                            width: '100%', maxWidth: '440px',
                            backgroundColor: 'white',
                            boxShadow: '-10px 0 50px rgba(0,0,0,0.1)',
                            zIndex: 101, display: 'flex', flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '30px', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', borderBottom: '1px solid #F0EDE8'
                        }}>
                            <div>
                                <h2 style={{ margin: 0, fontFamily: 'serif', fontSize: '24px', fontWeight: '700' }}>PANIER</h2>
                                <p style={{ margin: '4px 0 0', fontSize: '10px', fontWeight: '800', color: '#9ca3af', letterSpacing: '0.1em' }}>
                                    {items.length} {items.length > 1 ? 'ARTICLES' : 'ARTICLE'}
                                </p>
                            </div>
                            <button onClick={closeDrawer} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '10px', color: '#111111'
                            }}>✕</button>
                        </div>

                        {/* Items */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }} className="scrollbar-hide">
                            {items.length === 0 ? (
                                <div style={{
                                    height: '100%', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: '20px'
                                }}>
                                    <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>Votre panier est vide</p>
                                    <button
                                        onClick={closeDrawer}
                                        style={{
                                            padding: '14px 28px', backgroundColor: '#111111',
                                            color: 'white', border: 'none', borderRadius: '12px',
                                            fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em',
                                            cursor: 'pointer'
                                        }}>DÉCOUVRIR</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {items.map((item) => {
                                        const p = item.product || {};

                                        // Fixed: resolve image correctly from Supabase images array
                                        const primaryImage = p.images?.find(img => img.is_primary)?.image_url
                                            || p.images?.[0]?.image_url
                                            || p.cover_image_url
                                            || p.image_url;
                                        const img = primaryImage;

                                        return (
                                            <div key={item.key} style={{
                                                display: 'flex', gap: '20px',
                                                paddingBottom: '20px',
                                                borderBottom: '1px solid rgba(195,171,126,0.12)'
                                            }}>

                                                {/* Product image */}
                                                <div style={{
                                                    width: '90px', height: '110px', flexShrink: 0,
                                                    borderRadius: '12px', overflow: 'hidden',
                                                    backgroundColor: '#ffffff',
                                                    border: '1px solid rgba(195,171,126,0.2)'
                                                }}>
                                                    <img
                                                        src={img ? getImageUrl(img) : '/placeholder.jpg'}
                                                        alt={p.name_fr || p.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>

                                                {/* Item details */}
                                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>

                                                    {/* Name + remove */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#111111', lineHeight: '1.3' }}>
                                                            {/* Fixed: show name_fr first */}
                                                            {p.name_fr || p.name}
                                                        </p>
                                                        <button onClick={() => removeItem(item.key)} style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            color: '#9ca3af', fontSize: '14px', flexShrink: 0,
                                                            padding: '2px', lineHeight: 1
                                                        }}>✕</button>
                                                    </div>

                                                    {/* Price — fixed: use product.price */}
                                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#111111' }}>
                                                        {((p.price || 0) * item.quantity).toLocaleString()} DA
                                                    </p>

                                                    {/* Attrs */}
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        {item.size && (
                                                            <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#ffffff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #F0EDE8' }}>
                                                                {item.size}
                                                            </span>
                                                        )}
                                                        {item.color && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '800', backgroundColor: '#ffffff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #F0EDE8' }}>
                                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                                                                {item.colorName || item.color}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Qty controls */}
                                                    <div style={{
                                                        marginTop: 'auto', display: 'flex', alignItems: 'center',
                                                        gap: '12px', backgroundColor: '#ffffff',
                                                        width: 'fit-content', padding: '4px 10px', borderRadius: '8px',
                                                        border: '1px solid #F0EDE8'
                                                    }}>
                                                        <button
                                                            onClick={() => updateQuantity(item.key, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: item.quantity <= 1 ? '#e5e7eb' : '#111111' }}>−</button>
                                                        <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.key, item.quantity + 1)}
                                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#111111' }}>+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div style={{ padding: '30px', borderTop: '1px solid #F0EDE8', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af', letterSpacing: '0.1em' }}>TOTAL</span>
                                    <span style={{ fontSize: '24px', fontFamily: 'serif', fontWeight: '700', color: '#111111' }}>{total.toLocaleString()} DA</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af', fontWeight: '600' }}>
                                    TAXES ET LIVRAISON CALCULÉES À LA COMMANDE
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <button
                                        onClick={handleCheckout}
                                        style={{
                                            padding: '18px', backgroundColor: '#111111', color: 'white',
                                            border: 'none', borderRadius: '14px', fontSize: '12px',
                                            fontWeight: '800', letterSpacing: '0.15em', cursor: 'pointer',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                        }}>COMMANDER</button>
                                    <button
                                        onClick={handleCheckout}
                                        style={{
                                            padding: '14px', backgroundColor: 'transparent', color: '#111111',
                                            border: 'none', fontSize: '11px', fontWeight: '800',
                                            letterSpacing: '0.1em', cursor: 'pointer'
                                        }}>VOIR LE PANIER</button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
