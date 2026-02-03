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
    const docEmail = "tahmid0259@gmail.com";
    const patEmail = "tahmid12955@gmail.com";

    // 1. Find Users
    const docRes = await client.query("SELECT user_id, full_name FROM users WHERE email = $1 AND role = 'doctor'", [docEmail]);
    if (docRes.rows.length === 0) throw new Error(`Doctor ${docEmail} not found`);
    const docUser = docRes.rows[0];

    const patRes = await client.query("SELECT user_id, full_name FROM users WHERE email = $1 AND role = 'patient'", [patEmail]);
    if (patRes.rows.length === 0) throw new Error(`Patient ${patEmail} not found`);
    const patUser = patRes.rows[0];

    console.log(`Found Doctor: ${docUser.full_name} (${docUser.user_id})`);
    console.log(`Found Patient: ${patUser.full_name} (${patUser.user_id})`);

    // 2. Get Meta Data
    const hosRes = await client.query("SELECT hospital_id FROM hospitals LIMIT 1");
    const hospital_id = hosRes.rows[0]?.hospital_id;
    
    const deptRes = await client.query("SELECT dept_id FROM departments LIMIT 1");
    const department_id = deptRes.rows[0]?.dept_id;

    if (!hospital_id || !department_id) throw new Error("Missing hospital or department data");

    // 3. Create Appointment (30 mins ago)
    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60000); 
    
    // YYYY-MM-DD
    const dateStr = [
      thirtyMinsAgo.getFullYear(),
      ('0' + (thirtyMinsAgo.getMonth() + 1)).slice(-2),
      ('0' + thirtyMinsAgo.getDate()).slice(-2)
    ].join('-');
    const timeStr = thirtyMinsAgo.toTimeString().split(' ')[0];

    const res = await client.query(
        `INSERT INTO appointments (patient_id, doctor_id, hospital_id, department_id, appt_date, appt_time, status, note)
         VALUES ($1, $2, $3, $4, $5, $6, 'completed', 'Test Appointment for Prescription')
         RETURNING appointment_id`,
        [patUser.user_id, docUser.user_id, hospital_id, department_id, dateStr, timeStr]
    );

    console.log(`✅ Appointment Created! ID: ${res.rows[0].appointment_id}`);
    console.log(`   Time: ${dateStr} ${timeStr} (Valid for prescription)`);

  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
