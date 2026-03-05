import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    Plus, Tag, Trash2, Loader2, ToggleLeft,
    ToggleRight, Clock, Calendar, X, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Promos() {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percent',
        discount_value: '',
        min_order: 0,
        max_uses: 100,
        expires_at: '',
        is_active: true
    });

    useEffect(() => {
        fetchCodes();
    }, []);

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
            setCodes(data || []);
        } catch (error) {
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id, current) => {
        try {
            await supabase.from('promo_codes').update({ is_active: !current }).eq('id', id);
            setCodes(codes.map(c => c.id === id ? { ...c, is_active: !current } : c));
            toast.success('Statut mis à jour');
        } catch (error) {
            toast.error('Erreur');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await supabase.from('promo_codes').insert([{
                ...formData,
                code: formData.code.toUpperCase(),
                discount_value: parseFloat(formData.value || formData.discount_value),
                uses_count: 0
            }]);
            toast.success('Code promo créé');
            setIsModalOpen(false);
            fetchCodes();
        } catch (error) {
            toast.error('Erreur lors de la création');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-8" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
            <header className="flex justify-between items-center">
                <div>
                    <h1 style={{ fontSize: '32px', fontFamily: 'serif' }}>Codes Promo</h1>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>Gérer les réductions et offres spéciales</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{ backgroundColor: '#111111', color: 'white', padding: '0 24px', height: '56px', borderRadius: '16px', fontWeight: '700', fontSize: '14px' }}
                    className="flex items-center gap-2"
                >
                    <Plus size={20} /> Créer un Code
                </button>
            </header>

            {loading ? (
                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#C3AB7E]" size={40} /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {codes.map(code => (
                        <div key={code.id} style={{ backgroundColor: 'white', borderRadius: '32px', border: '1px solid #f0ede8', padding: '32px' }} className="group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div style={{ backgroundColor: '#fdfbf7', color: '#111', padding: '12px 20px', borderRadius: '12px', border: '1px solid #C3AB7E', fontWeight: '800', letterSpacing: '0.1em' }}>
                                    {code.code}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => toggleStatus(code.id, code.is_active)} className={code.is_active ? 'text-green-500' : 'text-gray-300'}>
                                        {code.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-400 text-sm font-medium">Réduction</span>
                                    <span style={{ fontWeight: '800' }}>{code.discount_type === 'percent' ? `${code.discount_value}%` : `${code.discount_value} DA`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 text-sm font-medium">Utilisations</span>
                                    <span style={{ fontWeight: '800' }}>{code.uses_count} / {code.max_uses}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 text-sm font-medium">Expire le</span>
                                    <span style={{ fontWeight: '800' }} className="flex items-center gap-2"><Clock size={14} /> {new Date(code.expires_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="bg-white rounded-[40px] w-full max-w-lg relative z-10 p-10">
                        <h2 style={{ fontSize: '28px', fontFamily: 'serif', marginBottom: '32px' }}>Nouveau Code Promo</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Code</label>
                                <input required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" placeholder="SOLDES2024" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Type</label>
                                    <select value={formData.discount_type} onChange={e => setFormData({ ...formData, discount_type: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]">
                                        <option value="percent">Pourcentage (%)</option>
                                        <option value="fixed">Montant Fixe (DA)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Valeur</label>
                                    <input required type="number" value={formData.discount_value} onChange={e => setFormData({ ...formData, discount_value: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Date d'expiration</label>
                                <input required type="date" value={formData.expires_at} onChange={e => setFormData({ ...formData, expires_at: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                            </div>
                            <button type="submit" style={{ width: '100%', height: '72px', backgroundColor: '#111111', color: 'white', borderRadius: '20px', fontWeight: '800', fontSize: '14px', marginTop: '20px' }}>
                                CRÉER LE CODE PROMO
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
