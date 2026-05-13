import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShoppingBag, Heart, Star, ChevronRight, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts } from '../api/products.api';
import ProductCard from '../components/shared/ProductCard';
import LogoLoader from '../components/shared/LogoLoader';
import { useTranslation } from 'react-i18next';
import useProductStore from '../store/productStore';

import { supabase } from '../lib/supabase';

export default function Home() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { homeData, loading, fetchHomeData } = useProductStore();
    const [contactLoading, setContactLoading] = useState(false);
    const [contactData, setContactData] = useState({ name: '', email: '', phone: '', message: '' });

    const handleContactSubmit = async (e) => {
        e.preventDefault();
        setContactLoading(true);
        try {
            const { error } = await supabase.from('messages').insert([{
                full_name: contactData.name, email: contactData.email, phone: contactData.phone,
                subject: 'General Inquiry', message: contactData.message, status: 'unread'
            }]);
            if (error) throw error;
            toast.success('Message envoyé avec succès !');
            setContactData({ name: '', email: '', phone: '', message: '' });
        } catch {
            toast.error('Une erreur est survenue.');
        } finally {
            setContactLoading(false);
        }
    };
    
    // Default fallback values if homeData is missing
    const heroData = homeData?.heroSettings || {
        title_fr: 'Maison du Caftans',
        subtitle_fr: 'L’excellence du savoir-faire traditionnel au service de votre élégance.',
        cta_text_fr: 'DÉCOUVRIR LA COLLECTION',
        image_url: '/hero-bg.jpg'
    };
    const categoryCounts = homeData?.categoryCounts || { caftans: 0, sacs: 0, accessoires: 0 };
    const sacsProducts = homeData?.sacsProducts || [];
    const caftansProducts = homeData?.caftansProducts || [];
    const accessoiresProducts = homeData?.accessoiresProducts || [];

    const [heroImageLoaded, setHeroImageLoaded] = useState(false);

    useEffect(() => {
        fetchHomeData();
    }, [fetchHomeData]);

    const categories = [
        { name: t('nav.caftans'), to: '/caftans', image: '/images/cat_caftans.jpg', count: `${categoryCounts.caftans} ${t('product.quantity')}` },
        { name: t('nav.bags'), to: '/sacs', image: '/images/cat_sacs.jpg', count: `${categoryCounts.sacs} ${t('product.quantity')}` },
        { name: t('nav.accessories'), to: '/accessoires', image: '/images/cat_acc.jpg', count: `${categoryCounts.accessoires} ${t('product.quantity')}` },
        { name: t('nav.packs'), to: '/packs', image: '/images/cat_packs.jpg', count: t('packs.label') },
    ];

    // Show LogoLoader if either the data is loading OR the hero image hasn't loaded yet
    if (loading || (heroData.image_url && !heroImageLoaded)) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <LogoLoader />
                {/* Preload the image invisibly so heroImageLoaded can turn true */}
                {heroData.image_url && (
                    <img
                        src={heroData.image_url}
                        alt=""
                        onLoad={() => setHeroImageLoaded(true)}
                        onError={() => setHeroImageLoaded(true)}
                        style={{ display: 'none' }}
                        fetchPriority="high"
                    />
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* HERO — SINGLE FULL-SCREEN IMAGE */}
            <section style={{
                position: 'relative',
                height: '100vh',
                minHeight: '100vh',
                width: '100%',
                overflow: 'hidden',
                backgroundColor: 'white',
                paddingTop: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {heroData.image_url && (
                    <img 
                        src={heroData.image_url} 
                        alt=""
                        fetchPriority="high"
                        style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%', 
                            objectFit: 'cover', objectPosition: 'center top',
                        }} 
                    />
                )}
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
                        position: 'absolute',
                        bottom: 'clamp(10%, 15vh, 25%)',
                        left: '7%',
                        maxWidth: '560px', zIndex: 10,
                    }}
                    className="max-sm:!bottom-auto max-sm:!top-[22%]"
                >
                    {/* Eyebrow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                        <div style={{ width: '40px', height: '1px', backgroundColor: '#C3AB7E' }} />
                        <span style={{
                            color: '#C3AB7E', fontSize: '10px', fontWeight: '600',
                            letterSpacing: '0.45em', textTransform: 'uppercase',
                            fontFamily: "'Inter', sans-serif",
                        }}>{t('home.hero.subtitle')}</span>
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
                            const defaultTitle = t('home.hero.brand', { defaultValue: 'Maison' }) + ' ' + t('home.hero.brand2', { defaultValue: 'du Caftans' });
                            const title = i18n.language === 'ar' ? (heroData.title_ar || defaultTitle) : (i18n.language === 'en' ? (heroData.title_en || defaultTitle) : (heroData.title_fr || defaultTitle));
                            const words = title.split(' ');
                            if (words.length > 1) {
                                return (
                                    <>
                                        {words.slice(0, -1).join(' ')}<br />
                                        {words.slice(-1)}
                                    </>
                                );
                            }
                            return title;
                        })()}
                    </h1>

                    {/* Subtitle */}
                    <p style={{
                        fontFamily: "'Inter', sans-serif",
                        color: 'rgba(255,255,255,0.65)', fontSize: '15px',
                        lineHeight: '1.75', marginBottom: '40px', maxWidth: '420px',
                    }}>
                        {i18n.language === 'ar' ? (heroData.subtitle_ar || t('home.hero.tagline')) : (i18n.language === 'en' ? (heroData.subtitle_en || t('home.hero.tagline')) : (heroData.subtitle_fr || t('home.hero.tagline')))}
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
                            {t('home.hero.cta')}
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
                            {t('home.hero.packs')}
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
                            <span style={{ color: '#C3AB7E', fontSize: '10px', fontWeight: '800', letterSpacing: '0.3em', textTransform: 'uppercase' }}>{t('home.categories.subtitle')}</span>
                            <h2 style={{ fontSize: '40px', fontFamily: 'serif', margin: '8px 0 0' }}>{t('home.categories.title')}</h2>
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

            {/* CAFTANS PRODUCTS */}
            <section style={{ padding: '0 0 80px', backgroundColor: '#ffffff' }}>
                <div className="container mx-auto px-10">
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '48px', fontFamily: 'serif', margin: 0 }}>{t('nav.caftans')}</h2>
                        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px', maxWidth: '500px', margin: '16px auto 0' }}>
                            {t('home.categories.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} style={{ aspectRatio: '3/4', backgroundColor: '#F0EBE0', borderRadius: '0px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                            ))
                        ) : (
                            caftansProducts.slice(0, 4).map((product) => (
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
                            {t('home.featured.viewAll', { defaultValue: 'VOIR TOUT' })} <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* SACS PRODUCTS */}
            <section style={{ padding: '0 0 80px', backgroundColor: '#ffffff' }}>
                <div className="container mx-auto px-10">
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '48px', fontFamily: 'serif', margin: 0 }}>{t('nav.bags')}</h2>
                        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px', maxWidth: '500px', margin: '16px auto 0' }}>
                            {t('home.categories.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} style={{ aspectRatio: '3/4', backgroundColor: '#F0EBE0', borderRadius: '0px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                            ))
                        ) : (
                            sacsProducts.slice(0, 4).map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                />
                            ))
                        )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '80px' }}>
                        <Link to="/sacs" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '12px',
                            color: '#111111', fontWeight: '800', fontSize: '11px',
                            letterSpacing: '0.2em', textTransform: 'uppercase',
                            textDecoration: 'none', borderBottom: '2px solid #C3AB7E',
                            paddingBottom: '8px'
                        }}>
                            {t('home.featured.viewAll')} <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ACCESSOIRES PRODUCTS */}
            <section style={{ padding: '0 0 80px', backgroundColor: '#ffffff' }}>
                <div className="container mx-auto px-10">
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 style={{ fontSize: '48px', fontFamily: 'serif', margin: 0 }}>{t('nav.accessories')}</h2>
                        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px', maxWidth: '500px', margin: '16px auto 0' }}>
                            {t('home.categories.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} style={{ aspectRatio: '3/4', backgroundColor: '#F0EBE0', borderRadius: '0px', animation: 'pulse 1.5s ease-in-out infinite' }} />
                            ))
                        ) : (
                            accessoiresProducts.slice(0, 4).map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                />
                            ))
                        )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '80px' }}>
                        <Link to="/accessoires" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '12px',
                            color: '#111111', fontWeight: '800', fontSize: '11px',
                            letterSpacing: '0.2em', textTransform: 'uppercase',
                            textDecoration: 'none', borderBottom: '2px solid #C3AB7E',
                            paddingBottom: '8px'
                        }}>
                            {t('home.featured.viewAll')} <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* CONTACT FORM SECTION */}
            <section style={{ padding: 'clamp(60px, 8vw, 100px) 20px', backgroundColor: '#fafaf9' }} className="mx-5 md:mx-10 mb-[100px] rounded-[40px]">
                <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                    <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.3em', display: 'block', textAlign: 'center', marginBottom: '12px' }}>{t('contact.label')}</span>
                    <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontFamily: 'serif', textAlign: 'center', marginBottom: '40px', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{t('contact.title')}</h2>

                    <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }} className="md:grid-cols-3">
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>{t('contact.name')}</label>
                                <input required value={contactData.name} onChange={e => setContactData({ ...contactData, name: e.target.value })} placeholder={t('contact.namePlaceholder')} style={{ width: '100%', height: '44px', borderBottom: '1px solid #e5e7eb', outline: 'none', backgroundColor: 'transparent', transition: 'border-color 0.3s' }} className="focus:border-[#111]" />
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>{t('contact.email')}</label>
                                <input required type="email" value={contactData.email} onChange={e => setContactData({ ...contactData, email: e.target.value })} placeholder={t('contact.emailPlaceholder')} style={{ width: '100%', height: '44px', borderBottom: '1px solid #e5e7eb', outline: 'none', backgroundColor: 'transparent', transition: 'border-color 0.3s' }} className="focus:border-[#111]" />
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>{t('contact.phone', 'Téléphone')}</label>
                                <input required type="tel" value={contactData.phone} onChange={e => setContactData({ ...contactData, phone: e.target.value })} placeholder={t('contact.phonePlaceholder', '05...')} style={{ width: '100%', height: '44px', borderBottom: '1px solid #e5e7eb', outline: 'none', backgroundColor: 'transparent', transition: 'border-color 0.3s' }} className="focus:border-[#111]" />
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>{t('contact.message')}</label>
                            <textarea required rows="4" value={contactData.message} onChange={e => setContactData({ ...contactData, message: e.target.value })} placeholder={t('contact.messagePlaceholder')} style={{ width: '100%', borderBottom: '1px solid #e5e7eb', outline: 'none', backgroundColor: 'transparent', resize: 'none', paddingTop: '10px', transition: 'border-color 0.3s' }} className="focus:border-[#111]" />
                        </div>
                        <button disabled={contactLoading} type="submit" style={{ height: '52px', backgroundColor: '#111', color: 'white', fontWeight: '800', fontSize: '12px', letterSpacing: '0.1em', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: 'none', cursor: contactLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s' }} className="hover:bg-[#C3AB7E]">
                            {contactLoading ? <Loader2 size={18} className="animate-spin" /> : <>{t('contact.send')} <Send size={15} /></>}
                        </button>
                    </form>
                </div>
            </section>
        </div >
    );
}

