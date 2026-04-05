import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../api/products.api';
import ProductCard from './ProductCard';
import { Search, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CollectionGrid({ category, title, subtitle }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [sort, setSort] = useState('newest');
    const navigate = useNavigate();

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            try {
                const params = {
                    category: category,
                    page: page,
                    limit: 12,
                    sort: sort === 'price_asc' || sort === 'price_desc' ? sort : 'newest'
                };
                const { data } = await getProducts(params);
                setProducts(data.products || []);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
            } catch (error) {
                console.error('Error loading products:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProducts();
    }, [category, page, sort]);

    return (
        <div className="min-h-screen bg-white" style={{ overflowX: 'hidden', paddingTop: 'calc(var(--navbar-height) + 32px)' }}>
            {/* Header */}
            <header className="container mx-auto px-4 md:px-10" style={{ marginBottom: '100px', textAlign: 'center' }}>
                <span style={{ color: '#C3AB7E', fontSize: '10px', fontWeight: '800', letterSpacing: '0.3em', textTransform: 'uppercase' }}>COLLECTION</span>
                <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontFamily: 'serif', marginTop: '12px' }}>{title}</h1>
                {subtitle && <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px', maxWidth: '600px', margin: '16px auto 0' }}>{subtitle}</p>}
            </header>

            {/* Grid */}
            <main className="container mx-auto px-4 md:px-10" style={{ paddingBottom: '160px' }}>
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} style={{ aspectRatio: '3/4', backgroundColor: '#F0EDE8' }} className="animate-pulse" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Search size={48} style={{ color: '#f0ede8', marginBottom: '24px' }} />
                        <h3 style={{ fontSize: '20px', fontFamily: 'serif' }}>Aucun produit trouvé</h3>
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>Revenez bientôt ou explorez d'autres catégories.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '80px' }}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #f0ede8', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.3 : 1 }}
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        style={{
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            border: 'none',
                                            backgroundColor: page === i + 1 ? '#111111' : 'transparent',
                                            color: page === i + 1 ? 'white' : '#111111',
                                            fontWeight: '800', fontSize: '12px', cursor: 'pointer'
                                        }}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #f0ede8', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.3 : 1 }}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
