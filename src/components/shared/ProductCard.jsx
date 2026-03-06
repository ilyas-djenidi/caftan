import { Heart, Plus, Sparkles } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { getImageUrl } from '../../utils';

const ProductCard = ({ product, onClick }) => {
    const { addItem, openDrawer } = useCartStore();
    const { toggle, isWishlisted } = useWishlistStore();

    if (!product) return null;

    const isSoldOut = product.stock_qty <= 0 || product.is_sold_out;
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
            className="group hover:shadow-2xl hover:shadow-gray-100"
        >
            <div style={{ aspectRatio: '1/1', overflow: 'hidden', backgroundColor: '#f9f9f9', position: 'relative' }}>
                <img
                    src={imageUrl || '/placeholder.jpg'}
                    alt={product.name_fr || product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    className="group-hover:scale-110 transition-transform duration-700"
                />

                <button
                    onClick={handleToggleWishlist}
                    style={{ position: 'absolute', top: '16px', right: '16px', width: '40px', height: '40px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isWishlisted(product.id) ? '#ef4444' : '#9ca3af' }}
                >
                    <Heart size={18} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
                </button>

                {isSoldOut && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ background: '#111', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '10px', fontWeight: '800' }}>ÉPUISÉ</span>
                    </div>
                )}
            </div>

            <div style={{ padding: '20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '10px', color: '#C3AB7E', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>{product.category || 'Collection'}</span>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>{product.name_fr || product.name || 'Produit sans nom'}</h3>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="flex flex-col">
                        <span style={{ fontWeight: '800' }}>{(product.price || 0).toLocaleString()} DA</span>
                        {hasDiscount && (
                            <span style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>{product.original_price.toLocaleString()} DA</span>
                        )}
                    </div>
                    <button
                        onClick={handleAddToCart}
                        disabled={isSoldOut}
                        style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
