import { MessageCircle } from 'lucide-react';

const FloatingIcons = () => {

    const btnBase = {
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        textDecoration: 'none',
    };

    return (
        <div
            style={{
                position: 'fixed',
                right: '16px',
                bottom: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 999,
            }}
        >
            {/* WhatsApp */}
            <a
                href="https://wa.me/213XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                title="Contactez-nous sur WhatsApp"
                style={{
                    ...btnBase,
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(37,211,102,0.4)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.18)';
                }}
            >
                <MessageCircle size={24} />
            </a>
        </div>
    );
};

export default FloatingIcons;
