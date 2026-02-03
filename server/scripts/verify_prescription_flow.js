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
const DOC_EMAIL = `doc_presc_${Date.now()}@test.com`;
const PAT_EMAIL = `pat_presc_${Date.now()}@test.com`;

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

async function post(url, data, token) {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  return { data: json, status: res.status };
}

async function runTest() {
  const client = await pool.connect();
  try {
    await new Promise(r => setTimeout(r, 3000)); // Wait for server restart
    console.log("Starting Prescription Verification Test...");
    const fs = require('fs');
    const logFile = path.resolve(__dirname, 'verification_log.txt');
    const log = (msg) => {
      console.log(msg);
      fs.appendFileSync(logFile, msg + '\n');
    };
    fs.writeFileSync(logFile, "Starting Test\n");

    // 0. Get Specialization
    let specId;
    const specRes = await client.query("SELECT spec_id FROM specializations LIMIT 1");
    if (specRes.rows.length > 0) {
      specId = specRes.rows[0].spec_id;
    } else {
       // Fallback: This might fail if no departments, but try inserting with dept_id NULL if allowed or 1
       const createSpec = await client.query("INSERT INTO specializations (spec_name) VALUES ('TestSpec') RETURNING spec_id");
       specId = createSpec.rows[0].spec_id;
    }

    // 0b. Get Hospital & Department
    let hospId, deptId;
    const hospRes = await client.query("SELECT hospital_id FROM hospitals LIMIT 1");
    if (hospRes.rows.length > 0) hospId = hospRes.rows[0].hospital_id;
    else {
      // Create Dummy Hospital? Or assuming seed. Let's fail with clearer error or try insert.
      // Trying insert for robustness.
      // But hospital creation is complex (many fields). Let's hope seed exists or just insert minimal.
      // Minimal insert might fail NOT NULLs.
      // Let's assume at least one hospital exists for now. If not, user environment is too empty.
      throw new Error("No hospitals found in DB for test"); 
    }

    const deptRes = await client.query("SELECT dept_id FROM departments LIMIT 1");
    if (deptRes.rows.length > 0) deptId = deptRes.rows[0].dept_id;
    else {
      const createDept = await client.query("INSERT INTO departments (name) VALUES ('TestDept') RETURNING dept_id");
      deptId = createDept.rows[0].dept_id;
    }

    // 1. Register Doctor
    const regDoc = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: DOC_EMAIL, password: "password123", full_name: "Dr Test", role: "doctor",
        phone: "111", address: "City", date_of_birth: "1980-01-01", gender: "male",
        license_number: "L123", specialization_id: specId, consultation_fee: 500
      })
    });
    const docData = await regDoc.json();
    if (!regDoc.ok) throw new Error("Doc Register failed: " + JSON.stringify(docData));
    await client.query("UPDATE users SET is_verified = TRUE WHERE email = $1", [DOC_EMAIL]);
    
    // Login to get token and ID
    const loginDoc = await login(DOC_EMAIL, "password123");
    const docToken = loginDoc.token;
    const realDocId = loginDoc.user.user_id;

    // 2. Register Patient
    const regPat = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: PAT_EMAIL, password: "password123", full_name: "Pat Test", role: "patient",
        phone: "222", address: "City", date_of_birth: "1990-01-01", gender: "male",
        height_cm: 180, weight_kg: 80
      })
    });
    await client.query("UPDATE users SET is_verified = TRUE WHERE email = $1", [PAT_EMAIL]);
    const patIdRes = await client.query("SELECT user_id FROM users WHERE email = $1", [PAT_EMAIL]);
    const realPatId = patIdRes.rows[0].user_id;

    // 3. Create Appointments
    const now = new Date();
    const dateStr = [now.getFullYear(), ('0' + (now.getMonth() + 1)).slice(-2), ('0' + now.getDate()).slice(-2)].join('-');
    
    // A. Valid (Starts 10 mins ago)
    const validStartTime = new Date(now.getTime() - 10 * 60000).toTimeString().split(' ')[0];
    const apptValid = await client.query(`
      INSERT INTO appointments (doctor_id, patient_id, appt_date, appt_time, status, department_id, hospital_id)
      VALUES ($1, $2, $3, $4, 'scheduled', $5, $6) RETURNING appointment_id`,
      [realDocId, realPatId, dateStr, validStartTime, deptId, hospId]
    );
    const validApptId = apptValid.rows[0].appointment_id;

    // B. Expired (Starts 3 hours ago)
    const expiredStartTime = new Date(now.getTime() - 185 * 60000).toTimeString().split(' ')[0];
    const apptExpired = await client.query(`
      INSERT INTO appointments (doctor_id, patient_id, appt_date, appt_time, status, department_id, hospital_id)
      VALUES ($1, $2, $3, $4, 'scheduled', $5, $6) RETURNING appointment_id`,
      [realDocId, realPatId, dateStr, expiredStartTime, deptId, hospId]
    );
    const expiredApptId = apptExpired.rows[0].appointment_id;

    // C. Future (Starts in 2 hours)
    const futureStartTime = new Date(now.getTime() + 120 * 60000).toTimeString().split(' ')[0];
    const apptFuture = await client.query(`
      INSERT INTO appointments (doctor_id, patient_id, appt_date, appt_time, status, department_id, hospital_id)
      VALUES ($1, $2, $3, $4, 'scheduled', $5, $6) RETURNING appointment_id`,
      [realDocId, realPatId, dateStr, futureStartTime, deptId, hospId]
    );
    const futureApptId = apptFuture.rows[0].appointment_id;

    // 4. Test Prescriptions
    log("   Testing Valid Prescription...");
    const res1 = await post("/prescriptions", {
      appointment_id: validApptId,
      medications: [{ medicine_name: "Napa", dosage: "1-1-1", duration: "3 days" }],
      notes: "Drink water"
    }, docToken);
    
    if (res1.status === 201) log("   ✅ Valid prescription created.");
    else {
      log("   ❌ Failed valid prescription: " + JSON.stringify(res1.data));
    }

    log("   Testing Expired Prescription (3h ago)...");
    const res2 = await post("/prescriptions", {
      appointment_id: expiredApptId,
      medications: [{ medicine_name: "Napa", dosage: "1-1-1", duration: "3 days" }]
    }, docToken);

    if (res2.status === 403) log("   ✅ Expired blocked (403): " + (res2.data.error || ""));
    else log(`   ❌ Expired NOT blocked: ${res2.status} ` + JSON.stringify(res2.data));

    log("   Testing Future Prescription (in 2h)...");
    const res3 = await post("/prescriptions", {
      appointment_id: futureApptId,
      medications: [{ medicine_name: "Napa", dosage: "1-1-1", duration: "3 days" }]
    }, docToken);

    if (res3.status === 403) log("   ✅ Future blocked (403): " + (res3.data.error || ""));
    else log(`   ❌ Future NOT blocked: ${res3.status} ` + JSON.stringify(res3.data));

  } catch (e) {
    const fs = require('fs');
    fs.appendFileSync(path.resolve(__dirname, 'verification_log.txt'), "Test Error: " + e.stack + "\n");
    console.error("Test Error:", e);
  } finally {
    // Cleanup
    await client.query("DELETE FROM users WHERE email IN ($1, $2)", [DOC_EMAIL, PAT_EMAIL]);
    client.release();
    pool.end();
  }
}

runTest();
