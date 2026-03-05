import { supabase } from '../lib/supabase'

export const validatePromo = async (code, total) => {
    const { data: promo, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

    if (error) throw new Error("Promo code not found or inactive");

    if (promo.expires_at && new Date() > new Date(promo.expires_at)) {
        throw new Error('Promo code has expired');
    }
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
        throw new Error('Usage limit exceeded');
    }
    if (Number(total) < Number(promo.min_order)) {
        throw new Error(`Minimum order amount for this code is ${promo.min_order} DA`);
    }

    let discount_value = Number(promo.value);
    let discount_type = promo.type;
    let final_total = Number(total);

    if (promo.type === 'percentage') {
        discount_value = (Number(total) * promo.value) / 100;
    }
    final_total = Math.max(0, Number(total) - discount_value);

    return {
        data: {
            valid: true,
            discount_type,
            discount_value,
            final_total: final_total.toFixed(2)
        }
    };
};

export const getAdminPromos = async () => {
    const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return { data };
};

export const createPromo = async (data) => {
    const { data: promo, error } = await supabase
        .from('promo_codes')
        .insert(data)
        .select()
        .single();

    if (error) throw error;
    return { data: promo };
};

export const updatePromo = async (id, data) => {
    const { data: promo, error } = await supabase
        .from('promo_codes')
        .update(data)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return { data: promo };
};

export const deletePromo = async (id) => {
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
};
