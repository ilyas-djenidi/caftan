import { supabase } from '../lib/supabase';

/**
 * Updates the local database order status when a shipment is manually cancelled or handled.
 */
export const updateShipmentStatus = async (tracking, status, orderNumber) => {
    // Note: We no longer update the `shipments` table because we fetch directly from Guepex.
    // We only update the `orders` table to keep local app state synced.

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
