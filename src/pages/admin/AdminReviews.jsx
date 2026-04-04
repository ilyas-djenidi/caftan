import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, CheckCircle2, XCircle, Trash2, Star, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
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
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('product_reviews')
                .select(`
                    *,
                    products ( name_fr )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('product_reviews')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            // Optimistic update
            setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
        } catch (error) {
            console.error('Error updating review:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet avis ?")) return;

        setUpdatingId(id);
        try {
            const { error } = await supabase
                .from('product_reviews')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Remove from state
            setReviews(reviews.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting review:', error);
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-10" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#111111]">Avis Clients</h1>
                    <p className="text-gray-400 text-sm mt-1 uppercase font-bold tracking-widest">Gérez les avis sur vos produits</p>
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
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Auteur & Produit</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Note</th>
                            <th style={{ padding: '20px 24px', fontSize: '10px', fontWeight: '800', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Commentaire</th>
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
                        ) : reviews.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-20 text-center text-gray-400 italic">Aucun avis trouvé</td>
                            </tr>
                        ) : (
                            reviews.map((review) => (
                                <tr key={review.id} className="hover:bg-[#FAFAFA] transition-colors">
                                    <td style={{ padding: '16px 24px' }}>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-[#111111]">{review.author_name}</span>
                                            <span className="text-xs text-[#C3AB7E] font-medium">{review.products?.name_fr || 'Produit inconnu'}</span>
                                            <span className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                                                {format(new Date(review.created_at), 'd MMM yyyy', { locale: fr })}
                                            </span>
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 24px' }}>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                                            ))}
                                        </div>
                                    </td>

                                    <td className="w-full-mobile md:w-auto" style={{ padding: '16px 24px', maxWidth: '300px' }}>
                                        <div className="flex items-start gap-2">
                                            <MessageSquare size={14} className="text-gray-300 mt-1 flex-shrink-0 hidden sm:block" />
                                            <div className="flex flex-col items-start gap-1 w-full">
                                                <p className={`text-sm text-gray-600 ${expandedIds.has(review.id) ? '' : 'line-clamp-2'}`} style={{ textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {review.comment}
                                                </p>
                                                {review.comment && review.comment.length > 50 && (
                                                    <button 
                                                        onClick={() => toggleExpand(review.id)}
                                                        className="text-[10px] text-[#C3AB7E] font-bold uppercase hover:underline mt-1"
                                                    >
                                                        {expandedIds.has(review.id) ? 'Voir moins' : 'Voir tout'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td style={{ padding: '16px 24px' }}>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '100px',
                                            fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                                            backgroundColor: review.status === 'approved' ? '#dcfce7' : review.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                                            color: review.status === 'approved' ? '#16a34a' : review.status === 'rejected' ? '#ef4444' : '#d97706'
                                        }}>
                                            {review.status === 'approved' ? 'Approuvé' : review.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                        </span>
                                    </td>

                                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                        <div className="flex items-center justify-end gap-2">
                                            {review.status !== 'approved' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(review.id, 'approved')}
                                                    disabled={updatingId === review.id}
                                                    title="Approuver"
                                                    className="p-2 rounded-full text-green-600 hover:bg-green-50 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                            )}
                                            {review.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(review.id, 'rejected')}
                                                    disabled={updatingId === review.id}
                                                    title="Rejeter"
                                                    className="p-2 rounded-full text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(review.id)}
                                                disabled={updatingId === review.id}
                                                title="Supprimer"
                                                className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                                            >
                                                {updatingId === review.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
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
