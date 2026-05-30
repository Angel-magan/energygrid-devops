-- CREATE TABLE IF NOT EXISTS districts (
--     id VARCHAR(80) PRIMARY KEY,
--     name VARCHAR(120) NOT NULL,
--     capacity_max_kw DECIMAL(10, 2) NOT NULL DEFAULT 5000,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- INSERT INTO districts (id, name, capacity_max_kw)
-- VALUES
--     ('Metapán', 'Metapán', 3500),
--     ('San Sebastian Salitrillo', 'San Sebastian Salitrillo', 2200),
--     ('Masahuat', 'Masahuat', 1800),
--     ('Santa Rosa Guachipilín', 'Santa Rosa Guachipilín', 2000),
--     ('Candelaria de la Frontera', 'Candelaria de la Frontera', 2800),
--     ('Santiago de la Frontera', 'Santiago de la Frontera', 2100),
--     ('San Antonio Pajonal', 'San Antonio Pajonal', 1600),
--     ('Texistepeque', 'Texistepeque', 2500),
--     ('Santa Ana', 'Santa Ana', 4800),
--     ('Chalchuapa', 'Chalchuapa', 4000),
--     ('Coatepeque', 'Coatepeque', 4200),
--     ('El Congo', 'El Congo', 3000),
--     ('El Porvenir', 'El Porvenir', 1700)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE TABLE IF NOT EXISTS telemetry (
--     id SERIAL PRIMARY KEY,
--     district_id VARCHAR(50) NOT NULL,
--     substation_id VARCHAR(50) NOT NULL,
--     consumption_kw DECIMAL(10, 2) NOT NULL,
--     timestamp TIMESTAMP NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- =============================================================================
-- ENERGYGRID SV - SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS (LOCAL & PROD)
-- =============================================================================

-- 1. Crear la tabla catálogo de distritos (Sector Occidente / Santa Ana)
CREATE TABLE IF NOT EXISTS districts (
    id VARCHAR(80) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    capacity_max_kw DECIMAL(10, 2) NOT NULL DEFAULT 5000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    district_id VARCHAR(50) NOT NULL,
    substation_id VARCHAR(50) NOT NULL,
    consumption_kw DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insertar los 13 distritos oficiales garantizando compatibilidad con el simulador
INSERT INTO districts (id, name, capacity_max_kw)
VALUES
    ('Metapán', 'Metapán', 3500),
    ('San Sebastián Salitrillo', 'San Sebastián Salitrillo', 2200), -- CON acento para hacer match con Python
    ('Masahuat', 'Masahuat', 1800),
    ('Santa Rosa Guachipilín', 'Santa Rosa Guachipilín', 2000),
    ('Candelaria de la Frontera', 'Candelaria de la Frontera', 2800),
    ('Santiago de la Frontera', 'Santiago de la Frontera', 2100),
    ('San Antonio Pajonal', 'San Antonio Pajonal', 1600),
    ('Texistepeque', 'Texistepeque', 2500),
    ('Santa Ana', 'Santa Ana', 4800),
    ('Chalchuapa', 'Chalchuapa', 4000),
    ('Coatepeque', 'Coatepeque', 4200),
    ('El Congo', 'El Congo', 3000),
    ('El Porvenir', 'El Porvenir', 1700)
ON CONFLICT (id) DO NOTHING;

-- 3. Limpieza preventiva en la tabla de telemetría (por si hay basura local)
DELETE FROM telemetry WHERE district_id IS NULL OR district_id = '';

-- 4. Asegurar que la columna de la tabla existente mida exactamente lo mismo que la PK
ALTER TABLE telemetry 
ALTER COLUMN district_id TYPE VARCHAR(80);

-- 5. Crear el puente de integridad (Llave Foránea)
-- El condicional evita errores si el script se corre en una base donde ya existe la FK
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_telemetry_districts' AND table_name = 'telemetry'
    ) THEN
        ALTER TABLE telemetry
        ADD CONSTRAINT fk_telemetry_districts
        FOREIGN KEY (district_id) 
        REFERENCES districts(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;
    END IF;
END $$;