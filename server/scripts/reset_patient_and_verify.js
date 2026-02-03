const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const API_URL = "http://127.0.0.1:5000/api";

async function run() {
  const client = await pool.connect();
  try {
    const email = "tahmid12955@gmail.com";
    const password = "password123";
    const hash = await bcrypt.hash(password, 10);

    console.log("1. Force Resetting Patient Credentials...");
    // Update or Insert
    const userRes = await client.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userRes.rows.length === 0) {
        console.log("   Creating new user...");
        await client.query(
            `INSERT INTO users (email, password_hash, full_name, role, is_verified, phone, is_active)
             VALUES ($1, $2, 'Test Patient', 'patient', TRUE, '123', TRUE)`,
            [email, hash]
        );
    } else {
        console.log("   Updating existing user...");
        await client.query(
            `UPDATE users SET password_hash = $2, is_verified = TRUE, is_active = TRUE WHERE email = $1`,
            [email, hash]
        );
    }

    // Ensure Patient Profile
    const u = await client.query("SELECT user_id FROM users WHERE email = $1", [email]);
    const userId = u.rows[0].user_id;
    const p = await client.query("SELECT * FROM patients WHERE user_id = $1", [userId]);
    if (p.rows.length === 0) {
        await client.query("INSERT INTO patients (user_id, patient_code) VALUES ($1, 'P-TEST')", [userId]);
    }

    console.log("2. Testing Login...");
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error("Login failed: " + JSON.stringify(data));
    const { token } = data;
    console.log("   ✅ Login successful.");

    console.log("3. Fetching Prescriptions...");
    const rxRes = await fetch(`${API_URL}/prescriptions/patient/${userId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const rxList = await rxRes.json();
    if (!rxRes.ok) throw new Error("Fetch failed: " + JSON.stringify(rxList));
    console.log(`   ✅ Success! Found ${rxList.length} prescriptions.`);
    if (rxList.length > 0) {
        console.log("   Sample Med:", rxList[0].medicine_name);
    }

  } catch (e) {
    console.error("Error:", e);
  } finally {
    client.release();
    pool.end();
  }
}

run();
