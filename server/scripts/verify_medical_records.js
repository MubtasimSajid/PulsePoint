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

const API_URL = "http://127.0.0.1:5000/api";
const PAT_EMAIL = `pat_mr_${Date.now()}@test.com`;

async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Login failed: " + (data.error || res.statusText));
  return { token: data.token, user: data.user };
}

async function runTest() {
  const client = await pool.connect();
  const fs = require('fs');
  const logFile = path.resolve(__dirname, 'verification_mr_log.txt');
  fs.writeFileSync(logFile, "Starting Medical Records Test\n");
  const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
  };

  try {
    log("1. Registering Patient...");
    const regPat = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: PAT_EMAIL, password: "password123", full_name: "Pat Records", role: "patient",
        phone: "555", address: "City", date_of_birth: "1995-01-01", gender: "female"
      })
    });
    if (!regPat.ok) throw new Error("Pat Register failed");
    await client.query("UPDATE users SET is_verified = TRUE WHERE email = $1", [PAT_EMAIL]);
    
    log("2. Logging In...");
    const { token, user } = await login(PAT_EMAIL, "password123");
    log("   Logged in as " + user.user_id);

    log("3. Creating Medical Record...");
    const createRes = await fetch(`${API_URL}/medical-records`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({
        title: "Test Report",
        record_type: "Report",
        description: "Blood test results",
        record_date: "2023-01-01",
        file_url: "http://example.com/report.pdf"
      })
    });
    const record = await createRes.json();
    if (!createRes.ok) throw new Error("Create failed: " + JSON.stringify(record));
    log("   ✅ Record created: " + record.record_id);

    log("4. Fetching Records...");
    const getRes = await fetch(`${API_URL}/medical-records`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const list = await getRes.json();
    if (list.length !== 1) throw new Error("Expected 1 record, got " + list.length);
    if (list[0].title !== "Test Report") throw new Error("Title mismatch");
    log("   ✅ Records fetched correctly.");

    log("5. Deleting Record...");
    const delRes = await fetch(`${API_URL}/medical-records/${record.record_id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (!delRes.ok) throw new Error("Delete failed");
    
    // Verify deletion
    const finalGet = await fetch(`${API_URL}/medical-records`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const finalList = await finalGet.json();
    if (finalList.length !== 0) throw new Error("Record not deleted");
    log("   ✅ Record deleted.");

    log("SUCCESS: All tests passed.");

  } catch (e) {
    log("ERROR: " + e.stack);
  } finally {
    await client.query("DELETE FROM users WHERE email = $1", [PAT_EMAIL]);
    client.release();
    pool.end();
  }
}

runTest();
