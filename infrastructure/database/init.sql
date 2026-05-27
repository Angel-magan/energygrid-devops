CREATE TABLE IF NOT EXISTS districts (
    id VARCHAR(80) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    capacity_max_kw DECIMAL(10, 2) NOT NULL DEFAULT 5000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO districts (id, name, capacity_max_kw)
VALUES
    ('Metapán', 'Metapán', 3500),
    ('San Sebastian Salitrillo', 'San Sebastian Salitrillo', 2200),
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

CREATE TABLE IF NOT EXISTS telemetry (
    id SERIAL PRIMARY KEY,
    district_id VARCHAR(50) NOT NULL,
    substation_id VARCHAR(50) NOT NULL,
    consumption_kw DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);