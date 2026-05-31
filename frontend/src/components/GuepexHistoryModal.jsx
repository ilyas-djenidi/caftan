import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getParcelHistory, getStatusColor } from '../services/guepex';

/* ─── Skeleton ────────────────────────────────────────────────────── */
function Skeleton({ h = 14, w = '100%', style = {} }) {
    return (
        <div style={{
            height: h, width: w, borderRadius: 6,
            background: 'linear-gradient(90deg,#E8E2D6 25%,#F0EDE8 50%,#E8E2D6 75%)',
            backgroundSize: '200% 100%',
            animation: 'shine 1.4s infinite',
            ...style,
        }} />
    );
}

/* ─── Main Modal ─────────────────────────────────────────────────── */
export default function GuepexHistoryModal({ tracking, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getParcelHistory(tracking).then(data => {
            const raw = Array.isArray(data) ? data : (data?.results || []);
            // newest on top
            setHistory([...raw].sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0)));
            setLoading(false);
        });
    }, [tracking]);

    return (
        <>
            <style>{`@keyframes shine{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>

            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '16px',
                }}
            >
                <div
                    onClick={e => e.stopPropagation()}
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 0,
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        padding: '32px 40px 24px',
                        borderBottom: '1px solid #F0EDE8',
                        flexShrink: 0,
                    }}>
                        <h2 style={{
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: '28px', fontStyle: 'italic', fontWeight: '500',
                            color: '#1A1714', margin: 0, lineHeight: 1.2,
                        }}>
                            Historique — {tracking}
                        </h2>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#6B6458', padding: '4px', flexShrink: 0, marginLeft: '16px',
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ overflowY: 'auto', padding: '32px 40px' }}>
                        {loading ? (
                            /* Skeleton entries */
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '16px' }}>
                                        <Skeleton h={8} w={8} style={{ borderRadius: '50%', flexShrink: 0, marginTop: '5px' }} />
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <Skeleton h={10} w="40%" />
                                            <Skeleton h={14} w="60%" />
                                            <Skeleton h={10} w="45%" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : history.length === 0 ? (
                            <p style={{
                                textAlign: 'center', color: '#9ca3af',
                                fontFamily: "'Jost', sans-serif", fontSize: '14px',
                                padding: '40px 0',
                            }}>
                                Aucun historique disponible.
                            </p>
                        ) : (
                            <div style={{ position: 'relative', paddingLeft: '24px' }}>
                                {/* Vertical line */}
                                <div style={{
                                    position: 'absolute', left: '3px', top: '8px', bottom: '8px',
                                    width: '2px', backgroundColor: '#F0EDE8',
                                }} />

                                {history.map((entry, i) => {
                                    const status = entry.status || entry.state || entry.last_status || '';
                                    const color = getStatusColor(status);
                                    const dateStr = entry.date || entry.created_at || entry.timestamp;
                                    const center = entry.center_name || entry.center || '';
                                    const wilaya = entry.wilaya_name || entry.wilaya || '';
                                    const reason = entry.reason || entry.motif || '';

                                    return (
                                        <div key={i} style={{
                                            position: 'relative',
                                            marginBottom: i < history.length - 1 ? '28px' : 0,
                                        }}>
                                            {/* Dot */}
                                            <div style={{
                                                position: 'absolute', left: '-22px', top: '5px',
                                                width: '8px', height: '8px', borderRadius: '50%',
                                                backgroundColor: color,
                                                boxShadow: `0 0 0 3px ${color}30`,
                                            }} />

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                {/* Date */}
                                                <span style={{
                                                    fontFamily: "'Jost', sans-serif", fontSize: '11px',
                                                    fontWeight: '400', color: '#6B6458',
                                                }}>
                                                    {dateStr
                                                        ? new Date(dateStr).toLocaleString('fr-FR', {
                                                            day: '2-digit', month: '2-digit', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit',
                                                        })
                                                        : '—'}
                                                </span>

                                                {/* Status */}
                                                <span style={{
                                                    fontFamily: "'Jost', sans-serif", fontSize: '13px',
                                                    fontWeight: '400', color,
                                                }}>
                                                    {status || '—'}
                                                </span>

                                                {/* Center + Wilaya */}
                                                {(center || wilaya) && (
                                                    <span style={{
                                                        fontFamily: "'Jost', sans-serif", fontSize: '11px',
                                                        fontWeight: '300', color: '#6B6458',
                                                    }}>
                                                        {[center, wilaya].filter(Boolean).join(' — ')}
                                                    </span>
                                                )}

                                                {/* Reason */}
                                                {reason && (
                                                    <span style={{
                                                        fontFamily: "'Jost', sans-serif", fontSize: '11px',
                                                        fontStyle: 'italic', color: '#F59E0B',
                                                    }}>
                                                        {reason}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
