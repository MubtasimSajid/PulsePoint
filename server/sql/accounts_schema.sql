-- Accounts and Transactions Schema

-- Accounts table (one per user)
CREATE TABLE IF NOT EXISTS accounts (
  account_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  balance DECIMAL(12, 2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'BDT',
  is_frozen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Access logs for audit
CREATE TABLE IF NOT EXISTS account_transactions (
  transaction_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_account_id INT, -- NULL for deposits
  to_account_id INT,   -- NULL for withdrawals
  amount DECIMAL(12, 2) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('payment', 'refund', 'deposit', 'withdrawal', 'transfer')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  reference_type VARCHAR(50), -- e.g., 'appointment'
  reference_id INT,           -- e.g., appointment_id
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_account_id) REFERENCES accounts(account_id),
  FOREIGN KEY (to_account_id) REFERENCES accounts(account_id)
);

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_accounts_timestamp ON accounts;
CREATE TRIGGER update_accounts_timestamp
BEFORE UPDATE ON accounts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Trigger to prevent negative balance on transfers/withdrawals
-- (Optional: enforced at app level usually, but DB constraint is safer)
CREATE OR REPLACE FUNCTION check_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_balance DECIMAL(12, 2);
BEGIN
  IF NEW.type IN ('payment', 'withdrawal', 'transfer') AND NEW.from_account_id IS NOT NULL THEN
    SELECT balance INTO current_balance FROM accounts WHERE account_id = NEW.from_account_id;
    IF current_balance < NEW.amount THEN
       RAISE EXCEPTION 'Insufficient funds in account %', NEW.from_account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Not applying check_balance trigger on transaction insert directly because 
-- usually we want to handle the logic in a transaction block where we deduct first.
-- Instead, we'll add a CHECK constraint on accounts table.

ALTER TABLE accounts ADD CONSTRAINT postive_balance_check CHECK (balance >= 0);

-- Automatically create account for existing users if missing
INSERT INTO accounts (user_id)
SELECT user_id FROM users
WHERE user_id NOT IN (SELECT user_id FROM accounts);
