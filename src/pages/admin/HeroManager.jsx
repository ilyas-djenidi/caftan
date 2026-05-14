import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Loader2, CheckCircle, Upload, Layout, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage } from '../../lib/compressImage';

export default function HeroManager() {
    const [heroData, setHeroData] = useState({
        title_fr: 'Maison du Caftans',
        subtitle_fr: 'L’excellence du savoir-faire traditionnel au service de votre élégance.',
        cta_text_fr: 'DÉCOUVRIR LES COLLECTIONS',
        image_url: '/hero-main.jpg'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);

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
            toast.error('Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `hero_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `hero/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('caftan-images')
                .upload(filePath, file); // upload raw file, no compression

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('caftan-images')
                .getPublicUrl(filePath);

            const newHeroData = { ...heroData, image_url: publicUrl };
            setHeroData(newHeroData);
            
            // Auto-save
            const { error: saveError } = await supabase.from('site_settings').upsert({
                key: 'hero_content',
                value: newHeroData,
                updated_at: new Date().toISOString()
            });
            
            if (saveError) throw saveError;

            toast.success('Image téléchargée et enregistrée avec succès !');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Erreur lors du téléchargement de l\'image');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
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
                            <div style={{ aspectRatio: '16/9', backgroundColor: '#fafafa', borderRadius: '20px', overflow: 'hidden', border: '1px solid #f0ede8', position: 'relative' }}>
                                <img src={heroData.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Hero preview" />
                                {uploadingImage && (
                                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Loader2 className="animate-spin" size={32} style={{ color: '#C3AB7E' }} />
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageUpload} 
                                        ref={fileInputRef}
                                        style={{ display: 'none' }} 
                                    />
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingImage}
                                        style={{ 
                                            width: '100%', height: '52px', borderRadius: '16px', 
                                            border: '2px dashed #C3AB7E', backgroundColor: '#FDF6E7', 
                                            color: '#C3AB7E', fontWeight: '700', fontSize: '13px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            cursor: uploadingImage ? 'not-allowed' : 'pointer'
                                        }}
                                        className="hover:bg-[#fcf1dd] transition-colors"
                                    >
                                        <Upload size={18} />
                                        {uploadingImage ? 'Téléchargement...' : 'Télécharger une nouvelle image'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ flex: 1, height: '1px', backgroundColor: '#f0ede8' }} />
                                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '800' }}>OU</span>
                                    <div style={{ flex: 1, height: '1px', backgroundColor: '#f0ede8' }} />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>URL de l'image (Lien direct)</label>
                                    <input value={heroData.image_url} onChange={e => setHeroData({ ...heroData, image_url: e.target.value })} style={{ width: '100%', height: '52px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-[#fafafa]" />
                                </div>
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

