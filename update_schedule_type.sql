BEGIN;

-- Add schedule_type and specific_date to doctor_schedules
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctor_schedules' AND column_name = 'schedule_type') THEN
        ALTER TABLE doctor_schedules ADD COLUMN schedule_type VARCHAR(10) DEFAULT 'weekly' CHECK (schedule_type IN ('weekly', 'single'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'doctor_schedules' AND column_name = 'specific_date') THEN
        ALTER TABLE doctor_schedules ADD COLUMN specific_date DATE;
    END IF;
END
$$;

-- Update constraint: specific_date is required if schedule_type is 'single'
-- We can't easily enforce "day_of_week is required only if weekly" without complex constraints or triggers, 
-- but we can enforce specific_date for single.
ALTER TABLE doctor_schedules DROP CONSTRAINT IF EXISTS check_schedule_type_dates;
ALTER TABLE doctor_schedules ADD CONSTRAINT check_schedule_type_dates 
  CHECK (
    (schedule_type = 'weekly') OR 
    (schedule_type = 'single' AND specific_date IS NOT NULL)
  );


-- Update generate_slots_for_schedule function to handle single vs weekly
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
  
  -- Handle 'single' type
  IF v_schedule.schedule_type = 'single' THEN
    -- Only generate if the specific date is within range
    IF v_schedule.specific_date >= p_start_date AND v_schedule.specific_date <= p_end_date THEN
      v_current_date := v_schedule.specific_date;
      v_current_time := v_schedule.start_time;
      
      WHILE v_current_time < v_schedule.end_time LOOP
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
          v_schedule.branch_name,
          'free'
        )
        ON CONFLICT (doctor_id, slot_date, slot_time, facility_type, branch_name) DO NOTHING;
        
        v_current_time := v_current_time + (v_schedule.slot_duration_minutes || ' minutes')::INTERVAL;
      END LOOP;
    END IF;
    
    RETURN; -- Done for single type
  END IF;

  -- Handle 'weekly' type (Existing logic)
  v_current_date := p_start_date;
  WHILE v_current_date <= p_end_date LOOP
    IF TRIM(TO_CHAR(v_current_date, 'FMDay')) = TRIM(v_schedule.day_of_week) THEN
      v_current_time := v_schedule.start_time;
      WHILE v_current_time < v_schedule.end_time LOOP
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
          v_schedule.branch_name,
          'free'
        )
        ON CONFLICT (doctor_id, slot_date, slot_time, facility_type, branch_name) DO NOTHING;
        
        v_current_time := v_current_time + (v_schedule.slot_duration_minutes || ' minutes')::INTERVAL;
      END LOOP;
    END IF;
    
    v_current_date := v_current_date + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMIT;
