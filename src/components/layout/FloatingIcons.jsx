import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

const FloatingIcons = () => {
    const { items, setIsCartOpen } = useCartStore();
    const itemCount = items?.reduce((total, item) => total + item.quantity, 0) || 0;

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
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s',
        textDecoration: 'none',
        position: 'relative'
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
            <button
                onClick={() => setIsCartOpen(true)}
                title="Mon Panier"
                style={{
                    ...btnBase,
                    backgroundColor: '#ffffff',
                    color: '#111111',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.backgroundColor = '#C3AB7E';
                    e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#111111';
                }}
            >
                <ShoppingBag size={24} />
                {itemCount > 0 && (
                    <div style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        backgroundColor: '#C3AB7E', color: 'white',
                        fontSize: '10px', fontWeight: 'bold',
                        width: '20px', height: '20px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {itemCount}
                    </div>
                )}
            </button>
        </div>
    );
};

export default FloatingIcons;
