-- Drop the old trigger that paid on completion
DROP TRIGGER IF EXISTS appointment_payment_trigger ON appointments;
DROP FUNCTION IF EXISTS create_appointment_payment();

-- Function to ensure an account exists and return its ID
CREATE OR REPLACE FUNCTION get_or_create_account(
  p_owner_type VARCHAR,
  p_owner_id INT
) RETURNS INT AS $$
DECLARE
  v_account_id INT;
BEGIN
  SELECT account_id INTO v_account_id
  FROM accounts
  WHERE owner_type = p_owner_type AND owner_id = p_owner_id;

  IF v_account_id IS NULL THEN
    INSERT INTO accounts (owner_type, owner_id)
    VALUES (p_owner_type, p_owner_id)
    RETURNING account_id INTO v_account_id;
  END IF;

  RETURN v_account_id;
END;
$$ LANGUAGE plpgsql;

-- New trigger function to handle payment splitting at booking time
CREATE OR REPLACE FUNCTION handle_booking_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_account_id INT;
  v_doctor_account_id INT;
  v_hospital_account_id INT;
  
  v_total_fee NUMERIC(12,2);
  v_hospital_share NUMERIC(12,2);
  v_doctor_share NUMERIC(12,2);
  
  v_patient_balance NUMERIC(12,2);
  v_txn_status VARCHAR(20);
BEGIN
  -- Only run on INSERT (new booking)
  -- 1. Determine Fee
  IF NEW.hospital_id IS NOT NULL THEN
    -- Booking at a hospital
    SELECT consultation_fee INTO v_total_fee
    FROM hospital_doctors
    WHERE hospital_id = NEW.hospital_id AND doctor_id = NEW.doctor_id;
    
    -- Fallback if no specific hospital fee is set, try generic doctor fee
    IF v_total_fee IS NULL THEN
        SELECT consultation_fee INTO v_total_fee
        FROM doctors
        WHERE user_id = NEW.doctor_id;
    END IF;

    -- Calculate Split (10% Hospital, 90% Doctor)
    IF v_total_fee IS NOT NULL THEN
       v_hospital_share := ROUND(v_total_fee * 0.10, 2);
       v_doctor_share := v_total_fee - v_hospital_share;
    END IF;
    
  ELSE
    -- Booking at a chamber (Private Practice)
    SELECT consultation_fee INTO v_total_fee
    FROM doctors
    WHERE user_id = NEW.doctor_id;
    
    -- 100% to Doctor
    v_doctor_share := v_total_fee;
    v_hospital_share := 0;
  END IF;

  -- If no fee is found (e.g. data missing), we cannot process payment
  IF v_total_fee IS NULL OR v_total_fee = 0 THEN
    RETURN NEW;
  END IF;

  -- 2. Get/Create Accounts
  v_patient_account_id := get_or_create_account('user', NEW.patient_id);
  v_doctor_account_id := get_or_create_account('user', NEW.doctor_id);
  
  IF NEW.hospital_id IS NOT NULL THEN
     v_hospital_account_id := get_or_create_account('hospital', NEW.hospital_id);
  END IF;

  -- 3. Check Patient Balance
  SELECT balance INTO v_patient_balance FROM accounts WHERE account_id = v_patient_account_id;
  
  IF v_patient_balance >= v_total_fee THEN
    v_txn_status := 'completed';
  ELSE
    v_txn_status := 'pending'; -- Insufficient balance, debt recorded but not deducted yet? Or just pending? 
    -- The prompt says "10 percent ... goes to hospital". Usually implies immediate transfer.
    -- Existing logic used 'pending' for insufficient balance. We will stick to that to avoid negative balance glitches if strict.
    -- However, standard wallet logic often blocks or allows overdraft. 
    -- 'ensure_account_balance' trigger raises exception on insufficient balance for 'completed' txns.
    -- So we must use 'pending' if balance is low, otherwise INSERT will fail.
  END IF;

  -- 4. Create Transactions
  -- Patient -> Doctor Share
  IF v_doctor_share > 0 THEN
    INSERT INTO account_transactions 
      (from_account_id, to_account_id, amount, status, description)
    VALUES 
      (v_patient_account_id, v_doctor_account_id, v_doctor_share, v_txn_status, 
       'Doctor fee for appointment ' || NEW.appointment_id);
  END IF;

  -- Patient -> Hospital Share
  IF v_hospital_share > 0 AND v_hospital_account_id IS NOT NULL THEN
    INSERT INTO account_transactions 
      (from_account_id, to_account_id, amount, status, description)
    VALUES 
      (v_patient_account_id, v_hospital_account_id, v_hospital_share, v_txn_status, 
       'Hospital fee (10%) for appointment ' || NEW.appointment_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
DROP TRIGGER IF EXISTS trigger_handle_booking_payment ON appointments;
CREATE TRIGGER trigger_handle_booking_payment
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_booking_payment();
