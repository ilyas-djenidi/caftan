import { supabase } from '../lib/supabase';
import { getAllParcels, cancelParcel } from '../services/guepex';

/**
 * Fetches all shipments from the local database.
 */
export const getShipments = async (params = {}) => {
    let query = supabase
        .from('shipments')
        .select('*', { count: 'exact' })
        .order('date_expedition', { ascending: false });

    if (params.search) {
        query = query.or(`tracking.ilike.%${params.search}%,order_number.ilike.%${params.search}%,destinataire_nom.ilike.%${params.search}%`);
    }

    if (params.status && params.status !== 'Tous') {
        // Map status filter to actual Guepex status groups if needed
        // For now, simpler exact match or UI handles groups
        query = query.eq('status', params.status);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return { data, total: count };
};

/**
 * Syncs all shipments from Guepex API to our local database.
 */
export const syncShipments = async () => {
    let allParcels = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const res = await getAllParcels(page);
        if (res?.error || !res?.data) break;
        
        allParcels = [...allParcels, ...res.data];
        hasMore = res.has_more && page < 50; // Safety cap
        page++;
    }

    if (allParcels.length === 0) return { success: true, count: 0 };

    // Prepare data for upsert
    const shipmentsToUpsert = allParcels.map(p => ({
        tracking: p.tracking,
        order_number: p.order_id, // Guepex uses order_id for our order_number string
        status: p.last_status,
        wilaya: p.to_wilaya_name,
        ville: p.to_commune_name,
        destinataire_nom: `${p.firstname || ''} ${p.familyname || ''}`.trim(),
        destinataire_phone: p.contact_phone,
        date_expedition: p.date_expedition || p.date_creation,
    }));

    // Perform upsert
    const { error: upsertError } = await supabase
        .from('shipments')
        .upsert(shipmentsToUpsert, { onConflict: 'tracking' });

    if (upsertError) throw upsertError;

    // Update corresponding orders' guepex_status
    // We do this individually or in batches to avoid complexity
    for (const p of allParcels) {
        if (!p.order_id) continue;

        const updateData = { guepex_status: p.last_status };
        
        // Map Guepex status to internal status
        if (['Livré', 'delivered'].includes(p.last_status)) {
            updateData.status = 'delivered';
        } else if (['Retourné au vendeur', 'Retourné au centre', 'Annulé', 'returned', 'cancelled'].includes(p.last_status)) {
            updateData.status = 'cancelled';
        }

        await supabase
            .from('orders')
            .update(updateData)
            .eq('order_number', p.order_id);
    }

    return { success: true, count: allParcels.length };
};

/**
 * Returns the Guepex label PDF URL for a given tracking number.
 * Note: Actual Guepex API might return PDF content or a URL.
 * We'll use the proxy or direct Guepex endpoint.
 */
/**
 * Cancels a shipment on Guepex and updates the local database.
 */
export const updateShipmentStatus = async (tracking, status, orderNumber) => {
    const { error: shipError } = await supabase
        .from('shipments')
        .update({ status })
        .eq('tracking', tracking);
    
    if (shipError) throw shipError;

    if (orderNumber) {
        const orderUpdate = { guepex_status: status };
        if (['Annulé', 'cancelled', 'returned'].includes(status)) {
            orderUpdate.status = 'cancelled';
        }
        await supabase
            .from('orders')
            .update(orderUpdate)
            .eq('order_number', orderNumber);
    }
};

export const getShipmentLabelUrl = async (tracking) => {
    return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/guepex-proxy?endpoint=/parcels/${tracking}/print/`;
};
