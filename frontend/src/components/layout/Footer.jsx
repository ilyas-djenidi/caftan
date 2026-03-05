import { Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

const TikTokIcon = ({ size = 20, className = "" }) => (
    <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
    >
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.59-1.01V14.5c.01 2.15-.55 4.33-1.95 6.02-1.48 1.83-3.72 2.94-6.07 3.25-2.29.35-4.71-.16-6.66-1.43-2.18-1.39-3.56-3.87-3.69-6.43-.16-2.58 1.05-5.18 3.1-6.84 1.95-1.61 4.57-2.28 7.07-1.87v4.11c-.56-.15-1.16-.2-1.74-.15-1 .11-1.96.6-2.61 1.4-.73.91-1 2.11-.84 3.24.13 1.08.76 2.06 1.7 2.61.94.57 2.12.7 3.19.38 1.1-.31 2-1.19 2.37-2.25.18-.58.25-1.19.24-1.8V0z" />
    </svg>
);

export default function Footer() {
    return (
        <footer style={{ backgroundColor: '#111111', color: '#ffffff', paddingTop: '80px', paddingBottom: '40px' }}>
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#ffffff' }}>
                            <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                            <h1 style={{ fontSize: '24px', fontFamily: 'serif', margin: 0 }}>Maison du Caftans</h1>
                        </Link>
                        <p style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                            Votre destination d'exception pour le caftan moderne et les accessoires de luxe. Chaque pièce est sélectionnée pour sublimer votre élégance.
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <a href="#" className="hover:text-[#C3AB7E]" style={{ color: '#ffffff' }}><Instagram size={20} /></a>
                            <a href="#" className="hover:text-[#C3AB7E]" style={{ color: '#ffffff' }}><TikTokIcon size={18} /></a>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#C3AB7E', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '24px' }}>Collections</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <li><Link to="/caftans" style={{ color: '#9ca3af', fontSize: '14px', textDecoration: 'none' }} className="hover:text-white">Caftans</Link></li>
                            <li><Link to="/sacs" style={{ color: '#9ca3af', fontSize: '14px', textDecoration: 'none' }} className="hover:text-white">Les Sacs</Link></li>
                            <li><Link to="/accessoires" style={{ color: '#9ca3af', fontSize: '14px', textDecoration: 'none' }} className="hover:text-white">Accessoires</Link></li>
                            <li><Link to="/packs" style={{ color: '#9ca3af', fontSize: '14px', textDecoration: 'none' }} className="hover:text-white">Packs Mariée</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#C3AB7E', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '24px' }}>L'Atelier</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <li><span style={{ color: '#9ca3af', fontSize: '14px' }}>À propos de nous</span></li>
                            <li><span style={{ color: '#9ca3af', fontSize: '14px' }}>Livraison & Retours</span></li>
                            <li><Link to="/contact" style={{ color: '#9ca3af', fontSize: '14px', textDecoration: 'none' }} className="hover:text-white">Contact</Link></li>
                            <li><Link to="/admin" style={{ color: '#9ca3af', fontSize: '14px', textDecoration: 'none' }} className="hover:text-white">Admin</Link></li>
                        </ul>
                    </div>
                </div>

                <div style={{ paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        © {new Date().getFullYear()} Maison du Caftans — قفطانك. Tous droits réservés.
                    </p>
                    <div style={{ display: 'flex', gap: '32px' }}>
                        <a href="#" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none', fontWeight: '700', textTransform: 'uppercase' }}>Confidentialité</a>
                        <a href="#" style={{ color: '#6b7280', fontSize: '12px', textDecoration: 'none', fontWeight: '700', textTransform: 'uppercase' }}>CGV</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
