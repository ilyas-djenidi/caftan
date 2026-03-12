-- 1. Update Orders Table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guepex_tracking text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guepex_status text DEFAULT 'non_expedie';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS frais_livraison integer DEFAULT 0;

-- 2. Create Shipping Rates Table
CREATE TABLE IF NOT EXISTS shipping_rates (
    wilaya text PRIMARY KEY,
    zone integer NOT NULL,
    tarif_domicile integer NOT NULL,
    tarif_stopdesk integer NOT NULL,
    tarif_retour integer DEFAULT 250,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Create Shipments Table
CREATE TABLE IF NOT EXISTS shipments (
    tracking text PRIMARY KEY,
    order_id uuid REFERENCES orders(id),
    order_number text,
    status text,
    wilaya text,
    ville text,
    destinataire_nom text,
    destinataire_phone text,
    date_expedition timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS Policies
DROP POLICY IF EXISTS "Allow all for authenticated users" ON shipping_rates;
CREATE POLICY "Allow all for authenticated users" ON shipping_rates FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated users" ON shipments;
CREATE POLICY "Allow all for authenticated users" ON shipments FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow read for anon users" ON shipping_rates;
CREATE POLICY "Allow read for anon users" ON shipping_rates FOR SELECT USING (true);

-- 6. Seed Shipping Rates (Zone-based)
-- Zone 0: Domicile 500 DA / Stop-desk 400 DA
-- Zone 1: Domicile 550 DA / Stop-desk 450 DA
-- Zone 2: Domicile 700 DA / Stop-desk 600 DA
-- Zone 3: Domicile 850 DA / Stop-desk 700 DA
-- Zone 4: Domicile 1650 DA / Stop-desk 1550 DA
-- Zone 5: Domicile 1650 DA / Stop-desk 1550 DA

INSERT INTO shipping_rates (wilaya, zone, tarif_domicile, tarif_stopdesk) VALUES
('M''Sila', 0, 500, 400),
('Batna', 1, 550, 450),
('Bouira', 1, 550, 450),
('Alger', 1, 550, 450),
('Sétif', 1, 550, 450),
('Médéa', 1, 550, 450),
('Bordj Bou Arréridj', 1, 550, 450),
('Chlef', 2, 700, 600),
('Oum El Bouaghi', 2, 700, 600),
('Béjaïa', 2, 700, 600),
('Biskra', 2, 700, 600),
('Blida', 2, 700, 600),
('Tlemcen', 2, 700, 600),
('Tiaret', 2, 700, 600),
('Tizi Ouzou', 2, 700, 600),
('Djelfa', 2, 700, 600),
('Jijel', 2, 700, 600),
('Saïda', 2, 700, 600),
('Skikda', 2, 700, 600),
('Sidi Bel Abbès', 2, 700, 600),
('Annaba', 2, 700, 600),
('Guelma', 2, 700, 600),
('Constantine', 2, 700, 600),
('Mostaganem', 2, 700, 600),
('Mascara', 2, 700, 600),
('Oran', 2, 700, 600),
('Boumerdès', 2, 700, 600),
('El Tarf', 2, 700, 600),
('Tissemsilt', 2, 700, 600),
('Khenchela', 2, 700, 600),
('Souk Ahras', 2, 700, 600),
('Tipaza', 2, 700, 600),
('Mila', 2, 700, 600),
('Aïn Defla', 2, 700, 600),
('Aïn Témouchent', 2, 700, 600),
('Relizane', 2, 700, 600),
('Laghouat', 3, 850, 700),
('Tébessa', 3, 850, 700),
('Ouargla', 3, 850, 700),
('El Oued', 3, 850, 700),
('Ghardaïa', 3, 850, 700),
('Adrar', 4, 1650, 1550),
('Béchar', 4, 1650, 1550),
('El Bayadh', 4, 1650, 1550),
('Naâma', 4, 1650, 1550),
('Tamanrasset', 5, 1650, 1550),
('Illizi', 5, 1650, 1550),
('Tindouf', 5, 1650, 1550),
('Timimoun', 4, 1650, 1550),
('Bordj Badji Mokhtar', 5, 1650, 1550),
('Ouled Djellal', 3, 850, 700),
('Béni Abbès', 4, 1650, 1550),
('In Salah', 5, 1650, 1550),
('In Guezzam', 5, 1650, 1550),
('Touggourt', 3, 850, 700),
('Djanet', 5, 1650, 1550),
('El M''Ghair', 3, 850, 700),
('El Meniaa', 3, 850, 700)
ON CONFLICT (wilaya) DO UPDATE SET
    zone = EXCLUDED.zone,
    tarif_domicile = EXCLUDED.tarif_domicile,
    tarif_stopdesk = EXCLUDED.tarif_stopdesk;
