import { supabase } from '../lib/supabase';

/**
 * Fetches the shipping rate for a specific wilaya from the database.
 * @param {string} wilaya - The name of the wilaya.
 * @returns {Promise<{data: any, error: any}>}
 */
export const getShippingRate = async (wilaya) => {
    if (!wilaya) return { data: null, error: 'Wilaya is required' };
    
    const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .eq('wilaya', wilaya)
        .single();
    
    return { data, error };
};

/**
 * Fetches all shipping rates.
 */
export const getAllShippingRates = async () => {
    const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .order('wilaya', { ascending: true });
    
    return { data, error };
};
