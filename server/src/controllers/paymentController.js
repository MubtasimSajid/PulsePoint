const pool = require("../config/database");

// Get balance (ensure account exists)
exports.getBalance = async (req, res) => {
    const userId = req.user.userId;
    const client = await pool.connect();

    try {
        // Upsert account to ensure it exists
        let result = await client.query(
            "SELECT * FROM accounts WHERE user_id = $1",
            [userId]
        );

        if (result.rows.length === 0) {
            result = await client.query(
                "INSERT INTO accounts (user_id) VALUES ($1) RETURNING *",
                [userId]
            );
        }

        const account = result.rows[0];

        // Get recent transactions
        const transactions = await client.query(
            `SELECT * FROM account_transactions 
       WHERE from_account_id = $1 OR to_account_id = $1 
       ORDER BY created_at DESC LIMIT 20`,
            [account.account_id]
        );

        res.json({
            balance: account.balance,
            currency: account.currency,
            transactions: transactions.rows
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

        // Get account
        const accResult = await client.query(
            "SELECT account_id FROM accounts WHERE user_id = $1",
            [userId]
        );
        let accountId = accResult.rows[0]?.account_id;

        if (!accountId) {
            const newAcc = await client.query(
                "INSERT INTO accounts (user_id) VALUES ($1) RETURNING account_id",
                [userId]
            );
            accountId = newAcc.rows[0].account_id;
        }

        // Update balance
        await client.query(
            "UPDATE accounts SET balance = balance + $1 WHERE account_id = $2",
            [amount, accountId]
        );

        // Record transaction
        await client.query(
            `INSERT INTO account_transactions 
       (to_account_id, amount, type, status, description)
       VALUES ($1, $2, 'deposit', 'completed', 'Added funds via Mock Gateway')`,
            [accountId, amount]
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

// Process Payment (Internal, not exposed as route directly typically, but here for testing)
// In real app, this is called by BookingController
exports.processTransfer = async (fromUserId, toUserId, amount, referenceType, referenceId, client) => {
    // Check from_account
    const fromRes = await client.query("SELECT account_id, balance FROM accounts WHERE user_id = $1", [fromUserId]);
    if (fromRes.rows.length === 0) throw new Error("Payer account not found");
    const fromAcc = fromRes.rows[0];

    if (parseFloat(fromAcc.balance) < parseFloat(amount)) {
        throw new Error("Insufficient funds");
    }

    // Check to_account
    const toRes = await client.query("SELECT account_id FROM accounts WHERE user_id = $1", [toUserId]);
    let toAccountId = toRes.rows[0]?.account_id;

    if (!toAccountId) {
        // Create if not exists (e.g. doctor receiving payment for first time)
        const newAcc = await client.query("INSERT INTO accounts (user_id) VALUES ($1) RETURNING account_id", [toUserId]);
        toAccountId = newAcc.rows[0].account_id;
    }

    // Deduct
    await client.query("UPDATE accounts SET balance = balance - $1 WHERE account_id = $2", [amount, fromAcc.account_id]);

    // Add
    await client.query("UPDATE accounts SET balance = balance + $1 WHERE account_id = $2", [amount, toAccountId]);

    // Log
    await client.query(
        `INSERT INTO account_transactions 
     (from_account_id, to_account_id, amount, type, status, reference_type, reference_id, description)
     VALUES ($1, $2, $3, 'payment', 'completed', $4, $5, 'Payment for service')`,
        [fromAcc.account_id, toAccountId, amount, referenceType, referenceId]
    );
};
