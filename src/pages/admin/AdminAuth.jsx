import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function AdminAuth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (token) navigate('/admin');
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Simple session management for mdc
            localStorage.setItem('admin_token', data.session.access_token);
            navigate('/admin');
        } catch (err) {
            setError(err.message || 'Email ou mot de passe invalide');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-4">
            <div className="w-full max-w-[340px] p-8 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)] rounded-[24px] border border-[#f0ede8] space-y-6">
                <div className="text-center space-y-2">
                    <span style={{ color: '#C3AB7E', fontSize: '10px', fontWeight: '800', letterSpacing: '0.4em' }}>ESPACE PRIVÉ</span>
                    <h1 style={{ fontSize: '24px', fontFamily: "'Cormorant Garamond', serif", fontWeight: '600', color: '#1A1714' }}>Maison du Caftan</h1>
                    <p style={{ color: '#9ca3af', fontSize: '12px', fontFamily: "'Jost', sans-serif" }}>Administration sécurisée</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1A1714' }}>Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="email" required
                                value={email} onChange={e => setEmail(e.target.value)}
                                style={{ width: '100%', height: '40px', padding: '0 16px 0 42px', borderRadius: '10px', border: '1.5px solid transparent', backgroundColor: '#F5F5F5', outline: 'none', fontSize: '13px', fontFamily: "'Jost', sans-serif", transition: 'border-color 0.2s' }}
                                onFocus={e => e.target.style.borderColor = '#B8963E'}
                                onBlur={e => e.target.style.borderColor = 'transparent'}
                                placeholder="votre@email.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1A1714' }}>Mot de passe</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="password" required
                                value={password} onChange={e => setPassword(e.target.value)}
                                style={{ width: '100%', height: '40px', padding: '0 16px 0 42px', borderRadius: '10px', border: '1.5px solid transparent', backgroundColor: '#F5F5F5', outline: 'none', fontSize: '13px', fontFamily: "'Jost', sans-serif", transition: 'border-color 0.2s' }}
                                onFocus={e => e.target.style.borderColor = '#B8963E'}
                                onBlur={e => e.target.style.borderColor = 'transparent'}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '12px', padding: '12px', borderRadius: '10px', border: '1px solid #fee2e2', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit" disabled={loading}
                        style={{ width: '100%', height: '40px', backgroundColor: '#1A1714', color: '#FAF8F4', border: 'none', borderRadius: '10px', fontFamily: "'Jost', sans-serif", fontWeight: '400', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.3s', marginTop: '10px' }}
                        onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = '#B8963E')}
                        onMouseLeave={e => !loading && (e.currentTarget.style.backgroundColor = '#1A1714')}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <>CONNEXION <ArrowRight size={14} /></>}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Propulsé par MDC Prestige
                </p>
            </div>
        </div>
    );
}
