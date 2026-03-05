const variantStyles = {
    success: { backgroundColor: '#dcfce7', color: '#15803d' },
    warning: { backgroundColor: '#fef9c3', color: '#a16207' },
    danger: { backgroundColor: '#fee2e2', color: '#b91c1c' },
    info: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
    default: { backgroundColor: '#f3f4f6', color: '#374151' },
};

const Badge = ({ label, variant = 'default' }) => {
    const style = variantStyles[variant] || variantStyles.default;

    return (
        <span
            style={{
                ...style,
                display: 'inline-block',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '10px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
            }}
        >
            {label}
        </span>
    );
};

export default Badge;
