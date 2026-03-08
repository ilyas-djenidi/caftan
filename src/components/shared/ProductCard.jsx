import { Heart, Plus, Sparkles, ShoppingBag as Bag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { getImageUrl } from '../../utils';

const ProductCard = ({ product, onClick }) => {
    const { addItem, openDrawer } = useCartStore();
    const { toggle, isWishlisted } = useWishlistStore();

    if (!product) return null;

    const isSoldOut = product.stock_count === 0 || product.is_sold_out;
    const hasDiscount = product.is_on_sale && product.original_price;
    const discountPercent = hasDiscount ? Math.round(((product.original_price - (product.price || 0)) / (product.original_price || 1)) * 100) : 0;

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addItem(product);
        openDrawer();
    };

    const handleToggleWishlist = (e) => {
        e.stopPropagation();
        toggle(product);
    };

    const imageUrl = getImageUrl(product.cover_image_url || product.image_url || product.image || (product.images && product.images[0]?.image_url));

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                overflow: 'hidden',
                transition: 'all 0.3s',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid #F0EDE8',
                position: 'relative'
            }}
            className="group"
        >
            <div style={{ aspectRatio: '3/4', overflow: 'hidden', backgroundColor: '#f9f9f9', position: 'relative' }}>
                <img
                    src={imageUrl || '/placeholder.jpg'}
                    alt={product.name_fr || product.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: isSoldOut ? 'grayscale(100%) opacity(0.7)' : 'none'
                    }}
                    className="group-hover:scale-[1.04] transition-transform duration-700"
                />

                {/* ── Heart button – circular ── */}
                <button
                    onClick={handleToggleWishlist}
                    style={{
                        position: 'absolute', top: '14px', right: '14px',
                        width: '38px', height: '38px', borderRadius: '50%',
                        background: 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(6px)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isWishlisted(product.id) ? '#ef4444' : '#9ca3af',
                        border: 'none', cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.10)'; }}
                >
                    <Heart size={16} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
                </button>

                {isSoldOut && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <div style={{
                            background: 'rgba(26, 23, 20, 0.85)',
                            color: 'white',
                            padding: '16px 32px',
                            borderRadius: '2px',
                            fontSize: '14px',
                            fontWeight: '600',
                            letterSpacing: '0.3em',
                            textTransform: 'uppercase',
                            fontFamily: "'Jost', sans-serif",
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            textAlign: 'center'
                        }}>
                            SOLD OUT
                        </div>
                    </div>
                )}
            </div>

            <div style={{ padding: '18px 20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#C3AB7E', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.08em' }}>{product.category || 'Collection'}</span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', lineHeight: 1.3 }}>{product.name_fr || product.name || 'Produit sans nom'}</h3>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                    {/* ── Price block ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{
                                fontSize: '26px', fontWeight: '800', color: '#1a1a1a',
                                fontFamily: "'Cormorant Garamond', serif", letterSpacing: '-0.02em'
                            }}>
                                {(product.price || 0).toLocaleString('fr-FR')}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#C3AB7E', letterSpacing: '0.05em' }}>DA</span>
                        </div>
                        {hasDiscount && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '11px', color: '#b0b0b0', textDecoration: 'line-through' }}>{product.original_price.toLocaleString('fr-FR')} DA</span>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#fff', background: '#C3AB7E', borderRadius: '4px', padding: '1px 5px' }}>-{discountPercent}%</span>
                            </div>
                        )}
                    </div>

                    {/* ── Bag button – circular ── */}
                    <button
                        onClick={handleAddToCart}
                        disabled={isSoldOut}
                        style={{
                            width: '42px', height: '42px', borderRadius: '50%',
                            background: isSoldOut ? '#f3f3f3' : '#111',
                            border: 'none',
                            color: isSoldOut ? '#ccc' : 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isSoldOut ? 'none' : '0 4px 14px rgba(0,0,0,0.18)',
                            transition: 'all 0.22s ease',
                            cursor: isSoldOut ? 'not-allowed' : 'pointer'
                        }}
                        onMouseEnter={(e) => {
                            if (!isSoldOut) {
                                e.currentTarget.style.background = '#C3AB7E';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(195,171,126,0.40)';
                                e.currentTarget.style.transform = 'scale(1.08)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSoldOut) {
                                e.currentTarget.style.background = '#111';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }
                        }}
                    >
                        {isSoldOut ? <Plus size={17} style={{ transform: 'rotate(45deg)' }} /> : <Bag size={17} strokeWidth={1.5} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
