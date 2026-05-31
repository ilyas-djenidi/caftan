import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, Check, Tag } from 'lucide-react';
import { getPacks } from '../api/packs.api';
import { useCartStore } from '../store/cartStore';
import { getImageUrl } from '../utils';
import { useTranslation } from 'react-i18next';

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
        const cartProduct = {
            id: pack.id,
            name_fr: pack.name_fr,
            name: pack.name_fr,
            price: pack.price,
            stock_count: null, // packs have no stock limit
            is_pack: true,
            image_url: pack.image_url,
            images: pack.image_url ? [{ image_url: pack.image_url }] : [],
        };
        addItem(cartProduct, null, null, null, 1);
        openDrawer();
    };

    const getPackName = (pack) => {
        if (i18n.language === 'ar' && pack.name_ar) return pack.name_ar;
        return pack.name_fr;
    };

    const getPackDesc = (pack) => {
        if (i18n.language === 'ar' && pack.description_ar) return pack.description_ar;
        return pack.description_fr;
    };

    const getDiscount = (pack) => {
        if (!pack.original_price || !pack.price) return null;
        return Math.round(100 - (pack.price / pack.original_price) * 100);
    };

    return (
        <div className="min-h-screen bg-[#FAFAF8]">
            {/* ── Header ── */}
            <header
                style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '0 24px',
                    paddingTop: 'calc(var(--navbar-height) + 36px)',
                    paddingBottom: '36px',
                    textAlign: 'center',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        backgroundColor: '#FDF6E7', borderRadius: '100px',
                        padding: '6px 16px', marginBottom: '20px'
                    }}>
                        <Sparkles size={13} style={{ color: '#C3AB7E' }} />
                        <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                            {t('packs.label')}
                        </span>
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(24px, 4vw, 36px)',
                        fontFamily: 'serif',
                        color: '#111111',
                        lineHeight: 1.15,
                        marginBottom: '16px'
                    }}>
                        {t('packs.title')}
                    </h1>
                    <p style={{ color: '#9ca3af', fontSize: '16px', maxWidth: '540px', margin: '0 auto', lineHeight: 1.7 }}>
                        {t('packs.desc')}
                    </p>
                </motion.div>
            </header>

            {/* ── Cards ── */}
            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
                {loading ? (
                    <div className="flex flex-col gap-8">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} style={{
                                minHeight: '320px', backgroundColor: '#f0ede8',
                                borderRadius: '32px', opacity: 0.5
                            }} className="animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-8">
                        {packs.map((pack, idx) => {
                            const discount = getDiscount(pack);
                            const isEven = idx % 2 === 0;

                            return (
                                <motion.article
                                    key={pack.id}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '30% 70%',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        backgroundColor: 'white',
                                        boxShadow: '0 4px 30px -6px rgba(0,0,0,0.08)',
                                        border: '1px solid #F0EDE8',
                                        minHeight: '220px'
                                    }}
                                    className="pack-card-grid"
                                >
                                    {/* ── Image ── */}
                                    <div style={{
                                        position: 'relative',
                                        order: isEven ? 0 : 1,
                                        overflow: 'hidden',
                                        minHeight: '140px'
                                    }}>
                                        <img
                                            src={getImageUrl(pack.image_url)}
                                            alt={getPackName(pack)}
                                            style={{
                                                width: '100%', height: '100%',
                                                objectFit: 'cover', display: 'block',
                                                transition: 'transform 0.6s ease'
                                            }}
                                            className="pack-img"
                                        />


                                        {/* Discount badge */}
                                        {discount && (
                                            <div style={{
                                                position: 'absolute', top: '16px',
                                                left: isEven ? 'auto' : '16px',
                                                right: isEven ? '16px' : 'auto',
                                                backgroundColor: '#111111', color: 'white',
                                                borderRadius: '100px', padding: '4px 12px',
                                                fontSize: '11px', fontWeight: '800',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}>
                                                <Tag size={10} />
                                                -{discount}%
                                            </div>
                                        )}

                                        {/* Sold out overlay */}
                                        {pack.is_sold_out && (
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                backgroundColor: 'rgba(0,0,0,0.45)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <span style={{
                                                    backgroundColor: 'white', color: '#111111',
                                                    padding: '10px 24px', borderRadius: '12px',
                                                    fontWeight: '800', fontSize: '12px',
                                                    letterSpacing: '0.1em', textTransform: 'uppercase'
                                                }}>
                                                    {t('packs.soldOut')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Content ── */}
                                    <div style={{
                                        order: isEven ? 1 : 0,
                                        padding: '20px 24px',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
                                        gap: '0'
                                    }}>
                                        {/* Badge */}
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            marginBottom: '8px'
                                        }}>
                                            <Sparkles size={12} style={{ color: '#C3AB7E' }} />
                                            <span style={{
                                                color: '#C3AB7E', fontSize: '9px',
                                                fontWeight: '800', letterSpacing: '0.3em', textTransform: 'uppercase'
                                            }}>
                                                {t('packs.badge')}
                                            </span>
                                        </div>

                                        {/* Name */}
                                        <h2 style={{
                                            fontSize: 'clamp(16px, 2vw, 22px)',
                                            fontFamily: 'serif', color: '#111111',
                                            lineHeight: 1.2, margin: '0 0 6px'
                                        }}>
                                            {getPackName(pack)}
                                        </h2>

                                        {/* Description */}
                                        <p style={{
                                            color: '#6b7280', fontSize: '12px',
                                            lineHeight: 1.6, marginBottom: '12px'
                                        }}>
                                            {getPackDesc(pack)}
                                        </p>

                                        {/* Items */}
                                        {pack.items?.length > 0 && (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: pack.items.length > 3 ? '1fr 1fr' : '1fr',
                                                gap: '8px',
                                                marginBottom: '20px',
                                                padding: '14px',
                                                backgroundColor: '#FAFAF8',
                                                borderRadius: '16px',
                                                border: '1px solid #F0EDE8'
                                            }}>
                                                {pack.items.map((item, i) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{
                                                            width: '22px', height: '22px', borderRadius: '50%',
                                                            backgroundColor: '#FDF6E7',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexShrink: 0
                                                        }}>
                                                            <Check size={12} style={{ color: '#C3AB7E' }} />
                                                        </div>
                                                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                                                            {item.name_fr}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Price + CTA */}
                                        <div style={{
                                            display: 'flex', flexWrap: 'wrap',
                                            alignItems: 'center', justifyContent: 'space-between',
                                            gap: '12px', marginTop: '0'
                                        }}>
                                            <div>
                                                {pack.original_price && pack.original_price > pack.price && (
                                                    <span style={{
                                                        color: '#9ca3af', fontSize: '13px',
                                                        textDecoration: 'line-through', display: 'block',
                                                        marginBottom: '2px'
                                                    }}>
                                                        {pack.original_price.toLocaleString('fr-FR')} DA
                                                    </span>
                                                )}
                                                <span style={{
                                                    fontSize: 'clamp(18px, 2.5vw, 24px)',
                                                    fontWeight: '800', color: '#111111'
                                                }}>
                                                    {pack.price?.toLocaleString('fr-FR')} DA
                                                </span>
                                            </div>

                                            <button
                                                disabled={pack.is_sold_out}
                                                onClick={() => handleAddToCart(pack)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    backgroundColor: pack.is_sold_out ? '#F3F4F6' : '#111111',
                                                    color: pack.is_sold_out ? '#9ca3af' : 'white',
                                                    padding: '12px 24px', borderRadius: '100px',
                                                    fontWeight: '800', fontSize: '12px',
                                                    letterSpacing: '0.15em', textTransform: 'uppercase',
                                                    border: 'none', transition: 'all 0.3s',
                                                    cursor: pack.is_sold_out ? 'not-allowed' : 'pointer',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                className={!pack.is_sold_out ? 'hover:scale-105 active:scale-95' : ''}
                                            >
                                                <ShoppingBag size={15} />
                                                {t('packs.reserve')}
                                            </button>
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                )}
            </main>

            <style>{`
                @media (max-width: 768px) {
                    .pack-card-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .pack-card-grid > div:first-child,
                    .pack-card-grid > div:last-child {
                        order: unset !important;
                    }
                }
                .pack-card-grid:hover .pack-img {
                    transform: scale(1.04);
                }
            `}</style>
        </div>
    );
}
