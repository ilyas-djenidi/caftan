import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, Check, ChevronRight, ArrowRight } from 'lucide-react';
import { getPacks } from '../api/packs.api';
import { useCartStore } from '../store/cartStore';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { getImageUrl } from '../utils';

export default function Packs() {
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
        // Handle pack as a conceptual product for simplicity in cart
        addItem({
            ...pack,
            id: pack.id,
            name: pack.name_fr,
            price: pack.price,
            is_pack: true,
            image: pack.image_url
        });
        openDrawer();
    };

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <Navbar />

            <header className="pt-40 pb-20 text-center container mx-auto px-10">
                <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4em' }}>ÉDITION LIMITÉE</span>
                <h1 style={{ fontSize: '48px', fontFamily: 'serif', marginTop: '16px' }}>Les Packs Mariée</h1>
                <p style={{ color: '#9ca3af', fontSize: '16px', marginTop: '20px', maxWidth: '600px', margin: '20px auto 0' }}>
                    Des ensembles prestigieux conçus pour les moments les plus inoubliables. Le raffinement ultime pour votre grand jour.
                </p>
            </header>

            <main className="container mx-auto px-10 pb-32">
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
                                    flexDirection: idx % 2 === 0 ? 'row' : 'row-reverse',
                                    backgroundColor: 'white',
                                    borderRadius: '60px',
                                    overflow: 'hidden',
                                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.05)',
                                    minHeight: '600px'
                                }}
                                className="flex-col md:flex-row"
                            >
                                {/* Image Section */}
                                <div style={{ flex: 1, position: 'relative' }} className="min-h-[400px]">
                                    <img
                                        src={getImageUrl(pack.image_url)}
                                        alt={pack.name_fr}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {pack.is_sold_out && (
                                        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ backgroundColor: 'white', color: '#111111', padding: '12px 24px', borderRadius: '12px', fontWeight: '800' }}>ÉPUISÉ</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content Section */}
                                <div style={{ flex: 1, padding: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                        <Sparkles size={20} style={{ color: '#C3AB7E' }} />
                                        <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.2em' }}>PACK D'EXCEPTION</span>
                                    </div>

                                    <h2 style={{ fontSize: '40px', fontFamily: 'serif', margin: '0 0 24px' }}>{pack.name_fr}</h2>
                                    <p style={{ color: '#6b7280', fontSize: '16px', lineHeight: '1.8', marginBottom: '40px' }}>
                                        {pack.description_fr}
                                    </p>

                                    {/* Items list */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '48px' }}>
                                        {pack.items?.map((item, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Check size={14} style={{ color: '#C3AB7E' }} />
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#111111' }}>{item.name_fr}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px' }}>
                                        <div>
                                            <span style={{ color: '#9ca3af', fontSize: '14px', textDecoration: 'line-through', display: 'block' }}>{pack.original_price?.toLocaleString()} DA</span>
                                            <span style={{ fontSize: '32px', fontWeight: '800', color: '#111111' }}>{pack.price?.toLocaleString()} DA</span>
                                        </div>
                                        <button
                                            disabled={pack.is_sold_out}
                                            onClick={() => handleAddToCart(pack)}
                                            style={{
                                                backgroundColor: pack.is_sold_out ? '#f0ede8' : '#111111',
                                                color: pack.is_sold_out ? '#9ca3af' : 'white',
                                                padding: '20px 48px', borderRadius: '100px',
                                                fontWeight: '800', fontSize: '12px', letterSpacing: '0.2em',
                                                border: 'none', transition: 'all 0.3s'
                                            }}
                                            className={!pack.is_sold_out ? "hover:scale-105 active:scale-95 shadow-xl shadow-gray-200" : ""}
                                        >
                                            RESERVER MAINTENANT
                                        </button>
                                    </div>
                                </div>
                            </motion.section>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
