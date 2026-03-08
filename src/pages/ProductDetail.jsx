import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, ChevronLeft, ChevronRight, Star, Shield, Truck, RefreshCw, Plus, Minus, Sparkles, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
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
    const [lightboxOpen, setLightboxOpen] = useState(false);

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
        const success = addItem(product, sizeToAdd, colorToAdd, quantity);

        if (success) {
            openDrawer();
        } else {
            toast.error("Limite de stock atteinte pour cet article.");
        }
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
        <div className="bg-white" style={{ paddingBottom: '60px' }}>

            {/* Lightbox Overlay */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setLightboxOpen(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            backgroundColor: 'rgba(0,0,0,0.88)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '20px',
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setLightboxOpen(false)}
                            style={{
                                position: 'absolute', top: '20px', right: '20px',
                                background: 'rgba(255,255,255,0.15)', border: 'none',
                                color: 'white', width: '44px', height: '44px',
                                borderRadius: '50%', fontSize: '22px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            ✕
                        </button>
                        {/* Big image */}
                        <motion.img
                            key={currentImageIndex}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                            src={getImageUrl(images[currentImageIndex]?.image_url)}
                            alt={product.name_fr || product.name}
                            style={{
                                maxWidth: '90vw', maxHeight: '88vh',
                                objectFit: 'contain', borderRadius: '16px',
                                boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
                                cursor: 'default',
                            }}
                        />
                        {/* Prev / Next inside lightbox */}
                        {images.length > 1 && (
                            <>
                                <button onClick={e => { e.stopPropagation(); setCurrentImageIndex(p => p === 0 ? images.length - 1 : p - 1); }}
                                    style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', fontSize: '22px', cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    ‹
                                </button>
                                <button onClick={e => { e.stopPropagation(); setCurrentImageIndex(p => p === images.length - 1 ? 0 : p + 1); }}
                                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '50%', fontSize: '22px', cursor: 'pointer', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    ›
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <main style={{ paddingLeft: '20px', paddingRight: '20px', paddingTop: 'calc(var(--navbar-height) + 20px)' }}
                className="max-w-[1400px] mx-auto md:px-[48px]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-10">

                    {/* Left: Main Image */}
                    <div className="lg:col-span-5">
                        <div
                            onClick={() => setLightboxOpen(true)}
                            style={{ overflow: 'hidden', cursor: 'zoom-in', position: 'relative', aspectRatio: '1/1', backgroundColor: '#F0EBE0' }}
                            className="w-full lg:sticky lg:top-[100px]"
                        >
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentImageIndex}
                                    src={getImageUrl(images[currentImageIndex]?.image_url)}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.4 }}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right: Info Section */}
                    <div className="lg:col-span-7 flex flex-col justify-start">
                        <div style={{ marginBottom: '8px' }}>
                            <h1 style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', fontFamily: "'Cormorant Garamond', serif", lineHeight: '1.1', margin: '0 0 8px', color: '#1A1714', fontWeight: '500' }}>
                                {product.name_fr || product.name}
                            </h1>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <div className="flex text-[#C3AB7E]">
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <Star key={s} size={13} fill={s <= Math.round(averageRating) ? "currentColor" : "none"} strokeWidth={1} />
                                    ))}
                                </div>
                                <span style={{ fontSize: '11px', color: '#6B6458' }}>{averageRating || 0} ({reviews.length} avis)</span>
                            </div>

                            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', fontWeight: '400', color: '#1A1714', margin: '0 0 16px' }}>
                                {product.price?.toLocaleString('fr-FR')} <span style={{ fontSize: '13px', fontFamily: "'Jost', sans-serif", color: '#B8963E', fontWeight: '500' }}>DA</span>
                            </p>
                        </div>

                        {/* Stock Info */}
                        {product.stock_count === 0 && (
                            <div className="flex items-center gap-2 text-sm font-medium text-red-500 bg-red-50 p-3 rounded-xl w-fit" style={{ marginBottom: '12px' }}>
                                <XCircle size={14} />
                                <span>Rupture de stock</span>
                            </div>
                        )}

                        {/* Selectors — Sizes */}
                        {sizes.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#B8963E', marginBottom: '10px', fontWeight: '600' }}>Taille</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {sizes.map(s => (
                                        <button key={s.id} onClick={() => setSelectedSize(s.value)}
                                            style={{
                                                minWidth: '48px', height: '40px', borderRadius: '10px',
                                                border: selectedSize === s.value ? '2px solid #1A1714' : '1px solid #E8E2D6',
                                                backgroundColor: selectedSize === s.value ? '#1A1714' : 'transparent',
                                                color: selectedSize === s.value ? 'white' : '#1A1714',
                                                fontWeight: '500', fontSize: '12px', transition: 'all 0.2s', cursor: 'pointer',
                                                padding: '0 14px', fontFamily: "'Jost', sans-serif"
                                            }}
                                        >{s.value}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Selectors — Colors */}
                        {colors.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#B8963E', marginBottom: '10px', fontWeight: '600' }}>
                                    Couleur
                                    {selectedColor && (
                                        <span style={{ fontStyle: 'italic', fontFamily: "'Cormorant Garamond', serif", color: '#B8963E', fontWeight: '400', textTransform: 'none', letterSpacing: '0', fontSize: '13px' }}>
                                            {colors.find(c => c.value === selectedColor)?.label || ''}
                                        </span>
                                    )}
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {colors.map(c => (
                                        <button key={c.id} onClick={() => setSelectedColor(c.value)}
                                            title={c.label}
                                            style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                border: selectedColor === c.value ? '2px solid #B8963E' : '1.5px solid #E8E2D6',
                                                padding: '3px', transition: 'all 0.3s', cursor: 'pointer', backgroundColor: 'transparent',
                                                boxShadow: selectedColor === c.value ? '0 0 0 3px rgba(184,150,62,0.25)' : 'none'
                                            }}
                                        >
                                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: c.value }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FAF8F4', border: '1px solid #E8E2D6', padding: '0 16px', borderRadius: '14px', height: '48px', minWidth: '130px' }}>
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1 hover:text-[#B8963E] transition-colors"><Minus size={16} /></button>
                                <span style={{ fontWeight: '600', fontSize: '15px', color: '#1A1714', fontFamily: "'Jost', sans-serif", padding: '0 12px' }}>{quantity}</span>
                                <button onClick={() => setQuantity(q => Math.min(product.stock_count || 99, q + 1))} className="p-1 hover:text-[#B8963E] transition-colors"><Plus size={16} /></button>
                            </div>

                            <button onClick={handleAddToCart}
                                style={{
                                    flex: 1, backgroundColor: '#1A1714', color: '#FAF8F4',
                                    height: '48px', borderRadius: '14px', fontWeight: '600',
                                    fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase',
                                    border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                                className="hover:bg-[#B8963E] active:scale-95"
                            >
                                <ShoppingBag size={17} /> Ajouter au panier
                            </button>

                            <button onClick={() => toggle(product)}
                                style={{
                                    height: '48px', width: '48px', borderRadius: '14px',
                                    border: '1px solid #E8E2D6',
                                    color: isWishlisted(product.id) ? '#ef4444' : '#1A1714',
                                    cursor: 'pointer', background: '#ffffff', transition: 'all 0.3s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                                className="hover:border-[#1A1714]"
                            >
                                <Heart size={20} fill={isWishlisted(product.id) ? 'currentColor' : 'none'} strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Tabs Section */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid #f0ede8', paddingTop: '20px' }}>
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

                            <div style={{ paddingTop: '16px' }}>
                                <AnimatePresence mode="wait">
                                    {activeTab === 'description' && (
                                        <motion.div key="desc" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                                            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#6B6458', fontWeight: '400', fontFamily: "'Jost', sans-serif", margin: 0 }}>
                                                {product.description_fr || (product.category === 'Caftans' ? "Magnifique caftan de notre nouvelle collection. Qualité supérieure et finition artisanale." : "Magnifique article de notre nouvelle collection. Qualité supérieure et finition artisanale.")}
                                            </p>
                                        </motion.div>
                                    )}
                                    {activeTab === 'details' && (
                                        <motion.div key="det" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
                                            <ul style={{ fontSize: '13px', lineHeight: '2', color: '#6B6458', fontFamily: "'Jost', sans-serif", paddingLeft: '18px', margin: 0 }} className="list-disc marker:text-[#C3AB7E]">
                                                <li>Tissu de haute qualité soigneusement sélectionné</li>
                                                <li>Finitions artisanales et broderies délicates</li>
                                                <li>Nettoyage à sec uniquement recommandé</li>
                                                <li>Livré dans son coffret Maison du Caftans exclusif</li>
                                            </ul>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Thumbnails — below tabs */}
                                {images.length > 1 && (
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                                        {images.map((img, i) => (
                                            <div
                                                key={i}
                                                onClick={() => setCurrentImageIndex(i)}
                                                style={{
                                                    width: '56px', height: '56px', overflow: 'hidden',
                                                    cursor: 'pointer', flexShrink: 0,
                                                    border: currentImageIndex === i ? '1.5px solid #B8963E' : '1.5px solid transparent',
                                                    transition: 'border-color 0.2s'
                                                }}
                                            >
                                                <img src={getImageUrl(img.image_url)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
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
                {
                    relatedProducts.length > 0 && (
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
                    )
                }
            </main>

            {/* Sticky Sold Out Banner */}
            {product.stock_count === 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#1A1714',
                    color: 'white',
                    padding: '20px',
                    textAlign: 'center',
                    zIndex: 50,
                    letterSpacing: '0.4em',
                    fontWeight: '600',
                    fontSize: '14px',
                    fontFamily: "'Jost', sans-serif",
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 -10px 30px rgba(0,0,0,0.2)'
                }}>
                    SOLD OUT
                </div>
            )}
        </div>
    );
}
