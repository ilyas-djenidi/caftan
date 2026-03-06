import { supabase } from '../lib/supabase'

export const login = async (credentials) => {
    const { email, password } = credentials;
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) throw error

    // Fetch user profile for role
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

    if (profileError) throw profileError

    return {
        data: {
            token: data.session.access_token,
            user: profile
        }
    }
}

export const validatePromo = async (code, total) => {
    const { data: promo, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single()

    if (error) {
        throw new Error("Promo code not found or inactive");
    }

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
    }
}
