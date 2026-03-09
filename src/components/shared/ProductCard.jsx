import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '../../store/wishlistStore';
import { getImageUrl } from '../../utils';

const ProductCard = ({ product, onClick }) => {
    const navigate = useNavigate();
    const { toggle, isWishlisted } = useWishlistStore();

    if (!product) return null;

    const isSoldOut = product.stock_count === 0 || product.is_sold_out;

    const imageUrl = getImageUrl(
        product.cover_image_url ||
        product.image_url ||
        product.image ||
        (product.images && product.images[0]?.image_url)
    );


    const handleCardClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(`/product/${product.id}`);
        }
    };

    return (
        <div
            className="product-card"
            onClick={handleCardClick}
            style={{
                cursor: 'pointer',
                backgroundColor: 'transparent',
                border: 'none',
                position: 'relative',
            }}
        >
            {/* Image Container */}
            <div style={{
                width: '100%',
                aspectRatio: '3/4',
                overflow: 'hidden',
                backgroundColor: '#F0EBE0',
                position: 'relative',
            }}>
                <img
                    src={imageUrl || '/placeholder.jpg'}
                    alt={product.name_fr || product.name}
                    loading="lazy"
                    decoding="async"
                    width={800}
                    height={1067}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        transition: 'transform 0.6s ease',
                        filter: isSoldOut ? 'grayscale(60%) opacity(0.8)' : 'none',
                    }}
                    onMouseEnter={e => { if (!isSoldOut) e.currentTarget.style.transform = 'scale(1.04)'; }}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />

                {/* Wishlist button — top right */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggle(product); }}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(4px)',
                        zIndex: 2,
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Heart
                        size={14}
                        fill={isWishlisted(product.id) ? '#1A1714' : 'none'}
                        stroke="#1A1714"
                        strokeWidth={1.5}
                    />
                </button>

                {/* Sold out badge */}
                {isSoldOut && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(26,23,20,0.85)',
                        color: 'white',
                        padding: '4px 10px',
                        fontSize: '9px',
                        fontFamily: "'Jost', sans-serif",
                        fontWeight: '600',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        zIndex: 2,
                    }}>
                        Sold Out
                    </div>
                )}

            </div>

            {/* Card Info */}
            <div style={{
                paddingTop: '14px',
                paddingBottom: '8px',
                textAlign: 'center',
            }}>
                {/* Product name */}
                <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '20px',
                    fontWeight: '500',
                    lineHeight: '1.2',
                    color: '#1A1714',
                    margin: '0 0 6px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}>
                    {product.name_fr || product.name}
                </p>

                {/* Price */}
                <p style={{
                    fontFamily: "'Jost', sans-serif",
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#6B6458',
                    margin: '0',
                }}>
                    {product.price?.toLocaleString('fr-FR')}
                    <span style={{
                        fontSize: '11px',
                        fontWeight: '500',
                        marginLeft: '4px',
                        letterSpacing: '0.05em',
                    }}>
                        DA
                    </span>
                </p>
            </div>
        </div>
    );
};

export default ProductCard;
