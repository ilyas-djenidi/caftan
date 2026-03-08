import { supabase } from '../lib/supabase';

/**
 * Fetch all reviews for a specific product
 */
export const getReviews = async (productId) => {
    const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return { data };
};

/**
 * Create a new review for a product
 */
export const createReview = async (productId, reviewData) => {
    const { data, error } = await supabase
        .from('product_reviews')
        .insert({
            product_id: productId,
            author_name: reviewData.author_name,
            rating: reviewData.rating,
            comment: reviewData.comment
        })
        .select()
        .single();

    if (error) throw error;
    return { data };
};
