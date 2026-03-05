import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
                animation: 'fadeIn 0.2s ease',
            }}
        >
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '672px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    animation: 'slideUp 0.25s ease',
                    position: 'relative',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '24px 28px',
                        borderBottom: '1px solid #F0EDE8',
                    }}
                >
                    {title && (
                        <h2
                            style={{
                                fontSize: '18px',
                                fontFamily: 'serif',
                                fontWeight: '700',
                                color: '#111111',
                                margin: 0,
                            }}
                        >
                            {title}
                        </h2>
                    )}
                    <button
                        onClick={onClose}
                        style={{
                            marginLeft: 'auto',
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            border: '1px solid #F0EDE8',
                            background: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#111111',
                            flexShrink: 0,
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '28px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
