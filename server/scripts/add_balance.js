const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  const client = await pool.connect();
  try {
    const email = "tahmid12955@gmail.com";
    const amount = 5000;

    // 1. Get User
    const userRes = await client.query("SELECT user_id, full_name FROM users WHERE email = $1", [email]);
    if (userRes.rows.length === 0) {
        throw new Error(`User with email ${email} not found.`);
    }
    const user = userRes.rows[0];
    console.log(`Found User: ${user.full_name} (${user.user_id})`);

    // 2. Ensure Account
    let accRes = await client.query(
        "SELECT account_id, balance FROM accounts WHERE owner_type = 'user' AND owner_id = $1",
        [user.user_id]
    );
    
    if (accRes.rows.length === 0) {
        console.log("   Creating wallet account...");
        accRes = await client.query(
            "INSERT INTO accounts (owner_type, owner_id) VALUES ('user', $1) RETURNING account_id, balance",
            [user.user_id]
        );
    }
    const account = accRes.rows[0];
    console.log(`   Account ID: ${account.account_id}, Current Balance: ${account.balance}`);

    // 3. Add Funds
    console.log(`   Adding ${amount} BDT...`);
    await client.query(
        `INSERT INTO account_transactions (to_account_id, amount, status, description)
         VALUES ($1, $2, 'completed', 'Manual Admin Top-up')`,
        [account.account_id, amount]
    );

    // 4. Verify New Balance
    const verifyRes = await client.query("SELECT balance FROM accounts WHERE account_id = $1", [account.account_id]);
    console.log(`   ✅ Success! New Balance: ${verifyRes.rows[0].balance}`);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
