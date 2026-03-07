import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, ChevronLeft, ChevronRight, Star, Shield, Truck, RefreshCw, Plus, Minus, Sparkles } from 'lucide-react';
import { getProduct, getProducts } from '../api/products.api';
import { getReviews, createReview } from '../api/reviews.api';
import ProductCard from '../components/shared/ProductCard';
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

    const { addItem, openDrawer } = useCartStore();
    const { toggle, isWishlisted } = useWishlistStore();

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const { data } = await getProduct(id);
                setProduct(data);
                if (data.attributes) {
                    const sizes = data.attributes.filter(a => a.name === 'size' || a.name === 'taille');
                    if (sizes.length > 0) setSelectedSize(sizes[0].value);
                    const colors = data.attributes.filter(a => a.name === 'color' || a.name === 'couleur');
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
                setReviews(reviewsRes.data || []);
            } catch (error) {
                console.error('Error loading product:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProduct();
    }, [id]);

    if (loading) {
        return <div className="min-h-screen bg-white flex items-center justify-center pt-40"><div className="animate-pulse text-[#C3AB7E]">Chargement...</div></div>;
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

    const sizes = product.attributes?.filter(a => a.name === 'size' || a.name === 'taille') || [];
    const colors = product.attributes?.filter(a => a.name === 'color' || a.name === 'couleur') || [];

    const handleAddToCart = () => {
        const sizeToAdd = selectedSize || (sizes[0]?.value) || null;
        const colorToAdd = selectedColor || (colors[0]?.value) || null;
        addItem(product, sizeToAdd, colorToAdd, quantity);
        openDrawer();
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!newReview.author_name || !newReview.comment) return;

        setIsSubmitting(true);
        try {
            await createReview(id, newReview);
            const updated = await getReviews(id);
            setReviews(updated.data || []);
            setNewReview({ author_name: '', rating: 5, comment: '' });
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
        <div className="min-h-screen bg-white">
            <main className="container mx-auto px-4 md:px-10" style={{ paddingTop: 'calc(var(--navbar-height) + 40px)', paddingBottom: '40px' }}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

                    {/* Left: Main Image */}
                    <div className="lg:col-span-6 space-y-4">
                        <div style={{ aspectRatio: '4/5', borderRadius: '40px', overflow: 'hidden', backgroundColor: '#f9f9f9', position: 'sticky', top: '120px' }}>
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
                    <div className="lg:col-span-6 flex flex-col justify-start">
                        <div className="mb-8">
                            <div className="space-y-1 mb-6">
                                <div className="flex items-center gap-1 text-[#C3AB7E]">
                                    <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '4px', color: '#6B6458' }}>Note</span>
                                </div>
                                <button
                                    onClick={() => setActiveTab('avis')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block' }}
                                >
                                    <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C3AB7E' }}>Votre avis</span>
                                </button>
                            </div>

                            <span style={{ color: '#C3AB7E', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '8px' }}>
                                {product.category}
                            </span>

                            <div className="flex items-center gap-1 text-[#C3AB7E] mb-6">
                                <Star size={14} fill="currentColor" />
                                <span className="text-xs font-bold">{averageRating || 0} ({reviews.length} avis)</span>
                            </div>

                            <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontFamily: "'Cormorant Garamond', serif", lineHeight: '1.2', margin: '0 0 12px', color: '#1A1714' }}>
                                {product.name_fr || product.name}
                            </h1>
                            <p className="font-serif italic" style={{ fontSize: '32px', fontWeight: '600', color: '#1A1714', margin: 0 }}>
                                {product.price?.toLocaleString()} <span className="text-sm font-sans text-gray-400 font-normal uppercase tracking-widest ml-2">DA</span>
                            </p>
                        </div>

                        {/* Moved Thumbnails Here */}
                        {images.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-8">
                                {images.map((img, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setCurrentImageIndex(i)}
                                        style={{
                                            width: '60px', height: '60px', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                                            border: currentImageIndex === i ? '2px solid #C3AB7E' : '2px solid transparent',
                                            padding: currentImageIndex === i ? '2px' : '0', transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ width: '100%', height: '100%', borderRadius: currentImageIndex === i ? '8px' : '12px', overflow: 'hidden' }}>
                                            <img src={getImageUrl(img.image_url)} className="w-full h-full object-cover" alt="" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Spacing instead of line */}
                        <div className="h-4" />

                        {/* Sizes */}
                        {sizes.length > 0 && (
                            <div className="mb-10">
                                <label className="block text-[11px] font-800 uppercase tracking-widest text-[#111111] mb-3">Taille</label>
                                <div className="flex flex-wrap gap-2">
                                    {sizes.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setSelectedSize(s.value)}
                                            style={{
                                                minWidth: '50px', height: '44px', borderRadius: '12px',
                                                border: selectedSize === s.value ? '2px solid #111111' : '1px solid #f0ede8',
                                                backgroundColor: selectedSize === s.value ? '#111111' : 'transparent',
                                                color: selectedSize === s.value ? 'white' : '#111111',
                                                fontWeight: '800', fontSize: '13px', transition: 'all 0.2s', cursor: 'pointer',
                                                padding: '0 16px'
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
                            <div className="mb-12">
                                <label className="block text-[11px] font-800 uppercase tracking-widest text-[#111111] mb-3">Couleur</label>
                                <div className="flex flex-wrap gap-3">
                                    {colors.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedColor(c.value)}
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                border: selectedColor === c.value ? '2px solid #C3AB7E' : '1px solid #e5e7eb',
                                                padding: '3px', transition: 'all 0.2s', cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: c.value, border: '1px solid rgba(0,0,0,0.05)' }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity & Actions inline */}
                        <div className="flex flex-col sm:flex-row gap-6 mt-12">
                            {/* Quantity Selector */}
                            <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#f9f9f9', padding: '8px', borderRadius: '16px', gap: '16px', height: '56px' }}>
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:scale-110 transition-all"><Minus size={14} /></button>
                                <span style={{ fontWeight: '800', width: '20px', textAlign: 'center', fontSize: '14px' }}>{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:scale-110 transition-all"><Plus size={14} /></button>
                            </div>

                            {/* Add to Cart */}
                            <button
                                onClick={handleAddToCart}
                                style={{
                                    flex: 1, backgroundColor: '#111111', color: 'white',
                                    height: '56px', borderRadius: '16px', fontWeight: '800',
                                    fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase',
                                    border: 'none', cursor: 'pointer'
                                }}
                                className="hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-3"
                            >
                                <ShoppingBag size={18} /> Ajouter au panier
                            </button>

                            {/* Wishlist */}
                            <button
                                onClick={() => toggle(product)}
                                style={{
                                    width: '56px', height: '56px', borderRadius: '16px',
                                    border: '1px solid #f0ede8', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    color: isWishlisted(product.id) ? '#ef4444' : '#111111',
                                    cursor: 'pointer', background: 'white'
                                }}
                                className="hover:bg-gray-50 transition-all flex items-center justify-center"
                            >
                                <Heart size={20} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} />
                            </button>
                        </div>

                        <div style={{ height: '1px', backgroundColor: '#f0ede8', margin: '60px 0 40px' }} />

                        {/* TABS: Description & Details */}
                        <div className="mb-20">
                            <div className="flex gap-8 border-b border-[#f0ede8] mb-6">
                                <button
                                    onClick={() => setActiveTab('description')}
                                    style={{
                                        paddingBottom: '12px',
                                        borderBottom: activeTab === 'description' ? '2px solid #111' : '2px solid transparent',
                                        color: activeTab === 'description' ? '#111' : '#9ca3af',
                                        fontWeight: '800', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    Description
                                </button>
                                <button
                                    onClick={() => setActiveTab('details')}
                                    style={{
                                        paddingBottom: '12px',
                                        borderBottom: activeTab === 'details' ? '2px solid #111' : '2px solid transparent',
                                        color: activeTab === 'details' ? '#111' : '#9ca3af',
                                        fontWeight: '800', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    Détails & Entretien
                                </button>
                                <button
                                    onClick={() => setActiveTab('avis')}
                                    style={{
                                        paddingBottom: '12px',
                                        borderBottom: activeTab === 'avis' ? '2px solid #111' : '2px solid transparent',
                                        color: activeTab === 'avis' ? '#111' : '#9ca3af',
                                        fontWeight: '800', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    Avis ({reviews.length})
                                </button>
                            </div>

                            {/* Global Tab Info */}
                            <div className="flex flex-col gap-2 mb-8 px-1">
                                <div className="flex items-center gap-1 text-[#C3AB7E]">
                                    <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '4px', color: '#6B6458' }}>Note</span>
                                    <Star size={12} fill="currentColor" />
                                    <span className="text-xs font-bold">{averageRating || 0} ({reviews.length} avis)</span>
                                </div>
                                <button
                                    onClick={() => setActiveTab('avis')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                                >
                                    <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C3AB7E' }}>Votre avis</span>
                                </button>
                            </div>

                            <div className="pt-4">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'description' && (
                                        <motion.div key="desc" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                                            <p className="text-[14px] font-400 leading-relaxed text-[#4b5563] mb-10">
                                                {product.description_fr || "Magnifique sacs de notre nouvelle collection. Qualité supérieure et finition artisanale."}
                                            </p>
                                        </motion.div>
                                    )}
                                    {activeTab === 'details' && (
                                        <motion.div key="det" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                                            <ul className="text-[14px] font-400 leading-relaxed text-[#4b5563] space-y-2 list-disc pl-4 marker:text-[#C3AB7E]">
                                                <li>Tissu de haute qualité soigneusement sélectionné</li>
                                                <li>Finitions artisanales et broderies délicates</li>
                                                <li>Nettoyage à sec uniquement recommandé</li>
                                                <li>Livré dans son coffret Maison du Caftans exclusif</li>
                                            </ul>
                                        </motion.div>
                                    )}
                                    {activeTab === 'avis' && (
                                        <motion.div key="avis" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                                            <div className="space-y-6">
                                                {reviews.length > 0 ? (
                                                    reviews.map((review) => (
                                                        <div
                                                            key={review.id}
                                                            style={{
                                                                backgroundColor: '#FAF8F4', border: '1px solid #E8E2D6',
                                                                padding: '20px'
                                                            }}
                                                        >
                                                            <div className="flex justify-between items-start mb-3">
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
                                                    <div className="text-center py-10">
                                                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '20px', color: '#9ca3af' }}>
                                                            Soyez le premier à laisser un avis
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Standalone Review Form Section */}
                <div className="mt-40 py-32 border-t border-[#f0ede8]">
                    <div className="max-w-xl mx-auto px-4 text-center">
                        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontStyle: 'italic', marginBottom: '40px' }}>
                            Laisser un avis
                        </h3>
                        <form onSubmit={handleReviewSubmit} className="space-y-8">
                            <div className="flex flex-col items-center">
                                <label style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'block' }}>Votre nom</label>
                                <input required type="text" value={newReview.author_name} onChange={e => setNewReview({ ...newReview, author_name: e.target.value })} className="w-full max-w-sm px-4 py-3 border border-[#E8E2D6] focus:border-[#B8963E] outline-none transition-colors font-['Jost'] text-sm text-center" style={{ borderRadius: 0, backgroundColor: '#FAF8F4' }} />
                            </div>
                            <div className="flex flex-col items-center">
                                <label style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'block' }}>Note</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button key={s} type="button" onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setNewReview({ ...newReview, rating: s })} className="text-[#B8963E] transition-transform hover:scale-125">
                                            <Star size={24} fill={(hoverRating || newReview.rating) >= s ? "currentColor" : "none"} strokeWidth={1} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <label style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'block' }}>Votre avis</label>
                                <textarea required rows="4" value={newReview.comment} onChange={e => setNewReview({ ...newReview, comment: e.target.value })} className="w-full px-4 py-3 border border-[#E8E2D6] focus:border-[#B8963E] outline-none transition-colors font-['Jost'] resize-none text-sm text-center" style={{ borderRadius: 0, backgroundColor: '#FAF8F4' }} />
                            </div>
                            <div className="flex justify-center">
                                <button type="submit" disabled={isSubmitting} style={{ width: '100%', maxWidth: '300px', height: '56px', backgroundColor: '#1A1714', color: '#FAF8F4', fontWeight: '500', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', position: 'relative', overflow: 'hidden' }} className="group">
                                    <span className="relative z-10">{isSubmitting ? 'Envoi...' : 'Envoyer mon avis'}</span>
                                    <div className="absolute inset-0 bg-[#B8963E] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Related Products Section */}
                {relatedProducts.length > 0 && (
                    <div className="mt-40 pt-32 mb-10 border-t border-[#f0ede8]">
                        <div className="flex flex-col items-center mb-16">
                            <h2 style={{ fontSize: 'clamp(32px, 4vw, 40px)', fontFamily: "'Cormorant Garamond', serif", margin: 0 }}>
                                Vous aimerez aussi
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
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
