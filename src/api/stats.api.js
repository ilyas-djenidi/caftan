import { supabase } from '../lib/supabase'

export const getDashboardStats = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Today Orders
    const { count: todayOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

    // Pending Orders
    const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    // Month Revenue
    const { data: monthOrders } = await supabase
        .from('orders')
        .select('total_price')
        .gte('created_at', monthStart.toISOString());
    const monthRevenue = monthOrders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

    // Unread Messages
    const { count: unreadMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread');

    // Total Products
    const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    // Low Stock Products
    const { data: lowStock } = await supabase
        .from('products')
        .select('id, name_fr, stock_count')
        .lt('stock_count', 5)
        .limit(10);

    // Orders Chart (Last 7 Days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date();
        dayEnd.setDate(dayEnd.getDate() - i);
        dayEnd.setHours(23, 59, 59, 999);

        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', dayStart.toISOString())
            .lte('created_at', dayEnd.toISOString());

        last7Days.push({
            date: dayStart.toISOString().split('T')[0],
            count: count || 0
        });
    }

    return {
        data: {
            today_orders: todayOrders || 0,
            pending_orders: pendingOrders || 0,
            month_revenue: monthRevenue || 0,
            unread_messages: unreadMessages || 0,
            products_count: productsCount || 0,
            total_visitors: 0,
            orders_chart: last7Days,
            low_stock: lowStock || []
        }
    };
};

// Assuming site content was handled as a single global row or JSON.
// Since we don't have a content table in the Node setup (usually handled differently),
// we will mock it to prevent errors if the UI expects it.
export const getSiteContent = async () => ({ data: {} });
export const updateSiteContent = async (data) => ({ data });


