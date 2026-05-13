import { supabase } from '../lib/supabase'

export const sendMessage = async (data) => {
    const { data: message, error } = await supabase
        .from('messages')
        .insert(data)
        .select()
        .single();
    if (error) throw error;
    return { data: message };
}

export const getMessages = async (params = {}) => {
    let query = supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });


    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
        data: {
            messages: data,
            total: count,
            pages: Math.ceil((count || 0) / limit)
        }
    };
}

export const markAsRead = async (id) => {
    const { data, error } = await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return { data };
}

export const deleteMessage = async (id) => {
    const { error } = await supabase.from('messages').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
}

