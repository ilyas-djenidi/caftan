import { useState, useEffect } from 'react';
import {
    Plus, Search, Edit2, Trash2, X, Loader2,
    Image as ImageIcon, Check, Package,
    Boxes, AlertCircle, Upload
} from 'lucide-react';
import { getPacks, createPack, updatePack, deletePack } from '../../api/packs.api';
import toast from 'react-hot-toast';

export default function PacksAdmin() {
    const [packs, setPacks] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPack, setEditingPack] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [newImagePreview, setNewImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        name_fr: '',
        name_ar: '',
        description_fr: '',
        description_ar: '',
        price: '',
        original_price: '',
        savings: 0,
        image: null,
        image_url: '',
        is_active: true,
        is_sold_out: false,
        items: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: packsData } = await getPacks();
            // We need a separate call for products or ensure getPacks includes them properly
            // Looking at the console logs in previous turns, we need all products for selection
            const { data: prodsData } = await import('../../lib/supabase').then(m =>
                m.supabase.from('products').select('id, name_fr, price, is_visible').eq('is_visible', true)
            );

            setPacks(packsData || []);
            setProducts(prodsData || []);
        } catch (error) {
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (pack = null) => {
        setNewImagePreview(null);
        if (pack) {
            setEditingPack(pack);
            setFormData({
                name_fr: pack.name_fr || '',
                name_ar: pack.name_ar || '',
                description_fr: pack.description_fr || '',
                description_ar: pack.description_ar || '',
                price: pack.price?.toString() || '',
                original_price: pack.original_price?.toString() || '',
                savings: pack.savings || 0,
                image: null,
                image_url: pack.image_url || '',
                is_active: pack.is_active ?? true,
                is_sold_out: pack.is_sold_out ?? false,
                items: pack.items?.map(item => ({
                    product_id: item.id,
                    quantity: item.PackItem?.quantity || 1
                })) || []
            });
        } else {
            setEditingPack(null);
            setFormData({
                name_fr: '',
                name_ar: '',
                description_fr: '',
                description_ar: '',
                price: '',
                original_price: '',
                savings: 0,
                image: null,
                image_url: '',
                is_active: true,
                is_sold_out: false,
                items: []
            });
        }
        setIsModalOpen(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onload = (ev) => setNewImagePreview(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handlePriceChange = (field, value) => {
        const newFormData = { ...formData, [field]: value };
        const price = parseFloat(newFormData.price) || 0;
        const original = parseFloat(newFormData.original_price) || 0;

        if (original > price) {
            newFormData.savings = original - price;
        } else {
            newFormData.savings = 0;
        }
        setFormData(newFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const data = new FormData();
            data.append('name_fr', formData.name_fr);
            data.append('name_ar', formData.name_ar);
            data.append('description_fr', formData.description_fr);
            data.append('description_ar', formData.description_ar);
            data.append('price', formData.price);
            data.append('original_price', formData.original_price);
            data.append('savings', formData.savings);
            data.append('is_active', formData.is_active);
            data.append('is_sold_out', formData.is_sold_out);

            if (formData.image) {
                data.append('image', formData.image);
            } else {
                data.append('image_url', formData.image_url);
            }

            const productIds = formData.items.map(i => i.product_id);
            const quantities = formData.items.map(i => i.quantity);
            data.append('product_ids', JSON.stringify(productIds));
            data.append('quantities', JSON.stringify(quantities));

            if (editingPack) {
                await updatePack(editingPack.id, data);
                toast.success('Pack mis à jour');
            } else {
                await createPack(data);
                toast.success('Pack créé');
            }

            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Pack error:', error);
            toast.error('Erreur lors de l’enregistrement');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleProduct = (productId) => {
        setFormData(prev => {
            const exists = prev.items.find(i => i.product_id === productId);
            if (exists) return { ...prev, items: prev.items.filter(i => i.product_id !== productId) };
            return { ...prev, items: [...prev.items, { product_id: productId, quantity: 1 }] };
        });
    };

    const updateQuantity = (productId, q) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.product_id === productId ? { ...item, quantity: Math.max(1, q) } : item
            )
        }));
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce pack ?')) return;
        try {
            await deletePack(id);
            toast.success('Pack supprimé');
            fetchData();
        } catch (error) {
            toast.error('Erreur de suppression');
        }
    };

    return (
        <div className="space-y-8" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
            <header className="flex justify-between items-center sm:flex-row flex-col gap-4">
                <div>
                    <h1 style={{ fontSize: '32px', fontFamily: 'serif' }}>Packs</h1>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>Collections et Bundles</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    style={{ backgroundColor: '#111111', color: 'white', padding: '0 24px', height: '56px', borderRadius: '16px', fontWeight: '700', fontSize: '14px' }}
                    className="flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                    <Plus size={20} /> Nouveau Pack
                </button>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#C3AB7E]" size={40} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {packs.map(pack => (
                        <div key={pack.id} style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #f0ede8', padding: '24px' }} className="group">
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ width: '100px', height: '100px', borderRadius: '20px', backgroundColor: '#fafafa', overflow: 'hidden', flexShrink: 0 }}>
                                    <img src={pack.image_url || '/placeholder.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={pack.name_fr} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{pack.name_fr}</h3>
                                    <div className="flex flex-col gap-1 mt-1">
                                        <span style={{ fontSize: '14px', color: '#C3AB7E', fontWeight: '800' }}>{pack.price.toLocaleString()} DA</span>
                                        {pack.original_price && (
                                            <span style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'line-through' }}>{pack.original_price.toLocaleString()} DA</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => handleOpenModal(pack)} className="p-2 bg-[#f0ede8] rounded-lg hover:bg-[#C3AB7E] hover:text-white transition-colors"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(pack.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '20px' }}>
                                <p style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.1em' }}>Contenu du Pack</p>
                                <div className="space-y-2">
                                    {pack.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-[13px]">
                                            <span className="text-gray-600">{item.name_fr}</span>
                                            <span style={{ fontWeight: '800', color: '#111' }}>x{item.PackItem?.quantity || 1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                        borderRadius: '32px',
                        width: '100%',
                        maxWidth: '900px',
                        position: 'relative',
                        padding: 'clamp(20px, 4vw, 48px)',
                        margin: 'auto'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '32px', gap: '16px'
                        }}>
                            <h2 style={{ fontSize: '28px', fontFamily: 'serif', margin: 0 }}>
                                Éditeur de Pack
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                border: '1px solid #F0EDE8', background: 'white',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Section: Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Nom du Pack (Français)*</label>
                                        <input required value={formData.name_fr} onChange={e => setFormData({ ...formData, name_fr: e.target.value })} style={{ width: '100%', height: '56px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Nom du Pack (Arabe)</label>
                                        <input value={formData.name_ar} onChange={e => setFormData({ ...formData, name_ar: e.target.value })} dir="rtl" style={{ width: '100%', height: '56px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Image de Couverture</label>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ width: '100px', height: '100px', borderRadius: '16px', border: '2px dashed #f0ede8', backgroundColor: '#fafafa', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {newImagePreview || formData.image_url ? (
                                                <img src={newImagePreview || formData.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <ImageIcon size={32} className="text-gray-300" />
                                            )}
                                        </div>
                                        <label style={{ flex: 1, height: '100px', display: 'flex', border: '2px dashed #f0ede8', borderRadius: '16px', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} className="hover:border-[#C3AB7E] transition-colors">
                                            <div className="text-center">
                                                <Upload size={20} className="mx-auto text-[#C3AB7E] mb-2" />
                                                <span style={{ fontSize: '12px', fontWeight: '700' }}>Cliquer pour uploader</span>
                                            </div>
                                            <input type="file" onChange={handleImageChange} accept="image/*" style={{ display: 'none' }} />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Pricing */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Prix Pack (DA)*</label>
                                    <input required type="number" value={formData.price} onChange={e => handlePriceChange('price', e.target.value)} style={{ width: '100%', height: '56px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Prix Original (DA)</label>
                                    <input type="number" value={formData.original_price} onChange={e => handlePriceChange('original_price', e.target.value)} style={{ width: '100%', height: '56px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Économie (DA)</label>
                                    <div style={{ width: '100%', height: '56px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', display: 'flex', alignItems: 'center', backgroundColor: '#FDF6E7', color: '#C3AB7E', fontWeight: '800' }}>
                                        {formData.savings.toLocaleString()} DA
                                    </div>
                                </div>
                            </div>

                            {/* Section: Description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Description (Français)</label>
                                    <textarea rows="4" value={formData.description_fr} onChange={e => setFormData({ ...formData, description_fr: e.target.value })} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', resize: 'none' }} className="bg-[#fafafa]" />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Description (Arabe)</label>
                                    <textarea rows="4" value={formData.description_ar} onChange={e => setFormData({ ...formData, description_ar: e.target.value })} dir="rtl" style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', resize: 'none' }} className="bg-[#fafafa]" />
                                </div>
                            </div>

                            {/* Section: Products Selection */}
                            <div className="space-y-4">
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Composants du Pack ({formData.items.length})</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                                    {products.map(p => {
                                        const selectedItem = formData.items.find(i => i.product_id === p.id);
                                        return (
                                            <div key={p.id} style={{
                                                padding: '16px', borderRadius: '20px',
                                                border: selectedItem ? '2px solid #C3AB7E' : '1px solid #f0ede8',
                                                backgroundColor: selectedItem ? '#fdfbf7' : 'white',
                                                display: 'flex', alignItems: 'center', gap: '16px',
                                                transition: 'all 0.2s'
                                            }}>
                                                <div onClick={() => toggleProduct(p.id)} style={{ flex: 1, cursor: 'pointer' }}>
                                                    <p style={{ fontSize: '14px', fontWeight: selectedItem ? '700' : '500', margin: 0 }}>{p.name_fr}</p>
                                                    <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{p.price.toLocaleString()} DA</p>
                                                </div>

                                                {selectedItem && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #f0ede8' }}>
                                                        <button type="button" onClick={() => updateQuantity(p.id, selectedItem.quantity - 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#fafafa', border: 'none', fontWeight: '800' }}>-</button>
                                                        <span style={{ fontSize: '13px', fontWeight: '800', minWidth: '20px', textAlign: 'center' }}>{selectedItem.quantity}</span>
                                                        <button type="button" onClick={() => updateQuantity(p.id, selectedItem.quantity + 1)} style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: '#fafafa', border: 'none', fontWeight: '800' }}>+</button>
                                                    </div>
                                                )}

                                                <div onClick={() => toggleProduct(p.id)} style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${selectedItem ? '#C3AB7E' : '#f0ede8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: selectedItem ? '#C3AB7E' : 'transparent' }}>
                                                    {selectedItem && <Check size={14} color="white" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 16px', borderRadius: '12px', border: `2px solid ${formData.is_active ? '#C3AB7E' : '#F0EDE8'}`, backgroundColor: formData.is_active ? '#FDF6E7' : 'white' }}>
                                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} style={{ display: 'none' }} />
                                    <div style={{ width: '18px', height: '18px', borderRadius: '6px', backgroundColor: formData.is_active ? '#C3AB7E' : 'white', border: `2px solid ${formData.is_active ? '#C3AB7E' : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {formData.is_active && <Check size={12} color="white" />}
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: '800' }}>Pack Actif</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 16px', borderRadius: '12px', border: `2px solid ${formData.is_sold_out ? '#ef4444' : '#F0EDE8'}`, backgroundColor: formData.is_sold_out ? '#FEF2F2' : 'white' }}>
                                    <input type="checkbox" checked={formData.is_sold_out} onChange={e => setFormData({ ...formData, is_sold_out: e.target.checked })} style={{ display: 'none' }} />
                                    <div style={{ width: '18px', height: '18px', borderRadius: '6px', backgroundColor: formData.is_sold_out ? '#ef4444' : 'white', border: `2px solid ${formData.is_sold_out ? '#ef4444' : '#D1D5DB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {formData.is_sold_out && <Check size={12} color="white" />}
                                    </div>
                                    <span style={{ fontSize: '12px', fontWeight: '800' }}>Épuisé</span>
                                </label>
                            </div>

                            <button disabled={isSaving} type="submit" style={{ width: '100%', height: '64px', backgroundColor: '#111111', color: 'white', borderRadius: '100px', fontWeight: '800', fontSize: '14px', letterSpacing: '0.1em', marginTop: '40px' }} className="hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
                                {isSaving ? <Loader2 className="animate-spin" /> : 'ENREGISTRER LE PACK'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
