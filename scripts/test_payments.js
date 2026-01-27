require("dotenv").config({ path: "../server/.env" });
const { Pool } = require("pg");

// Provide fallbacks so server/src/config/database.js (used by paymentController)
// can connect even when server/.env is missing.
process.env.DB_USER = process.env.DB_USER || "postgres";
process.env.DB_HOST = process.env.DB_HOST || "localhost";
process.env.DB_NAME = process.env.DB_NAME || "hospital_management";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "wirelight";
process.env.DB_PORT = process.env.DB_PORT || "5432";

const paymentController = require("../server/src/controllers/paymentController");

// Mock req, res for testing controller directly or mock DB calls
// Actually better to test via DB logic directly or use a simplified script
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "hospital_management",
  password: process.env.DB_PASSWORD || "wirelight",
  port: process.env.DB_PORT || 5432,
});

async function testPaymentSystem() {
  const client = await pool.connect();
  try {
    console.log("--- Starting Payment System Test ---");

    // 1. Create two test users if not exist (or just use existing)
    const userRes = await client.query("SELECT user_id FROM users LIMIT 2");
    if (userRes.rows.length < 2) {
      console.log("Not enough users to test transfer.");
      return;
    }
    const user1 = userRes.rows[0].user_id;
    const user2 = userRes.rows[1].user_id;
    console.log(`Testing with User A (${user1}) and User B (${user2})`);

    // 2. Reset balances
    await client.query("DELETE FROM account_transactions");
    await client.query(
      "UPDATE accounts SET balance = 0 WHERE owner_type = 'user' AND owner_id IN ($1, $2)",
      [user1, user2],
    );
    console.log("Balances reset to 0.");

    // 3. Add Funds to User A
    // Simulating logic from paymentController.addFunds but manually here to rely on DB constraints
    console.log("Adding 1000 to User A...");
    await paymentController.addFunds(
      { user: { userId: user1 }, body: { amount: 1000 } },
      {
        json: (data) => console.log("AddFunds Response:", data),
        status: (code) => ({
          json: (data) => console.log(`AddFunds Error (${code}):`, data),
        }),
      },
    );

    const bal1 = await client.query(
      "SELECT balance FROM accounts WHERE owner_type = 'user' AND owner_id = $1",
      [user1],
    );
    console.log(`User A Balance: ${bal1.rows[0].balance} (Expected 1000.00)`);

    // 4. Transfer 500 from A to B (Simulating detailed logic of scheduleController)
    console.log("Transferring 500 from User A to User B...");
    const txClient = await pool.connect();
    try {
      await txClient.query("BEGIN");
      await paymentController.processTransfer(
        user1,
        user2,
        500,
        "test",
        123,
        txClient,
      );
      await txClient.query("COMMIT");
      console.log("Transfer succesful.");
    } catch (e) {
      await txClient.query("ROLLBACK");
      console.error("Transfer Failed:", e.message);
    } finally {
      txClient.release();
    }

    const bal1_after = await client.query(
      "SELECT balance FROM accounts WHERE owner_type = 'user' AND owner_id = $1",
      [user1],
    );
    const bal2_after = await client.query(
      "SELECT balance FROM accounts WHERE owner_type = 'user' AND owner_id = $1",
      [user2],
    );
    console.log(
      `User A Balance: ${bal1_after.rows[0].balance} (Expected 500.00)`,
    );
    console.log(
      `User B Balance: ${bal2_after.rows[0].balance} (Expected 500.00)`,
    );

    // 5. Try Overdraft (Transfer 1000 from A)
    console.log("Attempting Overdraft (User A tries to send 1000, has 500)...");
    const txClient2 = await pool.connect();
    try {
      await txClient2.query("BEGIN");
      await paymentController.processTransfer(
        user1,
        user2,
        1000,
        "test_fail",
        124,
        txClient2,
      );
      await txClient2.query("COMMIT");
      console.log("Overdraft Transfer SUCCEEDED (Should have failed!)");
    } catch (e) {
      await txClient2.query("ROLLBACK");
      console.log("Overdraft Transfer FAILED as expected:", e.message);
    } finally {
      txClient2.release();
    }
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}

testPaymentSystem();
