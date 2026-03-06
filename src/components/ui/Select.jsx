import { useState } from 'react';

const Select = ({
    label,
    options = [],
    value,
    onChange,
    error,
    placeholder,
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
                </label>
            )}
            <select
                value={value}
                onChange={onChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#ffffff',
                    border: `1px solid ${error ? '#ef4444' : focused ? '#C3AB7E' : '#F0EDE8'}`,
                    borderRadius: '10px',
                    fontSize: '14px',
                    color: value ? '#111111' : '#9ca3af',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    cursor: 'pointer',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23111' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    paddingRight: '40px',
                    boxSizing: 'border-box',
                }}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && (
                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>
                    {error}
                </span>
            )}
        </div>
    );
};

export default Select;
