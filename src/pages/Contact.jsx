import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function Contact() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('messages')
                .insert([{
                    sender_name: formData.name,
                    email: formData.email,
                    subject: '',
                    body: formData.message,
                    status: 'unread'
                }]);

            if (error) {
                // Check if the error is the missing column error, or let it throw naturally
                if (error.code === 'PGRST204') {
                    console.warn("Supabase schema missing 'email' column in 'messages'.");
                }
                throw error;
            }
            toast.success(t('contact.successMsg'));
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            console.error('Contact error:', error);
            toast.error(t('contact.errorMsg'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main
            style={{ minHeight: 'calc(100vh - var(--navbar-height))', marginTop: 'var(--navbar-height)', overflowX: 'hidden', maxWidth: '100vw' }}
            className="flex items-center justify-center px-4 sm:px-8 md:px-10 pt-16 pb-0"
        >
            <div style={{ width: '100%', maxWidth: '560px' }}>
                <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.3em', marginBottom: '12px', display: 'block', textAlign: 'center' }}>{t('contact.label')}</span>
                <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontFamily: 'serif', marginBottom: '40px', lineHeight: 1.1, textAlign: 'center', whiteSpace: 'pre-line' }}>{t('contact.title')}</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#111111' }}>{t('contact.name')}</label>
                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', height: '56px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', backgroundColor: '#fafafa' }} className="focus:border-[#C3AB7E] transition-colors" placeholder={t('contact.namePlaceholder')} />
                        </div>
                        <div className="space-y-2">
                            <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#111111' }}>{t('contact.email')}</label>
                            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', height: '56px', padding: '0 20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', backgroundColor: '#fafafa' }} className="focus:border-[#C3AB7E] transition-colors" placeholder={t('contact.emailPlaceholder')} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#111111' }}>{t('contact.message')}</label>
                        <textarea required rows="5" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none', backgroundColor: '#fafafa', resize: 'none' }} className="focus:border-[#C3AB7E] transition-colors" placeholder={t('contact.messagePlaceholder')} />
                    </div>
                    <button disabled={loading} type="submit" style={{ width: '100%', height: '56px', backgroundColor: '#111111', color: 'white', borderRadius: '16px', fontWeight: '800', fontSize: '12px', letterSpacing: '0.1em', marginTop: '32px' }} className="hover:bg-[#C3AB7E] transition-colors flex items-center justify-center gap-3">
                        {loading ? <Loader2 className="animate-spin" /> : <>{t('contact.send')} <Send size={16} /></>}
                    </button>
                </form>
            </div>
        </main>
    );
}
