import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShoppingBag, Heart, Star, ChevronRight, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts } from '../api/products.api';
import ProductCard from '../components/shared/ProductCard';

import { supabase } from '../lib/supabase';

export default function Home() {
    const navigate = useNavigate();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contactLoading, setContactLoading] = useState(false);
    const [contactData, setContactData] = useState({ name: '', email: '', message: '' });

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setContactLoading(true);
        try {
            const { error } = await supabase.from('messages').insert([{
                name: contactData.name, email: contactData.email,
                subject: '', message: contactData.message, status: 'unread'
            }]);
            if (error) throw error;
            toast.success('Message envoyé avec succès !');
            setContactData({ name: '', email: '', message: '' });
        } catch {
            toast.error('Une erreur est survenue.');
        } finally {
            setContactLoading(false);
        }
    };
    const [heroData, setHeroData] = useState({
        title_fr: 'Maison du Caftans',
        subtitle_fr: 'L’excellence du savoir-faire traditionnel au service de votre élégance.',
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
            {/* HERO — SINGLE FULL-SCREEN IMAGE */}
            <section style={{
                position: 'relative',
                height: '100vh',
                width: '100%',
                overflow: 'hidden',
                backgroundColor: '#0e0e0e',
                paddingTop: '80px',
            }}>
                {/* Full-screen caftan image */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url('/images/caftan/photo_1_2026-03-01_04-05-38.jpg')`,
                    backgroundSize: 'cover', backgroundPosition: 'center top',
                }} />
                {/* Dark gradient overlay — heavier on the left for text legibility */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(105deg, rgba(14,14,14,0.80) 0%, rgba(14,14,14,0.35) 55%, rgba(14,14,14,0.10) 100%)',
                }} />

                {/* Text content — bottom-left */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        position: 'absolute', bottom: 'clamp(10%, 15vh, 25%)', left: '7%',
                        maxWidth: '560px', zIndex: 10,
                    }}
                >
                    {/* Eyebrow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '1px', backgroundColor: '#C3AB7E' }} />
                        <span style={{
                            color: '#C3AB7E', fontSize: '10px', fontWeight: '600',
                            letterSpacing: '0.45em', textTransform: 'uppercase',
                            fontFamily: "'Inter', sans-serif",
                        }}>L'ÉLÉGANCE À L'ÉTAT PUR</span>
                    </div>

                    {/* Title */}
                    <h1 style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 'clamp(56px, 7vw, 104px)',
                        fontWeight: '400',
                        color: 'white',
                        lineHeight: '1.05',
                        margin: '0 0 28px',
                        letterSpacing: '-0.01em',
                    }}>
                        {(() => {
                            const words = heroData.title_fr.split(' ');
                            if (words.length > 1) {
                                return (
                                    <>
                                        {words.slice(0, -1).join(' ')}<br />
                                        <em style={{ fontStyle: 'italic', fontWeight: '300' }}>{words.slice(-1)}</em>
                                    </>
                                );
                            }
                            return heroData.title_fr;
                        })()}
                    </h1>

                    {/* Subtitle */}
                    <p style={{
                        fontFamily: "'Inter', sans-serif",
                        color: 'rgba(255,255,255,0.65)', fontSize: '15px',
                        lineHeight: '1.75', marginBottom: '40px', maxWidth: '420px',
                    }}>
                        {heroData.subtitle_fr}
                    </p>

                    {/* CTAs */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <Link to="/caftans" style={{
                            backgroundColor: '#C3AB7E', color: '#0e0e0e',
                            padding: '16px 40px', borderRadius: '100px',
                            textDecoration: 'none', fontWeight: '700', fontSize: '10px',
                            letterSpacing: '0.25em', textTransform: 'uppercase',
                            fontFamily: "'Inter', sans-serif",
                            transition: 'all 0.3s',
                        }} className="hover:scale-105">
                            {heroData.cta_text_fr}
                        </Link>
                        <Link to="/packs" style={{
                            color: 'white', padding: '16px 32px',
                            borderRadius: '100px', textDecoration: 'none',
                            fontWeight: '600', fontSize: '10px',
                            letterSpacing: '0.25em', textTransform: 'uppercase',
                            fontFamily: "'Inter', sans-serif",
                            border: '1px solid rgba(255,255,255,0.3)',
                            transition: 'all 0.3s',
                        }} className="hover:border-[#C3AB7E] hover:text-[#C3AB7E]">
                            NOS PACKS
                        </Link>
                    </div>
                </motion.div>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    style={{
                        position: 'absolute', bottom: '32px', left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', gap: '8px', zIndex: 20,
                    }}
                >
                    <span style={{
                        color: 'rgba(255,255,255,0.4)', fontSize: '9px',
                        fontFamily: "'Inter', sans-serif",
                        letterSpacing: '0.3em', textTransform: 'uppercase',
                    }}>Défiler</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        style={{
                            width: '1px', height: '40px',
                            background: 'linear-gradient(to bottom, rgba(195,171,126,0.8), transparent)',
                        }}
                    />
                </motion.div>
            </section>

            {/* CATEGORIES GRID */}
            <section style={{ padding: 'clamp(60px, 10vw, 120px) 0', backgroundColor: '#ffffff' }}>
                <div className="container mx-auto px-10">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px' }}>
                        <div>
                            <span style={{ color: '#C3AB7E', fontSize: '10px', fontWeight: '800', letterSpacing: '0.3em', textTransform: 'uppercase' }}>EXPLOREZ</span>
                            <h2 style={{ fontSize: '40px', fontFamily: 'serif', margin: '8px 0 0' }}>Nos Univers</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        {categories.map((cat, i) => (
                            <Link key={i} to={cat.to} style={{
                                position: 'relative', height: 'clamp(320px, 65vw, 500px)', borderRadius: '30px',
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
                                    position: 'absolute', bottom: 'clamp(20px, 5vw, 40px)', left: 'clamp(20px, 5vw, 40px)', right: 'clamp(20px, 5vw, 40px)',
                                    display: 'flex', flexDirection: 'column', gap: '8px'
                                }}>
                                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(8px, 2vw, 10px)', fontWeight: '800', letterSpacing: '0.1em' }}>{cat.count}</span>
                                    <h3 style={{ color: 'white', fontSize: 'clamp(20px, 5vw, 28px)', fontFamily: 'serif', margin: 0 }}>{cat.name}</h3>
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
            <section style={{ padding: '0 0 80px', backgroundColor: '#ffffff' }}>
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
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                />
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

            {/* CONTACT FORM SECTION */}
            <section style={{ padding: 'clamp(60px, 8vw, 100px) 20px', backgroundColor: '#fafaf9' }} className="mx-5 md:mx-10 mb-[100px] rounded-[40px]">
                <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                    <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.3em', display: 'block', textAlign: 'center', marginBottom: '12px' }}>NOUS CONTACTER</span>
                    <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontFamily: 'serif', textAlign: 'center', marginBottom: '40px', lineHeight: 1.2 }}>Envoyez-nous<br />un Message</h2>

                    <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Nom</label>
                                <input required value={contactData.name} onChange={e => setContactData({ ...contactData, name: e.target.value })} placeholder="Votre nom" style={{ width: '100%', height: '44px', borderBottom: '1px solid #e5e7eb', outline: 'none', backgroundColor: 'transparent', transition: 'border-color 0.3s' }} className="focus:border-[#111]" />
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Email</label>
                                <input required type="email" value={contactData.email} onChange={e => setContactData({ ...contactData, email: e.target.value })} placeholder="votre@email.com" style={{ width: '100%', height: '44px', borderBottom: '1px solid #e5e7eb', outline: 'none', backgroundColor: 'transparent', transition: 'border-color 0.3s' }} className="focus:border-[#111]" />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Message</label>
                            <textarea required rows="4" value={contactData.message} onChange={e => setContactData({ ...contactData, message: e.target.value })} placeholder="Votre message..." style={{ width: '100%', borderBottom: '1px solid #e5e7eb', outline: 'none', backgroundColor: 'transparent', resize: 'none', paddingTop: '10px', transition: 'border-color 0.3s' }} className="focus:border-[#111]" />
                        </div>
                        <button disabled={contactLoading} type="submit" style={{ height: '52px', backgroundColor: '#111', color: 'white', fontWeight: '800', fontSize: '12px', letterSpacing: '0.1em', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: 'none', cursor: contactLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s' }} className="hover:bg-[#C3AB7E]">
                            {contactLoading ? <Loader2 size={18} className="animate-spin" /> : <>ENVOYER LE MESSAGE <Send size={15} /></>}
                        </button>
                    </form>
                </div>
            </section>
        </div >
    );
}
