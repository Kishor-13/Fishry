-- ==============================================================================
-- SMART AQUACULTURE FEED MANAGER / स्मार्ट मत्स्य खाद्य व्यवस्थापक
-- Supabase PostgreSQL Schema & Initial Seeding Script
-- ==============================================================================

-- Enable pgcrypto extension for secure bcrypt password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Feeding Rules Table
CREATE TABLE IF NOT EXISTS public.feeding_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species TEXT NOT NULL,
    scientific_name TEXT,
    culture_stage TEXT NOT NULL, -- 'Nursery', 'Rearing', 'Grow-out', 'All'
    min_weight NUMERIC(10, 2),   -- in grams (inclusive/exclusive boundary)
    max_weight NUMERIC(10, 2),   -- in grams
    min_month NUMERIC(5, 1),    -- for culture period (e.g. Pangasius)
    max_month NUMERIC(5, 1),
    feeding_method TEXT NOT NULL, -- 'BIOMASS_PERCENT', 'INITIAL_SPAWN_WEIGHT', 'VERIFIED_PROTOCOL', 'FORAGE_BASED', 'MANUAL'
    feeding_rate NUMERIC(6, 2),   -- Default working value percentage (e.g. 7.00, 2.50)
    rate_min NUMERIC(6, 2),       -- Range minimum (e.g. 6.00)
    rate_max NUMERIC(6, 2),       -- Range maximum (e.g. 8.00)
    priority INTEGER DEFAULT 10,  -- Weight-based specific rules have higher priority (e.g. 50 > 10)
    source TEXT NOT NULL,         -- Source / standard protocol citation
    notes TEXT,                   -- Farmer notes in English
    notes_mr TEXT,                -- Farmer notes in Marathi
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for speedy rule lookups
CREATE INDEX IF NOT EXISTS idx_feeding_rules_lookup 
ON public.feeding_rules (species, culture_stage, active);

-- 2. Feed History Table
CREATE TABLE IF NOT EXISTS public.feed_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    species TEXT NOT NULL,
    scientific_name TEXT,
    culture_stage TEXT NOT NULL,
    culture_month NUMERIC(5, 1),
    stocked NUMERIC(12, 2) NOT NULL,
    survival_percent NUMERIC(5, 2) NOT NULL,
    average_weight NUMERIC(10, 2) NOT NULL,
    surviving_fish NUMERIC(12, 2) NOT NULL,
    feeding_rate NUMERIC(6, 2) NOT NULL,
    feeding_method TEXT NOT NULL,
    rate_source TEXT NOT NULL, -- 'AUTOMATIC_RULE' or 'FARMER_ENTERED'
    rule_explanation TEXT,
    biomass NUMERIC(12, 3) NOT NULL,
    daily_feed NUMERIC(12, 3) NOT NULL,
    morning_feed NUMERIC(12, 3) NOT NULL,
    evening_feed NUMERIC(12, 3) NOT NULL,
    feed_price NUMERIC(10, 2) DEFAULT 0,
    feed_cost NUMERIC(12, 2) DEFAULT 0,
    rule_id UUID REFERENCES public.feeding_rules(id) ON DELETE SET NULL,
    pond_id UUID,
    pond_name TEXT,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_feed_history_created 
ON public.feed_history (created_at DESC);

-- 3. Pond Management Table
CREATE TABLE IF NOT EXISTS public.ponds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    area_acres NUMERIC(8, 2),
    depth_feet NUMERIC(6, 2),
    species TEXT,
    culture_stage TEXT,
    stocking_count NUMERIC(12, 0),
    survival_percent NUMERIC(5, 2),
    average_weight_g NUMERIC(10, 2),
    estimated_biomass_kg NUMERIC(12, 2),
    notes TEXT
);

-- 4. Farmers Authentication Table
CREATE TABLE IF NOT EXISTS public.farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    mobile VARCHAR(15) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    farm_name TEXT,
    role TEXT DEFAULT 'farmer'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_farmers_mobile ON public.farmers(mobile);

-- Enable Row Level Security (RLS)
ALTER TABLE public.feeding_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ponds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on feeding_rules" ON public.feeding_rules FOR SELECT USING (true);
CREATE POLICY "Allow public all on feed_history" ON public.feed_history FOR ALL USING (true);
CREATE POLICY "Allow public all on ponds" ON public.ponds FOR ALL USING (true);
CREATE POLICY "Allow public register farmers" ON public.farmers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select farmers" ON public.farmers FOR SELECT USING (true);

-- ==============================================================================
-- SECURE AUTHENTICATION FUNCTIONS (PostgreSQL RPC)
-- ==============================================================================

-- 1. Secure Register: hashes password using bcrypt salt
CREATE OR REPLACE FUNCTION public.register_farmer(
    p_name TEXT,
    p_mobile TEXT,
    p_password TEXT,
    p_farm_name TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    mobile VARCHAR,
    farm_name TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
    v_created_at TIMESTAMPTZ;
BEGIN
    -- Check if mobile already exists
    IF EXISTS (SELECT 1 FROM public.farmers WHERE farmers.mobile = p_mobile) THEN
        RAISE EXCEPTION 'MOBILE_ALREADY_REGISTERED';
    END IF;

    -- Insert new farmer with bcrypt salted hash
    INSERT INTO public.farmers (name, mobile, password_hash, farm_name)
    VALUES (
        p_name,
        p_mobile,
        crypt(p_password, gen_salt('bf', 8)),
        p_farm_name
    )
    RETURNING farmers.id, farmers.created_at INTO v_id, v_created_at;

    RETURN QUERY
    SELECT v_id, p_name, p_mobile::VARCHAR, p_farm_name, v_created_at;
END;
$$;

-- 2. Secure Login: validates password without exposing password_hash to the client
CREATE OR REPLACE FUNCTION public.login_farmer(
    p_mobile TEXT,
    p_password TEXT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    mobile VARCHAR,
    farm_name TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT f.id, f.name, f.mobile, f.farm_name, f.created_at
    FROM public.farmers f
    WHERE f.mobile = p_mobile
      AND f.password_hash = crypt(p_password, f.password_hash);
END;
$$;

-- ==============================================================================
-- INITIAL SEED DATA FOR FEEDING RULES
-- ==============================================================================

TRUNCATE TABLE public.feeding_rules CASCADE;

INSERT INTO public.feeding_rules 
(species, scientific_name, culture_stage, min_weight, max_weight, min_month, max_month, feeding_method, feeding_rate, rate_min, rate_max, priority, source, notes, notes_mr) 
VALUES
-- ROHU (Labeo rohita)
('Rohu', 'Labeo rohita', 'Nursery', NULL, NULL, NULL, NULL, 'INITIAL_SPAWN_WEIGHT', NULL, NULL, NULL, 10, 'CIFA Standard Protocol', 'First 5-7 days: 4x initial spawn weight. Subsequent: 8x initial spawn weight.', 'पहिले ५-७ दिवस: सुरुवातीच्या स्पॉन वजनाच्या ४ पट; पुढील कालावधीत: ८ पट.'),
('Rohu', 'Labeo rohita', 'Rearing', NULL, NULL, NULL, NULL, 'BIOMASS_PERCENT', 7.00, 6.00, 8.00, 20, 'ICAR-CIFA Freshwater Aquaculture Guide', '6–8% biomass/day (Default working value: 7%)', 'बायोमासच्या ६–८%/दिवस (निवडलेला कार्य दर: ७%)'),
('Rohu', 'Labeo rohita', 'Grow-out', NULL, NULL, NULL, NULL, 'BIOMASS_PERCENT', 2.50, 2.00, 3.00, 20, 'ICAR-CIFA Freshwater Aquaculture Guide', '2–3% biomass/day (Default working value: 2.5%)', 'बायोमासच्या २–३%/दिवस (निवडलेला कार्य दर: २.५%)'),

-- CATLA (Catla catla)
('Catla', 'Catla catla', 'Nursery', NULL, NULL, NULL, NULL, 'INITIAL_SPAWN_WEIGHT', NULL, NULL, NULL, 10, 'CIFA Standard Protocol', 'First 5-7 days: 4x initial spawn weight. Subsequent: 8x initial spawn weight.', 'पहिले ५-७ दिवस: सुरुवातीच्या स्पॉन वजनाच्या ४ पट; पुढील कालावधीत: ८ पट.'),
('Catla', 'Catla catla', 'Rearing', NULL, NULL, NULL, NULL, 'BIOMASS_PERCENT', 7.00, 6.00, 8.00, 20, 'ICAR-CIFA Freshwater Aquaculture Guide', '6–8% biomass/day (Default working value: 7%)', 'बायोमासच्या ६–८%/दिवस (निवडलेला कार्य दर: ७%)'),
('Catla', 'Catla catla', 'Grow-out', NULL, NULL, NULL, NULL, 'BIOMASS_PERCENT', 2.50, 2.00, 3.00, 20, 'ICAR-CIFA Freshwater Aquaculture Guide', '2–3% biomass/day (Default working value: 2.5%)', 'बायोमासच्या २–३%/दिवस (निवडलेला कार्य दर: २.५%)'),

-- MRIGAL (Cirrhinus cirrhosus)
('Mrigal', 'Cirrhinus cirrhosus', 'Nursery', NULL, NULL, NULL, NULL, 'INITIAL_SPAWN_WEIGHT', NULL, NULL, NULL, 10, 'CIFA Standard Protocol', 'First 5-7 days: 4x initial spawn weight. Subsequent: 8x initial spawn weight.', 'पहिले ५-७ दिवस: सुरुवातीच्या स्पॉन वजनाच्या ४ पट; पुढील कालावधीत: ८ पट.'),
('Mrigal', 'Cirrhinus cirrhosus', 'Rearing', NULL, NULL, NULL, NULL, 'BIOMASS_PERCENT', 7.00, 6.00, 8.00, 20, 'ICAR-CIFA Freshwater Aquaculture Guide', '6–8% biomass/day (Default working value: 7%)', 'बायोमासच्या ६–८%/दिवस (निवडलेला कार्य दर: ७%)'),
('Mrigal', 'Cirrhinus cirrhosus', 'Grow-out', NULL, NULL, NULL, NULL, 'BIOMASS_PERCENT', 2.50, 2.00, 3.00, 20, 'ICAR-CIFA Freshwater Aquaculture Guide', '2–3% biomass/day (Default working value: 2.5%)', 'बायोमासच्या २–३%/दिवस (निवडलेला कार्य दर: २.५%)'),

-- COMMON CARP (Cyprinus carpio) - Priority weight-based rules
('Common Carp', 'Cyprinus carpio', 'All', 1.00, 10.00, NULL, NULL, 'BIOMASS_PERCENT', 20.00, 20.00, 20.00, 50, 'FAO / ICAR Standard Carp Protocol', '1–10 g weight range: 20% biomass/day', '१–१० ग्रॅम वजन श्रेणी: बायोमासच्या २०% दर'),
('Common Carp', 'Cyprinus carpio', 'All', 10.01, 90.00, NULL, NULL, 'BIOMASS_PERCENT', 10.00, 10.00, 10.00, 50, 'FAO / ICAR Standard Carp Protocol', '10–90 g weight range: 10% biomass/day', '१०–९० ग्रॅम वजन श्रेणी: बायोमासच्या १०% दर'),
('Common Carp', 'Cyprinus carpio', 'All', 90.01, 200.00, NULL, NULL, 'BIOMASS_PERCENT', 7.00, 7.00, 7.00, 50, 'FAO / ICAR Standard Carp Protocol', '100–200 g weight range: 7% biomass/day', '१००–२०० ग्रॅम वजन श्रेणी: बायोमासच्या ७% दर'),
('Common Carp', 'Cyprinus carpio', 'All', 200.01, 500.00, NULL, NULL, 'BIOMASS_PERCENT', 4.80, 4.80, 4.80, 50, 'FAO / ICAR Standard Carp Protocol', '200–500 g weight range: 4.8% biomass/day', '२००–५०० ग्रॅम वजन श्रेणी: बायोमासच्या ४.८% दर'),
('Common Carp', 'Cyprinus carpio', 'All', 500.01, 900.00, NULL, NULL, 'BIOMASS_PERCENT', 3.30, 3.30, 3.30, 50, 'FAO / ICAR Standard Carp Protocol', '500–900 g weight range: 3.3% biomass/day', '५००–९०० ग्रॅम वजन श्रेणी: बायोमासच्या ३.३% दर'),
('Common Carp', 'Cyprinus carpio', 'All', 900.01, 1000.00, NULL, NULL, 'BIOMASS_PERCENT', 2.40, 2.40, 2.40, 50, 'FAO / ICAR Standard Carp Protocol', '900–1000 g weight range: 2.4% biomass/day', '९००–१००० ग्रॅम वजन श्रेणी: बायोमासच्या २.४% दर'),
('Common Carp', 'Cyprinus carpio', 'Grow-out', 1000.01, 99999.00, NULL, NULL, 'BIOMASS_PERCENT', 2.00, 1.80, 2.20, 40, 'FAO / ICAR Standard Carp Protocol', '>1000 g mature weight: 2% biomass/day', '>१००० ग्रॅम प्रौढ वजन: बायोमासच्या २% दर'),

-- TILAPIA (Oreochromis spp.) - Priority weight-based rules
('Tilapia', 'Oreochromis spp.', 'All', 0.01, 9.99, NULL, NULL, 'BIOMASS_PERCENT', 8.00, 7.00, 9.00, 50, 'FAO Tilapia Feed Management', '<10 g weight range: 7–9% biomass/day (Default: 8%)', '<१० ग्रॅम वजन श्रेणी: ७–९% बायोमास (कार्यकारी दर: ८%)'),
('Tilapia', 'Oreochromis spp.', 'All', 10.00, 39.99, NULL, NULL, 'BIOMASS_PERCENT', 7.00, 6.00, 8.00, 50, 'FAO Tilapia Feed Management', '10–40 g weight range: 6–8% biomass/day (Default: 7%)', '१०–४० ग्रॅम वजन श्रेणी: ६–८% बायोमास (कार्यकारी दर: ७%)'),
('Tilapia', 'Oreochromis spp.', 'All', 40.00, 99.99, NULL, NULL, 'BIOMASS_PERCENT', 6.00, 5.00, 7.00, 50, 'FAO Tilapia Feed Management', '40–100 g weight range: 5–7% biomass/day (Default: 6%)', '४०–१०० ग्रॅम वजन श्रेणी: ५–७% बायोमास (कार्यकारी दर: ६%)'),
('Tilapia', 'Oreochromis spp.', 'All', 100.00, 99999.00, NULL, NULL, 'BIOMASS_PERCENT', 4.00, 3.00, 5.00, 50, 'FAO Tilapia Feed Management', '>100 g weight range: 3–5% biomass/day (Default: 4%)', '>१०० ग्रॅम वजन श्रेणी: ३–५% बायोमास (कार्यकारी दर: ४%)'),

-- PANGASIUS - Culture-period rules
('Pangasius', 'Pangasianodon hypophthalmus', 'All', NULL, NULL, 0.0, 2.0, 'BIOMASS_PERCENT', 5.00, 5.00, 5.00, 35, 'ICAR-CIFA Pangasius Protocol', 'First 2 months (Months 1–2): 5% biomass/day', 'पहिले २ महिने (महिने १–२): बायोमासच्या ५% दर'),
('Pangasius', 'Pangasianodon hypophthalmus', 'All', NULL, NULL, 2.1, 5.0, 'BIOMASS_PERCENT', 3.00, 3.00, 3.00, 35, 'ICAR-CIFA Pangasius Protocol', 'Months 3–5: 3% biomass/day', 'महिने ३–५: बायोमासच्या ३% दर'),
('Pangasius', 'Pangasianodon hypophthalmus', 'All', NULL, NULL, 5.1, 99.0, 'BIOMASS_PERCENT', 2.00, 2.00, 2.00, 35, 'ICAR-CIFA Pangasius Protocol', 'Month 6 onward: 2% biomass/day', 'महिना ६ आणि पुढे: बायोमासच्या २% दर'),

-- MAGUR (Clarias batrachus) - Verified Protocol
('Magur', 'Clarias batrachus', 'All', NULL, NULL, NULL, NULL, 'VERIFIED_PROTOCOL', NULL, NULL, NULL, 30, 'ICAR-CIFA Catfish Farming Standard', 'Requires verified protocol for specific farm conditions and wet/pellet formulation.', 'या पालन परिस्थितीसाठी प्रमाणित मागूर खाद्य पद्धत वापरा.'),

('Grass Carp', 'Ctenopharyngodon idella', 'All', NULL, NULL, NULL, NULL, 'FORAGE_BASED', NULL, NULL, NULL, 30, 'ICAR Herbivorous Carp Schedule', 'Requires verified aquatic vegetation / green forage and supplementary feed schedule.', 'ग्रास कार्पसाठी प्रमाणित चारा व पूरक खाद्य वेळापत्रक वापरा.')
;

-- ==============================================================================
-- INITIAL DEMO FARMER SEED (Mobile: 9876543210, Password: farmer123)
-- ==============================================================================
INSERT INTO public.farmers (name, mobile, password_hash, farm_name)
VALUES (
    'Ramesh Patil',
    '9876543210',
    crypt('farmer123', gen_salt('bf', 8)),
    'Patil Aquaculture Farm'
)
ON CONFLICT (mobile) DO UPDATE
SET password_hash = crypt('farmer123', gen_salt('bf', 8));

