import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, Check } from 'lucide-react';
import { getPacks } from '../api/packs.api';
import { useCartStore } from '../store/cartStore';
import { getImageUrl } from '../utils';
import { useTranslation } from 'react-i18next';
import { showStockLimitToast } from '../utils/notifications';

export default function Packs() {
    const { t, i18n } = useTranslation();
    const [packs, setPacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addItem, openDrawer } = useCartStore();

    useEffect(() => {
        const loadPacks = async () => {
            try {
                const { data } = await getPacks({ active: 'true' });
                setPacks(data || []);
            } catch (error) {
                console.error('Error loading packs:', error);
            } finally {
                setLoading(false);
            }
        };
        loadPacks();
    }, []);

    const handleAddToCart = (pack) => {
        const success = addItem({
            ...pack,
            id: pack.id,
            name: pack.name_fr,
            price: pack.price,
            is_pack: true,
            image: pack.image_url
        });
        
        if (success) {
            openDrawer();
        } else {
            showStockLimitToast();
        }
    };

    const getPackName = (pack) => {
        if (i18n.language === 'ar' && pack.name_ar) return pack.name_ar;
        return pack.name_fr;
    };

    const getPackDesc = (pack) => {
        if (i18n.language === 'ar' && pack.description_ar) return pack.description_ar;
        return pack.description_fr;
    };

    return (
        <div className="min-h-screen bg-white">
            <header className="text-center container mx-auto px-4 md:px-10" style={{ paddingTop: 'calc(var(--navbar-height) + 40px)' }}>
                <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4em' }}>{t('packs.label')}</span>
                <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontFamily: 'serif', marginTop: '16px' }}>{t('packs.title')}</h1>
                <p style={{ color: '#9ca3af', fontSize: '16px', marginTop: '20px', maxWidth: '600px', margin: '20px auto 0' }}>
                    {t('packs.desc')}
                </p>
            </header>

            <main className="container mx-auto px-4 md:px-10" style={{ paddingBottom: '100px' }}>
                {loading ? (
                    <div className="flex flex-col gap-20">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} style={{ height: '600px', backgroundColor: '#f0ede8', borderRadius: '40px' }} className="animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-20">
                        {packs.map((pack, idx) => (
                            <motion.section
                                key={pack.id}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                style={{
                                    display: 'flex',
                                    backgroundColor: 'white',
                                    borderRadius: 'clamp(24px, 4vw, 60px)',
                                    overflow: 'hidden',
                                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.05)',
                                    minHeight: '500px'
                                }}
                                className="flex-col md:flex-row"
                            >
                                {/* Image Section */}
                                <div
                                    style={{ flex: 1, position: 'relative', order: 0 }}
                                    className="min-h-[300px] md:min-h-[500px]"
                                >
                                    <img
                                        src={getImageUrl(pack.image_url)}
                                        alt={getPackName(pack)}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                    {pack.is_sold_out && (
                                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ backgroundColor: 'white', color: '#111111', padding: '12px 24px', borderRadius: '12px', fontWeight: '800' }}>{t('packs.soldOut')}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content Section */}
                                <div style={{ flex: 1, padding: 'clamp(24px, 5vw, 80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                        <Sparkles size={20} style={{ color: '#C3AB7E' }} />
                                        <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.2em' }}>{t('packs.badge')}</span>
                                    </div>

                                    <h2 style={{ fontSize: 'clamp(24px, 3vw, 40px)', fontFamily: 'serif', margin: '0 0 24px' }}>{getPackName(pack)}</h2>
                                    <p style={{ color: '#6b7280', fontSize: '16px', lineHeight: '1.8', marginBottom: '40px' }}>
                                        {getPackDesc(pack)}
                                    </p>

                                    {/* Items list */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '48px' }}>
                                        {pack.items?.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <Check size={14} style={{ color: '#C3AB7E' }} />
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111111' }}>{item.name_fr}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                                        <div>
                                            <span style={{ color: '#9ca3af', fontSize: '14px', textDecoration: 'line-through', display: 'block' }}>{pack.original_price?.toLocaleString('fr-FR')} DA</span>
                                            <span style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: '800', color: '#111111' }}>{pack.price?.toLocaleString('fr-FR')} DA</span>
                                        </div>
                                        <button
                                            disabled={pack.is_sold_out}
                                            onClick={() => handleAddToCart(pack)}
                                            style={{
                                                backgroundColor: pack.is_sold_out ? '#f0ede8' : '#111111',
                                                color: pack.is_sold_out ? '#9ca3af' : 'white',
                                                padding: '20px 40px', borderRadius: '100px',
                                                fontWeight: '800', fontSize: '12px', letterSpacing: '0.2em',
                                                border: 'none', transition: 'all 0.3s', cursor: pack.is_sold_out ? 'default' : 'pointer'
                                            }}
                                            className={!pack.is_sold_out ? "hover:scale-105 active:scale-95 shadow-xl shadow-gray-200" : ""}
                                        >
                                            {t('packs.reserve')}
                                        </button>
                                    </div>
                                </div>
                            </motion.section>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
