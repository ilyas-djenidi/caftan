import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Loader2, CheckCircle, Upload, Layout } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HeroManager() {
    const [heroData, setHeroData] = useState({
        title_fr: 'Maison du Caftans',
        subtitle_fr: 'L’excellence du savoir-faire traditionnel au service de votre élégance.',
        cta_text_fr: 'DÉCOUVRIR LES COLLECTIONS',
        image_url: '/hero-main.jpg'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'hero_content').maybeSingle();
            if (!error && data?.value) {
                setHeroData(prev => ({ ...prev, ...data.value }));
            }
        } catch (error) {
            console.warn('site_settings table not found, using defaults');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase.from('site_settings').upsert({
                key: 'hero_content',
                value: heroData,
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
            toast.success('Paramètres enregistrés');
        } catch (error) {
            toast.error('Erreur (table manquante ?)');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-8" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
            <header className="flex justify-between items-center">
                <div>
                    <h1 style={{ fontSize: '32px', fontFamily: 'serif' }}>Gestion du Contenu</h1>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>Personnalisez l’apparence de votre boutique</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ backgroundColor: '#111111', color: 'white', padding: '0 32px', height: '56px', borderRadius: '16px', fontWeight: '700', fontSize: '14px' }}
                    className="flex items-center gap-2 hover:scale-105 transition-all"
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    ENREGISTRER LES MODIFICATIONS
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <div style={{ backgroundColor: 'white', border: '1px solid #f0ede8', borderRadius: '32px', padding: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontFamily: 'serif', marginBottom: '32px' }}>Section Héro (Accueil)</h2>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Titre Principal</label>
                                <input value={heroData.title_fr} onChange={e => setHeroData({ ...heroData, title_fr: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Sous-titre</label>
                                <textarea rows="3" value={heroData.subtitle_fr} onChange={e => setHeroData({ ...heroData, subtitle_fr: e.target.value })} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', resize: 'none' }} className="bg-[#fafafa]" />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>Texte du Bouton</label>
                                <input value={heroData.cta_text_fr} onChange={e => setHeroData({ ...heroData, cta_text_fr: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                            </div>
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'white', border: '1px solid #f0ede8', borderRadius: '32px', padding: '40px' }}>
                        <h2 style={{ fontSize: '20px', fontFamily: 'serif', marginBottom: '32px' }}>Image de Fond</h2>
                        <div className="space-y-6">
                            <div style={{ aspectRatio: '16/9', backgroundColor: '#fafafa', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f0ede8' }}>
                                <img src={heroData.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>URL de l'image</label>
                                <input value={heroData.image_url} onChange={e => setHeroData({ ...heroData, image_url: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:sticky lg:top-8 h-fit">
                    <div style={{ backgroundColor: 'white', border: '1px solid #f0ede8', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.1)' }}>
                        <div style={{ backgroundColor: '#f0ede8', padding: '12px 24px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af' }}>APERÇU MOBILE</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                            </div>
                        </div>
                        <div style={{ height: '600px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                            <img src={heroData.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                            <div style={{ position: 'absolute', bottom: '60px', left: '40px', right: '40px', color: 'white' }}>
                                <h3 style={{ fontSize: '32px', fontFamily: 'serif', marginBottom: '16px' }}>{heroData.title_fr}</h3>
                                <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '24px' }}>{heroData.subtitle_fr}</p>
                                <div style={{ display: 'inline-block', padding: '16px 32px', border: '1px solid white', borderRadius: '100px', fontSize: '11px', fontWeight: '800' }}>{heroData.cta_text_fr}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

