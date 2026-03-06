import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, ChevronLeft, ChevronRight, Star, Shield, Truck, RefreshCw, Plus, Minus, Sparkles } from 'lucide-react';
import { getProduct } from '../api/products.api';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { getImageUrl, formatPrice } from '../utils';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');

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

    // Provide fallback sizes/colors if DB is empty to showcase the premium UI
    let sizes = product.attributes?.filter(a => a.name === 'size' || a.name === 'taille') || [];
    let colors = product.attributes?.filter(a => a.name === 'color' || a.name === 'couleur') || [];

    if (sizes.length === 0 && (product.category?.toLowerCase() === 'caftans' || product.category?.toLowerCase() === 'caftan')) {
        sizes = [
            { id: 's1', value: 'S' },
            { id: 's2', value: 'M' },
            { id: 's3', value: 'L' }
        ];
    }

    if (colors.length === 0 && (product.category?.toLowerCase() === 'caftans' || product.category?.toLowerCase() === 'caftan')) {
        colors = [
            { id: 'c1', value: '#e2d4bd' }, // cream/vanilla
            { id: 'c2', value: '#111111' }, // black
            { id: 'c3', value: '#8b0000' }  // deep red/bordeaux
        ];
    }

    const handleAddToCart = () => {
        const sizeToAdd = selectedSize || (sizes[0]?.value) || null;
        const colorToAdd = selectedColor || (colors[0]?.value) || null;
        addItem(product, sizeToAdd, colorToAdd, quantity);
        openDrawer();
    };

    return (
        <div className="min-h-screen bg-white">
            <main className="container mx-auto px-4 md:px-10 pb-32" style={{ paddingTop: 'calc(var(--navbar-height) + 40px)' }}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

                    {/* Left: Image Gallery */}
                    <div className="lg:col-span-7 space-y-4">
                        <div style={{ position: 'relative', aspectRatio: '4/5', borderRadius: '40px', overflow: 'hidden', backgroundColor: '#f9f9f9' }}>
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
                                <div className="absolute inset-0 flex items-center justify-between px-6">
                                    <button onClick={() => setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))} className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg"><ChevronLeft /></button>
                                    <button onClick={() => setCurrentImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))} className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-lg"><ChevronRight /></button>
                                </div>
                            )}
                        </div>

                        {/* Thumbnails — 4 cols on mobile, 6 on sm+ */}
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {images.map((img, i) => (
                                <div
                                    key={i}
                                    onClick={() => setCurrentImageIndex(i)}
                                    style={{
                                        aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                                        border: currentImageIndex === i ? '2px solid #C3AB7E' : '2px solid transparent'
                                    }}
                                >
                                    <img src={getImageUrl(img.image_url)} className="w-full h-full object-cover" alt="" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Info Section */}
                    <div className="lg:col-span-5 flex flex-col justify-start">
                        <div className="flex items-center gap-4 mb-6">
                            <span style={{ backgroundColor: '#f0ede8', color: '#C3AB7E', fontSize: '10px', fontWeight: '800', padding: '6px 12px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {product.category}
                            </span>
                            <div className="flex items-center gap-1 text-[#C3AB7E]">
                                <Star size={14} fill="currentColor" />
                                <span className="text-xs font-bold">4.9 (24 avis)</span>
                            </div>
                        </div>

                        <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontFamily: 'serif', lineHeight: '1.2', margin: '0 0 16px' }}>{product.name_fr || product.name}</h1>
                        <p style={{ fontSize: '28px', fontWeight: '800', color: '#111111', margin: '0 0 32px' }}>{product.price?.toLocaleString()} DA</p>

                        <div style={{ height: '1px', backgroundColor: '#f0ede8', margin: '32px 0' }} />

                        {/* Sizes */}
                        {sizes.length > 0 && (
                            <div className="mb-8">
                                <label className="block text-[11px] font-800 uppercase tracking-widest text-[#111111] mb-4">Taille</label>
                                <div className="flex flex-wrap gap-3">
                                    {sizes.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setSelectedSize(s.value)}
                                            style={{
                                                minWidth: '60px', height: '48px', borderRadius: '12px',
                                                border: selectedSize === s.value ? '2px solid #111111' : '1px solid #f0ede8',
                                                backgroundColor: selectedSize === s.value ? '#111111' : 'transparent',
                                                color: selectedSize === s.value ? 'white' : '#111111',
                                                fontWeight: '700', fontSize: '14px', transition: 'all 0.2s', cursor: 'pointer'
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
                            <div className="mb-8">
                                <label className="block text-[11px] font-800 uppercase tracking-widest text-[#111111] mb-4">Couleur</label>
                                <div className="flex flex-wrap gap-4">
                                    {colors.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedColor(c.value)}
                                            style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                border: selectedColor === c.value ? '2px solid #C3AB7E' : '1px solid #f0ede8',
                                                padding: '3px', transition: 'all 0.2s', cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: c.value }} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity & Actions inline */}
                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
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

                        {/* Description & Details embedded in the right column */}
                        <div className="mt-12 space-y-8">
                            <div>
                                <h3 className="text-[11px] font-800 uppercase tracking-widest text-[#111111] mb-4 flex items-center gap-2">
                                    <Sparkles size={14} className="text-[#C3AB7E]" /> Description
                                </h3>
                                <p className="text-[15px] font-400 leading-relaxed text-[#4b5563]">
                                    {product.description_fr || "Découvrez l'élégance intemporelle de cette pièce unique. Conçue avec des matières nobles et un savoir-faire d'exception, elle sublimera votre allure en toute circonstance."}
                                </p>
                            </div>

                            <div className="w-full h-px bg-[#f0ede8]" />

                            <div>
                                <h3 className="text-[11px] font-800 uppercase tracking-widest text-[#111111] mb-4">
                                    Détails & Entretien
                                </h3>
                                <ul className="text-[14px] font-400 leading-relaxed text-[#4b5563] space-y-2 list-disc pl-4 marker:text-[#C3AB7E]">
                                    <li>Tissu de haute qualité soigneusement sélectionné</li>
                                    <li>Finitions artisanales et broderies délicates</li>
                                    <li>Nettoyage à sec uniquement recommandé</li>
                                    <li>Livré dans son coffret Maison du Caftans exclusif</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
