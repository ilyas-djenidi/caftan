import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/compressImage'

export const getPacks = async (params = {}) => {
    let query = supabase
        .from('packs')
        .select(`
            id, name_fr, name_ar, price, original_price, image_url, is_active, is_sold_out, savings, created_at,
            items:pack_items(
                quantity,
                product:products(
                    id, name_fr, name_ar, price, original_price, on_sale, stock_count,
                    images:product_images(image_url, is_primary)
                )
            )
        `)
        .order('created_at', { ascending: false });

    if (params.active === 'true') {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    const transformed = data.map(pack => ({
        ...pack,
        items: pack.items.map(item => ({
            ...item.product,
            images: item.product?.images?.filter(img => img.is_primary) || [],
            PackItem: { quantity: item.quantity }
        }))
    }));

    return { data: transformed };
};

export const getPack = async (id) => {
    const { data, error } = await supabase
        .from('packs')
        .select(`
            *,
            items:pack_items(
                quantity,
                product:products(
                    *,
                    images:product_images(*)
                )
            )
        `)
        .eq('id', id)
        .single();

    if (error) throw error;

    const transformed = {
        ...data,
        items: data.items.map(item => ({
            ...item.product,
            PackItem: { quantity: item.quantity }
        }))
    };

    return { data: transformed };
};

export const createPack = async (formData) => {
    let imageUrl = null;
    const file = formData.get('image');

    if (file instanceof File) {
        const compressed = await compressImage(file);
        const fileExt = compressed.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `packs/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('caftan-images')
            .upload(filePath, compressed);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('caftan-images')
            .getPublicUrl(filePath);

        imageUrl = publicUrl;
    }

    const packData = {
        name_fr: formData.get('name_fr'),
        name_ar: formData.get('name_ar') || null,
        description_fr: formData.get('description_fr') || null,
        description_ar: formData.get('description_ar') || null,
        price: parseFloat(formData.get('price')),
        original_price: formData.get('original_price') ? parseFloat(formData.get('original_price')) : null,
        is_active: formData.get('is_active') !== 'false',
        is_sold_out: formData.get('is_sold_out') === 'true',
        savings: formData.get('savings') ? parseFloat(formData.get('savings')) : null,
        image_url: imageUrl
    };

    const { data: pack, error: packError } = await supabase
        .from('packs')
        .insert(packData)
        .select()
        .single();

    if (packError) throw packError;

    const productIdsStr = formData.get('product_ids');
    const quantitiesStr = formData.get('quantities');

    if (productIdsStr) {
        const product_ids = JSON.parse(productIdsStr);
        const quantities = quantitiesStr ? JSON.parse(quantitiesStr) : [];

        if (product_ids.length > 0) {
            const items = product_ids.map((pid, idx) => ({
                pack_id: pack.id,
                product_id: pid,
                quantity: quantities[idx] || 1
            }));

            const { error: itemsError } = await supabase.from('pack_items').insert(items);
            if (itemsError) throw itemsError;
        }
    }

    return getPack(pack.id);
};

export const updatePack = async (id, formData) => {
    let imageUrl = formData.get('image_url');
    const file = formData.get('image');

    if (file instanceof File) {
        const compressed = await compressImage(file);
        const fileExt = compressed.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `packs/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('caftan-images')
            .upload(filePath, compressed);

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
                .from('caftan-images')
                .getPublicUrl(filePath);
            imageUrl = publicUrl;
        }
    }

    const packData = {
        name_fr: formData.get('name_fr'),
        name_ar: formData.get('name_ar') || null,
        description_fr: formData.get('description_fr') || null,
        description_ar: formData.get('description_ar') || null,
        price: parseFloat(formData.get('price')),
        original_price: formData.get('original_price') ? parseFloat(formData.get('original_price')) : null,
        is_active: formData.get('is_active') !== 'false',
        is_sold_out: formData.get('is_sold_out') === 'true',
        savings: formData.get('savings') ? parseFloat(formData.get('savings')) : null,
    };

    if (imageUrl) {
        packData.image_url = imageUrl;
    }

    const { error: packError } = await supabase
        .from('packs')
        .update(packData)
        .eq('id', id);

    if (packError) throw packError;

    const productIdsStr = formData.get('product_ids');
    const quantitiesStr = formData.get('quantities');

    if (productIdsStr) {
        await supabase.from('pack_items').delete().eq('pack_id', id);

        const product_ids = JSON.parse(productIdsStr);
        const quantities = quantitiesStr ? JSON.parse(quantitiesStr) : [];

        if (product_ids.length > 0) {
            const items = product_ids.map((pid, idx) => ({
                pack_id: id,
                product_id: pid,
                quantity: quantities[idx] || 1
            }));

            await supabase.from('pack_items').insert(items);
        }
    }

    return getPack(id);
};

export const deletePack = async (id) => {
    const { data: pack } = await supabase.from('packs').select('image_url').eq('id', id).single();
    if (pack && pack.image_url) {
        const filePath = pack.image_url.split('/caftan-images/')[1];
        if (filePath) {
            await supabase.storage.from('caftan-images').remove([filePath]);
        }
    }

    const { error } = await supabase.from('packs').delete().eq('id', id);
    if (error) throw error;

    return { data: { success: true } };
};
