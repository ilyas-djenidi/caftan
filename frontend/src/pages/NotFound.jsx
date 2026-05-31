import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <main style={{ maxWidth: '800px', margin: '0 auto', padding: '240px 24px', textAlign: 'center' }}>
            <span style={{ fontSize: '100px', fontFamily: 'serif', color: '#f0ede8', display: 'block', lineHeight: 1 }}>404</span>
            <h1 style={{ fontSize: '40px', fontFamily: 'serif', marginTop: '24px' }}>Page Introuvable</h1>
            <p style={{ color: '#9ca3af', fontSize: '16px', marginTop: '16px', maxWidth: '500px', margin: '16px auto 40px' }}>
                Désolé, la page que vous recherchez semble s'être égarée dans nos collections.
            </p>
            <Link to="/" style={{
                display: 'inline-flex', alignItems: 'center', gap: '12px', backgroundColor: '#111111', color: 'white',
                padding: '20px 48px', borderRadius: '100px', textDecoration: 'none',
                fontWeight: '800', fontSize: '12px', letterSpacing: '0.1em'
            }} className="hover:scale-105 transition-all">
                <ArrowLeft size={18} /> RETOUR À L'ACCUEIL
            </Link>
        </main>
    );
}
