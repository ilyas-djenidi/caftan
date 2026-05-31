import { Loader2 } from 'lucide-react';

const variants = {
    primary: {
        backgroundColor: '#111111',
        color: '#ffffff',
        border: 'none',
    },
    secondary: {
        backgroundColor: '#ffffff',
        color: '#111111',
        border: '1px solid #111111',
    },
    ghost: {
        backgroundColor: 'transparent',
        color: '#111111',
        border: 'none',
    },
};

const sizes = {
    sm: { padding: '8px 20px', fontSize: '10px' },
    md: { padding: '12px 28px', fontSize: '10px' },
    lg: { padding: '16px 40px', fontSize: '11px' },
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    style = {},
    ...props
}) => {
    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={className}
            style={{
                ...variants[variant],
                ...sizes[size],
                borderRadius: '12px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                ...style,
            }}
            {...props}
        >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {children}
        </button>
    );
};

export default Button;
