import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/compressImage'

export const getHeroBanners = async () => {
    const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .eq('is_active', true)
        .order('order', { ascending: true });
    if (error) throw error;
    return { data };
}

export const getAdminHeroBanners = async () => {
    const { data, error } = await supabase
        .from('hero_banners')
        .select('*')
        .order('order', { ascending: true });
    if (error) throw error;
    return { data };
}

export const createHeroBanner = async (formData) => {
    let imageUrl = null;
    const file = formData.get('image');

    if (file instanceof File) {
        const compressed = await compressImage(file);
        const fileExt = compressed.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `hero/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('caftan-images')
            .upload(filePath, compressed);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('caftan-images')
            .getPublicUrl(filePath);
        imageUrl = publicUrl;
    }

    const bannerData = {
        title_part1: formData.get('title_part1'),
        title_accent: formData.get('title_accent'),
        title_part2: formData.get('title_part2'),
        subtitle: formData.get('subtitle') || null,
        cta_text: formData.get('cta_text'),
        is_active: formData.get('is_active') !== 'false',
        order: parseInt(formData.get('order') || '0', 10),
        image_url: imageUrl
    };

    const { data, error } = await supabase
        .from('hero_banners')
        .insert(bannerData)
        .select()
        .single();
    if (error) throw error;
    return { data };
}

export const updateHeroBanner = async (id, formData) => {
    let imageUrl = formData.get('image_url');
    const file = formData.get('image');

    if (file instanceof File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `hero/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('caftan-images')
            .upload(filePath, file);
        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
                .from('caftan-images')
                .getPublicUrl(filePath);
            imageUrl = publicUrl;
        }
    }

    const bannerData = {
        title_part1: formData.get('title_part1'),
        title_accent: formData.get('title_accent'),
        title_part2: formData.get('title_part2'),
        subtitle: formData.get('subtitle') || null,
        cta_text: formData.get('cta_text'),
        is_active: formData.get('is_active') !== 'false',
        order: parseInt(formData.get('order') || '0', 10),
    };
    if (imageUrl !== null && imageUrl !== 'undefined') {
        bannerData.image_url = imageUrl;
    }

    const { data, error } = await supabase
        .from('hero_banners')
        .update(bannerData)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return { data };
}

export const deleteHeroBanner = async (id) => {
    const { data: banner } = await supabase.from('hero_banners').select('image_url').eq('id', id).single();
    if (banner && banner.image_url) {
        const filePath = banner.image_url.split('/caftan-images/')[1];
        if (filePath) {
            await supabase.storage.from('caftan-images').remove([filePath]);
        }
    }

    const { error } = await supabase.from('hero_banners').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
}
