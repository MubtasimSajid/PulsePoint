-- Enhancements to the existing hospital management system
-- Add these tables to support advanced booking features

-- Doctor Availability Schedules (for time slot management)
CREATE TABLE IF NOT EXISTS doctor_schedules (
  schedule_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  doctor_id INT NOT NULL,
  facility_id INT, -- References either hospital_id or chamber_id
  facility_type VARCHAR(10) CHECK (facility_type IN ('hospital', 'chamber')),
  day_of_week VARCHAR(10) CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE
);

-- Time Slots (individual bookable slots)
CREATE TABLE IF NOT EXISTS appointment_slots (
  slot_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_id INT NOT NULL,
  doctor_id INT NOT NULL,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  facility_id INT,
  facility_type VARCHAR(10) CHECK (facility_type IN ('hospital', 'chamber')),
  status VARCHAR(20) DEFAULT 'free' CHECK (status IN ('free', 'booked', 'blocked', 'cancelled')),
  appointment_id INT,
  FOREIGN KEY (schedule_id) REFERENCES doctor_schedules(schedule_id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES doctors(user_id) ON DELETE CASCADE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  UNIQUE(doctor_id, slot_date, slot_time, facility_type)
);

-- Triage Notes (pre-appointment information)
CREATE TABLE IF NOT EXISTS triage_notes (
  triage_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  appointment_id INT NOT NULL,
  patient_id INT NOT NULL,
  symptoms TEXT,
  severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(user_id) ON DELETE CASCADE
);

-- Notifications System
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'appointment', 'reminder', 'alert')),
  is_read BOOLEAN DEFAULT FALSE,
  related_appointment_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (related_appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE
);

-- Add location column to existing tables if not exists
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS location VARCHAR(100);
ALTER TABLE chambers ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_doctor ON doctor_schedules(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_doctor_date ON appointment_slots(doctor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_status ON appointment_slots(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_triage_notes_appointment ON triage_notes(appointment_id);

-- Function to automatically create notification on appointment changes
CREATE OR REPLACE FUNCTION notify_appointment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify patient
  INSERT INTO notifications (user_id, title, message, type, related_appointment_id)
  VALUES (
    NEW.patient_id,
    'Appointment Update',
    'Your appointment status is now ' || NEW.status,
    'appointment',
    NEW.appointment_id
  );
  
  -- Notify doctor
  INSERT INTO notifications (user_id, title, message, type, related_appointment_id)
  VALUES (
    NEW.doctor_id,
    'Appointment Update',
    'Appointment status updated to ' || NEW.status,
    'appointment',
    NEW.appointment_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointment notifications
DROP TRIGGER IF EXISTS appointment_change_trigger ON appointments;
CREATE TRIGGER appointment_change_trigger
  AFTER INSERT OR UPDATE OF status ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_appointment_change();

-- Function to generate time slots based on doctor schedule
CREATE OR REPLACE FUNCTION generate_slots_for_schedule(
  p_schedule_id INT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS void AS $$
DECLARE
  v_schedule RECORD;
  v_current_date DATE;
  v_current_time TIME;
BEGIN
  -- Get schedule details
  SELECT * INTO v_schedule FROM doctor_schedules WHERE schedule_id = p_schedule_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Loop through dates
  v_current_date := p_start_date;
  WHILE v_current_date <= p_end_date LOOP
    -- Check if current date matches the day of week
    IF TO_CHAR(v_current_date, 'Day') = TRIM(v_schedule.day_of_week) THEN
      -- Generate slots for this day
      v_current_time := v_schedule.start_time;
      WHILE v_current_time < v_schedule.end_time LOOP
        -- Insert slot if it doesn't exist
        INSERT INTO appointment_slots (
          schedule_id, doctor_id, slot_date, slot_time, 
          facility_id, facility_type, status
        )
        VALUES (
          v_schedule.schedule_id,
          v_schedule.doctor_id,
          v_current_date,
          v_current_time,
          v_schedule.facility_id,
          v_schedule.facility_type,
          'free'
        )
        ON CONFLICT (doctor_id, slot_date, slot_time, facility_type) DO NOTHING;
        
        -- Increment time by slot duration
        v_current_time := v_current_time + (v_schedule.slot_duration_minutes || ' minutes')::INTERVAL;
      END LOOP;
    END IF;
    
    v_current_date := v_current_date + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
