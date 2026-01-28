const pool = require("../config/database");

async function ensureAccount(client, userId) {
  const res = await client.query(
    "SELECT account_id, balance, currency FROM accounts WHERE owner_type = 'user' AND owner_id = $1",
    [userId],
  );
  if (res.rows.length > 0) return res.rows[0];

  // Race-safe creation: if another request creates the account concurrently,
  // we fall back to selecting the existing row.
  const created = await client.query(
    "INSERT INTO accounts (owner_type, owner_id) VALUES ('user', $1) ON CONFLICT (owner_type, owner_id) DO NOTHING RETURNING account_id, balance, currency",
    [userId],
  );
  if (created.rows.length > 0) return created.rows[0];

  const after = await client.query(
    "SELECT account_id, balance, currency FROM accounts WHERE owner_type = 'user' AND owner_id = $1",
    [userId],
  );
  return after.rows[0];
}

async function ensureHospitalAccount(client, adminUserId) {
  // One balance per hospital-admin: use a canonical branch hospital_id as the account owner.
  // This preserves the DB rule that hospital accounts must reference hospitals.hospital_id.
  const hospitalIdRes = await client.query(
    "SELECT MIN(hospital_id)::int AS hospital_id FROM hospitals WHERE admin_user_id = $1",
    [adminUserId],
  );

  const canonicalHospitalId = hospitalIdRes.rows[0]?.hospital_id;
  if (!canonicalHospitalId) {
    throw new Error("No hospital branches found for this admin");
  }

  const res = await client.query(
    "SELECT account_id, balance, currency FROM accounts WHERE owner_type = 'hospital' AND owner_id = $1",
    [canonicalHospitalId],
  );
  if (res.rows.length > 0) return res.rows[0];

  // Race-safe creation
  const created = await client.query(
    "INSERT INTO accounts (owner_type, owner_id) VALUES ('hospital', $1) ON CONFLICT (owner_type, owner_id) DO NOTHING RETURNING account_id, balance, currency",
    [canonicalHospitalId],
  );
  if (created.rows.length > 0) return created.rows[0];

  const after = await client.query(
    "SELECT account_id, balance, currency FROM accounts WHERE owner_type = 'hospital' AND owner_id = $1",
    [canonicalHospitalId],
  );
  return after.rows[0];
}

// Get balance (ensure account exists)
exports.getBalance = async (req, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;
  const client = await pool.connect();

  try {
    // For hospital admins, use ONE shared hospital account (regardless of branch)
    if (userRole === "hospital_admin") {
      const account = await ensureHospitalAccount(client, userId);

      const transactions = await client.query(
        `SELECT * FROM account_transactions 
         WHERE from_account_id = $1 OR to_account_id = $1 
         ORDER BY created_at DESC LIMIT 20`,
        [account.account_id],
      );

      const normalizedTransactions = transactions.rows.map((tx) => {
        const accountId = account.account_id;
        const description = String(tx.description || "");
        const descriptionLower = description.toLowerCase();

        const isIncoming = String(tx.to_account_id) === String(accountId);
        const isOutgoing = String(tx.from_account_id) === String(accountId);

        let type = "transfer";
        if (!tx.from_account_id && isIncoming) type = "deposit";
        else if (!tx.to_account_id && isOutgoing) type = "withdrawal";
        else if (descriptionLower.includes("appointment payment"))
          type = "payment";
        else if (descriptionLower.includes("appointment refund"))
          type = "refund";
        else if (descriptionLower.includes("added funds")) type = "deposit";

        let direction = "unknown";
        if (isIncoming) direction = "credit";
        else if (isOutgoing) direction = "debit";

        return {
          ...tx,
          transaction_id: tx.txn_id,
          type,
          direction,
        };
      });

      res.json({
        balance: account.balance,
        currency: account.currency,
        account_id: account.account_id,
        transactions: normalizedTransactions,
      });
    } else {
      // For regular users (patients, doctors)
      const account = await ensureAccount(client, userId);

      // Get recent transactions
      const transactions = await client.query(
        `SELECT * FROM account_transactions 
         WHERE from_account_id = $1 OR to_account_id = $1 
         ORDER BY created_at DESC LIMIT 20`,
        [account.account_id],
      );

      const normalizedTransactions = transactions.rows.map((tx) => {
        const accountId = account.account_id;
        const description = String(tx.description || "");
        const descriptionLower = description.toLowerCase();

        const isIncoming = String(tx.to_account_id) === String(accountId);
        const isOutgoing = String(tx.from_account_id) === String(accountId);

        let type = "transfer";
        if (!tx.from_account_id && isIncoming) type = "deposit";
        else if (!tx.to_account_id && isOutgoing) type = "withdrawal";
        else if (descriptionLower.includes("appointment payment"))
          type = "payment";
        else if (descriptionLower.includes("appointment refund"))
          type = "refund";
        else if (descriptionLower.includes("added funds")) type = "deposit";

        let direction = "unknown";
        if (isIncoming) direction = "credit";
        else if (isOutgoing) direction = "debit";

        return {
          ...tx,
          transaction_id: tx.txn_id,
          type,
          direction,
        };
      });

      res.json({
        balance: account.balance,
        currency: account.currency,
        account_id: account.account_id,
        transactions: normalizedTransactions,
      });
    }
  } catch (error) {
    console.error("Get balance error:", error);
    res.status(500).json({ error: "Failed to fetch wallet info" });
  } finally {
    client.release();
  }
};

// Add funds (Mock payment gateway)
exports.addFunds = async (req, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const account =
      userRole === "hospital_admin"
        ? await ensureHospitalAccount(client, userId)
        : await ensureAccount(client, userId);

    // Record transaction; DB trigger applies balance automatically
    await client.query(
      `INSERT INTO account_transactions 
       (to_account_id, amount, status, description)
       VALUES ($1, $2, 'completed', 'Added funds via Mock Gateway')`,
      [account.account_id, amount],
    );

    await client.query("COMMIT");
    res.json({ message: "Funds added successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Add funds error:", error);
    res.status(500).json({ error: "Failed to add funds" });
  } finally {
    client.release();
  }
};

// Deposit into a user's wallet (useful for simulating MFS top-up)
exports.processDeposit = async (
  userId,
  amount,
  referenceType,
  referenceId,
  client,
  options = {},
) => {
  const { description = "Deposit" } = options;
  const acc = await ensureAccount(client, userId);

  const refLabel =
    referenceType && referenceId ? ` (${referenceType} ${referenceId})` : "";

  // DB trigger applies balance automatically
  await client.query(
    `INSERT INTO account_transactions
     (to_account_id, amount, status, description)
     VALUES ($1, $2, 'completed', $3)`,
    [acc.account_id, amount, `${description}${refLabel}`],
  );
};

// Process wallet transfer between two users
// transactionType: payment | refund | transfer
exports.processTransfer = async (
  fromUserId,
  toUserId,
  amount,
  referenceType,
  referenceId,
  client,
  options = {},
) => {
  const { description = "Transfer" } = options;

  console.log(
    "[DEBUG processTransfer] From:",
    fromUserId,
    "To:",
    toUserId,
    "Amount:",
    amount,
    "Description:",
    description,
  );

  const fromAcc = await ensureAccount(client, fromUserId);
  const toAcc = await ensureAccount(client, toUserId);

  const refLabel =
    referenceType && referenceId ? ` (${referenceType} ${referenceId})` : "";

  // DB trigger enforces overdraft and applies balances
  await client.query(
    `INSERT INTO account_transactions
     (from_account_id, to_account_id, amount, status, description)
     VALUES ($1, $2, $3, 'completed', $4)`,
    [fromAcc.account_id, toAcc.account_id, amount, `${description}${refLabel}`],
  );
};
