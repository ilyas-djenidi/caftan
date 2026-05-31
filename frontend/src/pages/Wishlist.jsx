import { Link, useNavigate } from 'react-router-dom';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { ArrowLeft, Heart } from 'lucide-react';
import ProductCard from '../components/shared/ProductCard';
import { useTranslation } from 'react-i18next';

export default function Wishlist() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { items } = useWishlistStore();

    return (
        <main className="flex-grow pb-0" style={{ paddingTop: 'calc(var(--navbar-height) + 40px)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                <header className="mb-16">
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#9ca3af', textDecoration: 'none', marginBottom: '16px' }} className="hover:text-[#C3AB7E] transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{t('wishlist.back')}</span>
                    </Link>
                    <h1 style={{ fontSize: '48px', fontFamily: 'serif', margin: 0 }}>{t('wishlist.title')}</h1>
                    <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>{t('wishlist.saved', { count: items.length })}</p>
                </header>

                {items.length === 0 ? (
                    <div style={{
                        padding: '120px 0', textAlign: 'center', backgroundColor: '#fafafa',
                        borderRadius: '40px', border: '1px dashed #f0ede8'
                    }}>
                        <div style={{ width: '80px', height: '80px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                            <Heart size={32} style={{ color: '#f0ede8' }} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontFamily: 'serif', marginBottom: '16px' }}>{t('wishlist.empty')}</h2>
                        <p style={{ color: '#9ca3af', fontSize: '16px', maxWidth: '400px', margin: '0 auto 40px' }}>{t('wishlist.emptyDesc')}</p>
                        <Link to="/caftans" style={{
                            display: 'inline-block', backgroundColor: '#111111', color: 'white',
                            padding: '20px 48px', borderRadius: '100px', textDecoration: 'none',
                            fontWeight: '800', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase'
                        }} className="hover:scale-105 transition-all shadow-xl shadow-gray-200">
                            {t('wishlist.explore')}
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {items.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onClick={() => navigate(`/product/${product.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
