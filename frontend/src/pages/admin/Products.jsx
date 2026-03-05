import { useState, useEffect } from 'react';
import {
    Plus, Search, Edit2, Trash2, Loader2,
    Image as ImageIcon, X, Eye, EyeOff, Upload,
    Check, Sparkles, AlertCircle
} from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products.api';
import toast from 'react-hot-toast';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [formData, setFormData] = useState({
        name_fr: '',
        name_ar: '',
        category: 'caftans',
        price: '',
        original_price: '',
        description_fr: '',
        description_ar: '',
        stock_count: 0,
        in_stock: true,
        featured: false,
        on_sale: false,
        is_new: true,
        is_visible: true,
        images: [],
        attributes: []
    });

    useEffect(() => {
        loadProducts();
    }, [page, searchTerm]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const { data } = await getProducts({
                page,
                search: searchTerm,
                limit: 10
            });
            setProducts(data.products || []);
            setTotalPages(data.totalPages || 1);
            setTotalItems(data.total || 0);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Erreur lors du chargement des produits');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                ...product,
                price: product.price.toString(),
                original_price: product.original_price?.toString() || '',
                images: [], // New images to upload
                existing_images: product.images || []
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name_fr: '',
                name_ar: '',
                category: 'caftans',
                price: '',
                original_price: '',
                description_fr: '',
                description_ar: '',
                stock_count: 10,
                in_stock: true,
                featured: false,
                on_sale: false,
                is_new: true,
                is_visible: true,
                images: [],
                attributes: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'images') {
                    formData.images.forEach(file => data.append('images', file));
                } else if (key === 'attributes') {
                    data.append('attributes', JSON.stringify(formData.attributes));
                } else {
                    data.append(key, formData[key]);
                }
            });

            if (editingProduct) {
                await updateProduct(editingProduct.id, data);
                toast.success('Produit mis à jour');
            } else {
                await createProduct(data);
                toast.success('Produit créé');
            }
            setIsModalOpen(false);
            loadProducts();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error('Une erreur est survenue');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce produit ?')) return;
        try {
            await deleteProduct(id);
            toast.success('Produit supprimé');
            loadProducts();
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 style={{ fontSize: '32px', fontFamily: 'serif' }}>Gestion des Produits</h1>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>{totalItems} produits au total</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Rechercher..."
                            style={{ padding: '0 16px 0 40px', height: '48px', borderRadius: '12px', border: '1px solid #f0ede8', width: '240px', outline: 'none' }}
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        style={{ backgroundColor: '#111111', color: 'white', padding: '0 24px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={20} /> Nouveau Produit
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#C3AB7E]" size={40} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {products.map(product => (
                        <div key={product.id} style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #f0ede8', overflow: 'hidden' }} className="group">
                            <div style={{ aspectRatio: '1/1', backgroundColor: '#fafafa', position: 'relative' }}>
                                <img src={product.images?.[0]?.image_url || '/placeholder.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button onClick={() => handleOpenModal(product)} className="p-3 bg-white rounded-xl hover:scale-110 transition-transform"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(product.id)} className="p-3 bg-white text-red-500 rounded-xl hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                                </div>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#C3AB7E', textTransform: 'uppercase' }}>{product.category}</span>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name_fr}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span style={{ fontWeight: '800' }}>{product.price.toLocaleString()} DA</span>
                                    <span style={{ fontSize: '11px', color: product.stock_count > 0 ? '#16a34a' : '#ef4444', fontWeight: '700' }}>
                                        {product.stock_count} EN STOCK
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, bottom: 0, right: 0, left: 0,
                    zIndex: 200,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    overflowY: 'auto'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '32px',
                        width: '100%',
                        maxWidth: '860px',
                        maxHeight: '85vh',
                        overflowY: 'auto',
                        position: 'relative',
                        padding: 'clamp(24px, 4vw, 48px)',
                        margin: 'auto'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '32px'
                        }}>
                            <h2 style={{ fontSize: '28px', fontFamily: 'serif', margin: 0 }}>
                                {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    width: '44px', height: '44px', borderRadius: '50%',
                                    border: '1px solid #F0EDE8', background: 'white',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Nom (Français)</label>
                                        <input required value={formData.name_fr} onChange={e => setFormData({ ...formData, name_fr: e.target.value })} style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Catégorie</label>
                                        <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]">
                                            <option value="caftans">Caftans</option>
                                            <option value="sacs">Sacs</option>
                                            <option value="accessoires">Accessoires</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Prix (DA)</label>
                                            <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                        </div>
                                        <div className="space-y-2">
                                            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Stock</label>
                                            <input required type="number" value={formData.stock_count} onChange={e => setFormData({ ...formData, stock_count: e.target.value })} style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Description (Français)</label>
                                        <textarea rows="4" value={formData.description_fr} onChange={e => setFormData({ ...formData, description_fr: e.target.value })} style={{ width: '100%', padding: '20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none', resize: 'none' }} className="bg-[#fafafa]" />
                                    </div>
                                    <div className="flex gap-6 pt-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={formData.featured} onChange={e => setFormData({ ...formData, featured: e.target.checked })} />
                                            <span style={{ fontSize: '12px', fontWeight: '700' }}>Mis en avant</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={formData.on_sale} onChange={e => setFormData({ ...formData, on_sale: e.target.checked })} />
                                            <span style={{ fontSize: '12px', fontWeight: '700' }}>En promotion</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: '1px', backgroundColor: '#f0ede8' }} />

                            <button disabled={formLoading} type="submit" style={{ width: '100%', height: '52px', backgroundColor: '#111111', color: 'white', borderRadius: '100px', fontWeight: '800', fontSize: '14px', letterSpacing: '0.1em' }} className="hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-200">
                                {formLoading ? <Loader2 className="animate-spin" /> : (editingProduct ? 'MODIFIER LE PRODUIT' : 'CRÉER LE PRODUIT')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
