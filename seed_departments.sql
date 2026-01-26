-- Seed Departments
INSERT INTO departments (name) VALUES 
('Cardiology'),
('Neurology'),
('Pediatrics'),
('Orthopedics'),
('General Medicine'),
('Dermatology'),
('Gynecology'),
('ENT')
ON CONFLICT (name) DO NOTHING;
