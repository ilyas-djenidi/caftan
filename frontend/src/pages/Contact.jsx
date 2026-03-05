import { useState } from 'react';
import { Send, MapPin, Phone, Mail, Instagram, MessageCircle, Loader2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
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
        <div className="min-h-screen bg-white">
            <Navbar />
            <main className="container mx-auto px-10 pt-40 pb-32">
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.3em' }}>NOUS CONTACTER</span>
                    <h1 style={{ fontSize: '56px', fontFamily: 'serif', marginTop: '16px' }}>Une Équipe à votre Écoute</h1>
                    <p style={{ color: '#9ca3af', fontSize: '16px', maxWidth: '600px', margin: '20px auto 0' }}>
                        Vous avez une question sur une pièce ou souhaitez un conseil personnalisé ? Nos conseillers sont à votre disposition.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                    <div style={{ backgroundColor: '#fafafa', padding: '60px', borderRadius: '40px' }}>
                        <h2 style={{ fontSize: '32px', fontFamily: 'serif', marginBottom: '40px' }}>Envoyez-nous un Message</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nom</label>
                                    <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-white focus:border-[#C3AB7E]" />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</label>
                                    <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-white focus:border-[#C3AB7E]" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sujet</label>
                                <input required value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }} className="bg-white focus:border-[#C3AB7E]" />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Message</label>
                                <textarea required rows="5" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', resize: 'none' }} className="bg-white focus:border-[#C3AB7E]" />
                            </div>
                            <button disabled={loading} type="submit" style={{ width: '100%', height: '72px', backgroundColor: '#111111', color: 'white', borderRadius: '24px', fontWeight: '800', fontSize: '14px', letterSpacing: '0.1em' }} className="hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                                {loading ? <Loader2 className="animate-spin" /> : <>ENVOYER LE MESSAGE <Send size={18} /></>}
                            </button>
                        </form>
                    </div>

                    <div className="space-y-12">
                        <div>
                            <h3 style={{ fontSize: '24px', fontFamily: 'serif', marginBottom: '24px' }}>Maison du Caftans</h3>
                            <div className="space-y-8">
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ width: '48px', height: '48px', backgroundColor: '#f0ede8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <MapPin size={20} style={{ color: '#C3AB7E' }} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Adresse Prestige</p>
                                        <p style={{ color: '#6b7280', fontSize: '14px' }}>Quartier Élégant, Alger Centre<br />Algérie</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ width: '48px', height: '48px', backgroundColor: '#f0ede8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Smartphone size={20} style={{ color: '#C3AB7E' }} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>Contact Direct</p>
                                        <p style={{ color: '#6b7280', fontSize: '14px' }}>+213 (0) 555 55 55 55</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ width: '48px', height: '48px', backgroundColor: '#f0ede8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <MessageCircle size={20} style={{ color: '#C3AB7E' }} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>WhatsApp Conciergerie</p>
                                        <p style={{ color: '#6b7280', fontSize: '14px' }}>Disponibilité Immédiate</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ paddingTop: '40px', borderTop: '1px solid #f0ede8' }}>
                            <p style={{ fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', marginBottom: '20px' }}>Suivez notre Actualité</p>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <a href="#" style={{ width: '40px', height: '40px', border: '1px solid #f0ede8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111111' }} className="hover:bg-[#111111] hover:text-white transition-all"><Instagram size={18} /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
