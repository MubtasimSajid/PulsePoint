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

const API_URL = "http://127.0.0.1:5000/api/auth";

async function post(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) {
    const error = new Error(json.error || "Request failed");
    error.response = { status: res.status, data: json };
    throw error;
  }
  return { data: json, status: res.status };
}

async function testAuthFlow() {
  const client = await pool.connect();
  const testEmail = `test_otp_${Date.now()}@example.com`;
  
  try {
    console.log("1. Registering new user:", testEmail);
    const regRes = await post(`${API_URL}/register`, {
      email: testEmail,
      password: "password123",
      full_name: "OTP Tester",
      phone: "1234567890",
      role: "patient",
      date_of_birth: "1990-01-01",
      gender: "male",
      address: "123 Test St",
      height_cm: 180,
      weight_kg: 75
    });

    console.log("   Registration response:", regRes.data.message);
    if (!regRes.data.requires_verification) {
      throw new Error("Registration did not require verification!");
    }

    // 2. Check DB for unverified status
    const userRes = await client.query("SELECT * FROM users WHERE email = $1", [testEmail]);
    const user = userRes.rows[0];
    console.log("2. DB User Status:", user.is_verified ? "VERIFIED (Fail)" : "UNVERIFIED (Pass)");
    if (user.is_verified) throw new Error("User should not be verified yet");

    // 3. Get OTP from DB
    const otpRes = await client.query("SELECT * FROM email_verifications WHERE email = $1", [testEmail]);
    if (otpRes.rows.length === 0) throw new Error("No OTP found in DB");
    const otp = otpRes.rows[0].otp;
    console.log("3. Captured OTP from DB:", otp);

    // 4. Try Login (Should fail)
    console.log("4. Attempting Login before verification...");
    try {
      await post(`${API_URL}/login`, { email: testEmail, password: "password123" });
      throw new Error("Login should have failed!");
    } catch (e) {
      if (e.response && e.response.status === 403) {
        console.log("   Login failed as expected (403 Forbidden)");
      } else {
        throw e;
      }
    }

    // 5. Verify Email
    console.log("5. Verifying Email...");
    const verifyRes = await post(`${API_URL}/verify-email`, { email: testEmail, otp });
    console.log("   Verification response:", verifyRes.data.message);

    // 6. Check DB for verified status
    const userRes2 = await client.query("SELECT * FROM users WHERE email = $1", [testEmail]);
    console.log("6. DB User Status:", userRes2.rows[0].is_verified ? "VERIFIED (Pass)" : "UNVERIFIED (Fail)");
    if (!userRes2.rows[0].is_verified) throw new Error("User verification failed in DB");

    // 7. Login again (Should success)
    console.log("7. Attempting Login after verification...");
    const loginRes = await post(`${API_URL}/login`, { email: testEmail, password: "password123" });
    console.log("   Login successful!", "Token received:", !!loginRes.data.token);

    console.log("\n✅ SUCCESS: Full OTP flow verified!");

  } catch (error) {
    console.error("\n❌ FAILED:", error.message);
    if (error.response) {
      console.error("   API Error:", error.response.data);
    }
  } finally {
    // Cleanup
    await client.query("DELETE FROM email_verifications WHERE email = $1", [testEmail]);
    await client.query("DELETE FROM patients WHERE user_id = (SELECT user_id FROM users WHERE email = $1)", [testEmail]);
    await client.query("DELETE FROM users WHERE email = $1", [testEmail]);
    client.release();
    pool.end();
  }
}

testAuthFlow();
