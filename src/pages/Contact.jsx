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
    const [isSuccess, setIsSuccess] = useState(false);

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
            setIsSuccess(true);
            setFormData({ name: '', email: '', message: '' });
            setTimeout(() => setIsSuccess(false), 5000); // Hide after 5 seconds
        } catch (error) {
            console.error('Contact error:', error);
            toast.error(t('contact.errorMsg'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#FAF8F4',
            paddingTop: 'calc(var(--navbar-height, 100px) + 32px)',
            paddingBottom: '100px', // Extra spacing above footer
            paddingLeft: '24px',
            paddingRight: '24px',
        }}>
            <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                {/* Page Title Block — outside the card */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span style={{ color: '#B8963E', fontSize: '11px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Jost', sans-serif", display: 'block', marginBottom: '8px' }}>
                        {t('contact.label')}
                    </span>
                    <h1 style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: 'clamp(28px, 5vw, 40px)',
                        fontWeight: '500',
                        color: '#1A1714',
                        margin: 0,
                        lineHeight: 1.1
                    }}>
                        {t('contact.title')}
                    </h1>
                </div>

                {/* Card — all fields + button inside */}
                <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '14px',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    width: '100%',
                    boxSizing: 'border-box',
                }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Name */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{
                                fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: '400',
                                color: '#1A1714', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                                {t('contact.name')}
                            </label>
                            <input
                                required name="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder={t('contact.namePlaceholder')}
                                style={{
                                    width: '100%', padding: '12px 14px', backgroundColor: '#F5F5F5',
                                    border: '1.5px solid transparent', borderRadius: '10px',
                                    fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: '300',
                                    color: '#1A1714', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = '#B8963E'}
                                onBlur={e => e.target.style.borderColor = 'transparent'}
                            />
                        </div>

                        {/* Email */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{
                                fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: '400',
                                color: '#1A1714', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                                {t('contact.email')}
                            </label>
                            <input
                                required type="email" name="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                placeholder={t('contact.emailPlaceholder')}
                                style={{
                                    width: '100%', padding: '12px 14px', backgroundColor: '#F5F5F5',
                                    border: '1.5px solid transparent', borderRadius: '10px',
                                    fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: '300',
                                    color: '#1A1714', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = '#B8963E'}
                                onBlur={e => e.target.style.borderColor = 'transparent'}
                            />
                        </div>

                        {/* Message */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{
                                fontFamily: "'Jost', sans-serif", fontSize: '12px', fontWeight: '400',
                                color: '#1A1714', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>
                                {t('contact.message')}
                            </label>
                            <textarea
                                required name="message" rows="4" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}
                                placeholder={t('contact.messagePlaceholder')}
                                style={{
                                    width: '100%', padding: '12px 14px', backgroundColor: '#F5F5F5',
                                    border: '1.5px solid transparent', borderRadius: '10px',
                                    fontFamily: "'Jost', sans-serif", fontSize: '13px', fontWeight: '300',
                                    color: '#1A1714', outline: 'none', transition: 'border-color 0.2s',
                                    resize: 'none', boxSizing: 'border-box',
                                }}
                                onFocus={e => e.target.style.borderColor = '#B8963E'}
                                onBlur={e => e.target.style.borderColor = 'transparent'}
                            />
                        </div>

                        {/* Submit Button */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                            <button
                                disabled={loading} type="submit"
                                style={{
                                    width: '100%', maxWidth: '220px', height: '44px',
                                    backgroundColor: '#1A1714', color: '#FAF8F4',
                                    border: 'none', borderRadius: '10px',
                                    fontFamily: "'Jost', sans-serif", fontSize: '11px',
                                    fontWeight: '400', letterSpacing: '0.2em',
                                    textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'background 0.3s',
                                }}
                                onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#B8963E')}
                                onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = '#1A1714')}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> :
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {t('contact.send')} <Send size={13} />
                                    </span>
                                }
                            </button>
                        </div>

                        {/* Success Message Inline */}
                        {isSuccess && (
                            <div style={{
                                marginTop: '8px',
                                padding: '12px 16px',
                                backgroundColor: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                borderRadius: '10px',
                                color: '#166534',
                                textAlign: 'center',
                                fontFamily: "'Jost', sans-serif",
                                fontSize: '13px',
                                fontWeight: '500',
                                animation: 'fadeIn 0.3s ease-in-out'
                            }}>
                                ✅ {t('contact.successMsg') || "Votre message a été envoyé avec succès !"}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
