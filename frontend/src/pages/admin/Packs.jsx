import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Plus, Search, Edit2, Trash2, X, Loader2,
    Image as ImageIcon, Check, Package,
    Boxes, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PacksAdmin() {
    const [packs, setPacks] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPack, setEditingPack] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name_fr: '',
        name_ar: '',
        description_fr: '',
        description_ar: '',
        price: '',
        original_price: '',
        cover_image_url: '',
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
            const { data: packsData } = await supabase
                .from('packs')
                .select(`*, pack_items(product_id, quantity, products(name_fr))`)
                .order('created_at', { ascending: false });

            const { data: prodsData } = await supabase
                .from('products')
                .select('id, name_fr, price, is_visible')
                .eq('is_visible', true);

            setPacks(packsData || []);
            setProducts(prodsData || []);
        } catch (error) {
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (pack) => {
        setEditingPack(pack);
        setFormData({
            ...pack,
            price: pack.price.toString(),
            original_price: pack.original_price?.toString() || '',
            items: pack.pack_items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            }))
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const packData = {
                name_fr: formData.name_fr,
                name_ar: formData.name_ar,
                description_fr: formData.description_fr,
                price: parseFloat(formData.price),
                original_price: formData.original_price ? parseFloat(formData.original_price) : null,
                cover_image_url: formData.cover_image_url,
                is_active: formData.is_active,
                is_sold_out: formData.is_sold_out
            };

            let packId;
            if (editingPack) {
                await supabase.from('packs').update(packData).eq('id', editingPack.id);
                packId = editingPack.id;
            } else {
                const { data } = await supabase.from('packs').insert([packData]).select().single();
                packId = data.id;
            }

            await supabase.from('pack_items').delete().eq('pack_id', packId);
            if (formData.items.length > 0) {
                await supabase.from('pack_items').insert(
                    formData.items.map(item => ({ pack_id: packId, ...item }))
                );
            }

            toast.success('Pack enregistré');
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement');
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

    return (
        <div className="space-y-8" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
            <header className="flex justify-between items-center">
                <div>
                    <h1 style={{ fontSize: '32px', fontFamily: 'serif' }}>Gestion des Packs</h1>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>Collections et Bundles</p>
                </div>
                <button
                    onClick={() => { setEditingPack(null); setIsModalOpen(true); }}
                    style={{ backgroundColor: '#111111', color: 'white', padding: '0 24px', height: '56px', borderRadius: '16px', fontWeight: '700', fontSize: '14px' }}
                    className="flex items-center gap-2"
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
                                <div style={{ width: '100px', height: '100px', borderRadius: '20px', backgroundColor: '#fafafa', overflow: 'hidden' }}>
                                    <img src={pack.cover_image_url || '/placeholder.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{pack.name_fr}</h3>
                                    <span style={{ fontSize: '12px', color: '#C3AB7E', fontWeight: '800' }}>{pack.price.toLocaleString()} DA</span>
                                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(pack)} className="p-2 bg-[#f0ede8] rounded-lg"><Edit2 size={16} /></button>
                                        <button className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '20px' }}>
                                <p style={{ fontSize: '11px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Contenu du Pack</p>
                                <div className="space-y-1">
                                    {pack.pack_items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-[13px]">
                                            <span>{item.products?.name_fr}</span>
                                            <span style={{ fontWeight: '700' }}>x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col">
                        <header className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <h2 style={{ fontSize: '28px', fontFamily: 'serif' }}>Éditeur de Pack</h2>
                            <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center"><X /></button>
                        </header>
                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-grow grid grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Nom du Pack</label>
                                    <input required value={formData.name_fr} onChange={e => setFormData({ ...formData, name_fr: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Prix Pack (DA)</label>
                                        <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Image Preview URL</label>
                                        <input value={formData.cover_image_url} onChange={e => setFormData({ ...formData, cover_image_url: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Description</label>
                                    <textarea rows="4" value={formData.description_fr} onChange={e => setFormData({ ...formData, description_fr: e.target.value })} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', resize: 'none' }} className="bg-[#fafafa]" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Sélectionner les Produits ({formData.items.length})</label>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                    {products.map(p => {
                                        const selected = formData.items.find(i => i.product_id === p.id);
                                        return (
                                            <div key={p.id} onClick={() => toggleProduct(p.id)} style={{ padding: '16px', borderRadius: '16px', border: selected ? '2px solid #C3AB7E' : '1px solid #f0ede8', backgroundColor: selected ? '#fdfbf7' : 'white', cursor: 'pointer' }} className="flex justify-between items-center transition-all">
                                                <span style={{ fontSize: '14px', fontWeight: selected ? '700' : '400' }}>{p.name_fr}</span>
                                                {selected && <Check size={18} style={{ color: '#C3AB7E' }} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </form>
                        <footer className="p-8 border-t border-gray-100">
                            <button disabled={isSaving} onClick={handleSubmit} style={{ width: '100%', height: '72px', backgroundColor: '#111111', color: 'white', borderRadius: '20px', fontWeight: '800', fontSize: '14px' }}>
                                {isSaving ? <Loader2 className="animate-spin" /> : 'ENREGISTRER LE PACK'}
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
