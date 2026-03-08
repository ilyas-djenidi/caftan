import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, ChevronLeft, ChevronRight, Star, Shield, Truck, RefreshCw, Plus, Minus, Sparkles } from 'lucide-react';
import { getProduct, getProducts } from '../api/products.api';
import { getReviews, createReview } from '../api/reviews.api';
import ProductCard from '../components/shared/ProductCard';
import LogoLoader from '../components/shared/LogoLoader';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { getImageUrl, formatPrice } from '../utils';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [activeTab, setActiveTab] = useState('description');
    const [reviews, setReviews] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newReview, setNewReview] = useState({ author_name: '', rating: 5, comment: '' });
    const [hoverRating, setHoverRating] = useState(0);
    const [hasReviewed, setHasReviewed] = useState(false);

    const { addItem, openDrawer } = useCartStore();
    const { toggle, isWishlisted } = useWishlistStore();

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const { data } = await getProduct(id);
                setProduct(data);
                if (data.attributes) {
                    const sizes = data.attributes.filter(a =>
                        (a.type && (a.type.toLowerCase() === 'size' || a.type.toLowerCase() === 'taille')) ||
                        (a.name && (a.name.toLowerCase() === 'size' || a.name.toLowerCase() === 'taille'))
                    );
                    if (sizes.length > 0) setSelectedSize(sizes[0].value);

                    const colors = data.attributes.filter(a =>
                        (a.type && (a.type.toLowerCase() === 'color' || a.type.toLowerCase() === 'couleur')) ||
                        (a.name && (a.name.toLowerCase() === 'color' || a.name.toLowerCase() === 'couleur'))
                    );
                    if (colors.length > 0) setSelectedColor(colors[0].value);
                }

                // Fetch related products (same category if possible, or just recent)
                const relatedRes = await getProducts({ limit: 4, category: data.category });
                // Filter out the current product from related
                const filteredRelated = (relatedRes.data?.products || []).filter(p => p.id !== data.id).slice(0, 4);

                // If we didn't get enough from the same category, fetch more generally
                if (filteredRelated.length < 4) {
                    const moreRes = await getProducts({ limit: 8 });
                    const moreFiltered = (moreRes.data?.products || []).filter(p => p.id !== data.id && !filteredRelated.some(r => r.id === p.id));
                    filteredRelated.push(...moreFiltered.slice(0, 4 - filteredRelated.length));
                }

                setRelatedProducts(filteredRelated);

                // Fetch reviews
                const reviewsRes = await getReviews(id);
                const fetchedReviews = reviewsRes.data || [];
                setReviews(fetchedReviews);

                // Check if user has already reviewed this product (by local storage OR by name matches)
                const reviewedProducts = JSON.parse(localStorage.getItem('reviewed_products') || '[]');
                if (reviewedProducts.includes(id)) {
                    setHasReviewed(true);
                }
            } catch (error) {
                console.error('Error loading product:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [id]);

    if (loading) {
        return <LogoLoader />;
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <h1 className="text-2xl font-serif">Produit non trouvé</h1>
                <button onClick={() => navigate(-1)} className="mt-4 text-[#C3AB7E] font-bold">Retour</button>
            </div>
        );
    }

    const images = product.images?.length > 0 ? product.images : [{ image_url: product.image_url || product.image }];

    const sizes = product.attributes?.filter(a =>
        (a.type && (a.type.toLowerCase() === 'size' || a.type.toLowerCase() === 'taille')) ||
        (a.name && (a.name.toLowerCase() === 'size' || a.name.toLowerCase() === 'taille'))
    ) || [];

    const colors = product.attributes?.filter(a =>
        (a.type && (a.type.toLowerCase() === 'color' || a.type.toLowerCase() === 'couleur')) ||
        (a.name && (a.name.toLowerCase() === 'color' || a.name.toLowerCase() === 'couleur'))
    ) || [];

    const handleAddToCart = () => {
        const sizeToAdd = selectedSize || (sizes[0]?.value) || null;
        const colorToAdd = selectedColor || (colors[0]?.value) || null;
        addItem(product, sizeToAdd, colorToAdd, quantity);
        openDrawer();
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!newReview.author_name || !newReview.comment) return;

        // Extra guard: check if name already exists in current reviews
        const nameExists = reviews.some(r => r.author_name.toLowerCase() === newReview.author_name.toLowerCase());
        if (nameExists) {
            alert('Vous avez déjà laissé un avis sur ce produit.');
            setHasReviewed(true);
            return;
        }

        setIsSubmitting(true);
        try {
            await createReview(id, newReview);
            const updated = await getReviews(id);
            setReviews(updated.data || []);
            setNewReview({ author_name: '', rating: 5, comment: '' });

            // Set hasReviewed to true and save to localStorage
            const reviewedProducts = JSON.parse(localStorage.getItem('reviewed_products') || '[]');
            if (!reviewedProducts.includes(id)) {
                reviewedProducts.push(id);
                localStorage.setItem('reviewed_products', JSON.stringify(reviewedProducts));
            }
            setHasReviewed(true);
        } catch (error) {
            console.error('Error submitting review:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return (
        <div className="bg-white" style={{ paddingBottom: '120px' }}>
            <main style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: 'calc(var(--navbar-height) + 40px)' }}
                className="max-w-[1400px] mx-auto md:px-[48px]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

                    {/* Left: Main Image */}
                    <div className="lg:col-span-6 space-y-4">
                        <div
                            style={{ backgroundColor: '#F0EBE0', borderRadius: '40px', overflow: 'hidden' }}
                            className="w-full aspect-[4/3] max-h-[420px] lg:aspect-[3/4] lg:max-h-[600px] lg:sticky lg:top-[120px]"
                        >
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentImageIndex}
                                    src={getImageUrl(images[currentImageIndex]?.image_url)}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </AnimatePresence>

                            {images.length > 1 && (
                                <div className="absolute inset-0 flex items-center justify-between px-6 z-10 pointer-events-none">
                                    <button onClick={() => setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))} className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg pointer-events-auto transition-transform hover:scale-110"><ChevronLeft /></button>
                                    <button onClick={() => setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))} className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg pointer-events-auto transition-transform hover:scale-110"><ChevronRight /></button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Info Section */}
                    {/* Right: Info Section */}
                    <div className="lg:col-span-6 flex flex-col justify-start">
                        <div className="mb-12">
                            <h1 style={{ fontSize: 'clamp(30px, 4vw, 44px)', fontFamily: "'Cormorant Garamond', serif", lineHeight: '1.1', margin: '0 0 12px', color: '#1A1714', fontWeight: '500', marginBottom: '12px' }}>
                                {product.name_fr || product.name}
                            </h1>

                            <div className="flex items-center gap-3 mb-8" style={{ marginBottom: '24px' }}>
                                <div className="flex text-[#C3AB7E]">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} size={14} fill={s <= Math.round(averageRating) ? "currentColor" : "none"} strokeWidth={1} />
                                    ))}
                                </div>
                                <span style={{ fontSize: '12px', letterSpacing: '0.05em', color: '#6B6458', fontWeight: '400' }}>
                                    {averageRating || 0} ({reviews.length} avis)
                                </span>
                            </div>

                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: '400', color: '#1A1714', margin: 0, marginTop: '32px' }}>
                                {product.price?.toLocaleString()} <span style={{ fontSize: '14px', fontFamily: "'Jost', sans-serif", color: '#B8963E', fontWeight: '500', marginLeft: '4px' }}>DA</span>
                            </p>
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex flex-wrap gap-3 mb-14">
                                {images.map((img, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setCurrentImageIndex(i)}
                                        style={{
                                            width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                                            border: currentImageIndex === i ? '1.5px solid #B8963E' : '1px solid #f0ede8',
                                            padding: '2px', transition: 'all 0.3s ease'
                                        }}
                                        className="hover:border-[#B8963E]"
                                    >
                                        <img src={getImageUrl(img.image_url)} className="w-full h-full object-cover rounded-[12px]" alt="" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-14">
                            {/* Sizes */}
                            {sizes.length > 0 && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#B8963E', marginBottom: '18px', fontWeight: '600' }}>Taille</label>
                                    <div className="flex flex-wrap gap-3">
                                        {sizes.map(s => (
                                            <button key={s.id} onClick={() => setSelectedSize(s.value)}
                                                style={{
                                                    minWidth: '64px', height: '52px', borderRadius: '16px',
                                                    border: selectedSize === s.value ? '2px solid #1A1714' : '1px solid #E8E2D6',
                                                    backgroundColor: selectedSize === s.value ? '#1A1714' : 'transparent',
                                                    color: selectedSize === s.value ? 'white' : '#1A1714',
                                                    fontWeight: '500', fontSize: '14px', transition: 'all 0.2s', cursor: 'pointer',
                                                    padding: '0 24px', fontFamily: "'Jost', sans-serif"
                                                }}
                                            >
                                                {s.value}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Colors */}
                            {colors.length > 0 && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#B8963E', marginBottom: '18px', fontWeight: '600' }}>Couleur</label>
                                    <div className="flex flex-wrap gap-4">
                                        {colors.map(c => (
                                            <button key={c.id} onClick={() => setSelectedColor(c.value)}
                                                style={{
                                                    width: '44px', height: '44px', borderRadius: '50%',
                                                    border: selectedColor === c.value ? '2px solid #B8963E' : '1px solid #E8E2D6',
                                                    padding: '4px', transition: 'all 0.3s', cursor: 'pointer', backgroundColor: 'transparent'
                                                }}
                                            >
                                                <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: c.value, boxShadow: 'inset 0 0 6px rgba(0,0,0,0.1)' }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6" style={{ marginTop: '40px' }}>
                                <div className="flex items-center justify-between w-full sm:w-auto bg-[#FAF8F4] border border-[#E8E2D6] px-5 rounded-[20px] h-[60px] min-w-[150px]">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 hover:text-[#B8963E] transition-colors"><Minus size={18} /></button>
                                    <span style={{ fontWeight: '600', fontSize: '16px', color: '#1A1714', fontFamily: "'Jost', sans-serif" }}>{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)} className="p-2 hover:text-[#B8963E] transition-colors"><Plus size={18} /></button>
                                </div>

                                <button onClick={handleAddToCart}
                                    style={{
                                        backgroundColor: '#1A1714', color: '#FAF8F4',
                                        height: '60px', borderRadius: '20px', fontWeight: '600',
                                        fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase',
                                        border: 'none', cursor: 'pointer', transition: 'all 0.4s ease'
                                    }}
                                    className="w-full sm:flex-1 hover:bg-[#B8963E] flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-black/5"
                                >
                                    <ShoppingBag size={20} /> Ajouter au panier
                                </button>

                                <button onClick={() => toggle(product)}
                                    style={{
                                        height: '60px', width: '60px', borderRadius: '20px',
                                        border: '1px solid #E8E2D6',
                                        color: isWishlisted(product.id) ? '#ef4444' : '#1A1714',
                                        cursor: 'pointer', background: '#ffffff', transition: 'all 0.3s'
                                    }}
                                    className="flex items-center justify-center hover:border-[#1A1714] shadow-sm"
                                >
                                    <Heart size={24} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Tabs Section */}
                            <div className="pt-12" style={{ marginTop: '40px', borderTop: '1px solid #f0ede8', paddingTop: '40px', paddingBottom: '40px' }}>
                                <div className="flex gap-10 border-b border-[#f0ede8] overflow-x-auto no-scrollbar">
                                    {[
                                        { key: 'description', label: 'Description' },
                                        { key: 'details', label: 'Détails & Entretien' },
                                    ].map(tab => (
                                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                            style={{
                                                fontSize: '11px', fontWeight: activeTab === tab.key ? '600' : '400',
                                                letterSpacing: '0.2em', textTransform: 'uppercase',
                                                color: activeTab === tab.key ? '#1A1714' : '#6B6458',
                                                paddingBottom: '20px', borderBottom: activeTab === tab.key ? '2px solid #B8963E' : '2px solid transparent',
                                                cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-1px',
                                                flexShrink: 0, whiteSpace: 'nowrap', backgroundColor: 'transparent'
                                            }}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-10" style={{ marginTop: '20px' }}>
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'description' && (
                                            <motion.div key="desc" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                                                <p style={{ fontSize: '15px', lineHeight: '1.8', color: '#6B6458', fontWeight: '400', fontFamily: "'Jost', sans-serif" }}>
                                                    {product.description_fr || "Magnifique sacs de notre nouvelle collection. Qualité supérieure et finition artisanale."}
                                                </p>
                                            </motion.div>
                                        )}
                                        {activeTab === 'details' && (
                                            <motion.div key="det" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                                                <ul style={{ fontSize: '15px', lineHeight: '2.2', color: '#6B6458', fontWeight: '400', fontFamily: "'Jost', sans-serif" }} className="space-y-2 list-disc pl-5 marker:text-[#C3AB7E]">
                                                    <li>Tissu de haute qualité soigneusement sélectionné</li>
                                                    <li>Finitions artisanales et broderies délicates</li>
                                                    <li>Nettoyage à sec uniquement recommandé</li>
                                                    <li>Livré dans son coffret Maison du Caftans exclusif</li>
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '32px' }}></div>
                    </div>
                </div>

                {/* Side-by-Side Reviews & Form Section */}
                <div style={{ marginTop: '80px' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start">

                        {/* Left Column: Review Form or Success Message */}
                        <div>
                            {hasReviewed ? (
                                <div style={{ border: '1px solid #E8E2D6', padding: '24px', backgroundColor: '#ffffff', textAlign: 'center', marginTop: '24px' }}>
                                    <div className="w-16 h-16 bg-[#F0FDF4] text-[#16A34A] rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Sparkles size={32} />
                                    </div>
                                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontStyle: 'italic', color: '#1A1714', marginBottom: '16px' }}>
                                        Merci pour votre avis !
                                    </h3>
                                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '14px', color: '#6B6458', fontWeight: '300' }}>
                                        Votre témoignage a été enregistré avec succès.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8963E', marginBottom: '12px', textAlign: 'center' }}>
                                        PARTAGER VOTRE EXPÉRIENCE
                                    </p>
                                    <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontStyle: 'italic', fontWeight: '400', marginBottom: '60px', color: '#1A1714', textAlign: 'center' }}>
                                        Laisser un avis
                                    </h3>
                                    <form onSubmit={handleReviewSubmit} className="space-y-8">
                                        <div className="flex flex-col items-center">
                                            <label style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Votre nom</label>
                                            <input
                                                required
                                                type="text"
                                                value={newReview.author_name}
                                                onChange={e => setNewReview({ ...newReview, author_name: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '400px',
                                                    padding: '14px 16px',
                                                    border: '1px solid #E8E2D6',
                                                    borderRadius: 0,
                                                    backgroundColor: '#FAF8F4',
                                                    fontFamily: "'Jost', sans-serif",
                                                    fontSize: '13px',
                                                    fontWeight: '300',
                                                    color: '#1A1714',
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s',
                                                    textAlign: 'center'
                                                }}
                                                onFocus={e => e.target.style.borderColor = '#B8963E'}
                                                onBlur={e => e.target.style.borderColor = '#E8E2D6'}
                                            />
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <label style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Note</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <button key={s} type="button" onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setNewReview({ ...newReview, rating: s })} className="text-[#B8963E] transition-transform hover:scale-125">
                                                        <Star size={24} fill={(hoverRating || newReview.rating) >= s ? "currentColor" : "none"} strokeWidth={1} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <label style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Votre avis</label>
                                            <textarea
                                                required
                                                rows="4"
                                                value={newReview.comment}
                                                onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    maxWidth: '500px',
                                                    padding: '14px 16px',
                                                    border: '1px solid #E8E2D6',
                                                    borderRadius: 0,
                                                    backgroundColor: '#FAF8F4',
                                                    fontFamily: "'Jost', sans-serif",
                                                    fontSize: '13px',
                                                    fontWeight: '300',
                                                    color: '#1A1714',
                                                    outline: 'none',
                                                    transition: 'border-color 0.2s',
                                                    resize: 'none',
                                                    textAlign: 'center'
                                                }}
                                                onFocus={e => e.target.style.borderColor = '#B8963E'}
                                                onBlur={e => e.target.style.borderColor = '#E8E2D6'}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <button type="submit" disabled={isSubmitting} style={{ width: '100%', maxWidth: '300px', height: '56px', backgroundColor: '#1A1714', color: '#FAF8F4', fontWeight: '500', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', position: 'relative', overflow: 'hidden' }} className="group">
                                                <span className="relative z-10">{isSubmitting ? 'Envoi...' : 'Envoyer mon avis'}</span>
                                                <div className="absolute inset-0 bg-[#B8963E] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Existing Reviews */}
                        <div className="space-y-0" style={{ marginTop: '20px' }}>
                            <div>
                                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#B8963E' }}>
                                    TÉMOIGNAGES
                                </p>
                                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '36px', fontStyle: 'italic', fontWeight: '400', color: '#1A1714', marginTop: '16px' }}>
                                    Avis Clients ({reviews.length})
                                </h3 >
                            </div>

                            <div className="custom-scrollbar" style={{ marginTop: '32px', maxHeight: '600px', overflowY: 'auto', paddingRight: '16px' }}>
                                <div className="space-y-8">
                                    {reviews.length > 0 ? (
                                        reviews.map((review) => (
                                            <div
                                                key={review.id}
                                                style={{
                                                    backgroundColor: '#FAF8F4', border: '1px solid #E8E2D6',
                                                    padding: '20px', marginBottom: '12px'
                                                }}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 style={{ fontFamily: "'Jost', sans-serif", fontWeight: '500', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            {review.author_name}
                                                        </h4>
                                                        <div className="flex text-[#B8963E] mt-1">
                                                            {[1, 2, 3, 4, 5].map(s => (
                                                                <Star key={s} size={10} fill={s <= review.rating ? "currentColor" : "none"} strokeWidth={1} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: '200', fontSize: '10px', color: '#6B6458' }}>
                                                        {new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <p style={{
                                                    fontFamily: "'Jost', sans-serif", fontWeight: '300', fontSize: '13px',
                                                    color: '#6B6458', lineHeight: '1.6'
                                                }}>
                                                    {review.comment}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10">
                                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '20px', color: '#9ca3af' }}>
                                                Aucun avis pour le moment.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div style={{ marginTop: '80px', paddingTop: '60px', borderTop: '1px solid #f0ede8' }}>
                        <div className="flex flex-col items-center">
                            <h2 style={{ fontSize: 'clamp(32px, 4vw, 40px)', fontFamily: "'Cormorant Garamond', serif", margin: 0 }}>
                                Vous aimerez aussi
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8" style={{ marginTop: '40px' }}>
                            {relatedProducts.map(rp => (
                                <ProductCard key={rp.id} product={rp} onClick={() => {
                                    navigate(`/product/${rp.id}`);
                                    window.scrollTo(0, 0);
                                }} />
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
