-- Nivaro Health Technologies - Production Database Schema

CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'operator');
CREATE TYPE payment_status AS ENUM ('pending', 'paid');
CREATE TYPE consultation_status AS ENUM ('pending', 'in_progress', 'rx_written', 'completed');

CREATE TABLE villages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    village_id UUID REFERENCES villages(id), -- Null for Admin/Doctor
    
    -- Doctor Specific Fields
    license_number VARCHAR(50),
    medical_degree VARCHAR(100), -- MBBS, MD, etc.
    specialization VARCHAR(100),
    experience_years INT,
    hospital_affiliation VARCHAR(100),
    profile_photo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    age INT,
    gender VARCHAR(10),
    phone VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    village_id UUID REFERENCES villages(id),
    medical_history TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100),
    strength VARCHAR(50), -- e.g. 500mg
    form VARCHAR(50),     -- e.g. Tablet, Syrup
    sku_id VARCHAR(50) UNIQUE NOT NULL,
    purchase_cost DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    low_stock_threshold INT DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MANDATORY INDEXES for high-performance search
CREATE INDEX idx_medicine_name ON medicines USING GIN (to_tsvector('english', name));
CREATE INDEX idx_medicine_sku ON medicines(sku_id);
CREATE INDEX idx_medicine_generic ON medicines(generic_name);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID REFERENCES medicines(id),
    village_id UUID REFERENCES villages(id),
    quantity INT DEFAULT 0,
    batch_number VARCHAR(50),
    expiry_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_village_med UNIQUE (medicine_id, village_id)
);

CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    operator_id UUID REFERENCES users(id),
    doctor_id UUID REFERENCES users(id),
    vitals JSONB, -- {temp, bp_systolic, bp_diastolic, spo2, glucose}
    status consultation_status DEFAULT 'pending',
    fee DECIMAL(10, 2),
    notes TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_id UUID REFERENCES consultations(id) UNIQUE,
    prescription_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., NV-2026-0001
    doctor_id UUID REFERENCES users(id),
    patient_id UUID REFERENCES patients(id),
    medicines JSONB, -- Array of {medicine_id, sku, dosage, instructions}
    instructions TEXT,
    digital_signature TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID REFERENCES prescriptions(id),
    consultation_id UUID REFERENCES consultations(id),
    amount DECIMAL(10, 2),
    status payment_status DEFAULT 'pending',
    commission_amount DECIMAL(10, 2),
    operator_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    role user_role,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50),
    entity_id UUID,
    prev_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
