-- Accounts and Transactions Schema

-- NOTE: This repo's main schema.sql defines accounts by (owner_type, owner_id)
-- to support both user and hospital balances.

CREATE TABLE IF NOT EXISTS accounts (
  account_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_type VARCHAR(20) NOT NULL CHECK (owner_type IN ('user', 'hospital')),
  owner_id INT NOT NULL,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'BDT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (owner_type, owner_id)
);

CREATE TABLE IF NOT EXISTS account_transactions (
  txn_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_account_id INT,
  to_account_id INT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_account_id) REFERENCES accounts(account_id) ON DELETE SET NULL,
  FOREIGN KEY (to_account_id) REFERENCES accounts(account_id) ON DELETE SET NULL
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

-- Keep balance non-negative (core schema already enforces overdraft via triggers,
-- but this adds a direct invariant if balances are updated manually.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'positive_balance_check'
  ) THEN
    ALTER TABLE accounts ADD CONSTRAINT positive_balance_check CHECK (balance >= 0);
  END IF;
END $$;

-- Create accounts for existing users if missing
INSERT INTO accounts (owner_type, owner_id)
SELECT 'user', u.user_id
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM accounts a WHERE a.owner_type = 'user' AND a.owner_id = u.user_id
);
