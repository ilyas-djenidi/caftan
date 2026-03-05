import { useState } from 'react';
import { Send, MapPin, Phone, Mail, Instagram, MessageCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function Contact() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('messages')
                .insert([{
                    name: formData.name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message,
                    status: 'unread'
                }]);

            if (error) throw error;
            toast.success('Message envoyé avec succès !');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error('Contact error:', error);
            toast.error('Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main style={{ minHeight: 'calc(100vh - var(--navbar-height))', marginTop: 'var(--navbar-height)' }} className="flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-center">
                {/* Form Side */}
                <div style={{ flex: 1, width: '100%', maxWidth: '440px' }}>
                    <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.3em', marginBottom: '12px', display: 'block' }}>NOUS CONTACTER</span>
                    <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontFamily: 'serif', marginBottom: '32px', lineHeight: 1.1 }}>Envoyez-nous<br />un Message</h1>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                                <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Nom</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', height: '44px', borderBottom: '1px solid #e5e7eb', outline: 'none', transition: 'border-color 0.3s', backgroundColor: 'transparent' }} className="focus:border-[#111]" placeholder="Votre nom" />
                            </div>
                            <div className="space-y-1">
                                <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Email</label>
                                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', height: '44px', borderBottom: '1px solid #e5e7eb', outline: 'none', transition: 'border-color 0.3s', backgroundColor: 'transparent' }} className="focus:border-[#111]" placeholder="votre@email.com" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Sujet</label>
                            <input required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} style={{ width: '100%', height: '44px', borderBottom: '1px solid #e5e7eb', outline: 'none', transition: 'border-color 0.3s', backgroundColor: 'transparent' }} className="focus:border-[#111]" placeholder="Sujet de votre message" />
                        </div>
                        <div className="space-y-1">
                            <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af' }}>Message</label>
                            <textarea required rows="1" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} style={{ width: '100%', borderBottom: '1px solid #e5e7eb', outline: 'none', transition: 'border-color 0.3s', backgroundColor: 'transparent', resize: 'none', paddingTop: '12px' }} className="focus:border-[#111]" placeholder="Votre message..." />
                        </div>
                        <button disabled={loading} type="submit" style={{ width: '100%', height: '52px', backgroundColor: '#111111', color: 'white', fontWeight: '800', fontSize: '12px', letterSpacing: '0.1em', marginTop: '32px' }} className="hover:bg-[#C3AB7E] transition-colors flex items-center justify-center gap-3">
                            {loading ? <Loader2 className="animate-spin" /> : <>ENVOYER LE MESSAGE <Send size={16} /></>}
                        </button>
                    </form>
                </div>

                {/* Info Side */}
                <div style={{ flex: 1, backgroundColor: '#fafafa', padding: 'clamp(32px, 4vw, 48px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', maxWidth: '440px' }} className="rounded-2xl">
                    <h3 style={{ fontSize: '22px', fontFamily: 'serif', marginBottom: '32px' }}>Maison du Caftans</h3>
                    <div className="space-y-10">
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #f0ede8' }}>
                                <MapPin size={16} style={{ color: '#C3AB7E' }} />
                            </div>
                            <div>
                                <p style={{ fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Adresse Prestige</p>
                                <p style={{ color: '#6b7280', fontSize: '13px' }}>Quartier Élégant, Alger Centre</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #f0ede8' }}>
                                <Phone size={16} style={{ color: '#C3AB7E' }} />
                            </div>
                            <div>
                                <p style={{ fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>Contact Direct</p>
                                <p style={{ color: '#6b7280', fontSize: '13px' }}>+213 (0) 555 55 55 55</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #f0ede8' }}>
                                <MessageCircle size={16} style={{ color: '#C3AB7E' }} />
                            </div>
                            <div>
                                <p style={{ fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>WhatsApp Conciergerie</p>
                                <p style={{ color: '#6b7280', fontSize: '13px' }}>Disponibilité Immédiate</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid #f0ede8' }}>
                        <p style={{ fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', marginBottom: '16px', color: '#9ca3af' }}>Suivez notre Actualité</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <a href="#" style={{ width: '36px', height: '36px', border: '1px solid #e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111111', backgroundColor: 'white' }} className="hover:border-[#111111] transition-all"><Instagram size={14} /></a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
