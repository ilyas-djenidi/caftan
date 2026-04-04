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

    const [newImagePreviews, setNewImagePreviews] = useState([]);
    const [selectedPresetColor, setSelectedPresetColor] = useState(null);

    const PRESET_COLORS = [
        { name: 'Ivoire', hex: '#F0EBE0' },
        { name: 'Blanc', hex: '#FFFFFF' },
        { name: 'Noir', hex: '#1A1714' },
        { name: 'Bordeaux', hex: '#8B1A1A' },
        { name: 'Rouge', hex: '#C0392B' },
        { name: 'Bleu nuit', hex: '#1A1A4E' },
        { name: 'Vert', hex: '#2D5A27' },
        { name: 'Beige', hex: '#D4B896' },
        { name: 'Doré', hex: '#B8963E' },
        { name: 'Rose', hex: '#E8C4C4' },
        { name: 'Gris', hex: '#9CA3AF' },
        { name: 'Caramel', hex: '#C68642' },
    ];

    const [formData, setFormData] = useState({
        name_fr: '',
        name_ar: '',
        category: 'caftans',
        sub_category: '',
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
        setNewImagePreviews([]);
        setSelectedPresetColor(null);

        if (product) {
            setEditingProduct(product);
            setFormData({
                ...product,
                name_fr: product.name_fr || '',
                name_ar: product.name_ar || '',
                category: product.category || 'caftans',
                sub_category: product.sub_category || '',
                price: product.price?.toString() || '',
                original_price: product.original_price?.toString() || '',
                description_fr: product.description_fr || '',
                description_ar: product.description_ar || '',
                stock_count: product.stock_count || 0,
                in_stock: product.in_stock ?? true,
                featured: product.featured ?? false,
                on_sale: product.on_sale ?? false,
                is_new: product.is_new ?? true,
                is_visible: product.is_visible ?? true,
                images: [], // New images to upload
                existing_images: product.images || [],
                attributes: product.attributes || []
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name_fr: '',
                name_ar: '',
                category: 'caftans',
                sub_category: '',
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
                existing_images: [],
                attributes: []
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNewImagePreviews([]);
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = [...(formData.images || []), ...files];
        setFormData(prev => ({ ...prev, images: newFiles }));

        // Generate previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setNewImagePreviews(prev => [...prev, ev.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeNewImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
        setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (id) => {
        setFormData(prev => ({
            ...prev,
            existing_images: prev.existing_images.filter(img => img.id !== id)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'images') {
                    formData.images.forEach(file => data.append('images', file));
                } else if (key === 'existing_images') {
                    data.append('existing_images', JSON.stringify(formData.existing_images));
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
            handleCloseModal();
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(20px, 4vw, 28px)', fontFamily: 'serif', fontWeight: '700', margin: 0 }}>Produits</h1>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: '100%' }} className="sm:w-auto">
                    <div className="relative" style={{ flex: 1, minWidth: '160px' }}>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Rechercher..."
                            style={{ padding: '0 16px 0 40px', height: '48px', borderRadius: '12px', border: '1px solid #f0ede8', width: '100%', outline: 'none' }}
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        style={{ backgroundColor: '#111111', color: 'white', padding: '0 24px', borderRadius: '12px', height: '48px', fontWeight: '700', fontSize: '14px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                        <Plus size={20} /> Nouveau Produit
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#C3AB7E]" size={40} /></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {products.map(product => (
                        <div key={product.id} style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #f0ede8', overflow: 'hidden' }} className="group">
                            <div style={{ aspectRatio: '1/1', backgroundColor: '#fafafa', position: 'relative' }}>
                                <img src={product.images?.[0]?.image_url || '/placeholder.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                    <button onClick={() => handleOpenModal(product)} className="p-5 bg-white rounded-2xl hover:scale-110 transition-all shadow-xl"><Edit2 size={24} /></button>
                                    <button onClick={() => handleDelete(product.id)} className="p-5 bg-white text-red-500 rounded-2xl hover:scale-110 transition-all shadow-xl"><Trash2 size={24} /></button>
                                </div>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#C3AB7E', textTransform: 'uppercase' }}>{product.category}</span>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '4px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name_fr}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span style={{ fontWeight: '800' }}>{product.price.toLocaleString('fr-FR')} DA</span>
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
                    position: 'fixed', inset: 0, zIndex: 200,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: '20px',
                    overflowY: 'auto'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '28px',
                        width: '100%',
                        maxWidth: '900px',
                        position: 'relative',
                        padding: 'clamp(20px, 4vw, 40px)',
                        margin: 'auto',
                        overflowY: 'visible'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '32px'
                        }}>
                            <h2 style={{ fontSize: '28px', fontFamily: 'serif', margin: 0 }}>
                                {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit'}
                            </h2>
                            <button
                                type="button"
                                onClick={handleCloseModal}
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
                            {/* Section 1: Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Nom (Français)*</label>
                                    <input required value={formData.name_fr} onChange={e => setFormData({ ...formData, name_fr: e.target.value })} style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Nom (Arabe)</label>
                                    <input value={formData.name_ar} onChange={e => setFormData({ ...formData, name_ar: e.target.value })} dir="rtl" style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Catégorie*</label>
                                    <select required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]">
                                        <option value="caftans">Caftans</option>
                                        <option value="sacs">Sacs</option>
                                        <option value="accessoires">Accessoires</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Sous-catégorie</label>
                                    <input value={formData.sub_category || ''} onChange={e => setFormData({ ...formData, sub_category: e.target.value })} style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                </div>
                            </div>

                            {/* Section 2: Pricing */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Prix (DA)*</label>
                                    <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Prix Original (DA)</label>
                                    <input type="number" value={formData.original_price} onChange={e => setFormData({ ...formData, original_price: e.target.value })} style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Stock*</label>
                                    <input required type="number" value={formData.stock_count} onChange={e => setFormData({ ...formData, stock_count: e.target.value })} style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                </div>
                            </div>

                            {/* Section 3: Description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Description (Français)</label>
                                    <textarea rows="4" value={formData.description_fr} onChange={e => setFormData({ ...formData, description_fr: e.target.value })} style={{ width: '100%', padding: '20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none', resize: 'none' }} className="bg-[#fafafa]" />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Description (Arabe)</label>
                                    <textarea rows="4" value={formData.description_ar} onChange={e => setFormData({ ...formData, description_ar: e.target.value })} dir="rtl" style={{ width: '100%', padding: '20px', borderRadius: '12px', border: '1px solid #f0ede8', outline: 'none', resize: 'none' }} className="bg-[#fafafa]" />
                                </div>
                            </div>

                            {/* Section 4: Images */}
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>
                                    Images du Produit
                                </label>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                                    {(formData.existing_images || []).map((img, i) => (
                                        <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: img.is_primary ? '2px solid #C3AB7E' : '1px solid #F0EDE8' }}>
                                            <img src={img.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button type="button" onClick={() => removeExistingImage(img.id)} style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                            {img.is_primary && <span style={{ position: 'absolute', bottom: '4px', left: '4px', backgroundColor: '#C3AB7E', color: 'white', fontSize: '8px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>PRINCIPALE</span>}
                                        </div>
                                    ))}
                                    {newImagePreviews.map((src, i) => (
                                        <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #F0EDE8' }}>
                                            <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button type="button" onClick={() => removeNewImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                                        </div>
                                    ))}
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '16px', border: '2px dashed #F0EDE8', cursor: 'pointer', backgroundColor: '#FAFAFA', transition: 'all 0.2s' }} className="hover:border-[#C3AB7E] hover:bg-white">
                                    <Upload size={20} style={{ color: '#C3AB7E' }} />
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#6b7280' }}>Cliquer pour ajouter des images</span>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                                </label>
                            </div>

                            {/* Section 5: Sizes */}
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>Tailles Disponibles</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '36', '38', '40', '42', '44', '46', '48', '50', '52'].map(size => (
                                        <button
                                            key={size} type="button"
                                            onClick={() => {
                                                const sizes = formData.attributes?.filter(a => a.type === 'size') || [];
                                                const exists = sizes.find(a => a.value === size);
                                                if (exists) {
                                                    setFormData(prev => ({ ...prev, attributes: prev.attributes.filter(a => !(a.type === 'size' && a.value === size)) }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, attributes: [...(prev.attributes || []), { type: 'size', value: size, label: size, is_available: true }] }));
                                                }
                                            }}
                                            style={{
                                                padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '800',
                                                border: formData.attributes?.find(a => a.type === 'size' && a.value === size)
                                                    ? '2px solid #C3AB7E' : '1px solid #F0EDE8',
                                                backgroundColor: formData.attributes?.find(a => a.type === 'size' && a.value === size)
                                                    ? '#FDF6E7' : 'white',
                                                color: formData.attributes?.find(a => a.type === 'size' && a.value === size)
                                                    ? '#C3AB7E' : '#6b7280',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >{size}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Section 6: Colors */}
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>Couleurs Disponibles</label>

                                {/* Selected colors chips */}
                                {(formData.attributes?.filter(a => a.type === 'color') || []).length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                                        {(formData.attributes?.filter(a => a.type === 'color') || []).map((color, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', border: '1px solid #F0EDE8', backgroundColor: 'white' }}>
                                                <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: color.value, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                                                <span style={{ fontSize: '11px', fontWeight: '600' }}>{color.label}</span>
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, attributes: prev.attributes.filter((_, idx) => idx !== prev.attributes.findIndex(a => a.type === 'color' && a.value === color.value)) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '16px', padding: '0 0 0 2px', lineHeight: 1 }}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Preset color swatches */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                                    {PRESET_COLORS.map(color => (
                                        <div
                                            key={color.hex}
                                            onClick={() => {
                                                const exists = formData.attributes?.find(a => a.type === 'color' && a.value === color.hex);
                                                if (!exists) {
                                                    setFormData(prev => ({ ...prev, attributes: [...(prev.attributes || []), { type: 'color', value: color.hex, label: color.name, is_available: true }] }));
                                                }
                                                setSelectedPresetColor(color);
                                            }}
                                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                        >
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                backgroundColor: color.hex,
                                                border: selectedPresetColor?.hex === color.hex ? '2px solid #B8963E' : '2px solid #E8E2D6',
                                                boxShadow: selectedPresetColor?.hex === color.hex ? '0 0 0 3px rgba(184,150,62,0.3)' : 'none',
                                                transition: 'all 0.2s',
                                            }} />
                                            <span style={{ fontSize: '9px', fontFamily: "'Jost', sans-serif", fontWeight: '300', color: '#6B6458', textAlign: 'center', letterSpacing: '0.05em' }}>{color.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section: Models */}
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '12px' }}>Modèles (Numéros)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(modelNum => {
                                        const modelStr = modelNum.toString();
                                        return (
                                        <button
                                            key={modelStr} type="button"
                                            onClick={() => {
                                                const models = formData.attributes?.filter(a => a.type === 'model') || [];
                                                const exists = models.find(a => a.value === modelStr);
                                                if (exists) {
                                                    setFormData(prev => ({ ...prev, attributes: prev.attributes.filter(a => !(a.type === 'model' && a.value === modelStr)) }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, attributes: [...(prev.attributes || []), { type: 'model', value: modelStr, label: modelStr, is_available: true }] }));
                                                }
                                            }}
                                            style={{
                                                padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: '800',
                                                border: formData.attributes?.find(a => a.type === 'model' && a.value === modelStr)
                                                    ? '2px solid #C3AB7E' : '1px solid #F0EDE8',
                                                backgroundColor: formData.attributes?.find(a => a.type === 'model' && a.value === modelStr)
                                                    ? '#FDF6E7' : 'white',
                                                color: formData.attributes?.find(a => a.type === 'model' && a.value === modelStr)
                                                    ? '#C3AB7E' : '#6b7280',
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >{modelStr}</button>
                                    )})}
                                </div>
                            </div>

                            {/* Section 7: Toggles */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                {[
                                    { key: 'featured', label: 'Mis en avant' },
                                    { key: 'is_new', label: 'Nouveauté' },
                                    { key: 'on_sale', label: 'En promotion' },
                                    { key: 'in_stock', label: 'En stock' },
                                    { key: 'is_visible', label: 'Visible' },
                                ].map(({ key, label }) => (
                                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 16px', borderRadius: '12px', border: `2px solid ${formData[key] ? '#C3AB7E' : '#F0EDE8'}`, backgroundColor: formData[key] ? '#FDF6E7' : 'white', transition: 'all 0.2s' }}>
                                        <input type="checkbox" checked={!!formData[key]} onChange={e => setFormData(prev => ({ ...prev, [key]: e.target.checked }))} style={{ display: 'none' }} />
                                        <div style={{ width: '18px', height: '18px', borderRadius: '6px', backgroundColor: formData[key] ? '#C3AB7E' : 'white', border: `2px solid ${formData[key] ? '#C3AB7E' : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                                            {formData[key] && <span style={{ color: 'white', fontSize: '12px', fontWeight: '900' }}>✓</span>}
                                        </div>
                                        <span style={{ fontSize: '12px', fontWeight: '800', color: formData[key] ? '#C3AB7E' : '#6b7280' }}>{label}</span>
                                    </label>
                                ))}
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
