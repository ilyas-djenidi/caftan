import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Search, Trash2, Check, Clock, User, MessageSquare, Loader2, CheckCircle2, UserCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Messages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedIds, setExpandedIds] = useState(new Set());

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .order('created_at', { ascending: false });
            setMessages(data || []);
        } catch (error) {
            toast.error('Erreur de chargement');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        setUpdatingId(id);
        try {
            await supabase.from('messages').update({ status: 'read' }).eq('id', id);
            setMessages(messages.map(m => m.id === id ? { ...m, status: 'read' } : m));
            toast.success("Message marqué comme lu");
        } catch (error) {
            toast.error('Erreur');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) return;
        setUpdatingId(id);
        try {
            await supabase.from('messages').delete().eq('id', id);
            setMessages(messages.filter(m => m.id !== id));
            toast.success("Message supprimé");
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        } finally {
            setUpdatingId(null);
        }
    };

    const filtered = messages.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-10" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#111111]">Messages Clients</h1>
                    <p className="text-gray-400 text-sm mt-1 uppercase font-bold tracking-widest">{messages.filter(m => m.status === 'unread').length} messages non lus</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Filtrer les messages..."
                        style={{ width: '100%', maxWidth: '300px', padding: '12px 20px 12px 44px', borderRadius: '15px', border: '1px solid #f0ede8', outline: 'none', backgroundColor: 'white', fontSize: '14px', fontWeight: '500' }}
                    />
                </div>
            </div>

            <div style={{
                backgroundColor: 'white',
                borderRadius: '30px',
                border: '1px solid #F0EDE8',
                overflow: 'hidden',
                boxShadow: '0 4px 30px rgba(0,0,0,0.02)'
            }}>
                <table className="w-full text-left border-collapse mobile-card-table">
                    <thead>
                        <tr style={{ borderBottom: '1px solid #F0EDE8', backgroundColor: '#ffffff' }}>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Expéditeur</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sujet</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Message</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Statut</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EDE8]">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="py-20 text-center text-[#C3AB7E]">
                                    <Loader2 className="animate-spin inline-block" size={32} />
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-20 text-center text-gray-400 italic">Aucun message trouvé</td>
                            </tr>
                        ) : (
                            filtered.map((msg) => (
                                <tr key={msg.id} className={`transition-colors ${!(msg.status !== 'unread') ? 'bg-[#fdfbf7]' : 'hover:bg-[#FAFAFA]'}`}>
                                    <td style={{ padding: '16px 24px' }} className="w-full-mobile md:w-auto">
                                        <div className="flex items-center gap-3">
                                            <div style={{ width: '40px', height: '40px', backgroundColor: '#f0ede8', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <UserCircle2 size={20} style={{ color: '#C3AB7E' }} />
                                            </div>
                                            <div className="flex flex-col gap-1 items-start text-left">
                                                <span className={`text-[#111111] ${!(msg.status !== 'unread') ? 'font-bold' : 'font-medium'}`}>{msg.full_name || msg.name || 'Inconnu'}</span>
                                                <span className="text-xs text-[#C3AB7E] font-medium">
                                                    {msg.email}
                                                    {msg.phone && <span className="text-gray-400 font-normal ml-2">| {msg.phone}</span>}
                                                </span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                                                    {format(new Date(msg.created_at), 'd MMM yyyy, HH:mm', { locale: fr })}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 24px' }} className="w-full-mobile md:w-auto">
                                        <div className="flex items-center gap-2">
                                            <span style={{ fontSize: '13px', fontWeight: !(msg.status !== 'unread') ? '700' : '500', color: '#111111' }}>
                                                {msg.subject || 'Sans sujet'}
                                            </span>
                                            {!(msg.status !== 'unread') && <div className="w-2 h-2 rounded-full bg-[#C3AB7E]" />}
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 24px', maxWidth: '300px' }} className="w-full-mobile md:w-auto">
                                        <div className="flex items-start gap-2">
                                            <MessageSquare size={14} className="text-gray-300 mt-1 flex-shrink-0 hidden sm:block" />
                                            <div className="flex flex-col items-start gap-1 w-full">
                                                <p className={`text-sm text-gray-600 ${expandedIds.has(msg.id) ? '' : 'line-clamp-2'}`} style={{ textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {msg.message}
                                                </p>
                                                {msg.message && msg.message.length > 50 && (
                                                    <button 
                                                        onClick={() => toggleExpand(msg.id)}
                                                        className="text-[10px] text-[#C3AB7E] font-bold uppercase hover:underline mt-1"
                                                    >
                                                        {expandedIds.has(msg.id) ? 'Voir moins' : 'Voir tout'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '100px',
                                            fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                                            backgroundColor: (msg.status !== 'unread') ? '#f1f5f9' : '#fef3c7',
                                            color: (msg.status !== 'unread') ? '#64748b' : '#d97706'
                                        }}>
                                            {(msg.status !== 'unread') ? 'Lu' : 'Non Lu'}
                                        </span>
                                    </td>

                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div className="flex justify-end gap-2">
                                            {!(msg.status !== 'unread') && (
                                                <button
                                                    onClick={() => markAsRead(msg.id)}
                                                    disabled={updatingId === msg.id}
                                                    title="Marquer comme lu"
                                                    className="p-2 rounded-full text-[#C3AB7E] hover:bg-[#C3AB7E]/10 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                                                >
                                                    {updatingId === msg.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(msg.id)}
                                                disabled={updatingId === msg.id}
                                                title="Supprimer"
                                                className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                                            >
                                                {updatingId === msg.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

