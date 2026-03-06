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
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md p-10 space-y-10">
                <div className="text-center space-y-4">
                    <span style={{ color: '#C3AB7E', fontSize: '11px', fontWeight: '800', letterSpacing: '0.4em' }}>ESPACE PRIVÉ</span>
                    <h1 style={{ fontSize: '32px', fontFamily: 'serif' }}>Maison du Caftans</h1>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>Administration sécurisée</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Email</label>
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input
                                type="email" required
                                value={email} onChange={e => setEmail(e.target.value)}
                                style={{ width: '100%', height: '64px', padding: '0 20px 0 60px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }}
                                className="focus:border-[#C3AB7E] bg-[#fafafa]"
                                placeholder="votre@email.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mot de passe</label>
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                            <input
                                type="password" required
                                value={password} onChange={e => setPassword(e.target.value)}
                                style={{ width: '100%', height: '64px', padding: '0 20px 0 60px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }}
                                className="focus:border-[#C3AB7E] bg-[#fafafa]"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '13px', padding: '16px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit" disabled={loading}
                        style={{ width: '100%', height: '72px', backgroundColor: '#111111', color: 'white', borderRadius: '24px', fontWeight: '800', fontSize: '14px', letterSpacing: '0.1em' }}
                        className="hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>CONNEXION <ArrowRight size={18} /></>}
                    </button>
                </form>

                <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Propulsé par MDC Prestige
                </p>
            </div>
        </div>
    );
}
