import { useState } from 'react';

const Input = ({
    label,
    error,
    placeholder,
    type = 'text',
    value,
    onChange,
    required = false,
    className = '',
    style = {},
    ...props
}) => {
    const [focused, setFocused] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }} className={className}>
            {label && (
                <label
                    style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        color: '#111111',
                    }}
                >
                    {label}
                    {required && <span style={{ color: '#C3AB7E', marginLeft: '4px' }}>*</span>}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#ffffff',
                    border: `1px solid ${error ? '#ef4444' : focused ? '#C3AB7E' : '#F0EDE8'}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: '#111111',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box',
                }}
                {...props}
            />
            {error && (
                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>
                    {error}
                </span>
            )}
        </div>
    );
};

export default Input;
