-- Nivaro Health Technologies - SQLite Database Schema

CREATE TABLE villages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    district TEXT,
    state TEXT
);

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- admin, doctor, operator
    village_id TEXT REFERENCES villages(id),
    
    -- Doctor Specific Fields
    license_number TEXT,
    medical_degree TEXT,
    specialization TEXT,
    experience_years INT,
    hospital_affiliation TEXT,
    profile_photo_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

CREATE TABLE patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INT,
    gender TEXT,
    phone TEXT UNIQUE NOT NULL,
    address TEXT,
    village_id TEXT REFERENCES villages(id),
    medical_history TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    generic_name TEXT,
    strength TEXT,
    form TEXT,
    sku_id TEXT UNIQUE NOT NULL,
    purchase_cost REAL,
    selling_price REAL,
    low_stock_threshold INT DEFAULT 20,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_orders (
    id TEXT PRIMARY KEY,
    vendor_id TEXT REFERENCES vendors(id),
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL,
    status TEXT DEFAULT 'pending' -- pending, received, cancelled
);

CREATE TABLE inventory_batches (
    id TEXT PRIMARY KEY,
    medicine_id TEXT REFERENCES medicines(id),
    village_id TEXT REFERENCES villages(id),
    batch_number TEXT NOT NULL,
    purchase_order_id TEXT REFERENCES purchase_orders(id),
    expiry_date DATE NOT NULL,
    initial_quantity INT NOT NULL,
    remaining_quantity INT NOT NULL,
    purchase_cost REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_movements (
    id TEXT PRIMARY KEY,
    medicine_id TEXT REFERENCES medicines(id),
    batch_id TEXT REFERENCES inventory_batches(id),
    village_id TEXT REFERENCES villages(id),
    movement_type TEXT NOT NULL, -- PURCHASE, TRANSFER, DISPENSING, ADJUSTMENT, EXPIRY
    quantity INT NOT NULL, -- Positive for intake, negative for deduction
    linked_entity_id TEXT, -- prescription_id, transfer_id, etc.
    user_id TEXT REFERENCES users(id),
    reason TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SQLite Search Indexes
CREATE INDEX idx_medicine_name ON medicines(name);
CREATE INDEX idx_medicine_sku ON medicines(sku_id);
CREATE INDEX idx_batch_expiry ON inventory_batches(expiry_date);
CREATE INDEX idx_movement_medicine ON stock_movements(medicine_id);

CREATE TABLE inventory (
    id TEXT PRIMARY KEY,
    medicine_id TEXT REFERENCES medicines(id),
    village_id TEXT REFERENCES villages(id),
    quantity INT DEFAULT 0,
    batch_number TEXT,
    expiry_date DATE,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(medicine_id, village_id)
);

CREATE TABLE consultations (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id),
    operator_id TEXT REFERENCES users(id),
    doctor_id TEXT REFERENCES users(id),
    vitals TEXT, -- JSON string
    status TEXT DEFAULT 'pending', -- pending, in_progress, rx_written, completed
    fee REAL,
    notes TEXT,
    start_time DATETIME,
    end_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescriptions (
    id TEXT PRIMARY KEY,
    consultation_id TEXT REFERENCES consultations(id),
    prescription_id TEXT UNIQUE NOT NULL,
    doctor_id TEXT REFERENCES users(id),
    patient_id TEXT REFERENCES patients(id),
    medicines TEXT, -- JSON string
    instructions TEXT,
    digital_signature TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(consultation_id)
);

CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    prescription_id TEXT REFERENCES prescriptions(id),
    consultation_id TEXT REFERENCES consultations(id),
    amount REAL,
    status TEXT DEFAULT 'pending', -- pending, paid
    commission_amount REAL,
    operator_id TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    role TEXT,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id TEXT,
    prev_value TEXT, -- JSON string
    new_value TEXT, -- JSON string
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
