-- Optimizing Doctor Dashboard Performance
-- Indexes for consultations summary statistics
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_date ON consultations(doctor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_status ON consultations(doctor_id, status);

-- Functional index for SpO2 alerts (vitals is JSON string)
CREATE INDEX IF NOT EXISTS idx_consultations_vitals_spo2 ON consultations (CAST(json_extract(vitals, '$.spo2') AS NUMERIC));
CREATE INDEX IF NOT EXISTS idx_consultations_vitals_bp_sys ON consultations (CAST(json_extract(vitals, '$.bp_systolic') AS NUMERIC));
CREATE INDEX IF NOT EXISTS idx_consultations_vitals_bp_dia ON consultations (CAST(json_extract(vitals, '$.bp_diastolic') AS NUMERIC));

-- Index for Patient queries
CREATE INDEX IF NOT EXISTS idx_patients_village_id ON patients(village_id);
CREATE INDEX IF NOT EXISTS idx_patients_name_phone ON patients(name, phone);

-- Index for prescriptions history
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_timestamp ON prescriptions(patient_id, timestamp DESC);
