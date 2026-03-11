import { supabase } from '../lib/supabase'

export const generateOrderNumber = () => {
    const rand1 = Math.floor(Math.random() * 90000) + 10000;
    const rand2 = Math.floor(Math.random() * 900) + 100;
    return `#PKR-${rand1}-${rand2}`;
};

export const createOrder = async (data) => {
    const { items, promo_code, ...orderData } = data;

    let subtotal = 0;
    const itemsWithSnapshots = [];

    const productIds = items.filter(i => i.product_id).map(i => i.product_id);
    const packIds = items.filter(i => i.pack_id).map(i => i.pack_id);

    let productsMap = {};
    if (productIds.length > 0) {
        const { data: dbProducts } = await supabase.from('products').select('id, name_fr, price').in('id', productIds);
        if (dbProducts) {
            productsMap = dbProducts.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        }
    }

    let packsMap = {};
    if (packIds.length > 0) {
        const { data: dbPacks } = await supabase.from('packs').select('id, name_fr, image_url, price').in('id', packIds);
        if (dbPacks) {
            packsMap = dbPacks.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        }
    }

    for (const item of items) {
        if (item.product_id) {
            const product = productsMap[item.product_id];
            if (!product) throw new Error(`Product ${item.product_id} not found`);

            subtotal += product.price * item.quantity;
            itemsWithSnapshots.push({
                product_id: product.id,
                product_name: product.name_fr,
                product_image: '',
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                price_at_purchase: product.price
            });
        } else if (item.pack_id) {
            const pack = packsMap[item.pack_id];
            if (!pack) throw new Error(`Pack ${item.pack_id} not found`);

            subtotal += pack.price * item.quantity;
            itemsWithSnapshots.push({
                pack_id: pack.id,
                product_name: pack.name_fr,
                product_image: pack.image_url,
                quantity: item.quantity,
                price_at_purchase: pack.price
            });
        }
    }

    let total = subtotal;
    let discount = 0;

    if (promo_code) {
        const { data: promo } = await supabase
            .from('promo_codes')
            .select('*')
            .eq('code', promo_code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (promo) {
            if (promo.expires_at && new Date() > new Date(promo.expires_at)) throw new Error('Promo code expired');
            if (promo.max_uses !== null && promo.used_count >= promo.max_uses) throw new Error('Promo code limit reached');
            if (subtotal < promo.min_order) throw new Error(`Minimum order for this promo is ${promo.min_order} DA`);

            if (promo.type === 'percentage') {
                discount = (subtotal * promo.value) / 100;
            } else {
                discount = promo.value;
            }
            total = Math.max(0, subtotal - discount);

            await supabase
                .from('promo_codes')
                .update({ used_count: promo.used_count + 1 })
                .eq('id', promo.id);
        }
    }

    const { data: userSession } = await supabase.auth.getSession();
    const user_id = userSession?.session?.user?.id || null;

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            ...orderData,
            order_number: generateOrderNumber(),
            total_price: total,
            user_id
        })
        .select()
        .single();

    if (orderError) throw orderError;

    const finalItems = itemsWithSnapshots.map(item => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await supabase.from('order_items').insert(finalItems);
    if (itemsError) throw itemsError;

    // Send to n8n webhook
    try {
        await fetch('https://innovation-team.hawiyat.org/webhook/COFTAN', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_number: order.order_number,
                customer_name: order.customer_name || `${orderData.first_name || ''} ${orderData.last_name || ''}`.trim(),
                customer_phone: order.customer_phone || orderData.phone,
                wilaya: order.wilaya || orderData.wilaya,
                city: order.notes || orderData.city,
                address: order.shipping_address || orderData.address,
                total_price: total,
                items: finalItems.map(item => ({
                    product_name: item.product_name,
                    quantity: item.quantity,
                    price: item.price_at_purchase,
                    size: item.size || '',
                    color: item.color || ''
                }))
            })
        });
    } catch (webhookError) {
        console.error('Webhook error:', webhookError);
    }

    return { data: order };
};

export const getAdminOrders = async (params = {}) => {
    let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

    if (params.status && params.status !== 'ALL') {
        query = query.eq('status', params.status);
    }

    if (params.search) {
        query = query.or(`order_number.ilike.%${params.search}%,customer_name.ilike.%${params.search}%,customer_phone.ilike.%${params.search}%`);
    }

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
        data: {
            orders: data,
            total: count,
            pages: Math.ceil((count || 0) / limit)
        }
    };
};

export const updateOrderStatus = async (id, status) => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return { data };
};

export const deleteOrder = async (id) => {
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;

    return { data: { success: true } };
};

export const getOrderById = async (id) => {
    return supabase
        .from('orders')
        .select(`
            *,
            items:order_items(*)
        `)
        .eq('id', id)
        .single();
};

export const updateOrderGuepex = async (id, fields) => {
    const { data, error } = await supabase
        .from('orders')
        .update(fields)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return { data };
};

export const getGuepexDeliveryStats = async () => {
    const [
        { count: total },
        { count: in_transit },
        { count: delivered },
        { count: returned },
    ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).not('guepex_tracking_id', 'is', null),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('guepex_status', 'in_transit'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('guepex_status', 'delivered'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('guepex_status', 'returned'),
    ]);
    return { total: total || 0, in_transit: in_transit || 0, delivered: delivered || 0, returned: returned || 0 };
};
