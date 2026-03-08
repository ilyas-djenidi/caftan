import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { ShoppingBag, X, Trash2, ArrowRight } from 'lucide-react';
import { getImageUrl } from '../../utils';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function CartDrawer() {
    const { t } = useTranslation();
    const { items, isDrawerOpen, closeDrawer, updateQuantity, removeItem } = useCartStore();
    const navigate = useNavigate();

    // Fixed: use product.price instead of item.price
    const total = items.reduce((sum, item) => sum + ((item.product?.price || 0) * item.quantity), 0);

    const handleCheckout = () => {
        closeDrawer();
        navigate('/checkout');
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
                            padding: '24px 20px', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', borderBottom: '1px solid #F0EDE8'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShoppingBag size={20} strokeWidth={1.5} />
                                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', letterSpacing: '-0.01em' }}>{t('cart.title')}</h2>
                                <span style={{
                                    backgroundColor: '#111111', color: 'white',
                                    fontSize: '10px', fontWeight: 'bold',
                                    padding: '2px 8px', borderRadius: '12px'
                                }}>
                                    {items.length}
                                </span>
                            </div>
                            <button onClick={closeDrawer} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '4px', color: '#111111'
                            }}>
                                <X size={24} strokeWidth={1} />
                            </button>
                        </div>

                        {/* Items */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="scrollbar-hide">
                            {items.length === 0 ? (
                                <div style={{
                                    height: '100%', display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: '20px'
                                }}>
                                    <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>{t('cart.empty')}</p>
                                    <button
                                        onClick={closeDrawer}
                                        style={{
                                            padding: '14px 28px', backgroundColor: '#111111',
                                            color: 'white', border: 'none', borderRadius: '12px',
                                            fontSize: '11px', fontWeight: '800', letterSpacing: '0.1em',
                                            cursor: 'pointer'
                                        }}>{t('cart.explore')}</button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {items.map((item) => {
                                        const p = item.product || {};
                                        const primaryImage = p.images?.find(img => img.is_primary)?.image_url
                                            || p.images?.[0]?.image_url
                                            || p.cover_image_url
                                            || p.image_url;

                                        const sizeText = item.size || 'NO SIZE';
                                        const colorText = item.colorName || item.color || 'NO COLOR';

                                        return (
                                            <div key={item.key} style={{
                                                display: 'flex', gap: '16px',
                                                position: 'relative'
                                            }}>
                                                {/* Product image */}
                                                <div style={{
                                                    width: '80px', height: '80px', flexShrink: 0,
                                                    borderRadius: '8px', overflow: 'hidden',
                                                    backgroundColor: '#f9f9f9'
                                                }}>
                                                    <img
                                                        src={primaryImage ? getImageUrl(primaryImage) : '/placeholder.jpg'}
                                                        alt={p.name_fr || p.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>

                                                {/* Item details */}
                                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '24px' }}>
                                                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#111111', lineHeight: '1.2' }}>
                                                                {p.name_fr || p.name}
                                                            </h3>
                                                        </div>
                                                        <p style={{
                                                            margin: '4px 0 0',
                                                            fontSize: '11px',
                                                            color: '#9ca3af',
                                                            fontWeight: '600',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.05em'
                                                        }}>
                                                            {sizeText} • {colorText}
                                                        </p>
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                                                        {/* Qty controls */}
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center',
                                                            gap: '12px', backgroundColor: '#f9f9f9',
                                                            padding: '4px 12px', borderRadius: '8px'
                                                        }}>
                                                            <button
                                                                onClick={() => updateQuantity(item.key, item.quantity - 1)}
                                                                disabled={item.quantity <= 1}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: item.quantity <= 1 ? '#e5e7eb' : '#111111' }}>−</button>
                                                            <span style={{ fontSize: '13px', fontWeight: '700', minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const success = updateQuantity(item.key, item.quantity + 1);
                                                                    if (p.stock_count !== undefined && item.quantity >= p.stock_count) {
                                                                        toast.error("Limite de stock atteinte.");
                                                                    }
                                                                }}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#111111' }}>+</button>
                                                        </div>
                                                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#111111' }}>
                                                            {((p.price || 0) * item.quantity).toLocaleString('fr-FR')} DA
                                                        </span>
                                                    </div>

                                                    {/* Trash icon at top right of the item */}
                                                    <button
                                                        onClick={() => removeItem(item.key)}
                                                        style={{
                                                            position: 'absolute', top: 0, right: 0,
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            color: '#9ca3af', padding: '4px'
                                                        }}
                                                    >
                                                        <Trash2 size={16} strokeWidth={1.5} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div style={{
                                padding: '24px 20px',
                                borderTop: '1px solid #F0EDE8',
                                backgroundColor: 'white'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', color: '#6b7280' }}>{t('cart.subtotal')}</span>
                                        <span style={{ fontSize: '15px', fontWeight: '600' }}>{total.toLocaleString('fr-FR')} DA</span>
                                    </div>
                                    <div style={{ height: '1px', backgroundColor: '#F0EDE8' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#111111' }}>{t('cart.total')}</span>
                                        <span style={{ fontSize: '18px', fontWeight: '800', color: '#C3AB7E' }}>{total.toLocaleString('fr-FR')} DA</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    style={{
                                        width: '100%',
                                        height: '52px',
                                        backgroundColor: '#111111',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        fontWeight: '800',
                                        letterSpacing: '0.1em',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {t('cart.checkout')} <ArrowRight size={18} />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
