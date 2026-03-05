import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Search, Trash2, Check, Clock, User, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Messages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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
        try {
            await supabase.from('messages').update({ status: 'read' }).eq('id', id);
            setMessages(messages.map(m => m.id === id ? { ...m, status: 'read' } : m));
        } catch (error) {
            toast.error('Erreur');
        }
    };

    const filtered = messages.filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 style={{ fontSize: '32px', fontFamily: 'serif' }}>Messages Clients</h1>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>{messages.filter(m => m.status === 'unread').length} messages non lus</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Filtrer les messages..."
                        style={{ width: '320px', height: '56px', padding: '0 20px 0 52px', borderRadius: '16px', border: '1px solid #f0ede8', outline: 'none' }}
                    />
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8 min-h-[600px]">
                <div className="col-span-4 bg-white rounded-[32px] border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#C3AB7E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>INBOX</span>
                    </div>
                    <div className="overflow-y-auto flex-grow divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div>
                        ) : filtered.length === 0 ? (
                            <div className="p-10 text-center text-gray-400">Aucun message</div>
                        ) : filtered.map(msg => (
                            <div
                                key={msg.id}
                                onClick={() => { setSelectedMessage(msg); if (msg.status === 'unread') markAsRead(msg.id); }}
                                style={{ padding: '24px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: selectedMessage?.id === msg.id ? '#fdfbf7' : 'white' }}
                                className="hover:bg-[#fafafa]"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 style={{ fontSize: '15px', fontWeight: msg.status === 'unread' ? '800' : '600' }}>{msg.name}</h3>
                                    {msg.status === 'unread' && <div className="w-2 h-2 rounded-full bg-[#C3AB7E]" />}
                                </div>
                                <p style={{ fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.subject}</p>
                                <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', display: 'block' }}>{format(new Date(msg.created_at), 'd MMM, HH:mm', { locale: fr })}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-8 bg-white rounded-[32px] border border-gray-100 p-12 flex flex-col">
                    {selectedMessage ? (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-400">
                            <header className="flex justify-between items-start">
                                <div className="flex gap-6">
                                    <div style={{ width: '64px', height: '64px', backgroundColor: '#f0ede8', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={24} style={{ color: '#C3AB7E' }} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{selectedMessage.name}</h2>
                                        <p style={{ color: '#C3AB7E', fontWeight: '700', fontSize: '14px' }}>{selectedMessage.email}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                                </div>
                            </header>

                            <div style={{ padding: '40px', backgroundColor: '#fafafa', borderRadius: '32px', position: 'relative' }}>
                                <div className="absolute -top-3 left-10 p-2 bg-white rounded-lg border border-gray-100">
                                    <MessageSquare size={16} style={{ color: '#C3AB7E' }} />
                                </div>
                                <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>{selectedMessage.subject}</h4>
                                <p style={{ color: '#4b5563', lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-wrap' }}>{selectedMessage.message}</p>
                            </div>

                            <div className="flex items-center gap-4 text-gray-400">
                                <Clock size={16} />
                                <span style={{ fontSize: '13px' }}>Reçu le {format(new Date(selectedMessage.created_at), 'PPPP à HH:mm', { locale: fr })}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center opacity-30">
                            <Mail size={80} style={{ color: '#C3AB7E', marginBottom: '24px' }} />
                            <h3 style={{ fontSize: '24px', fontFamily: 'serif' }}>Sélectionnez un message</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
