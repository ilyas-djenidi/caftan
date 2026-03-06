const Skeleton = ({
    width = '100%',
    height = '20px',
    className = '',
    count = 1,
    style = {},
}) => {
    const items = Array.from({ length: count });

    return (
        <>
            {items.map((_, i) => (
                <div
                    key={i}
                    className={`animate-pulse ${className}`}
                    style={{
                        width,
                        height,
                        backgroundColor: '#E5E0D8',
                        borderRadius: '8px',
                        marginBottom: count > 1 && i < count - 1 ? '8px' : 0,
                        ...style,
                    }}
                />
            ))}
        </>
    );
};

export default Skeleton;
