import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../../api/products.api';
import ProductCard from './ProductCard';
import { Search, Loader2 } from 'lucide-react';

const ROW_SIZE = 4; // products per row (matches lg:grid-cols-4)

export default function CollectionGrid({ category, title, subtitle }) {
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [sort, setSort] = useState('newest');
    const navigate = useNavigate();

    // Sentinel ref — one per loaded row
    const sentinelRef = useRef(null);
    const observerRef = useRef(null);

    const loadPage = useCallback(async (pageNum, replace = false) => {
        if (pageNum === 1) setLoadingInitial(true);
        else setLoadingMore(true);

        try {
            const { data } = await getProducts({
                category,
                page: pageNum,
                limit: ROW_SIZE,
                sort: sort === 'price_asc' || sort === 'price_desc' ? sort : 'newest',
                is_visible: true,
            });

            const fetched = data.products || [];
            setProducts(prev => replace ? fetched : [...prev, ...fetched]);
            setHasMore(fetched.length === ROW_SIZE && pageNum < (data.totalPages || 1));
        } catch (err) {
            console.error('CollectionGrid load error:', err);
        } finally {
            setLoadingInitial(false);
            setLoadingMore(false);
        }
    }, [category, sort]);

    // Reset when category or sort changes
    useEffect(() => {
        setProducts([]);
        setPage(1);
        setHasMore(true);
        loadPage(1, true);
    }, [category, sort]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load next page whenever `page` advances beyond 1
    useEffect(() => {
        if (page === 1) return;
        loadPage(page);
    }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

    // IntersectionObserver: watch the sentinel at the bottom
    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loadingInitial) {
                    setPage(prev => prev + 1);
                }
            },
            { rootMargin: '200px' } // start loading 200px before the sentinel is visible
        );

        if (sentinelRef.current) {
            observerRef.current.observe(sentinelRef.current);
        }

        return () => observerRef.current?.disconnect();
    }, [hasMore, loadingMore, loadingInitial]);

    return (
        <div className="min-h-screen bg-white" style={{ overflowX: 'hidden', paddingTop: 'calc(var(--navbar-height) + 32px)' }}>
            {/* Header */}
            <header className="container mx-auto px-4 md:px-10" style={{ marginBottom: '80px', textAlign: 'center' }}>
                <span style={{ color: '#C3AB7E', fontSize: '10px', fontWeight: '800', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                    COLLECTION
                </span>
                <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontFamily: 'serif', marginTop: '12px' }}>{title}</h1>
                {subtitle && (
                    <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '16px', maxWidth: '600px', margin: '16px auto 0' }}>
                        {subtitle}
                    </p>
                )}
            </header>

            <main className="container mx-auto px-4 md:px-10" style={{ paddingBottom: '160px' }}>
                {/* Initial skeleton */}
                {loadingInitial ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
                        {Array.from({ length: ROW_SIZE }).map((_, i) => (
                            <div key={i} style={{ aspectRatio: '3/4', backgroundColor: '#F0EDE8', borderRadius: '16px' }} className="animate-pulse" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 0' }}>
                        <Search size={48} style={{ color: '#f0ede8', marginBottom: '24px', display: 'block', margin: '0 auto 24px' }} />
                        <h3 style={{ fontSize: '20px', fontFamily: 'serif' }}>Aucun produit trouvé</h3>
                        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
                            Revenez bientôt ou explorez d'autres catégories.
                        </p>
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

                            {/* Inline skeleton row while loading more */}
                            {loadingMore && Array.from({ length: ROW_SIZE }).map((_, i) => (
                                <div
                                    key={`skeleton-${i}`}
                                    style={{ aspectRatio: '3/4', backgroundColor: '#F0EDE8', borderRadius: '16px' }}
                                    className="animate-pulse"
                                />
                            ))}
                        </div>

                        {/* Sentinel — observed to trigger next load */}
                        {hasMore && (
                            <div ref={sentinelRef} style={{ height: '1px', marginTop: '40px' }} aria-hidden="true" />
                        )}

                        {/* End of collection message */}
                        {!hasMore && products.length > 0 && (
                            <div style={{ textAlign: 'center', marginTop: '64px', paddingBottom: '32px' }}>
                                <div style={{ width: '40px', height: '1px', backgroundColor: '#C3AB7E', margin: '0 auto 16px' }} />
                                <p style={{ fontSize: '11px', fontWeight: '700', color: '#C3AB7E', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                                    Fin de la collection
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
