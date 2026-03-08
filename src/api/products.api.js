import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/compressImage'

export const getProducts = async (params = {}) => {
    let query = supabase
        .from('products')
        .select(`
            *,
            images:product_images(*),
            attributes:product_attributes(*)
        `, { count: 'exact' });

    // The backend `getProducts` always filters by visibility except presumably for admin endpoints
    // I'll keep it flexible: check if we should strictly filter is_visible
    if (params.category) query = query.eq('category', params.category);
    if (params.featured) query = query.eq('featured', true);
    if (params.on_sale) query = query.eq('on_sale', true);
    if (params.search) {
        query = query.or(`name_fr.ilike.%${params.search}%,name_ar.ilike.%${params.search}%`);
    }

    // Default sorting
    if (params.sort === 'price_asc') query = query.order('price', { ascending: true });
    else if (params.sort === 'price_desc') query = query.order('price', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    // Pagination
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
        data: {
            products: data,
            total: count,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        }
    };
};

export const getProduct = async (id) => {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            images:product_images(*),
            attributes:product_attributes(*),
            pack_items(packs(*))
        `)
        .eq('id', id)
        .single();

    if (error) throw error;

    // Map packs structure if it exists to match the backend expectation
    if (data.pack_items) {
        data.packs = data.pack_items.map(pi => pi.packs).filter(Boolean);
        delete data.pack_items;
    }

    return { data };
};

export const createProduct = async (formData) => {
    const uploadedImages = [];
    const files = formData.getAll('images');

    // 1. Upload Images
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file instanceof File) {
            const compressed = await compressImage(file);
            const fileExt = compressed.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('caftan-images')
                .upload(filePath, compressed);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('caftan-images')
                .getPublicUrl(filePath);

            uploadedImages.push(publicUrl);
        }
    }

    // 2. Insert Product
    const productData = {
        name_fr: formData.get('name_fr'),
        name_ar: formData.get('name_ar') || null,
        category: formData.get('category'),
        subcategory: formData.get('subcategory') || null,
        description_fr: formData.get('description_fr') || null,
        description_ar: formData.get('description_ar') || null,
        price: parseFloat(formData.get('price')),
        original_price: formData.get('original_price') ? parseFloat(formData.get('original_price')) : null,
        on_sale: formData.get('on_sale') === 'true',
        tissu: formData.get('tissu') || null,
        featured: formData.get('featured') === 'true',
        is_new: formData.get('is_new') === 'true',
        in_stock: formData.get('in_stock') === 'true',
        stock_count: parseInt(formData.get('stock_count') || '0', 10),
        is_visible: formData.get('is_visible') !== 'false'
    };

    const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

    if (productError) throw productError;

    // 3. Insert attributes
    const attributesStr = formData.get('attributes');
    if (attributesStr) {
        const attributes = JSON.parse(attributesStr).map(attr => ({
            ...attr,
            product_id: product.id
        }));
        if (attributes.length > 0) {
            const { error: attrError } = await supabase.from('product_attributes').insert(attributes);
            if (attrError) throw attrError;
        }
    }

    // 4. Insert Images
    if (uploadedImages.length > 0) {
        const imageRecords = uploadedImages.map((url, index) => ({
            product_id: product.id,
            image_url: url,
            is_primary: index === 0,
            display_order: index
        }));
        const { error: imgError } = await supabase.from('product_images').insert(imageRecords);
        if (imgError) throw imgError;
    }

    return getProduct(product.id);
};

export const updateProduct = async (id, formData) => {
    // 1. Update Product
    const productData = {
        name_fr: formData.get('name_fr'),
        name_ar: formData.get('name_ar') || null,
        category: formData.get('category'),
        subcategory: formData.get('subcategory') || null,
        description_fr: formData.get('description_fr') || null,
        description_ar: formData.get('description_ar') || null,
        price: parseFloat(formData.get('price')),
        original_price: formData.get('original_price') ? parseFloat(formData.get('original_price')) : null,
        on_sale: formData.get('on_sale') === 'true',
        tissu: formData.get('tissu') || null,
        featured: formData.get('featured') === 'true',
        is_new: formData.get('is_new') === 'true',
        in_stock: formData.get('in_stock') === 'true',
        stock_count: parseInt(formData.get('stock_count') || '0', 10),
        is_visible: formData.get('is_visible') !== 'false'
    };

    const { error: productError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id);

    if (productError) throw productError;

    // 2. Update attributes
    const attributesStr = formData.get('attributes');
    if (attributesStr) {
        await supabase.from('product_attributes').delete().eq('product_id', id);
        const attributes = JSON.parse(attributesStr).map(attr => ({
            ...attr,
            product_id: id
        }));
        if (attributes.length > 0) {
            await supabase.from('product_attributes').insert(attributes);
        }
    }

    // 3. Handle Images
    const existingImagesStr = formData.get('existing_images');
    let existingImages = [];
    if (existingImagesStr) {
        existingImages = JSON.parse(existingImagesStr);

        const { data: currentImages } = await supabase.from('product_images').select('*').eq('product_id', id);
        if (currentImages) {
            const existingIds = existingImages.map(img => img.id);
            const toDelete = currentImages.filter(img => !existingIds.includes(img.id));
            if (toDelete.length > 0) {
                const filePaths = toDelete.map(img => img.image_url.split('/caftan-images/')[1]).filter(Boolean);
                if (filePaths.length > 0) {
                    await supabase.storage.from('caftan-images').remove(filePaths);
                }
                await supabase.from('product_images').delete().in('id', toDelete.map(img => img.id));
            }
        }
    }

    // Upload New Images
    const files = formData.getAll('images');
    let newUploadCount = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file instanceof File) {
            const compressed = await compressImage(file);
            const fileExt = compressed.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('caftan-images')
                .upload(filePath, compressed);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('caftan-images')
                    .getPublicUrl(filePath);

                await supabase.from('product_images').insert({
                    product_id: id,
                    image_url: publicUrl,
                    is_primary: existingImages.length === 0 && newUploadCount === 0,
                    display_order: existingImages.length + newUploadCount
                });
                newUploadCount++;
            }
        }
    }

    return getProduct(id);
};

export const deleteProduct = async (id) => {
    const { data: images } = await supabase.from('product_images').select('image_url').eq('product_id', id);
    if (images && images.length > 0) {
        const filePaths = images.map(img => img.image_url.split('/caftan-images/')[1]).filter(Boolean);
        if (filePaths.length > 0) {
            await supabase.storage.from('caftan-images').remove(filePaths);
        }
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    return { data: { success: true } };
};
