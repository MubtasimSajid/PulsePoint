BEGIN;

-- Add branch_name to doctor_schedules
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctor_schedules' AND column_name = 'branch_name') THEN
        ALTER TABLE doctor_schedules ADD COLUMN branch_name VARCHAR(150);
    END IF;
END
$$;

-- Add branch_name to appointment_slots
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointment_slots' AND column_name = 'branch_name') THEN
        ALTER TABLE appointment_slots ADD COLUMN branch_name VARCHAR(150);
    END IF;
END
$$;

-- Add branch_name to appointments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'branch_name') THEN
        ALTER TABLE appointments ADD COLUMN branch_name VARCHAR(150);
    END IF;
END
$$;

-- Update unique constraint on appointment_slots
ALTER TABLE appointment_slots DROP CONSTRAINT IF EXISTS appointment_slots_doctor_id_slot_date_slot_time_facility_ty_key;
ALTER TABLE appointment_slots DROP CONSTRAINT IF EXISTS appointment_slots_unique_slot;

ALTER TABLE appointment_slots ADD CONSTRAINT appointment_slots_unique_slot UNIQUE(doctor_id, slot_date, slot_time, facility_type, branch_name);


-- Update generate_slots_for_schedule function to include branch_name
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
    IF TRIM(TO_CHAR(v_current_date, 'FMDay')) = TRIM(v_schedule.day_of_week) THEN
      -- Generate slots for this day
      v_current_time := v_schedule.start_time;
      WHILE v_current_time < v_schedule.end_time LOOP
        -- Insert slot if it doesn't exist
        INSERT INTO appointment_slots (
          schedule_id, doctor_id, slot_date, slot_time, 
          facility_id, facility_type, branch_name, status
        )
        VALUES (
          v_schedule.schedule_id,
          v_schedule.doctor_id,
          v_current_date,
          v_current_time,
          v_schedule.facility_id,
          v_schedule.facility_type,
          v_schedule.branch_name, -- Include branch name
          'free'
        )
        ON CONFLICT (doctor_id, slot_date, slot_time, facility_type, branch_name) DO NOTHING;
        
        -- Increment time by slot duration
        v_current_time := v_current_time + (v_schedule.slot_duration_minutes || ' minutes')::INTERVAL;
      END LOOP;
    END IF;
    
    v_current_date := v_current_date + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMIT;
