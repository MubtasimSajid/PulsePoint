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

async function deleteUser(email) {
  const client = await pool.connect();
  try {
    console.log(`Searching for user with email: ${email}`);
    const res = await client.query("SELECT user_id, email, role FROM users WHERE email = $1", [email]);
    
    if (res.rows.length === 0) {
      console.log("❌ User not found.");
      return;
    }

    const user = res.rows[0];
    console.log(`Found User: ID=${user.user_id}, Role=${user.role}`);

    // Manual Cascade
    console.log("Deleting related records...");
    
    // 1. Appointments (Cascades to Prescriptions)
    await client.query("DELETE FROM appointments WHERE doctor_id = $1 OR patient_id = $1", [user.user_id]);
    
    // 2. Medical History
    await client.query("DELETE FROM medical_history WHERE doctor_id = $1 OR patient_id = $1", [user.user_id]);

    // 3. Accounts (No FK constraint, manual delete)
    await client.query("DELETE FROM accounts WHERE owner_id = $1 AND owner_type = 'user'", [user.user_id]);

    // 4. Doctor specific
    if (user.role === 'doctor') {
        await client.query("DELETE FROM doctor_specializations WHERE doctor_id = $1", [user.user_id]);
        await client.query("DELETE FROM doctors WHERE user_id = $1", [user.user_id]);
    }

    // 5. Patient specific
    if (user.role === 'patient') {
        await client.query("DELETE FROM patients WHERE user_id = $1", [user.user_id]);
    }

    console.log("Deleting user...");
    await client.query("DELETE FROM users WHERE user_id = $1", [user.user_id]);
    console.log("✅ User and all related data deleted successfully.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    pool.end();
  }
}

const email = process.argv[2];
if (!email) {
    console.log("Usage: node delete_doctor_by_email.js <email>");
    process.exit(1);
}

deleteUser(email);
