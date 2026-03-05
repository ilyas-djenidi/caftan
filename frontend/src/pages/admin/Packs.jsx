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
                    <h1 style={{ fontSize: '32px', fontFamily: 'serif' }}>Packs</h1>
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
                <div style={{
                    position: 'fixed',
                    top: 0, bottom: 0, right: 0, left: 0,
                    zIndex: 200,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '32px',
                        width: '100%',
                        maxWidth: '860px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        padding: 'clamp(24px, 4vw, 48px)'
                    }}>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: '32px', gap: '16px', flexShrink: 0
                        }}>
                            <h2 style={{ fontSize: '28px', fontFamily: 'serif', margin: 0 }}>
                                Éditeur de Pack
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                border: '1px solid #F0EDE8', background: 'white',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
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
                        <footer className="mt-8 pt-8 border-t border-gray-100" style={{ flexShrink: 0 }}>
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
