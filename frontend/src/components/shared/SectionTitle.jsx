const SectionTitle = ({ label, title, subtitle }) => {
    return (
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            {label && (
                <span
                    style={{
                        display: 'block',
                        fontSize: '10px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3em',
                        color: '#C3AB7E',
                        marginBottom: '16px',
                    }}
                >
                    {label}
                </span>
            )}
            {title && (
                <h2
                    style={{
                        fontFamily: 'serif',
                        fontSize: 'clamp(28px, 4vw, 48px)',
                        fontWeight: '700',
                        color: '#111111',
                        lineHeight: 1.2,
                        margin: '0 auto',
                        maxWidth: '700px',
                    }}
                >
                    {title}
                </h2>
            )}
            {subtitle && (
                <p
                    style={{
                        marginTop: '16px',
                        fontSize: '14px',
                        color: '#9ca3af',
                        maxWidth: '560px',
                        margin: '16px auto 0',
                        lineHeight: 1.7,
                    }}
                >
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default SectionTitle;
