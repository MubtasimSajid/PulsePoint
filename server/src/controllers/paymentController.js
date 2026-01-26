const pool = require("../config/database");

async function ensureAccount(client, userId) {
  const res = await client.query(
    "SELECT account_id, balance, currency FROM accounts WHERE owner_type = 'user' AND owner_id = $1",
    [userId],
  );
  if (res.rows.length > 0) return res.rows[0];

  const created = await client.query(
    "INSERT INTO accounts (owner_type, owner_id) VALUES ('user', $1) RETURNING account_id, balance, currency",
    [userId],
  );
  return created.rows[0];
}

// Get balance (ensure account exists)
exports.getBalance = async (req, res) => {
  const userId = req.user.userId;
  const client = await pool.connect();

  try {
    const account = await ensureAccount(client, userId);

    // Get recent transactions
    const transactions = await client.query(
      `SELECT * FROM account_transactions 
       WHERE from_account_id = $1 OR to_account_id = $1 
       ORDER BY created_at DESC LIMIT 20`,
      [account.account_id],
    );

    res.json({
      balance: account.balance,
      currency: account.currency,
      transactions: transactions.rows,
    });
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
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const account = await ensureAccount(client, userId);

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
