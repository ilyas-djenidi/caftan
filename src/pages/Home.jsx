import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShoppingBag, Heart, Star, ChevronRight } from 'lucide-react';
import { getProducts } from '../api/products.api';
import ProductCard from '../components/shared/ProductCard';

import { supabase } from '../lib/supabase';

export default function Home() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [heroData, setHeroData] = useState({
        title_fr: 'Maison du Caftans',
        subtitle_fr: 'Découvrez notre collection exclusive de caftans haute couture et accessoires raffinés, alliant tradition et modernité.',
        cta_text_fr: 'DÉCOUVRIR LA COLLECTION',
        image_url: '/hero-bg.jpg'
    });
    const [categoryCounts, setCategoryCounts] = useState({ caftans: 0, sacs: 0, accessoires: 0 });

    useEffect(() => {
        const loadPageData = async () => {
            try {
                // Fetch Products
                const { data } = await getProducts({ limit: 20 });
                setFeaturedProducts(data.products || []);

                // Fetch Hero Settings
                const { data: heroSettings } = await supabase
                    .from('site_settings')
                    .select('value')
                    .eq('key', 'hero_content')
                    .maybeSingle();
                if (heroSettings?.value) {
                    setHeroData(prev => ({ ...prev, ...heroSettings.value }));
                }

                // Fetch product counts per category
                const [{ count: caftansCount }, { count: sacsCount }, { count: accCount }] = await Promise.all([
                    supabase.from('products').select('*', { count: 'exact', head: true }).eq('category', 'caftans'),
                    supabase.from('products').select('*', { count: 'exact', head: true }).eq('category', 'sacs'),
                    supabase.from('products').select('*', { count: 'exact', head: true }).eq('category', 'accessoires'),
                ]);
                setCategoryCounts({ caftans: caftansCount || 0, sacs: sacsCount || 0, accessoires: accCount || 0 });
            } catch (error) {
                console.error('Error loading home data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadPageData();
    }, []);

    const categories = [
        { name: 'Caftans', to: '/caftans', image: '/images/cat_caftans.jpg', count: `${categoryCounts.caftans} Modèles` },
        { name: 'Sacs', to: '/sacs', image: '/images/cat_sacs.jpg', count: `${categoryCounts.sacs} Styles` },
        { name: 'Accessoires', to: '/accessoires', image: '/images/cat_acc.jpg', count: `${categoryCounts.accessoires} Pièces` },
        { name: 'Packs', to: '/packs', image: '/images/cat_packs.jpg', count: 'Édition Spéciale' },
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* HER0 - OVERLAY STYLE */}
            <section style={{
                position: 'relative', height: '100vh', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', backgroundColor: '#111111'
            }}>
                {/* Background Image with Overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url("${heroData.image_url}")`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: 0.6, scale: 1.1
                }} />
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.8))'
                }} />

                <div className="container mx-auto px-10 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span style={{
                            color: '#C3AB7E', fontSize: '12px', fontWeight: '800',
                            letterSpacing: '0.4em', textTransform: 'uppercase',
                            marginBottom: '24px', display: 'block'
                        }}>L'ÉLÉGANCE À L'ÉTAT PUR</span>
                        <h1 style={{
                            fontSize: 'clamp(48px, 8vw, 120px)', fontFamily: 'serif',
                            color: 'white', fontWeight: '400', lineHeight: '1.1',
                            margin: '0 0 32px'
                        }}>
                            {heroData.title_fr.split(' ').length > 1 ? (
                                <>
                                    {heroData.title_fr.split(' ').slice(0, -1).join(' ')} <br />
                                    <span style={{ fontStyle: 'italic', fontWeight: '400' }}>{heroData.title_fr.split(' ').slice(-1)}</span>
                                </>
                            ) : heroData.title_fr}
                        </h1>
                        <p style={{
                            color: 'rgba(255,255,255,0.7)', fontSize: '18px',
                            maxWidth: '600px', margin: '0 auto 48px', lineHeight: '1.6'
                        }}>
                            {heroData.subtitle_fr}
                        </p>
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            <Link to="/caftans" style={{
                                backgroundColor: '#C3AB7E', color: 'white',
                                padding: '20px 48px', borderRadius: '100px',
                                textDecoration: 'none', fontWeight: '800', fontSize: '12px',
                                letterSpacing: '0.2em', textTransform: 'uppercase',
                                border: 'none', transition: 'all 0.3s'
                            }} className="hover:scale-105">
                                {heroData.cta_text_fr}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* CATEGORIES GRID */}
            <section style={{ padding: '120px 0', backgroundColor: '#ffffff' }}>
                <div className="container mx-auto px-10">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px' }}>
                        <div>
                            <span style={{ color: '#C3AB7E', fontSize: '10px', fontWeight: '800', letterSpacing: '0.3em', textTransform: 'uppercase' }}>EXPLOREZ</span>
                            <h2 style={{ fontSize: '40px', fontFamily: 'serif', margin: '8px 0 0' }}>Nos Univers</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {categories.map((cat, i) => (
                            <Link key={i} to={cat.to} style={{
                                position: 'relative', height: '500px', borderRadius: '30px',
                                overflow: 'hidden', textDecoration: 'none', display: 'block'
                            }} className="group">
                                <div style={{
                                    position: 'absolute', inset: 0, backgroundColor: '#f0ede8',
                                    backgroundImage: `url(${cat.image})`, backgroundSize: 'cover',
                                    backgroundPosition: 'center', transition: 'transform 1s'
                                }} className="group-hover:scale-110" />
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)'
                                }} />
                                <div style={{
                                    position: 'absolute', bottom: '40px', left: '40px', right: '40px',
                                    display: 'flex', flexDirection: 'column', gap: '8px'
                                }}>
                                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: '800', letterSpacing: '0.1em' }}>{cat.count}</span>
                                    <h3 style={{ color: 'white', fontSize: '24px', fontFamily: 'serif', margin: 0 }}>{cat.name}</h3>
                                    <div style={{
                                        width: '40px', height: '2px', backgroundColor: '#C3AB7E',
                                        transition: 'width 0.3s'
                                    }} className="group-hover:w-full" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section >

            {/* FEATURED PRODUCTS */}
            < section style={{ padding: '0 0 120px', backgroundColor: '#ffffff' }}>
                <div className="container mx-auto px-10">
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '48px', fontFamily: 'serif', margin: 0 }}>Sélection Exclusive</h2>
                        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px', maxWidth: '500px', margin: '16px auto 0' }}>
                            Nos pièces les plus convoitées, choisies pour leur qualité exceptionnelle et leur design intemporel.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} style={{ height: '400px', backgroundColor: '#F0EDE8', borderRadius: '24px' }} className="animate-pulse" />
                            ))
                        ) : (
                            featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))
                        )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '80px' }}>
                        <Link to="/caftans" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '12px',
                            color: '#111111', fontWeight: '800', fontSize: '11px',
                            letterSpacing: '0.2em', textTransform: 'uppercase',
                            textDecoration: 'none', borderBottom: '2px solid #C3AB7E',
                            paddingBottom: '8px'
                        }}>
                            VOIR TOUTE LA BOUTIQUE <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section >

            {/* CALL TO ACTION - PACK BRIDAL */}
            <section style={{
                padding: 'clamp(40px, 8vw, 100px)', borderRadius: 'clamp(30px, 10vw, 60px)',
                backgroundColor: '#111111', position: 'relative', overflow: 'hidden'
            }} className="mx-5 md:mx-10 mb-[120px]">
                <div style={{
                    position: 'absolute', right: '10%', top: '50%', transform: 'translateY(-50%)',
                    width: '500px', height: '500px', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(195,171,126,0.3) 0%, transparent 70%)',
                    filter: 'blur(40px)'
                }} />

                <div className="relative z-10 max-w-2xl">
                    <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4em' }}>ÉDITION SPÉCIALE</span>
                    <h2 style={{ color: 'white', fontSize: 'clamp(32px, 8vw, 56px)', fontFamily: 'serif', margin: '24px 0 32px', lineHeight: '1.2' }}>Le Pack <br /> d'Exception</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '18px', lineHeight: '1.6', marginBottom: '48px' }}>
                        Un coffret complet soigneusement assemblé pour accompagner vos moments les plus précieux. Inclut des pièces exclusives et personnalisées.
                    </p>
                    <Link to="/packs" style={{
                        display: 'inline-block',
                        backgroundColor: 'white', color: '#111111',
                        padding: '16px 32px', sm: { padding: '20px 48px' }, borderRadius: '100px',
                        textDecoration: 'none', fontWeight: '800', fontSize: '11px',
                        letterSpacing: '0.2em', textTransform: 'uppercase',
                        transition: 'all 0.3s', whiteSpace: 'nowrap'
                    }} className="hover:bg-[#C3AB7E] hover:text-white px-8 py-4 sm:px-12 sm:py-5">
                        DÉCOUVRIR LE PACK
                    </Link>
                </div>
            </section >
        </div >
    );
}
