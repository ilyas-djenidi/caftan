const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dpnttpriwkxddhrxntgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbnR0cHJpd2t4ZGRocnhudGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NzM2NjksImV4cCI6MjA5NDI0OTY2OX0.HNlIiS9h_FS0oIZENrJiV-ohwpb3qVK1C-uQahoRyvk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    // get a product ID
    const { data: prods } = await supabase.from('products').select('id').limit(1);
    const id = prods[0].id;
    console.log("Testing on Product ID:", id);

    // delete existing attributes
    const { error: delError } = await supabase.from('product_attributes').delete().eq('product_id', id);
    if (delError) console.error("Del Error:", delError);

    // try inserting attributes
    const attributes = [
        { type: 'color', value: '#FFFFFF', label: 'Blanc', is_available: true, product_id: id }
    ];

    const { error: attrError } = await supabase.from('product_attributes').insert(attributes);
    if (attrError) {
        console.error("Insert Error:", attrError);
    } else {
        console.log("Insert Success!");
    }
}

testUpdate();
